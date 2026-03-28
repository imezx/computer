/**
 * @file container/engine.ts
 * Container lifecycle engine — creates, starts, stops, and executes
 * commands inside the model's dedicated Linux computer.
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

function toDockerPath(hostPath: string): string {
  if (process.platform !== "win32") return hostPath;
  return hostPath
    .replace(/^([A-Za-z]):\\/, (_, d) => `//${d.toLowerCase()}/`)
    .replace(/\\/g, "/");
}

/** Shell-escape a string for use inside single quotes. */
function q(p: string): string {
  return p.replace(/'/g, "'\\''");
}

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
      const line =
        'helper_binaries_dir = ["/usr/bin", "/usr/local/bin", "/usr/lib/podman"]';
      updated = updated.includes("[network]")
        ? updated.replace("[network]", `[network]\n${line}`)
        : updated + `\n[network]\n${line}\n`;
    }

    if (needsDNS) {
      const line = 'dns_servers = ["8.8.8.8", "8.8.4.4"]';
      updated = updated.includes("[containers]")
        ? updated.replace("[containers]", `[containers]\n${line}`)
        : updated + `\n[containers]\n${line}\n`;
    }

    writeFileSync(configPath, updated, "utf-8");
    console.log("[lms-computer] Auto-configured Podman containers.conf.");
  } catch (err) {
    console.warn("[lms-computer] Could not write Podman config:", err);
  }
}

let runtime: RuntimeInfo | null = null;
let containerName: string = "";
let containerReady: boolean = false;
let initPromise: Promise<void> | null = null;
let currentNetwork: NetworkMode = "none";

interface ShellSession {
  proc: ReturnType<typeof spawn>;
  write: (data: string) => void;
  kill: () => void;
}

let shellSession: ShellSession | null = null;

const SENTINEL = `__LMS_DONE_${Math.random().toString(36).slice(2)}__`;
const SENTINEL_NL = SENTINEL + "\n";

/**
 * Truncate large output by keeping the head and tail with an omission
 * notice in the middle — like Claude's own bash tool.
 * The beginning (setup) and end (result/error) are almost always what matters.
 */
function smartTruncate(
  text: string,
  maxBytes: number,
): { text: string; truncated: boolean; linesOmitted: number } {
  if (Buffer.byteLength(text, "utf-8") <= maxBytes) {
    return { text, truncated: false, linesOmitted: 0 };
  }

  const lines = text.split("\n");
  const headBudget = Math.floor(maxBytes * 0.45);
  const tailBudget = Math.floor(maxBytes * 0.45);

  const headLines: string[] = [];
  let headUsed = 0;
  for (const line of lines) {
    const lb = Buffer.byteLength(line + "\n", "utf-8");
    if (headUsed + lb > headBudget) break;
    headLines.push(line);
    headUsed += lb;
  }

  const tailLines: string[] = [];
  let tailUsed = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const lb = Buffer.byteLength(line + "\n", "utf-8");
    if (tailUsed + lb > tailBudget) break;
    tailLines.unshift(line);
    tailUsed += lb;
  }

  const omitted = lines.length - headLines.length - tailLines.length;
  if (omitted <= 0) {
    return {
      text: text.slice(0, maxBytes) + "\n… [output truncated]",
      truncated: true,
      linesOmitted: 0,
    };
  }

  const joined = [
    ...headLines,
    "",
    `… [${omitted} lines omitted — use ReadFile with startLine/endLine to inspect the full output] …`,
    "",
    ...tailLines,
  ].join("\n");

  return { text: joined, truncated: true, linesOmitted: omitted };
}

function shellFor(image: string): string {
  return image.startsWith("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
}

function startShellSession(): ShellSession {
  if (!runtime) throw new Error("Runtime not initialized");

  const isAlpine = containerName.includes("alpine");
  const shell = isAlpine ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;

  const proc = spawn(
    runtime.path,
    ["exec", "-i", "-w", CONTAINER_WORKDIR, containerName, shell],
    { stdio: ["pipe", "pipe", "pipe"], env: getRuntimeEnv() },
  );

  const init = [
    "export PS1=''",
    "export PS2=''",
    "export TERM=xterm-256color",
    `cd ${CONTAINER_WORKDIR}`,
    `[ -f ~/.bashrc ] && source ~/.bashrc 2>/dev/null || true`,
    "",
  ].join("\n");
  proc.stdin?.write(init);

  const session: ShellSession = {
    proc,
    write: (data: string) => proc.stdin?.write(data),
    kill: () => {
      try { proc.kill("SIGKILL"); } catch { /* ignore */ }
    },
  };

  proc.on("exit", () => { if (shellSession === session) shellSession = null; });
  proc.on("error", () => { if (shellSession === session) shellSession = null; });

  return session;
}

async function execInSession(
  command: string,
  timeoutSeconds: number,
  maxOutputBytes: number,
): Promise<ExecResult> {
  if (!shellSession || shellSession.proc.exitCode !== null || shellSession.proc.killed) {
    shellSession = startShellSession();
    await new Promise((r) => setTimeout(r, 100));
  }

  const session = shellSession;
  const start = Date.now();
  const effectiveMax = Math.min(maxOutputBytes, MAX_OUTPUT_BYTES);

  return new Promise<ExecResult>((resolve) => {
    let rawStdout = "";
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
      const exitMatch = rawStdout.match(/\nEXIT_CODE:(\d+)\n?$/);
      if (exitMatch) {
        exitCode = parseInt(exitMatch[1], 10);
        rawStdout = rawStdout.slice(0, exitMatch.index);
      }
      rawStdout = rawStdout.replace(new RegExp(SENTINEL + "\\n?$"), "").trimEnd();

      const { text: stdout, truncated, linesOmitted } = smartTruncate(rawStdout, effectiveMax);

      resolve({
        exitCode: killed ? 137 : exitCode,
        stdout,
        stderr: stderr.slice(0, effectiveMax),
        timedOut,
        durationMs: Date.now() - start,
        truncated,
        originalSize: linesOmitted > 0 ? rawStdout.length : undefined,
      });
    };

    const onStdout = (chunk: Buffer) => {
      if (done) return;
      rawStdout += chunk.toString("utf-8");
      if (rawStdout.includes(SENTINEL_NL) || rawStdout.endsWith(SENTINEL)) {
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

async function run(args: string[], timeoutMs: number = 30_000): Promise<string> {
  if (!runtime) throw new Error("Runtime not initialized");
  const { stdout } = await execAsync(runtime.path, args, {
    timeout: timeoutMs,
    maxBuffer: MAX_OUTPUT_BYTES,
    env: getRuntimeEnv(),
  });
  return stdout.trim();
}

async function getContainerState(): Promise<ContainerState> {
  try {
    const out = await run(["inspect", containerName, "--format", "{{.State.Status}}"]);
    const status = out.trim().toLowerCase();
    if (status === "running") return "running";
    if (["exited", "stopped", "created", "paused", "dead"].includes(status)) return "stopped";
    return "error";
  } catch {
    return "not_found";
  }
}

function buildRunArgs(opts: ContainerCreateOptions): string[] {
  const args: string[] = [
    "run", "-d",
    "--name", opts.name,
    "--hostname", "lms-computer",
    ...(opts.network !== "podman-default" ? ["--network", opts.network] : []),
    ...(opts.network !== "none" ? ["--dns", "8.8.8.8", "--dns", "8.8.4.4"] : []),
    "-w", "/root",
  ];

  if (opts.cpuLimit > 0) args.push("--cpus", String(opts.cpuLimit));
  if (opts.memoryLimitMB > 0) {
    args.push("--memory", `${opts.memoryLimitMB}m`);
    // wsl2 kernel often lacks swap cgroup accounting so
    if (process.platform !== "win32") {
      args.push("--memory-swap", `${opts.memoryLimitMB}m`);
    }
  }

  for (const [k, v] of Object.entries(opts.envVars)) args.push("-e", `${k}=${v}`);
  for (const pf of opts.portForwards) { const t = pf.trim(); if (t) args.push("-p", t); }
  if (opts.hostMountPath) args.push("-v", `${toDockerPath(opts.hostMountPath)}:/mnt/shared`);

  args.push(opts.image, "tail", "-f", "/dev/null");
  return args;
}

async function setupContainer(
  image: ContainerImage,
  preset: string,
  hasNetwork: boolean = false,
): Promise<void> {
  const isAlpine = image.startsWith("alpine");
  const shell = shellFor(image);

  await execAsync(
    runtime!.path,
    [
      "exec", containerName, shell, "-c",
      `mkdir -p ${CONTAINER_WORKDIR} && chown root:root ${CONTAINER_WORKDIR} && ` +
      `touch ~/.bashrc ~/.profile && ` +
      `grep -q 'source ~/.bashrc' ~/.profile 2>/dev/null || ` +
      `echo 'source ~/.bashrc 2>/dev/null || true' >> ~/.profile`,
    ],
    { timeout: 30_000, env: getRuntimeEnv() },
  );

  if (preset === "none" || !hasNetwork) return;

  const packages = isAlpine
    ? (PACKAGE_PRESETS_ALPINE[preset] ?? [])
    : (PACKAGE_PRESETS[preset] ?? []);
  if (packages.length === 0) return;

  const installCmd = isAlpine
    ? `apk add --no-cache ${packages.join(" ")}`
    : `DEBIAN_FRONTEND=noninteractive apt-get update -qq && apt-get install -y --no-install-recommends ${packages.join(" ")} && rm -rf /var/lib/apt/lists/*`;

  await execAsync(runtime!.path, ["exec", containerName, shell, "-c", installCmd], {
    timeout: 300_000,
    env: getRuntimeEnv(),
  }).catch((e: Error) => {
    console.warn("[lms-computer] Package install failed (non-fatal):", e.message);
  });
}

export interface EnsureReadyOptions {
  image: ContainerImage;
  network: NetworkMode;
  cpuLimit: number;
  memoryLimitMB: number;
  diskLimitMB: number;
  autoInstallPreset: string;
  portForwards: string;
  hostMountPath: string;
  persistenceMode: string;
}

export async function ensureReady(opts: EnsureReadyOptions): Promise<void> {
  if (containerReady) return;
  if (initPromise) { await initPromise; return; }

  initPromise = (async () => {
    if (!runtime) {
      runtime = await detectRuntime();
      containerName = `${CONTAINER_NAME_PREFIX}-main`;
      if (runtime.kind === "podman") ensurePodmanConfig();
    }

    const state = await getContainerState();

    if (state === "running") { containerReady = true; return; }

    if (opts.persistenceMode === "ephemeral" && state !== "not_found") {
      try { await run(["stop", containerName], 15_000); } catch { }
      try { await run(["rm", "-f", containerName], 10_000); } catch { }
    }

    if (state === "stopped") {
      try {
        await run(["start", containerName]);
        containerReady = true;
        return;
      } catch (err: any) {
        const msg: string = err?.message ?? "";
        if (msg.includes("workdir") || msg.includes("does not exist") ||
          msg.includes("netns") || msg.includes("mount runtime")) {
          try { await run(["rm", "-f", containerName], 10_000); } catch { }
        } else { throw err; }
      }
    }

    try { await run(["pull", opts.image], 300_000); } catch { }

    const portForwards = opts.portForwards
      ? opts.portForwards.split(",").map((s) => s.trim()).filter(Boolean)
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

    // --storage-opt is not supported on docker desktop win (overlayfs)
    const diskOptArgs = [...createArgs];
    if (opts.diskLimitMB > 0 && process.platform !== "win32") {
      diskOptArgs.splice(diskOptArgs.indexOf(opts.image), 0,
        "--storage-opt", `size=${opts.diskLimitMB}m`);
    }

    const stripResourceFlags = (args: string[]): string[] =>
      args.filter((a, i, arr) => {
        const prev = arr[i - 1] ?? "";
        return (
          a !== "--memory" && a !== "--memory-swap" &&
          a !== "--cpus" && a !== "--storage-opt" &&
          !prev.match(/^--(memory|memory-swap|cpus|storage-opt)$/)
        );
      });

    const tryRun = async (args: string[]): Promise<void> => {
      try {
        await run(args, 60_000);
      } catch (err: any) {
        const msg: string = err?.message ?? "";
        if (msg.includes("storage-opt") || msg.includes("backingFS") || msg.includes("overlay.size")) {
          console.warn("[lms-computer] Disk quota not supported, retrying without --storage-opt.");
          const noStorage = args.filter((a, i, arr) =>
            a !== "--storage-opt" && !(arr[i - 1] === "--storage-opt")
          );
          await tryRun(noStorage);
        } else if (msg.includes("memory") || msg.includes("cpus") ||
          msg.includes("cgroup") || msg.includes("resource")) {
          console.warn("[lms-computer] Resource limits not supported, retrying without them.");
          await run(stripResourceFlags(createArgs), 60_000);
        } else {
          throw err;
        }
      }
    };

    await tryRun(diskOptArgs);

    const hasNetworkForSetup = setupNetwork !== "none";
    await setupContainer(opts.image, opts.autoInstallPreset, hasNetworkForSetup);

    if (opts.network === "none" && setupNetwork !== "none") {
      try {
        await run(["network", "disconnect", setupNetwork, containerName], 10_000);
      } catch { /* best effort */ }
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

export async function exec(
  command: string,
  timeoutSeconds: number,
  maxOutputBytes: number = DEFAULT_MAX_OUTPUT_BYTES,
  workdir?: string,
): Promise<ExecResult> {
  if (!runtime || !containerReady) throw new Error("Container not ready. Call ensureReady() first.");
  const cmdToRun = workdir && workdir !== CONTAINER_WORKDIR
    ? `cd ${workdir} && ${command}` : command;
  return execInSession(cmdToRun, timeoutSeconds, maxOutputBytes);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  return new Promise<void>((resolve, reject) => {
    const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
    const proc = spawn(runtime!.path, ["exec", "-i", containerName, shell, "-c", `cat > '${q(filePath)}'`], {
      timeout: 15_000, stdio: ["pipe", "ignore", "pipe"], env: getRuntimeEnv(),
    });
    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => { code === 0 ? resolve() : reject(new Error(`Write failed (exit ${code}): ${stderr}`)); });
    proc.on("error", reject);
    proc.stdin?.write(content);
    proc.stdin?.end();
  });
}

export async function appendFile(filePath: string, content: string): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  return new Promise<void>((resolve, reject) => {
    const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
    const proc = spawn(runtime!.path, ["exec", "-i", containerName, shell, "-c", `cat >> '${q(filePath)}'`], {
      timeout: 15_000, stdio: ["pipe", "ignore", "pipe"], env: getRuntimeEnv(),
    });
    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => { code === 0 ? resolve() : reject(new Error(`Append failed (exit ${code}): ${stderr}`)); });
    proc.on("error", reject);
    proc.stdin?.write(content);
    proc.stdin?.end();
  });
}

export async function readFile(
  filePath: string,
  maxBytes: number,
  startLine?: number,
  endLine?: number,
): Promise<{ content: string; totalLines: number }> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const qp = q(filePath);
  const totalResult = await exec(`wc -l < '${qp}' 2>/dev/null || echo 0`, 5);
  const totalLines = parseInt(totalResult.stdout.trim(), 10) || 0;

  let cmd: string;
  if (startLine !== undefined && endLine !== undefined) {
    cmd = `sed -n '${startLine},${endLine}p' '${qp}'`;
  } else if (startLine !== undefined) {
    cmd = `tail -n +${startLine} '${qp}'`;
  } else {
    cmd = `cat '${qp}'`;
  }

  const result = await exec(cmd, 10, maxBytes);
  if (result.exitCode !== 0) throw new Error(`Read failed: ${result.stderr || "file not found"}`);
  return { content: result.stdout, totalLines };
}

/**
 * Replace one or more exact strings in a file.
 * All replacements are applied in order and the file is written once.
 * Each oldStr must appear exactly once.
 */
export async function strReplaceInFile(
  filePath: string,
  replacements: Array<{ oldStr: string; newStr: string }>,
): Promise<{ replacements: number }> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const qp = q(filePath);
  const readResult = await exec(`cat '${qp}'`, 10, MAX_OUTPUT_BYTES);
  if (readResult.exitCode !== 0) throw new Error(`File not found: ${filePath}`);

  let content = readResult.stdout;
  for (const { oldStr, newStr } of replacements) {
    const occurrences = content.split(oldStr).length - 1;
    if (occurrences === 0) {
      throw new Error(
        `String not found in ${filePath}:\n"${oldStr.slice(0, 80)}"\n` +
        `Hint: use ReadFile to view the current contents before editing.`,
      );
    }
    if (occurrences > 1) {
      throw new Error(
        `String appears ${occurrences} times in ${filePath} — it must be unique.\n` +
        `Hint: include more surrounding context to make the match unique.`,
      );
    }
    content = content.replace(oldStr, newStr);
  }

  await writeFile(filePath, content);
  return { replacements: replacements.length };
}

export async function insertLinesInFile(
  filePath: string,
  afterLine: number,
  content: string,
): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const qp = q(filePath);
  const readResult = await exec(`cat '${qp}'`, 10, MAX_OUTPUT_BYTES);
  if (readResult.exitCode !== 0) throw new Error(`File not found: ${filePath}`);
  const lines = readResult.stdout.split("\n");
  const insertLines = content.split("\n");
  const clampedLine = Math.max(0, Math.min(afterLine, lines.length));
  lines.splice(clampedLine, 0, ...insertLines);
  await writeFile(filePath, lines.join("\n"));
}

export async function moveFile(src: string, dest: string): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const destDir = dest.includes("/") ? dest.slice(0, dest.lastIndexOf("/")) : ".";
  const result = await exec(
    `mkdir -p '${q(destDir)}' 2>/dev/null; mv '${q(src)}' '${q(dest)}'`, 10);
  if (result.exitCode !== 0) throw new Error(`Move failed: ${result.stderr || "unknown error"}`);
}

export async function copyFile(src: string, dest: string): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const destDir = dest.includes("/") ? dest.slice(0, dest.lastIndexOf("/")) : ".";
  const result = await exec(
    `mkdir -p '${q(destDir)}' 2>/dev/null; cp -r '${q(src)}' '${q(dest)}'`, 10);
  if (result.exitCode !== 0) throw new Error(`Copy failed: ${result.stderr || "unknown error"}`);
}

export async function searchInFiles(
  pattern: string,
  dir: string,
  options: { ignoreCase?: boolean; glob?: string; maxResults?: number } = {},
): Promise<{ matches: string; count: number; truncated: boolean }> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  const { ignoreCase, glob, maxResults = 200 } = options;

  const flags = [
    "-rn", "--color=never",
    ignoreCase ? "-i" : "",
    glob ? `--include='${glob}'` : "",
    `--exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='.cache'`,
  ].filter(Boolean).join(" ");

  const escapedPattern = q(pattern);
  const cmd = `grep ${flags} '${escapedPattern}' '${q(dir)}' 2>/dev/null | head -${maxResults + 1}`;
  const result = await exec(cmd, 15, DEFAULT_MAX_OUTPUT_BYTES);
  const lines = result.stdout.trim() ? result.stdout.trim().split("\n") : [];
  const truncated = lines.length > maxResults;
  const displayLines = truncated ? lines.slice(0, maxResults) : lines;

  return {
    matches: displayLines.join("\n") || "(no matches)",
    count: displayLines.length,
    truncated,
  };
}

export async function setEnvVar(key: string, value: string): Promise<void> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw new Error(
      `Invalid env var name: "${key}". Must match [A-Za-z_][A-Za-z0-9_]*`,
    );
  }
  const escaped = q(value);
  const cmd =
    `sed -i '/^export ${key}=/d' ~/.bashrc 2>/dev/null; ` +
    `echo "export ${key}='${escaped}'" >> ~/.bashrc; ` +
    `export ${key}='${escaped}'`;
  const result = await exec(cmd, 5);
  if (result.exitCode !== 0) throw new Error(`Failed to set env var: ${result.stderr}`);
}

interface BgEntry {
  stdout: string;
  stderr: string;
  done: boolean;
  exitCode: number | null;
  proc: ReturnType<typeof spawn> | null;
  command: string;
  startedAt: number;
}

const bgLogs = new Map<number, BgEntry>();

export async function execBackground(
  command: string,
  timeoutSeconds: number,
): Promise<{ handleId: number; pid: number }> {
  if (!runtime || !containerReady) throw new Error("Container not ready.");

  const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
  const handleId = Date.now();
  const entry: BgEntry = {
    stdout: "", stderr: "", done: false, exitCode: null, proc: null,
    command, startedAt: Date.now(),
  };
  bgLogs.set(handleId, entry);

  const proc = spawn(runtime.path, ["exec", containerName, shell, "-c", command], {
    stdio: ["ignore", "pipe", "pipe"], env: getRuntimeEnv(),
  });

  entry.proc = proc;
  const cap = MAX_OUTPUT_BYTES * 4;

  proc.stdout?.on("data", (chunk: Buffer) => {
    if (entry.stdout.length < cap) entry.stdout += chunk.toString("utf-8");
  });
  proc.stderr?.on("data", (chunk: Buffer) => {
    if (entry.stderr.length < cap) entry.stderr += chunk.toString("utf-8");
  });

  const killTimer = setTimeout(() => {
    if (!entry.done) {
      try { proc.kill("SIGKILL"); } catch { }
      entry.done = true;
      entry.exitCode = 137;
      entry.proc = null;
    }
  }, timeoutSeconds * 1_000);

  proc.on("close", (code) => {
    entry.done = true;
    entry.exitCode = code;
    entry.proc = null;
    clearTimeout(killTimer);
  });

  return { handleId, pid: proc.pid ?? -1 };
}

/**
 * Read buffered output from a background process.
 * Pass `fromOffset` (the `nextOffset` from the previous call) to receive
 * only new stdout since the last read — avoids duplicate output on repeated polling.
 */
export function readBgLogs(
  handleId: number,
  maxBytes: number = DEFAULT_MAX_OUTPUT_BYTES,
  fromOffset: number = 0,
): {
  stdout: string;
  stderr: string;
  done: boolean;
  exitCode: number | null;
  found: boolean;
  nextOffset: number;
} {
  const entry = bgLogs.get(handleId);
  if (!entry) {
    return { stdout: "", stderr: "", done: true, exitCode: null, found: false, nextOffset: 0 };
  }
  const newStdout = entry.stdout.slice(fromOffset, fromOffset + maxBytes);
  const nextOffset = fromOffset + newStdout.length;
  return {
    stdout: newStdout || "(no new output since last read)",
    stderr: entry.stderr.slice(-maxBytes) || "",
    done: entry.done,
    exitCode: entry.exitCode,
    found: true,
    nextOffset,
  };
}

/**
 * Kill a background process by handle ID.
 * Sends SIGTERM then SIGKILL after 2 s if the process hasn't exited.
 */
export function killBgProcess(handleId: number): {
  found: boolean;
  alreadyDone: boolean;
} {
  const entry = bgLogs.get(handleId);
  if (!entry) return { found: false, alreadyDone: false };
  if (entry.done) return { found: true, alreadyDone: true };
  if (entry.proc) {
    try {
      entry.proc.kill("SIGTERM");
      setTimeout(() => {
        if (!entry.done && entry.proc) {
          try { entry.proc.kill("SIGKILL"); } catch { }
        }
      }, 2_000);
    } catch { }
  }
  return { found: true, alreadyDone: false };
}

/**
 * List all background processes (running or recently finished).
 * Used by the preprocessor to inject context about active jobs.
 */
export function listBgProcesses(): Array<{
  handleId: number;
  command: string;
  running: boolean;
  exitCode: number | null;
  runtimeSecs: number;
}> {
  const out = [];
  for (const [handleId, entry] of bgLogs.entries()) {
    out.push({
      handleId,
      command: entry.command.length > 60 ? entry.command.slice(0, 57) + "…" : entry.command,
      running: !entry.done,
      exitCode: entry.exitCode,
      runtimeSecs: Math.round((Date.now() - entry.startedAt) / 1000),
    });
  }
  return out.sort((a, b) => b.handleId - a.handleId).slice(0, 10);
}

export async function copyToContainer(hostPath: string, containerPath: string): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", hostPath, `${containerName}:${containerPath}`], 60_000);
}

export async function copyFromContainer(containerPath: string, hostPath: string): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", `${containerName}:${containerPath}`, hostPath], 60_000);
}

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
  const toMiB = (kb: number) =>
    kb >= 1024 * 1024 ? `${(kb / 1024 / 1024).toFixed(1)}GiB` : `${Math.round(kb / 1024)}MiB`;

  if (diskLimitMB > 0) {
    const diskLimitKB = diskLimitMB * 1024;
    diskTotal = toMiB(diskLimitKB);
    diskFree = toMiB(Math.max(0, diskLimitKB - diskUsedKB));
  } else {
    diskFree = toMiB(diskFreeRawKB);
    diskTotal = "N/A";
  }

  return {
    os: get("OS"), kernel: get("KERNEL"), arch: get("ARCH"),
    hostname: get("HOSTNAME"), uptime: get("UPTIME"),
    diskFree, diskTotal,
    memoryFree: get("MEM_FREE"), memoryTotal: get("MEM_TOTAL"),
    pythonVersion: get("PYTHON") || null,
    nodeVersion: get("NODE") || null,
    gccVersion: get("GCC") || null,
    installedTools: get("TOOLS").split(",").filter(Boolean),
    workdir: CONTAINER_WORKDIR,
    networkEnabled: network,
  };
}

export async function listProcesses(): Promise<ProcessInfo[]> {
  const result = await exec("ps aux --no-headers 2>/dev/null || ps aux 2>/dev/null", 5);
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

export async function killProcess(pid: number, signal: string = "SIGTERM"): Promise<boolean> {
  const result = await exec(`kill -${signal} ${pid} 2>&1`, 5);
  return result.exitCode === 0;
}

export async function stopContainer(remove: boolean = false): Promise<void> {
  if (!runtime) return;
  if (shellSession) { shellSession.kill(); shellSession = null; }
  try { await run(["stop", containerName], 15_000); } catch { }
  if (remove) { try { await run(["rm", "-f", containerName], 10_000); } catch { } }
  containerReady = false;
}

export async function destroyContainer(): Promise<void> {
  await stopContainer(true);
  containerReady = false;
  currentNetwork = "none";
  initPromise = null;
}

export async function restartContainer(): Promise<void> {
  if (!runtime) throw new Error("Runtime not initialized.");
  if (shellSession) { shellSession.kill(); shellSession = null; }
  try { await run(["stop", containerName], 15_000); } catch { }
  await run(["start", containerName], 30_000);
  containerReady = true;
}

export async function getContainerInfo(): Promise<ContainerInfo> {
  if (!runtime) throw new Error("Runtime not initialized.");
  const state = await getContainerState();

  if (state === "not_found") {
    return {
      id: "", name: containerName, state: "not_found", image: "", created: "",
      uptime: null, cpuUsage: null, memoryUsage: null, diskUsage: null, networkMode: "", ports: []
    };
  }

  try {
    const format = "{{.Id}}\t{{.Config.Image}}\t{{.Created}}\t{{.State.Status}}\t{{.HostConfig.NetworkMode}}";
    const out = await run(["inspect", containerName, "--format", format]);
    const [id, image, created, , networkMode] = out.split("\t");

    let cpuUsage: string | null = null;
    let memoryUsage: string | null = null;

    if (state === "running") {
      try {
        const stats = await run(
          ["stats", containerName, "--no-stream", "--format", "{{.CPUPerc}}\t{{.MemUsage}}"],
          10_000,
        );
        const [cpu, mem] = stats.split("\t");
        cpuUsage = cpu?.trim() ?? null;
        memoryUsage = mem?.trim() ?? null;
      } catch { /* stats not available */ }
    }

    return {
      id: id?.slice(0, 12) ?? "", name: containerName, state,
      image: image ?? "", created: created ?? "",
      uptime: state === "running" ? "running" : null,
      cpuUsage, memoryUsage, diskUsage: null,
      networkMode: networkMode ?? "", ports: [],
    };
  } catch {
    return {
      id: "", name: containerName, state, image: "", created: "",
      uptime: null, cpuUsage: null, memoryUsage: null, diskUsage: null, networkMode: "", ports: []
    };
  }
}

export async function updateNetwork(
  mode: NetworkMode,
  opts: Parameters<typeof ensureReady>[0],
): Promise<void> {
  const hadContainer = (await getContainerState()) !== "not_found";
  if (!hadContainer) return;

  const tempImage = `${containerName}-state:latest`;
  if (opts.persistenceMode === "persistent") {
    try { await run(["commit", containerName, tempImage], 60_000); } catch { }
  }

  await destroyContainer();
  const useImage = opts.persistenceMode === "persistent" ? tempImage : opts.image;
  containerReady = false;
  await ensureReady({ ...opts, network: mode, image: useImage as any });

  if (opts.persistenceMode === "persistent") {
    try { await run(["rmi", tempImage], 10_000); } catch { }
  }
}

export function isReady(): boolean { return containerReady; }

export function resetShellSession(): void {
  if (shellSession) { shellSession.kill(); shellSession = null; }
}

export async function verifyHealth(): Promise<void> {
  if (!containerReady) return;
  try {
    const state = await getContainerState();
    if (state !== "running") {
      containerReady = false;
      currentNetwork = "none";
      if (shellSession) { shellSession.kill(); shellSession = null; }
    }
  } catch {
    containerReady = false;
    currentNetwork = "none";
    if (shellSession) { shellSession.kill(); shellSession = null; }
  }
}

export function getContainerName(): string { return containerName; }