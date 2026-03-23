/**
 * @file container/engine.ts
 * Container lifecycle engine — creates, starts, stops, and executes
 * commands inside the model's dedicated Linux computer.
 *
 * All container operations go through this module. The engine is
 * lazy-initialized: the container is only created/started when the
 * first tool call happens.
 *
 * Supports Docker and Podman interchangeably via the detected runtime.
 */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { detectRuntime } from "./runtime";
import {
  CONTAINER_NAME_PREFIX,
  CONTAINER_WORKDIR,
  CONTAINER_SHELL,
  CONTAINER_SHELL_ALPINE,
  CONTAINER_ENV_VARS,
  DEFAULT_MAX_OUTPUT_BYTES,
  MAX_OUTPUT_BYTES,
  PACKAGE_PRESETS,
  PACKAGE_PRESETS_ALPINE,
} from "../constants";
import type {
  RuntimeInfo,
  ContainerCreateOptions,
  ContainerInfo,
  ExecResult,
  EnvironmentInfo,
  ProcessInfo,
} from "../types";
import type { ContainerImage, ContainerState, NetworkMode } from "../constants";

const execAsync = promisify(execFile);

/**
 * Convert a Windows host path (C:\Users\foo) to the format Docker
 * on Windows expects for volume mounts (//c/Users/foo).
 * No-op on Linux/Mac.
 */
function toDockerPath(hostPath: string): string {
  if (process.platform !== "win32") return hostPath;
  return hostPath
    .replace(/^([A-Za-z]):\\/, (_, d) => `//${d.toLowerCase()}/`)
    .replace(/\\/g, "/");
}

/**
 * Augment PATH with platform-specific locations where Docker/Podman
 * helper binaries live, so they're findable regardless of what PATH
 * LM Studio inherited from the OS launcher.
 */
function getRuntimeEnv(): NodeJS.ProcessEnv {
  const base = process.env.PATH ?? "";
  const extra =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Docker\\Docker\\resources\\bin",
          "C:\\Program Files\\Docker\\Docker\\resources",
        ]
      : [
          "/usr/bin",
          "/usr/local/bin",
          "/usr/lib/podman",
          "/usr/libexec/podman",
          "/bin",
        ];

  const sep = process.platform === "win32" ? ";" : ":";
  return {
    ...process.env,
    PATH: [base, ...extra].filter(Boolean).join(sep),
  };
}

/**
 * Ensure Podman's containers.conf has explicit DNS servers set.
 * This fixes DNS resolution failures in rootless containers on Ubuntu/systemd-resolved hosts.
 * Safe to call multiple times — only writes if the config is missing or incomplete.
 */
function ensurePodmanConfig(): void {
  try {
    const configDir = join(homedir(), ".config", "containers");
    const configPath = join(configDir, "containers.conf");

    let existing = "";
    if (existsSync(configPath)) {
      existing = readFileSync(configPath, "utf-8");
    }

    const needsDNS = !existing.includes("dns_servers");
    const needsHelperDir = !existing.includes("helper_binaries_dir");

    if (!needsDNS && !needsHelperDir) return;

    mkdirSync(configDir, { recursive: true });

    let updated = existing;

    if (needsHelperDir) {
      const helperLine =
        'helper_binaries_dir = ["/usr/bin", "/usr/local/bin", "/usr/lib/podman"]';
      updated = updated.includes("[network]")
        ? updated.replace("[network]", `[network]\n${helperLine}`)
        : updated + `\n[network]\n${helperLine}\n`;
    }

    if (needsDNS) {
      const dnsLine = 'dns_servers = ["8.8.8.8", "8.8.4.4"]';
      updated = updated.includes("[containers]")
        ? updated.replace("[containers]", `[containers]\n${dnsLine}`)
        : updated + `\n[containers]\n${dnsLine}\n`;
    }

    writeFileSync(configPath, updated, "utf-8");
    console.log(
      "[lms-computer] Auto-configured Podman containers.conf (helper_binaries_dir + dns_servers).",
    );
  } catch (err) {
    console.warn("[lms-computer] Could not write Podman config:", err);
  }
}

let runtime: RuntimeInfo | null = null;
let containerName: string = "";
let containerReady: boolean = false;
let currentNetwork: NetworkMode = "none";
let initPromise: Promise<void> | null = null;

interface ShellSession {
  proc: ReturnType<typeof spawn>;
  write: (data: string) => void;
  kill: () => void;
}

let shellSession: ShellSession | null = null;

const SENTINEL = `__LMS_DONE_${Math.random().toString(36).slice(2)}__`;
const SENTINEL_NL = SENTINEL + "\n";

/**
 * Get the shell path for the given image.
 */
function shellFor(image: string): string {
  return image.startsWith("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
}

/**
 * Start a persistent bash session inside the container.
 * The session stays alive across multiple Execute calls so that
 * cd, export, source, nvm use, conda activate, etc. all persist.
 */
function startShellSession(): ShellSession {
  if (!runtime) throw new Error("Runtime not initialized");

  const isAlpine = containerName.includes("alpine");
  const shell = isAlpine ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;

  const proc = spawn(
    runtime.path,
    ["exec", "-i", "-w", CONTAINER_WORKDIR, containerName, shell],
    {
      stdio: ["pipe", "pipe", "pipe"],
      env: getRuntimeEnv(),
    },
  );

  const init = [
    "export PS1=''",
    "export PS2=''",
    "export TERM=xterm-256color",
    `cd ${CONTAINER_WORKDIR}`,
    "",
  ].join("\n");
  proc.stdin?.write(init);

  const session: ShellSession = {
    proc,
    write: (data: string) => proc.stdin?.write(data),
    kill: () => {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* ignore */
      }
    },
  };

  proc.on("exit", () => {
    if (shellSession === session) shellSession = null;
  });

  proc.on("error", () => {
    if (shellSession === session) shellSession = null;
  });

  return session;
}

/**
 * Execute a command through the persistent shell session.
 * State (cwd, env vars, sourced files) persists across calls.
 */
async function execInSession(
  command: string,
  timeoutSeconds: number,
  maxOutputBytes: number,
): Promise<ExecResult> {
  if (
    !shellSession ||
    shellSession.proc.exitCode !== null ||
    shellSession.proc.killed
  ) {
    shellSession = startShellSession();
    await new Promise((r) => setTimeout(r, 100));
  }

  const session = shellSession;
  const start = Date.now();
  const effectiveMax = Math.min(maxOutputBytes, MAX_OUTPUT_BYTES);

  return new Promise<ExecResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let done = false;

    const cleanup = () => {
      session.proc.stdout?.removeListener("data", onStdout);
      session.proc.stderr?.removeListener("data", onStderr);
      clearTimeout(timer);
    };

    const finish = (timedOut: boolean, killed: boolean) => {
      if (done) return;
      done = true;
      cleanup();

      let exitCode = 0;
      const exitMatch = stdout.match(/\nEXIT_CODE:(\d+)\n?$/);
      if (exitMatch) {
        exitCode = parseInt(exitMatch[1], 10);
        stdout = stdout.slice(0, exitMatch.index);
      }

      stdout = stdout.replace(new RegExp(SENTINEL + "\\n?$"), "").trimEnd();

      resolve({
        exitCode: killed ? 137 : exitCode,
        stdout: stdout.slice(0, effectiveMax),
        stderr: stderr.slice(0, effectiveMax),
        timedOut,
        durationMs: Date.now() - start,
        truncated:
          stdout.length >= effectiveMax || stderr.length >= effectiveMax,
      });
    };

    const onStdout = (chunk: Buffer) => {
      if (done) return;
      stdout += chunk.toString("utf-8");
      if (stdout.includes(SENTINEL_NL) || stdout.endsWith(SENTINEL)) {
        finish(false, false);
      }
    };

    const onStderr = (chunk: Buffer) => {
      if (done) return;
      if (stderr.length < effectiveMax) stderr += chunk.toString("utf-8");
    };

    const timer = setTimeout(() => {
      if (done) return;
      session.kill();
      shellSession = null;
      finish(true, true);
    }, timeoutSeconds * 1000);

    session.proc.stdout?.on("data", onStdout);
    session.proc.stderr?.on("data", onStderr);

    const wrapped = `${command}\necho "EXIT_CODE:$?"\necho "${SENTINEL}"\n`;
    session.write(wrapped);
  });
}

/**
 * Run a container runtime command and return stdout.
 */
async function run(
  args: string[],
  timeoutMs: number = 30_000,
): Promise<string> {
  if (!runtime) throw new Error("Runtime not initialized");
  const { stdout } = await execAsync(runtime.path, args, {
    timeout: timeoutMs,
    maxBuffer: MAX_OUTPUT_BYTES,
    env: getRuntimeEnv(),
  });
  return stdout.trim();
}

/**
 * Check current state of the managed container.
 */
async function getContainerState(): Promise<ContainerState> {
  try {
    const out = await run([
      "inspect",
      containerName,
      "--format",
      "{{.State.Status}}",
    ]);
    const status = out.trim().toLowerCase();
    if (status === "running") return "running";
    if (["exited", "stopped", "created", "paused", "dead"].includes(status))
      return "stopped";
    return "error";
  } catch {
    return "not_found";
  }
}

/**
 * Build `docker run` / `podman run` arguments from options.
 */
function buildRunArgs(opts: ContainerCreateOptions): string[] {
  const args: string[] = [
    "run",
    "-d",
    "--name",
    opts.name,
    "--hostname",
    "lms-computer",
    ...(opts.network !== "podman-default" ? ["--network", opts.network] : []),
    ...(opts.network !== "none"
      ? ["--dns", "8.8.8.8", "--dns", "8.8.4.4"]
      : []),
    "-w",
    "/root",
  ];

  if (opts.cpuLimit > 0) {
    args.push("--cpus", String(opts.cpuLimit));
  }
  if (opts.memoryLimitMB > 0) {
    args.push("--memory", `${opts.memoryLimitMB}m`);
    args.push("--memory-swap", `${opts.memoryLimitMB}m`);
  }

  for (const [k, v] of Object.entries(opts.envVars)) {
    args.push("-e", `${k}=${v}`);
  }

  for (const pf of opts.portForwards) {
    const trimmed = pf.trim();
    if (trimmed) args.push("-p", trimmed);
  }

  if (opts.hostMountPath) {
    args.push("-v", `${toDockerPath(opts.hostMountPath)}:/mnt/shared`);
  }

  args.push(opts.image, "tail", "-f", "/dev/null");

  return args;
}

/**
 * Create the user workspace and install packages inside the container.
 */
async function setupContainer(
  image: ContainerImage,
  preset: string,
  hasNetwork: boolean = false,
): Promise<void> {
  const shell = shellFor(image);

  await run(
    [
      "exec",
      containerName,
      shell,
      "-c",
      `mkdir -p ${CONTAINER_WORKDIR} && ` +
        `(id user >/dev/null 2>&1 || adduser --disabled-password --gecos "" --home ${CONTAINER_WORKDIR} user 2>/dev/null || ` +
        `adduser -D -h ${CONTAINER_WORKDIR} user 2>/dev/null || true)`,
    ],
    15_000,
  );

  if (preset && preset !== "none" && hasNetwork) {
    const isAlpine = image.startsWith("alpine");
    const presets = isAlpine ? PACKAGE_PRESETS_ALPINE : PACKAGE_PRESETS;
    const packages = presets[preset];
    if (packages && packages.length > 0) {
      const installCmd = isAlpine
        ? `apk update && apk add --no-cache ${packages.join(" ")}`
        : `apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${packages.join(" ")} && apt-get clean && rm -rf /var/lib/apt/lists/*`;

      try {
        await run(["exec", containerName, shell, "-c", installCmd], 180_000);
      } catch (installErr: any) {
        console.warn(
          "[lms-computer] Package install failed (non-fatal):",
          installErr?.message ?? installErr,
        );
      }
    }
  }
}

/**
 * Initialize the container engine: detect runtime, create or start
 * the container if needed. Safe to call multiple times (idempotent).
 */
export async function ensureReady(opts: {
  image: ContainerImage;
  network: NetworkMode;
  cpuLimit: number;
  memoryLimitMB: number;
  diskLimitMB: number;
  autoInstallPreset: string;
  portForwards: string;
  hostMountPath: string;
  persistenceMode: string;
}): Promise<void> {
  if (containerReady) {
    const wantsNetwork = opts.network !== "none";
    const hasNetwork = currentNetwork !== "none";
    if (wantsNetwork === hasNetwork) return;

    containerReady = false;
    currentNetwork = "none";
    try {
      await run(["stop", containerName], 15_000);
    } catch {
      /* ignore */
    }
    try {
      await run(["rm", "-f", containerName], 10_000);
    } catch {
      /* ignore */
    }
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    runtime = await detectRuntime();
    containerName = `${CONTAINER_NAME_PREFIX}-main`;

    if (runtime.kind === "podman") {
      ensurePodmanConfig();
    }

    const state = await getContainerState();

    if (state === "running") {
      let actuallyHasNetwork = false;
      try {
        const netOut = await run([
          "inspect",
          containerName,
          "--format",
          "{{.HostConfig.NetworkMode}}",
        ]);
        const actualNet = netOut.trim().toLowerCase();
        actuallyHasNetwork = actualNet !== "none" && actualNet !== "";
      } catch {
        /* assume no network */
      }

      const wantsNetwork = opts.network !== "none";

      if (actuallyHasNetwork === wantsNetwork) {
        currentNetwork = wantsNetwork ? opts.network : "none";
        containerReady = true;
        return;
      }

      console.log(
        `[lms-computer] Network mismatch (container has ${actuallyHasNetwork ? "internet" : "no internet"}, settings want ${wantsNetwork ? "internet" : "no internet"}) — recreating container.`,
      );
      try {
        await run(["stop", containerName], 15_000);
      } catch {
        /* already stopped */
      }
      try {
        await run(["rm", "-f", containerName], 10_000);
      } catch {
        /* already gone */
      }
    }

    if (state === "stopped") {
      try {
        await run(["start", containerName]);
        containerReady = true;
        return;
      } catch (err: any) {
        const msg: string = err?.message ?? "";
        if (
          msg.includes("workdir") ||
          msg.includes("does not exist") ||
          msg.includes("netns") ||
          msg.includes("mount runtime")
        ) {
          try {
            await run(["rm", "-f", containerName], 10_000);
          } catch {
            /* ignore */
          }
        } else {
          throw err;
        }
      }
    }

    try {
      await run(["pull", opts.image], 300_000);
    } catch {}

    const portForwards = opts.portForwards
      ? opts.portForwards
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let setupNetwork: NetworkMode | "podman-default" = "none";
    if (runtime?.kind === "docker") {
      setupNetwork = opts.network === "none" ? "none" : "bridge";
    } else if (runtime?.kind === "podman" && opts.network !== "none") {
      setupNetwork = "podman-default";
    }
    const createArgs = buildRunArgs({
      image: opts.image,
      name: containerName,
      network: setupNetwork,
      cpuLimit: opts.cpuLimit,
      memoryLimitMB: opts.memoryLimitMB,
      diskLimitMB: opts.diskLimitMB,
      workdir: CONTAINER_WORKDIR,
      envVars: CONTAINER_ENV_VARS,
      portForwards,
      hostMountPath: opts.hostMountPath || null,
    });

    const diskOptArgs = [...createArgs];
    if (opts.diskLimitMB > 0) {
      diskOptArgs.splice(
        diskOptArgs.indexOf(opts.image),
        0,
        "--storage-opt",
        `size=${opts.diskLimitMB}m`,
      );
    }
    try {
      await run(diskOptArgs, 60_000);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (
        msg.includes("storage-opt") ||
        msg.includes("backingFS") ||
        msg.includes("overlay.size")
      ) {
        console.warn(
          "[lms-computer] Disk quota not supported by storage driver, starting without size limit.",
        );
        await run(createArgs, 60_000);
      } else {
        throw err;
      }
    }

    const hasNetworkForSetup = setupNetwork !== "none";
    await setupContainer(
      opts.image,
      opts.autoInstallPreset,
      hasNetworkForSetup,
    );

    if (opts.network === "none" && setupNetwork !== "none") {
      try {
        await run(
          ["network", "disconnect", setupNetwork, containerName],
          10_000,
        );
      } catch {
        /* best effort — container still works, just has network */
      }
    }

    currentNetwork = setupNetwork !== "none" ? opts.network : "none";
    containerReady = true;
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Execute a command inside the container.
 */
export async function exec(
  command: string,
  timeoutSeconds: number,
  maxOutputBytes: number = DEFAULT_MAX_OUTPUT_BYTES,
  workdir?: string,
): Promise<ExecResult> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready. Call ensureReady() first.");
  }

  const cmdToRun =
    workdir && workdir !== CONTAINER_WORKDIR
      ? `cd ${workdir} && ${command}`
      : command;

  return execInSession(cmdToRun, timeoutSeconds, maxOutputBytes);
}

/**
 * Write a file inside the container using stdin piping.
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }

  return new Promise<void>((resolve, reject) => {
    const shell = containerName.includes("alpine")
      ? CONTAINER_SHELL_ALPINE
      : CONTAINER_SHELL;
    const proc = spawn(
      runtime!.path,
      [
        "exec",
        "-i",
        containerName,
        shell,
        "-c",
        `cat > '${filePath.replace(/'/g, "'\\''")}'`,
      ],
      {
        timeout: 15_000,
        stdio: ["pipe", "ignore", "pipe"],
        env: getRuntimeEnv(),
      },
    );

    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Write failed (exit ${code}): ${stderr}`));
    });
    proc.on("error", reject);
    proc.stdin?.write(content);
    proc.stdin?.end();
  });
}

/**
 * Read a file from the container, optionally limited to a line range.
 */
export async function readFile(
  filePath: string,
  maxBytes: number,
  startLine?: number,
  endLine?: number,
): Promise<{ content: string; totalLines: number }> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }

  const q = filePath.replace(/'/g, "'\\''");
  const totalResult = await exec(`wc -l < '${q}' 2>/dev/null || echo 0`, 5);
  const totalLines = parseInt(totalResult.stdout.trim(), 10) || 0;

  let cmd: string;
  if (startLine !== undefined && endLine !== undefined) {
    cmd = `sed -n '${startLine},${endLine}p' '${q}'`;
  } else if (startLine !== undefined) {
    cmd = `tail -n +${startLine} '${q}'`;
  } else {
    cmd = `cat '${q}'`;
  }

  const result = await exec(cmd, 10, maxBytes);
  if (result.exitCode !== 0) {
    throw new Error(`Read failed: ${result.stderr || "file not found"}`);
  }
  return { content: result.stdout, totalLines };
}

/**
 * Replace an exact string in a file. Fails if the string is not found
 * or appears more than once, matching the behaviour of surgical editors.
 */
export async function strReplaceInFile(
  filePath: string,
  oldStr: string,
  newStr: string,
): Promise<{ replacements: number }> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }

  const q = filePath.replace(/'/g, "'\\''");
  const readResult = await exec(`cat '${q}'`, 10, MAX_OUTPUT_BYTES);
  if (readResult.exitCode !== 0) {
    throw new Error(`File not found: ${filePath}`);
  }

  const original = readResult.stdout;
  const occurrences = original.split(oldStr).length - 1;

  if (occurrences === 0) {
    throw new Error(
      `String not found in ${filePath}.\n` +
        `Hint: use ReadFile to view the current contents before editing.`,
    );
  }
  if (occurrences > 1) {
    throw new Error(
      `String appears ${occurrences} times in ${filePath} — it must be unique.\n` +
        `Hint: include more surrounding context to make the match unique.`,
    );
  }

  const updated = original.replace(oldStr, newStr);
  await writeFile(filePath, updated);
  return { replacements: 1 };
}

/**
 * Insert lines into a file at a given line number.
 * Line numbers are 1-based. Pass 0 to prepend, or a number past EOF to append.
 */
export async function insertLinesInFile(
  filePath: string,
  afterLine: number,
  content: string,
): Promise<void> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }

  const q = filePath.replace(/'/g, "'\\''");
  const readResult = await exec(`cat '${q}'`, 10, MAX_OUTPUT_BYTES);
  if (readResult.exitCode !== 0) {
    throw new Error(`File not found: ${filePath}`);
  }

  const lines = readResult.stdout.split("\n");
  const insertLines = content.split("\n");
  const clampedLine = Math.max(0, Math.min(afterLine, lines.length));
  lines.splice(clampedLine, 0, ...insertLines);
  await writeFile(filePath, lines.join("\n"));
}

const bgLogs = new Map<
  number,
  { stdout: string; stderr: string; done: boolean; exitCode: number | null }
>();

/**
 * Run a command in the background inside the container.
 * Returns a handle ID that can be used with readBgLogs.
 */
export async function execBackground(
  command: string,
  timeoutSeconds: number,
): Promise<{ handleId: number; pid: number }> {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }

  const shell = containerName.includes("alpine")
    ? CONTAINER_SHELL_ALPINE
    : CONTAINER_SHELL;
  const handleId = Date.now();
  const entry = {
    stdout: "",
    stderr: "",
    done: false,
    exitCode: null as number | null,
  };
  bgLogs.set(handleId, entry);

  const proc = spawn(
    runtime.path,
    ["exec", containerName, shell, "-c", command],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: getRuntimeEnv(),
    },
  );

  const cap = MAX_OUTPUT_BYTES * 2;
  proc.stdout?.on("data", (chunk: Buffer) => {
    if (entry.stdout.length < cap) entry.stdout += chunk.toString("utf-8");
  });
  proc.stderr?.on("data", (chunk: Buffer) => {
    if (entry.stderr.length < cap) entry.stderr += chunk.toString("utf-8");
  });
  proc.on("close", (code) => {
    entry.done = true;
    entry.exitCode = code;
  });

  setTimeout(() => {
    if (!entry.done) {
      proc.kill("SIGKILL");
      entry.done = true;
      entry.exitCode = 137;
    }
  }, timeoutSeconds * 1_000);

  return { handleId, pid: proc.pid ?? -1 };
}

/**
 * Read buffered output from a background process by handle ID.
 */
export function readBgLogs(
  handleId: number,
  maxBytes: number = DEFAULT_MAX_OUTPUT_BYTES,
): {
  stdout: string;
  stderr: string;
  done: boolean;
  exitCode: number | null;
  found: boolean;
} {
  const entry = bgLogs.get(handleId);
  if (!entry)
    return { stdout: "", stderr: "", done: true, exitCode: null, found: false };
  return {
    stdout: entry.stdout.slice(-maxBytes),
    stderr: entry.stderr.slice(-maxBytes),
    done: entry.done,
    exitCode: entry.exitCode,
    found: true,
  };
}

/**
 * Copy a file from the host into the container.
 */
export async function copyToContainer(
  hostPath: string,
  containerPath: string,
): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", hostPath, `${containerName}:${containerPath}`], 60_000);
}

/**
 * Copy a file from the container to the host.
 */
export async function copyFromContainer(
  containerPath: string,
  hostPath: string,
): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", `${containerName}:${containerPath}`, hostPath], 60_000);
}

/**
 * Get environment info from inside the container.
 */
export async function getEnvironmentInfo(
  network: boolean,
  diskLimitMB: number = 0,
): Promise<EnvironmentInfo> {
  const infoScript = `
echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
echo "KERNEL=$(uname -r)"
echo "ARCH=$(uname -m)"
echo "HOSTNAME=$(hostname)"
echo "UPTIME=$(uptime -p 2>/dev/null || uptime)"
DISK_USED_KB=$(du -sk ${CONTAINER_WORKDIR} 2>/dev/null | awk '{print $1}' || echo 0)
echo "DISK_USED_KB=\$DISK_USED_KB"
echo "DISK_FREE_RAW=$(df -k ${CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4}')"
MEM_LIMIT_BYTES=\$(cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo '')
MEM_USAGE_BYTES=\$(cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || echo '')
if [ -n "\$MEM_LIMIT_BYTES" ] && [ "\$MEM_LIMIT_BYTES" != "max" ] && [ "\$MEM_LIMIT_BYTES" -lt 9000000000000 ] 2>/dev/null; then
  MEM_TOTAL_H=\$(awk "BEGIN{printf \"%.0fMiB\", \$MEM_LIMIT_BYTES/1048576}")
  MEM_USED_H=\$(awk "BEGIN{printf \"%.0fMiB\", \${MEM_USAGE_BYTES:-0}/1048576}")
  MEM_FREE_H=\$(awk "BEGIN{printf \"%.0fMiB\", (\$MEM_LIMIT_BYTES-\${MEM_USAGE_BYTES:-0})/1048576}")
else
  MEM_TOTAL_H=\$(free -h 2>/dev/null | grep Mem | awk '{print \$2}' || echo 'N/A')
  MEM_USED_H=\$(free -h 2>/dev/null | grep Mem | awk '{print \$3}' || echo 'N/A')
  MEM_FREE_H=\$(free -h 2>/dev/null | grep Mem | awk '{print \$4}' || echo 'N/A')
fi
echo "MEM_FREE=\$MEM_FREE_H"
echo "MEM_TOTAL=\$MEM_TOTAL_H"
echo "PYTHON=$(python3 --version 2>/dev/null || echo '')"
echo "NODE=$(node --version 2>/dev/null || echo '')"
echo "GCC=$(gcc --version 2>/dev/null | head -1 || echo '')"
echo "TOOLS=$(which git curl wget vim nano python3 node npm gcc make cmake pip3 2>/dev/null | xargs -I{} basename {} | tr '\\n' ',')"
  `.trim();

  const result = await exec(infoScript, 10);
  const lines = result.stdout.split("\n");
  const get = (prefix: string): string => {
    const line = lines.find((l) => l.startsWith(prefix + "="));
    return line?.slice(prefix.length + 1)?.trim() ?? "N/A";
  };

  const diskUsedKB = parseInt(get("DISK_USED_KB") || "0", 10);
  const diskFreeRawKB = parseInt(get("DISK_FREE_RAW") || "0", 10);
  let diskTotal: string;
  let diskFree: string;
  if (diskLimitMB > 0) {
    const diskLimitKB = diskLimitMB * 1024;
    const diskFreeKB = Math.max(0, diskLimitKB - diskUsedKB);
    const toMiB = (kb: number) =>
      kb >= 1024 * 1024
        ? `${(kb / 1024 / 1024).toFixed(1)}GiB`
        : `${Math.round(kb / 1024)}MiB`;
    diskTotal = toMiB(diskLimitKB);
    diskFree = toMiB(diskFreeKB);
  } else {
    const toMiB = (kb: number) =>
      kb >= 1024 * 1024
        ? `${(kb / 1024 / 1024).toFixed(1)}GiB`
        : `${Math.round(kb / 1024)}MiB`;
    diskFree = toMiB(diskFreeRawKB);
    diskTotal = "N/A";
  }

  return {
    os: get("OS"),
    kernel: get("KERNEL"),
    arch: get("ARCH"),
    hostname: get("HOSTNAME"),
    uptime: get("UPTIME"),
    diskFree,
    diskTotal,
    memoryFree: get("MEM_FREE"),
    memoryTotal: get("MEM_TOTAL"),
    pythonVersion: get("PYTHON") || null,
    nodeVersion: get("NODE") || null,
    gccVersion: get("GCC") || null,
    installedTools: get("TOOLS").split(",").filter(Boolean),
    workdir: CONTAINER_WORKDIR,
    networkEnabled: network,
  };
}

/**
 * List processes running inside the container.
 */
export async function listProcesses(): Promise<ProcessInfo[]> {
  const result = await exec(
    "ps aux --no-headers 2>/dev/null || ps aux 2>/dev/null",
    5,
  );

  if (result.exitCode !== 0) return [];

  return result.stdout
    .split("\n")
    .filter((line) => line.trim() && !line.includes("ps aux"))
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[1] ?? "0", 10),
        user: parts[0] ?? "?",
        cpu: parts[2] ?? "0",
        memory: parts[3] ?? "0",
        started: parts[8] ?? "?",
        command: parts.slice(10).join(" ") || parts.slice(3).join(" "),
      };
    })
    .filter((p) => p.pid > 0);
}

/**
 * Kill a process inside the container.
 */
export async function killProcess(
  pid: number,
  signal: string = "SIGTERM",
): Promise<boolean> {
  const result = await exec(`kill -${signal} ${pid}`, 5);
  return result.exitCode === 0;
}

/**
 * Stop and optionally remove the container.
 */
export async function stopContainer(remove: boolean = false): Promise<void> {
  if (!runtime) return;

  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }

  try {
    await run(["stop", containerName], 15_000);
  } catch {
    /* already stopped */
  }

  if (remove) {
    try {
      await run(["rm", "-f", containerName], 10_000);
    } catch {
      /* already removed */
    }
  }

  containerReady = false;
}

/**
 * Destroy the container and all its data.
 */
export async function destroyContainer(): Promise<void> {
  await stopContainer(true);
  containerReady = false;
  currentNetwork = "none";
  initPromise = null;
}

/**
 * Restart the container without wiping its data.
 * Stops the running container, kills the shell session, then starts it again.
 * Faster than a full rebuild — filesystem and installed packages are preserved.
 */
export async function restartContainer(): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }
  try {
    await run(["stop", containerName], 15_000);
  } catch {}
  await run(["start", containerName], 30_000);
  containerReady = true;
}

/**
 * Get detailed container info.
 */
export async function getContainerInfo(): Promise<ContainerInfo> {
  if (!runtime) throw new Error("Runtime not initialized.");

  const state = await getContainerState();

  if (state === "not_found") {
    return {
      id: "",
      name: containerName,
      state: "not_found",
      image: "",
      created: "",
      uptime: null,
      cpuUsage: null,
      memoryUsage: null,
      diskUsage: null,
      networkMode: "",
      ports: [],
    };
  }

  try {
    const format =
      "{{.Id}}\t{{.Config.Image}}\t{{.Created}}\t{{.State.Status}}\t{{.HostConfig.NetworkMode}}";
    const out = await run(["inspect", containerName, "--format", format]);
    const [id, image, created, , networkMode] = out.split("\t");

    let cpuUsage: string | null = null;
    let memoryUsage: string | null = null;

    if (state === "running") {
      try {
        const stats = await run(
          [
            "stats",
            containerName,
            "--no-stream",
            "--format",
            "{{.CPUPerc}}\t{{.MemUsage}}",
          ],
          10_000,
        );
        const [cpu, mem] = stats.split("\t");
        cpuUsage = cpu?.trim() ?? null;
        memoryUsage = mem?.trim() ?? null;
      } catch {
        /* stats not available */
      }
    }

    return {
      id: id?.slice(0, 12) ?? "",
      name: containerName,
      state,
      image: image ?? "",
      created: created ?? "",
      uptime: state === "running" ? "running" : null,
      cpuUsage,
      memoryUsage,
      diskUsage: null,
      networkMode: networkMode ?? "",
      ports: [],
    };
  } catch {
    return {
      id: "",
      name: containerName,
      state,
      image: "",
      created: "",
      uptime: null,
      cpuUsage: null,
      memoryUsage: null,
      diskUsage: null,
      networkMode: "",
      ports: [],
    };
  }
}

/**
 * Update the container's network mode (requires restart).
 */
export async function updateNetwork(
  mode: NetworkMode,
  opts: Parameters<typeof ensureReady>[0],
): Promise<void> {
  const hadContainer = (await getContainerState()) !== "not_found";

  if (hadContainer) {
    const tempImage = `${containerName}-state:latest`;
    if (opts.persistenceMode === "persistent") {
      try {
        await run(["commit", containerName, tempImage], 60_000);
      } catch {
        /* best effort */
      }
    }

    await destroyContainer();

    const useImage =
      opts.persistenceMode === "persistent" ? tempImage : opts.image;
    const actualOpts = { ...opts, network: mode };

    containerReady = false;
    await ensureReady({ ...actualOpts, image: useImage as any });

    if (opts.persistenceMode === "persistent") {
      try {
        await run(["rmi", tempImage], 10_000);
      } catch {
        /* best effort */
      }
    }
  }
}

/**
 * Check if the container engine is ready.
 */
export function isReady(): boolean {
  return containerReady;
}

/**
 * Reset the persistent shell session without touching the container.
 * Useful when the model wants a clean shell (fresh env vars, back to home dir)
 * without a full container rebuild.
 */
export function resetShellSession(): void {
  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }
}

/**
 * Verify the container is actually running. If it has been deleted or stopped
 * externally, resets containerReady so ensureReady() will recreate it.
 * Call this at the start of every tool implementation.
 */
export async function verifyHealth(): Promise<void> {
  if (!containerReady) return;
  try {
    const state = await getContainerState();
    if (state !== "running") {
      containerReady = false;
      currentNetwork = "none";
      if (shellSession) {
        shellSession.kill();
        shellSession = null;
      }
    }
  } catch {
    containerReady = false;
    currentNetwork = "none";
    if (shellSession) {
      shellSession.kill();
      shellSession = null;
    }
  }
}

/**
 * Get the container name.
 */
export function getContainerName(): string {
  return containerName;
}
