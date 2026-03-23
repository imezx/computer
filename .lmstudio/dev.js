"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config.ts
var import_sdk, configSchematics;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
    configSchematics = (0, import_sdk.createConfigSchematics)().field(
      "internetAccess",
      "select",
      {
        displayName: "Internet Access",
        subtitle: "Allow the computer to reach the internet (toggle container network mode)",
        options: [
          { value: "on", displayName: "On \u2014 container has full internet access" },
          { value: "off", displayName: "Off \u2014 completely airgapped, no network" }
        ]
      },
      "off"
    ).field(
      "persistenceMode",
      "select",
      {
        displayName: "Persistence Mode",
        subtitle: "Whether the computer keeps its state when LM Studio closes",
        options: [
          {
            value: "persistent",
            displayName: "Persistent \u2014 keep files, packages, and state across sessions"
          },
          {
            value: "ephemeral",
            displayName: "Ephemeral \u2014 fresh clean environment every time"
          }
        ]
      },
      "persistent"
    ).field(
      "baseImage",
      "select",
      {
        displayName: "Base Image",
        subtitle: "The Linux distribution running inside the container",
        options: [
          {
            value: "ubuntu:24.04",
            displayName: "Ubuntu 24.04 (recommended \u2014 widest compatibility)"
          },
          { value: "ubuntu:22.04", displayName: "Ubuntu 22.04 (LTS stable)" },
          {
            value: "debian:bookworm-slim",
            displayName: "Debian Bookworm Slim (lightweight)"
          },
          {
            value: "alpine:3.20",
            displayName: "Alpine 3.20 (ultra-lightweight ~5MB, musl libc)"
          }
        ]
      },
      "ubuntu:24.04"
    ).field(
      "cpuLimit",
      "numeric",
      {
        displayName: "CPU Core Limit",
        subtitle: "Maximum CPU cores allocated to the computer (0 = no limit)",
        min: 0,
        max: 8,
        int: true,
        slider: { step: 1, min: 0, max: 8 }
      },
      2
    ).field(
      "memoryLimitMB",
      "numeric",
      {
        displayName: "Memory Limit (MB)",
        subtitle: "Maximum RAM in megabytes (256-8192)",
        min: 256,
        max: 8192,
        int: true,
        slider: { step: 256, min: 256, max: 8192 }
      },
      1024
    ).field(
      "diskLimitMB",
      "numeric",
      {
        displayName: "Disk Limit (MB)",
        subtitle: "Maximum disk space in megabytes (512-32768). Only enforced on new containers.",
        min: 512,
        max: 32768,
        int: true,
        slider: { step: 512, min: 512, max: 32768 }
      },
      4096
    ).field(
      "commandTimeout",
      "numeric",
      {
        displayName: "Command Timeout (seconds)",
        subtitle: "Maximum time a single command can run before being killed (5-300)",
        min: 5,
        max: 300,
        int: true,
        slider: { step: 5, min: 5, max: 300 }
      },
      30
    ).field(
      "maxOutputSize",
      "numeric",
      {
        displayName: "Max Output Size (KB)",
        subtitle: "Maximum stdout/stderr returned to the model per command (1-128 KB). Larger output is truncated.",
        min: 1,
        max: 128,
        int: true,
        slider: { step: 1, min: 1, max: 128 }
      },
      32
    ).field(
      "maxToolCallsPerTurn",
      "numeric",
      {
        displayName: "Max Tool Calls Per Turn",
        subtitle: "Maximum number of times the model can use the computer per conversational turn (1-100). It resets each time you send a message. Prevents infinite or long loops.",
        min: 1,
        max: 100,
        int: true,
        slider: { step: 1, min: 1, max: 100 }
      },
      10
    ).field(
      "autoInstallPreset",
      "select",
      {
        displayName: "Auto-Install Packages",
        subtitle: "Pre-install common tools when the container is first created",
        options: [
          { value: "none", displayName: "None \u2014 bare OS, install manually" },
          { value: "minimal", displayName: "Minimal \u2014 curl, wget, git, vim, jq" },
          { value: "python", displayName: "Python \u2014 python3, pip, venv" },
          { value: "node", displayName: "Node.js \u2014 nodejs, npm" },
          { value: "build", displayName: "Build Tools \u2014 gcc, cmake, make" },
          {
            value: "full",
            displayName: "Full \u2014 all of the above + networking tools"
          }
        ]
      },
      "minimal"
    ).field(
      "portForwards",
      "string",
      {
        displayName: "Port Forwards",
        subtitle: "Comma-separated host:container port pairs (e.g., '8080:80,3000:3000'). Allows accessing services running inside the container."
      },
      ""
    ).field(
      "hostMountPath",
      "string",
      {
        displayName: "Shared Folder (Host Mount)",
        subtitle: "Absolute path to a folder on your computer that will be accessible inside the container at /mnt/shared. Leave empty to disable."
      },
      ""
    ).field(
      "strictSafety",
      "select",
      {
        displayName: "Strict Safety Mode",
        subtitle: "Block known destructive commands (fork bombs, disk wipers). Disable only if you know what you're doing.",
        options: [
          {
            value: "on",
            displayName: "On \u2014 block obviously destructive commands (recommended)"
          },
          {
            value: "off",
            displayName: "Off \u2014 allow everything, I accept the risk"
          }
        ]
      },
      "on"
    ).field(
      "autoInjectContext",
      "select",
      {
        displayName: "Auto-Inject Computer Context",
        subtitle: "Automatically tell the model about its computer (OS, installed tools, running processes) at the start of each turn",
        options: [
          {
            value: "on",
            displayName: "On \u2014 model always knows its computer state (recommended)"
          },
          {
            value: "off",
            displayName: "Off \u2014 model discovers state via tools only"
          }
        ]
      },
      "on"
    ).build();
  }
});

// src/container/runtime.ts
async function probe(cmd, kind) {
  try {
    const { stdout } = await execAsync(cmd, ["--version"], { timeout: 5e3 });
    const version = stdout.trim().split("\n")[0] ?? "unknown";
    return { kind, path: cmd, version };
  } catch {
    return null;
  }
}
function getRuntimeCandidates() {
  const candidates = [
    { cmd: "docker", kind: "docker" },
    { cmd: "podman", kind: "podman" }
  ];
  if (process.platform === "win32") {
    candidates.push(
      {
        cmd: "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe",
        kind: "docker"
      },
      {
        cmd: "C:\\Program Files\\Docker\\Docker\\resources\\docker.exe",
        kind: "docker"
      }
    );
  }
  return candidates;
}
async function detectRuntime() {
  if (cachedRuntime) return cachedRuntime;
  for (const { cmd, kind } of getRuntimeCandidates()) {
    const result = await probe(cmd, kind);
    if (result) {
      cachedRuntime = result;
      return result;
    }
  }
  const isWin = process.platform === "win32";
  throw new Error(
    "No container runtime found. Please install Docker Desktop" + (isWin ? " from https://docs.docker.com/desktop/setup/install/windows-install/" : " (https://docs.docker.com/get-docker/)") + " or Podman (https://podman.io/getting-started/installation) to use this plugin."
  );
}
var import_child_process, import_util, execAsync, cachedRuntime;
var init_runtime = __esm({
  "src/container/runtime.ts"() {
    "use strict";
    import_child_process = require("child_process");
    import_util = require("util");
    execAsync = (0, import_util.promisify)(import_child_process.execFile);
    cachedRuntime = null;
  }
});

// src/constants.ts
var CONTAINER_NAME_PREFIX, CONTAINER_WORKDIR, CONTAINER_SHELL, CONTAINER_SHELL_ALPINE, MAX_TIMEOUT_SECONDS, DEFAULT_MAX_OUTPUT_BYTES, MAX_OUTPUT_BYTES, MAX_FILE_READ_BYTES, MAX_FILE_WRITE_BYTES, BLOCKED_COMMANDS_STRICT, CONTAINER_ENV_VARS, PACKAGE_PRESETS, PACKAGE_PRESETS_ALPINE, MAX_INJECTED_CONTEXT_CHARS;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    CONTAINER_NAME_PREFIX = "lms-computer";
    CONTAINER_WORKDIR = "/home/user";
    CONTAINER_SHELL = "/bin/bash";
    CONTAINER_SHELL_ALPINE = "/bin/sh";
    MAX_TIMEOUT_SECONDS = 300;
    DEFAULT_MAX_OUTPUT_BYTES = 32768;
    MAX_OUTPUT_BYTES = 131072;
    MAX_FILE_READ_BYTES = 512e3;
    MAX_FILE_WRITE_BYTES = 5242880;
    BLOCKED_COMMANDS_STRICT = [
      ":(){ :|:& };:",
      // fork bomb
      "rm -rf /",
      // root wipe
      "rm -rf /*",
      // root wipe variant
      "mkfs",
      // format filesystem
      "dd if=/dev/zero",
      // disk destroyer
      "dd if=/dev/random",
      // disk destroyer
      "> /dev/sda",
      // raw disk write
      "chmod -R 777 /",
      // permission nuke
      "chown -R"
      // ownership nuke on root
    ];
    CONTAINER_ENV_VARS = {
      TERM: "xterm-256color",
      LANG: "en_US.UTF-8",
      HOME: CONTAINER_WORKDIR,
      LMS_COMPUTER: "1"
    };
    PACKAGE_PRESETS = {
      minimal: ["curl", "wget", "git", "vim-tiny", "jq"],
      python: ["python3", "python3-pip", "python3-venv"],
      node: ["nodejs", "npm"],
      build: ["build-essential", "cmake", "pkg-config"],
      network: ["net-tools", "iputils-ping", "dnsutils", "traceroute", "nmap"],
      full: [
        "curl",
        "wget",
        "git",
        "vim-tiny",
        "jq",
        "python3",
        "python3-pip",
        "python3-venv",
        "nodejs",
        "npm",
        "build-essential",
        "cmake",
        "net-tools",
        "iputils-ping",
        "htop",
        "tree",
        "unzip",
        "zip"
      ]
    };
    PACKAGE_PRESETS_ALPINE = {
      minimal: ["curl", "wget", "git", "vim", "jq"],
      python: ["python3", "py3-pip"],
      node: ["nodejs", "npm"],
      build: ["build-base", "cmake", "pkgconf"],
      network: ["net-tools", "iputils", "bind-tools", "traceroute", "nmap"],
      full: [
        "curl",
        "wget",
        "git",
        "vim",
        "jq",
        "python3",
        "py3-pip",
        "nodejs",
        "npm",
        "build-base",
        "cmake",
        "net-tools",
        "iputils",
        "htop",
        "tree",
        "unzip",
        "zip"
      ]
    };
    MAX_INJECTED_CONTEXT_CHARS = 2e3;
  }
});

// src/container/engine.ts
function toDockerPath(hostPath) {
  if (process.platform !== "win32") return hostPath;
  return hostPath.replace(/^([A-Za-z]):\\/, (_, d) => `//${d.toLowerCase()}/`).replace(/\\/g, "/");
}
function getRuntimeEnv() {
  const base = process.env.PATH ?? "";
  const extra = process.platform === "win32" ? [
    "C:\\Program Files\\Docker\\Docker\\resources\\bin",
    "C:\\Program Files\\Docker\\Docker\\resources"
  ] : [
    "/usr/bin",
    "/usr/local/bin",
    "/usr/lib/podman",
    "/usr/libexec/podman",
    "/bin"
  ];
  const sep = process.platform === "win32" ? ";" : ":";
  return {
    ...process.env,
    PATH: [base, ...extra].filter(Boolean).join(sep)
  };
}
function ensurePodmanConfig() {
  try {
    const configDir = (0, import_path.join)((0, import_os.homedir)(), ".config", "containers");
    const configPath = (0, import_path.join)(configDir, "containers.conf");
    let existing = "";
    if ((0, import_fs.existsSync)(configPath)) {
      existing = (0, import_fs.readFileSync)(configPath, "utf-8");
    }
    const needsDNS = !existing.includes("dns_servers");
    const needsHelperDir = !existing.includes("helper_binaries_dir");
    if (!needsDNS && !needsHelperDir) return;
    (0, import_fs.mkdirSync)(configDir, { recursive: true });
    let updated = existing;
    if (needsHelperDir) {
      const helperLine = 'helper_binaries_dir = ["/usr/bin", "/usr/local/bin", "/usr/lib/podman"]';
      updated = updated.includes("[network]") ? updated.replace("[network]", `[network]
${helperLine}`) : updated + `
[network]
${helperLine}
`;
    }
    if (needsDNS) {
      const dnsLine = 'dns_servers = ["8.8.8.8", "8.8.4.4"]';
      updated = updated.includes("[containers]") ? updated.replace("[containers]", `[containers]
${dnsLine}`) : updated + `
[containers]
${dnsLine}
`;
    }
    (0, import_fs.writeFileSync)(configPath, updated, "utf-8");
    console.log(
      "[lms-computer] Auto-configured Podman containers.conf (helper_binaries_dir + dns_servers)."
    );
  } catch (err) {
    console.warn("[lms-computer] Could not write Podman config:", err);
  }
}
function shellFor(image) {
  return image.startsWith("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
}
function startShellSession() {
  if (!runtime) throw new Error("Runtime not initialized");
  const isAlpine = containerName.includes("alpine");
  const shell = isAlpine ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
  const proc = (0, import_child_process2.spawn)(
    runtime.path,
    ["exec", "-i", "-w", CONTAINER_WORKDIR, containerName, shell],
    {
      stdio: ["pipe", "pipe", "pipe"],
      env: getRuntimeEnv()
    }
  );
  const init = [
    "export PS1=''",
    "export PS2=''",
    "export TERM=xterm-256color",
    `cd ${CONTAINER_WORKDIR}`,
    ""
  ].join("\n");
  proc.stdin?.write(init);
  const session = {
    proc,
    write: (data) => proc.stdin?.write(data),
    kill: () => {
      try {
        proc.kill("SIGKILL");
      } catch {
      }
    }
  };
  proc.on("exit", () => {
    if (shellSession === session) shellSession = null;
  });
  proc.on("error", () => {
    if (shellSession === session) shellSession = null;
  });
  return session;
}
async function execInSession(command, timeoutSeconds, maxOutputBytes) {
  if (!shellSession || shellSession.proc.exitCode !== null || shellSession.proc.killed) {
    shellSession = startShellSession();
    await new Promise((r) => setTimeout(r, 100));
  }
  const session = shellSession;
  const start = Date.now();
  const effectiveMax = Math.min(maxOutputBytes, MAX_OUTPUT_BYTES);
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let done = false;
    const cleanup = () => {
      session.proc.stdout?.removeListener("data", onStdout);
      session.proc.stderr?.removeListener("data", onStderr);
      clearTimeout(timer);
    };
    const finish = (timedOut, killed) => {
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
        truncated: stdout.length >= effectiveMax || stderr.length >= effectiveMax
      });
    };
    const onStdout = (chunk) => {
      if (done) return;
      stdout += chunk.toString("utf-8");
      if (stdout.includes(SENTINEL_NL) || stdout.endsWith(SENTINEL)) {
        finish(false, false);
      }
    };
    const onStderr = (chunk) => {
      if (done) return;
      if (stderr.length < effectiveMax) stderr += chunk.toString("utf-8");
    };
    const timer = setTimeout(() => {
      if (done) return;
      session.kill();
      shellSession = null;
      finish(true, true);
    }, timeoutSeconds * 1e3);
    session.proc.stdout?.on("data", onStdout);
    session.proc.stderr?.on("data", onStderr);
    const wrapped = `${command}
echo "EXIT_CODE:$?"
echo "${SENTINEL}"
`;
    session.write(wrapped);
  });
}
async function run(args, timeoutMs = 3e4) {
  if (!runtime) throw new Error("Runtime not initialized");
  const { stdout } = await execAsync2(runtime.path, args, {
    timeout: timeoutMs,
    maxBuffer: MAX_OUTPUT_BYTES,
    env: getRuntimeEnv()
  });
  return stdout.trim();
}
async function getContainerState() {
  try {
    const out = await run([
      "inspect",
      containerName,
      "--format",
      "{{.State.Status}}"
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
function buildRunArgs(opts) {
  const args = [
    "run",
    "-d",
    "--name",
    opts.name,
    "--hostname",
    "lms-computer",
    ...opts.network !== "podman-default" ? ["--network", opts.network] : [],
    ...opts.network !== "none" ? ["--dns", "8.8.8.8", "--dns", "8.8.4.4"] : [],
    "-w",
    "/root"
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
async function setupContainer(image, preset, hasNetwork = false) {
  const shell = shellFor(image);
  await run(
    [
      "exec",
      containerName,
      shell,
      "-c",
      `mkdir -p ${CONTAINER_WORKDIR} && (id user >/dev/null 2>&1 || adduser --disabled-password --gecos "" --home ${CONTAINER_WORKDIR} user 2>/dev/null || adduser -D -h ${CONTAINER_WORKDIR} user 2>/dev/null || true)`
    ],
    15e3
  );
  if (preset && preset !== "none" && hasNetwork) {
    const isAlpine = image.startsWith("alpine");
    const presets = isAlpine ? PACKAGE_PRESETS_ALPINE : PACKAGE_PRESETS;
    const packages = presets[preset];
    if (packages && packages.length > 0) {
      const installCmd = isAlpine ? `apk update && apk add --no-cache ${packages.join(" ")}` : `apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${packages.join(" ")} && apt-get clean && rm -rf /var/lib/apt/lists/*`;
      try {
        await run(["exec", containerName, shell, "-c", installCmd], 18e4);
      } catch (installErr) {
        console.warn(
          "[lms-computer] Package install failed (non-fatal):",
          installErr?.message ?? installErr
        );
      }
    }
  }
}
async function ensureReady(opts) {
  if (containerReady) {
    const wantsNetwork = opts.network !== "none";
    const hasNetwork = currentNetwork !== "none";
    if (wantsNetwork === hasNetwork) return;
    containerReady = false;
    currentNetwork = "none";
    try {
      await run(["stop", containerName], 15e3);
    } catch {
    }
    try {
      await run(["rm", "-f", containerName], 1e4);
    } catch {
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
          "{{.HostConfig.NetworkMode}}"
        ]);
        const actualNet = netOut.trim().toLowerCase();
        actuallyHasNetwork = actualNet !== "none" && actualNet !== "";
      } catch {
      }
      const wantsNetwork = opts.network !== "none";
      if (actuallyHasNetwork === wantsNetwork) {
        currentNetwork = wantsNetwork ? opts.network : "none";
        containerReady = true;
        return;
      }
      console.log(
        `[lms-computer] Network mismatch (container has ${actuallyHasNetwork ? "internet" : "no internet"}, settings want ${wantsNetwork ? "internet" : "no internet"}) \u2014 recreating container.`
      );
      try {
        await run(["stop", containerName], 15e3);
      } catch {
      }
      try {
        await run(["rm", "-f", containerName], 1e4);
      } catch {
      }
    }
    if (state === "stopped") {
      try {
        await run(["start", containerName]);
        containerReady = true;
        return;
      } catch (err) {
        const msg = err?.message ?? "";
        if (msg.includes("workdir") || msg.includes("does not exist") || msg.includes("netns") || msg.includes("mount runtime")) {
          try {
            await run(["rm", "-f", containerName], 1e4);
          } catch {
          }
        } else {
          throw err;
        }
      }
    }
    try {
      await run(["pull", opts.image], 3e5);
    } catch {
    }
    const portForwards = opts.portForwards ? opts.portForwards.split(",").map((s) => s.trim()).filter(Boolean) : [];
    let setupNetwork = "none";
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
      hostMountPath: opts.hostMountPath || null
    });
    const diskOptArgs = [...createArgs];
    if (opts.diskLimitMB > 0) {
      diskOptArgs.splice(
        diskOptArgs.indexOf(opts.image),
        0,
        "--storage-opt",
        `size=${opts.diskLimitMB}m`
      );
    }
    try {
      await run(diskOptArgs, 6e4);
    } catch (err) {
      const msg = err?.message ?? "";
      if (msg.includes("storage-opt") || msg.includes("backingFS") || msg.includes("overlay.size")) {
        console.warn(
          "[lms-computer] Disk quota not supported by storage driver, starting without size limit."
        );
        await run(createArgs, 6e4);
      } else {
        throw err;
      }
    }
    const hasNetworkForSetup = setupNetwork !== "none";
    await setupContainer(
      opts.image,
      opts.autoInstallPreset,
      hasNetworkForSetup
    );
    if (opts.network === "none" && setupNetwork !== "none") {
      try {
        await run(
          ["network", "disconnect", setupNetwork, containerName],
          1e4
        );
      } catch {
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
async function exec(command, timeoutSeconds, maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES, workdir) {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready. Call ensureReady() first.");
  }
  const cmdToRun = workdir && workdir !== CONTAINER_WORKDIR ? `cd ${workdir} && ${command}` : command;
  return execInSession(cmdToRun, timeoutSeconds, maxOutputBytes);
}
async function writeFile(filePath, content) {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }
  return new Promise((resolve, reject) => {
    const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
    const proc = (0, import_child_process2.spawn)(
      runtime.path,
      [
        "exec",
        "-i",
        containerName,
        shell,
        "-c",
        `cat > '${filePath.replace(/'/g, "'\\''")}'`
      ],
      {
        timeout: 15e3,
        stdio: ["pipe", "ignore", "pipe"],
        env: getRuntimeEnv()
      }
    );
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
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
async function readFile(filePath, maxBytes, startLine, endLine) {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }
  const q = filePath.replace(/'/g, "'\\''");
  const totalResult = await exec(`wc -l < '${q}' 2>/dev/null || echo 0`, 5);
  const totalLines = parseInt(totalResult.stdout.trim(), 10) || 0;
  let cmd;
  if (startLine !== void 0 && endLine !== void 0) {
    cmd = `sed -n '${startLine},${endLine}p' '${q}'`;
  } else if (startLine !== void 0) {
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
async function strReplaceInFile(filePath, oldStr, newStr) {
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
      `String not found in ${filePath}.
Hint: use ReadFile to view the current contents before editing.`
    );
  }
  if (occurrences > 1) {
    throw new Error(
      `String appears ${occurrences} times in ${filePath} \u2014 it must be unique.
Hint: include more surrounding context to make the match unique.`
    );
  }
  const updated = original.replace(oldStr, newStr);
  await writeFile(filePath, updated);
  return { replacements: 1 };
}
async function insertLinesInFile(filePath, afterLine, content) {
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
async function execBackground(command, timeoutSeconds) {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }
  const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
  const handleId = Date.now();
  const entry = {
    stdout: "",
    stderr: "",
    done: false,
    exitCode: null
  };
  bgLogs.set(handleId, entry);
  const proc = (0, import_child_process2.spawn)(
    runtime.path,
    ["exec", containerName, shell, "-c", command],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: getRuntimeEnv()
    }
  );
  const cap = MAX_OUTPUT_BYTES * 2;
  proc.stdout?.on("data", (chunk) => {
    if (entry.stdout.length < cap) entry.stdout += chunk.toString("utf-8");
  });
  proc.stderr?.on("data", (chunk) => {
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
  }, timeoutSeconds * 1e3);
  return { handleId, pid: proc.pid ?? -1 };
}
function readBgLogs(handleId, maxBytes = DEFAULT_MAX_OUTPUT_BYTES) {
  const entry = bgLogs.get(handleId);
  if (!entry)
    return { stdout: "", stderr: "", done: true, exitCode: null, found: false };
  return {
    stdout: entry.stdout.slice(-maxBytes),
    stderr: entry.stderr.slice(-maxBytes),
    done: entry.done,
    exitCode: entry.exitCode,
    found: true
  };
}
async function copyToContainer(hostPath, containerPath) {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", hostPath, `${containerName}:${containerPath}`], 6e4);
}
async function copyFromContainer(containerPath, hostPath) {
  if (!runtime) throw new Error("Runtime not initialized.");
  await run(["cp", `${containerName}:${containerPath}`, hostPath], 6e4);
}
async function getEnvironmentInfo(network, diskLimitMB = 0) {
  const infoScript = `
echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
echo "KERNEL=$(uname -r)"
echo "ARCH=$(uname -m)"
echo "HOSTNAME=$(hostname)"
echo "UPTIME=$(uptime -p 2>/dev/null || uptime)"
DISK_USED_KB=$(du -sk ${CONTAINER_WORKDIR} 2>/dev/null | awk '{print $1}' || echo 0)
echo "DISK_USED_KB=$DISK_USED_KB"
echo "DISK_FREE_RAW=$(df -k ${CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4}')"
MEM_LIMIT_BYTES=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo '')
MEM_USAGE_BYTES=$(cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || echo '')
if [ -n "$MEM_LIMIT_BYTES" ] && [ "$MEM_LIMIT_BYTES" != "max" ] && [ "$MEM_LIMIT_BYTES" -lt 9000000000000 ] 2>/dev/null; then
  MEM_TOTAL_H=$(awk "BEGIN{printf "%.0fMiB", $MEM_LIMIT_BYTES/1048576}")
  MEM_USED_H=$(awk "BEGIN{printf "%.0fMiB", \${MEM_USAGE_BYTES:-0}/1048576}")
  MEM_FREE_H=$(awk "BEGIN{printf "%.0fMiB", ($MEM_LIMIT_BYTES-\${MEM_USAGE_BYTES:-0})/1048576}")
else
  MEM_TOTAL_H=$(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo 'N/A')
  MEM_USED_H=$(free -h 2>/dev/null | grep Mem | awk '{print $3}' || echo 'N/A')
  MEM_FREE_H=$(free -h 2>/dev/null | grep Mem | awk '{print $4}' || echo 'N/A')
fi
echo "MEM_FREE=$MEM_FREE_H"
echo "MEM_TOTAL=$MEM_TOTAL_H"
echo "PYTHON=$(python3 --version 2>/dev/null || echo '')"
echo "NODE=$(node --version 2>/dev/null || echo '')"
echo "GCC=$(gcc --version 2>/dev/null | head -1 || echo '')"
echo "TOOLS=$(which git curl wget vim nano python3 node npm gcc make cmake pip3 2>/dev/null | xargs -I{} basename {} | tr '\\n' ',')"
  `.trim();
  const result = await exec(infoScript, 10);
  const lines = result.stdout.split("\n");
  const get = (prefix) => {
    const line = lines.find((l) => l.startsWith(prefix + "="));
    return line?.slice(prefix.length + 1)?.trim() ?? "N/A";
  };
  const diskUsedKB = parseInt(get("DISK_USED_KB") || "0", 10);
  const diskFreeRawKB = parseInt(get("DISK_FREE_RAW") || "0", 10);
  let diskTotal;
  let diskFree;
  if (diskLimitMB > 0) {
    const diskLimitKB = diskLimitMB * 1024;
    const diskFreeKB = Math.max(0, diskLimitKB - diskUsedKB);
    const toMiB = (kb) => kb >= 1024 * 1024 ? `${(kb / 1024 / 1024).toFixed(1)}GiB` : `${Math.round(kb / 1024)}MiB`;
    diskTotal = toMiB(diskLimitKB);
    diskFree = toMiB(diskFreeKB);
  } else {
    const toMiB = (kb) => kb >= 1024 * 1024 ? `${(kb / 1024 / 1024).toFixed(1)}GiB` : `${Math.round(kb / 1024)}MiB`;
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
    networkEnabled: network
  };
}
async function listProcesses() {
  const result = await exec(
    "ps aux --no-headers 2>/dev/null || ps aux 2>/dev/null",
    5
  );
  if (result.exitCode !== 0) return [];
  return result.stdout.split("\n").filter((line) => line.trim() && !line.includes("ps aux")).map((line) => {
    const parts = line.trim().split(/\s+/);
    return {
      pid: parseInt(parts[1] ?? "0", 10),
      user: parts[0] ?? "?",
      cpu: parts[2] ?? "0",
      memory: parts[3] ?? "0",
      started: parts[8] ?? "?",
      command: parts.slice(10).join(" ") || parts.slice(3).join(" ")
    };
  }).filter((p) => p.pid > 0);
}
async function killProcess(pid, signal = "SIGTERM") {
  const result = await exec(`kill -${signal} ${pid}`, 5);
  return result.exitCode === 0;
}
async function stopContainer(remove = false) {
  if (!runtime) return;
  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }
  try {
    await run(["stop", containerName], 15e3);
  } catch {
  }
  if (remove) {
    try {
      await run(["rm", "-f", containerName], 1e4);
    } catch {
    }
  }
  containerReady = false;
}
async function destroyContainer() {
  await stopContainer(true);
  containerReady = false;
  currentNetwork = "none";
  initPromise = null;
}
async function restartContainer() {
  if (!runtime) throw new Error("Runtime not initialized.");
  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }
  try {
    await run(["stop", containerName], 15e3);
  } catch {
  }
  await run(["start", containerName], 3e4);
  containerReady = true;
}
async function getContainerInfo() {
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
      ports: []
    };
  }
  try {
    const format = "{{.Id}}	{{.Config.Image}}	{{.Created}}	{{.State.Status}}	{{.HostConfig.NetworkMode}}";
    const out = await run(["inspect", containerName, "--format", format]);
    const [id, image, created, , networkMode] = out.split("	");
    let cpuUsage = null;
    let memoryUsage = null;
    if (state === "running") {
      try {
        const stats = await run(
          [
            "stats",
            containerName,
            "--no-stream",
            "--format",
            "{{.CPUPerc}}	{{.MemUsage}}"
          ],
          1e4
        );
        const [cpu, mem] = stats.split("	");
        cpuUsage = cpu?.trim() ?? null;
        memoryUsage = mem?.trim() ?? null;
      } catch {
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
      ports: []
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
      ports: []
    };
  }
}
function isReady() {
  return containerReady;
}
function resetShellSession() {
  if (shellSession) {
    shellSession.kill();
    shellSession = null;
  }
}
async function verifyHealth() {
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
var import_child_process2, import_util2, import_fs, import_os, import_path, execAsync2, runtime, containerName, containerReady, currentNetwork, initPromise, shellSession, SENTINEL, SENTINEL_NL, bgLogs;
var init_engine = __esm({
  "src/container/engine.ts"() {
    "use strict";
    import_child_process2 = require("child_process");
    import_util2 = require("util");
    import_fs = require("fs");
    import_os = require("os");
    import_path = require("path");
    init_runtime();
    init_constants();
    execAsync2 = (0, import_util2.promisify)(import_child_process2.execFile);
    runtime = null;
    containerName = "";
    containerReady = false;
    currentNetwork = "none";
    initPromise = null;
    shellSession = null;
    SENTINEL = `__LMS_DONE_${Math.random().toString(36).slice(2)}__`;
    SENTINEL_NL = SENTINEL + "\n";
    bgLogs = /* @__PURE__ */ new Map();
  }
});

// src/safety/guard.ts
function normalize(cmd) {
  return cmd.replace(/\s+/g, " ").trim().toLowerCase().replace(/^(sudo|doas)\s+/, "");
}
function checkCommand(command, strictMode) {
  if (!strictMode) {
    return { allowed: true };
  }
  const normalized = normalize(command);
  for (const pattern of BLOCKED_COMMANDS_STRICT) {
    const normalizedPattern = normalize(pattern);
    if (normalized.includes(normalizedPattern)) {
      return {
        allowed: false,
        reason: `Blocked by strict safety mode: command matches destructive pattern "${pattern}". Disable "Strict Safety Mode" in plugin settings if you need to run this.`
      };
    }
  }
  if (/:\(\)\s*\{.*\}/.test(normalized) || /\.\(\)\s*\{.*\}/.test(normalized)) {
    return {
      allowed: false,
      reason: "Blocked by strict safety mode: detected fork bomb pattern."
    };
  }
  if (/>\s*\/dev\/[sh]d[a-z]/.test(normalized) || /of=\/dev\/[sh]d[a-z]/.test(normalized)) {
    return {
      allowed: false,
      reason: "Blocked by strict safety mode: direct write to block device."
    };
  }
  return { allowed: true };
}
var init_guard = __esm({
  "src/safety/guard.ts"() {
    "use strict";
    init_constants();
  }
});

// src/toolsProvider.ts
function readConfig(ctl) {
  const c = ctl.getPluginConfig(configSchematics);
  return {
    internetAccess: c.get("internetAccess") === "on",
    persistenceMode: c.get("persistenceMode") || "persistent",
    baseImage: c.get("baseImage") || "ubuntu:24.04",
    cpuLimit: c.get("cpuLimit") ?? 2,
    memoryLimitMB: c.get("memoryLimitMB") ?? 1024,
    diskLimitMB: c.get("diskLimitMB") ?? 4096,
    commandTimeout: c.get("commandTimeout") ?? 30,
    maxOutputSize: (c.get("maxOutputSize") ?? 32) * 1024,
    maxToolCallsPerTurn: c.get("maxToolCallsPerTurn") ?? 10,
    autoInstallPreset: c.get("autoInstallPreset") || "minimal",
    portForwards: c.get("portForwards") || "",
    hostMountPath: c.get("hostMountPath") || "",
    strictSafety: c.get("strictSafety") === "on",
    autoInjectContext: c.get("autoInjectContext") === "on"
  };
}
function advanceTurn(maxCalls) {
  turnBudget.turnId++;
  turnBudget.callsUsed = 0;
  turnBudget.maxCalls = maxCalls;
}
function consumeBudget() {
  turnBudget.callsUsed++;
  if (turnBudget.callsUsed > turnBudget.maxCalls) {
    return `Tool call budget exhausted (${turnBudget.maxCalls}/${turnBudget.maxCalls}). Wait for the user's next message to continue.`;
  }
  return null;
}
function budgetStatus() {
  return {
    callsUsed: turnBudget.callsUsed,
    callsRemaining: Math.max(0, turnBudget.maxCalls - turnBudget.callsUsed),
    maxPerTurn: turnBudget.maxCalls
  };
}
function classifyError(raw, context) {
  const m = raw.toLowerCase();
  const fp = context?.filePath ?? "";
  if (m.includes("no such file") || m.includes("not found") && fp) {
    const dir = fp.includes("/") ? fp.slice(0, fp.lastIndexOf("/")) || "/" : CONTAINER_WORKDIR;
    return {
      error: `File not found: ${fp}`,
      hint: `Use ListDirectory on "${dir}" to check what exists there.`
    };
  }
  if (m.includes("permission denied") || m.includes("eacces")) {
    return {
      error: `Permission denied: ${fp || raw.slice(0, 80)}`,
      hint: `Try running with sudo, or fix permissions with: chmod +rw '${fp || "<path>"}'.`
    };
  }
  if (m.includes("is a directory")) {
    return {
      error: `Path is a directory, not a file: ${fp}`,
      hint: `Use ListDirectory to browse its contents, or specify a file path.`
    };
  }
  if (m.includes("no space left") || m.includes("disk quota")) {
    return {
      error: "Disk full or quota exceeded.",
      hint: `Run: df -h && du -sh /home/user/* to find what's using space.`
    };
  }
  if (m.includes("cannot allocate memory") || m.includes("out of memory") || m.includes("oom")) {
    return {
      error: "Out of memory.",
      hint: `Use ComputerStatus to check memory usage. Consider increasing Memory Limit in plugin settings.`
    };
  }
  if (m.includes("command not found") || m.includes("executable file not found") || m.includes("not found in $path")) {
    const cmd = context?.command?.split(" ")[0] ?? "the command";
    return {
      error: `Command not found: ${cmd}`,
      hint: `Install it first \u2014 e.g. apt-get install ${cmd} (Ubuntu) or apk add ${cmd} (Alpine). Make sure Internet Access is enabled in settings.`
    };
  }
  if (m.includes("temporary failure resolving") || m.includes("could not resolve") || m.includes("network unreachable") || m.includes("connection refused") && context?.isNetwork) {
    return {
      error: "Network/DNS failure inside container.",
      hint: `Internet Access may be disabled or the container was built without it. Tell the user to enable Internet Access in settings and call RebuildComputer.`
    };
  }
  if (m.includes("timed out") || m.includes("timeout")) {
    return {
      error: "Command timed out.",
      hint: `For long-running tasks use ExecuteBackground instead, or increase Command Timeout in plugin settings.`
    };
  }
  if (m.includes("container") && (m.includes("not running") || m.includes("not found") || m.includes("no such container"))) {
    return {
      error: "Container is not running.",
      hint: `Call ComputerStatus to wake it up, or call RebuildComputer if it keeps failing.`
    };
  }
  if (m.includes("string not found")) {
    return {
      error: raw.slice(0, 120),
      hint: `Use ReadFile to view the current file content before retrying StrReplace.`
    };
  }
  if (m.includes("appears") && m.includes("times")) {
    return {
      error: raw.slice(0, 120),
      hint: `Include more surrounding lines in oldStr to make the match unique.`
    };
  }
  return {
    error: raw.length > 200 ? raw.slice(0, 200) + "\u2026" : raw,
    hint: `If this persists, try ResetShell or RestartComputer.`
  };
}
async function ensureContainer(cfg, status) {
  await verifyHealth();
  if (isReady()) return;
  status("Starting computer\u2026 (first use may take a moment to pull the image)");
  await ensureReady({
    image: cfg.baseImage,
    network: cfg.internetAccess ? "bridge" : "none",
    cpuLimit: cfg.cpuLimit,
    memoryLimitMB: cfg.memoryLimitMB,
    diskLimitMB: cfg.diskLimitMB,
    autoInstallPreset: cfg.autoInstallPreset,
    portForwards: cfg.portForwards,
    hostMountPath: cfg.hostMountPath,
    persistenceMode: cfg.persistenceMode
  });
}
async function toolsProvider(ctl) {
  const cfg = readConfig(ctl);
  turnBudget.maxCalls = cfg.maxToolCallsPerTurn;
  const executeTool = (0, import_sdk2.tool)({
    name: "Execute",
    description: `Run a shell command on your dedicated Linux computer.

IMPORTANT: This runs in a persistent shell session \u2014 state is preserved between calls.
\u2022 cd, export, source, nvm use, conda activate \u2014 all persist across commands
\u2022 You are always in the same shell; no need to repeat setup
\u2022 Use pwd to check where you are, env to see variables

This is a real isolated Linux container. You can install packages, compile code, run scripts, manage files, start services, etc.

TIPS:
\u2022 Chain with && or ; as usual
\u2022 Use 2>&1 to capture stderr
\u2022 Background long tasks with & (e.g. starting a server)
\u2022 Install packages with apt-get (Ubuntu/Debian) or apk (Alpine)`,
    parameters: {
      command: import_zod.z.string().min(1).max(8e3).describe(
        "Shell command to execute. Supports pipes, redirects, chaining."
      ),
      timeout: import_zod.z.number().int().min(1).max(MAX_TIMEOUT_SECONDS).optional().describe(
        `Timeout in seconds (default: ${cfg.commandTimeout}, max: ${MAX_TIMEOUT_SECONDS}). Increase for long operations like package installs.`
      ),
      workdir: import_zod.z.string().optional().describe(
        `Working directory for the command (default: ${CONTAINER_WORKDIR}).`
      )
    },
    implementation: async ({ command, timeout, workdir }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      if (cfg.strictSafety) {
        const check = checkCommand(command, true);
        if (!check.allowed) {
          warn(check.reason);
          return { error: check.reason, exitCode: -1 };
        }
      }
      try {
        await ensureContainer(cfg, status);
        status(
          `Running: ${command.length > 80 ? command.slice(0, 77) + "\u2026" : command}`
        );
        const result = await exec(
          command,
          timeout ?? cfg.commandTimeout,
          cfg.maxOutputSize,
          workdir
        );
        if (result.timedOut) {
          warn(`Command timed out after ${timeout ?? cfg.commandTimeout}s`);
        }
        if (result.truncated) {
          status("Output was truncated (exceeded max size)");
        }
        const hint = result.timedOut ? classifyError("timed out", { command }).hint : result.exitCode !== 0 && result.stderr ? classifyError(result.stderr, { command }).hint : void 0;
        return {
          exitCode: result.exitCode,
          stdout: result.stdout || "(no output)",
          stderr: result.stderr || "",
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          truncated: result.truncated,
          ...hint ? { hint } : {},
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { error, hint, exitCode: -1, budget: budgetStatus() };
      }
    }
  });
  const writeFileTool = (0, import_sdk2.tool)({
    name: "WriteFile",
    description: `Create or overwrite a complete file inside the computer.

Use for new files or when replacing the entire content. For editing existing files, prefer StrReplace or InsertLines \u2014 they are faster and use far less context. Parent directories are created automatically.`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe(
        `File path inside the container. Relative paths are relative to ${CONTAINER_WORKDIR}.`
      ),
      content: import_zod.z.string().max(MAX_FILE_WRITE_BYTES).describe("File content to write."),
      makeExecutable: import_zod.z.boolean().optional().describe(
        "Set the executable bit (chmod +x) after writing. Useful for scripts."
      )
    },
    implementation: async ({ path: filePath, content, makeExecutable }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        const dir = filePath.includes("/") ? filePath.slice(0, filePath.lastIndexOf("/")) : null;
        if (dir) {
          await exec(`mkdir -p '${dir.replace(/'/g, "'\\''")}'`, 5);
        }
        status(`Writing: ${filePath}`);
        await writeFile(filePath, content);
        if (makeExecutable) {
          await exec(`chmod +x '${filePath.replace(/'/g, "'\\''")}'`, 5);
        }
        return {
          written: true,
          path: filePath,
          bytesWritten: Buffer.byteLength(content, "utf-8"),
          executable: makeExecutable ?? false,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, written: false, budget: budgetStatus() };
      }
    }
  });
  const readFileTool = (0, import_sdk2.tool)({
    name: "ReadFile",
    description: `Read a file from the computer, optionally limited to a line range.

Always read a file before editing it with StrReplace. For large files use startLine/endLine to read only the section you need \u2014 this keeps context short. Binary files may not display correctly.`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe("File path inside the container."),
      startLine: import_zod.z.number().int().min(1).optional().describe("First line to return (1-based, inclusive)."),
      endLine: import_zod.z.number().int().min(1).optional().describe(
        "Last line to return (1-based, inclusive). Requires startLine."
      )
    },
    implementation: async ({ path: filePath, startLine, endLine }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        status(`Reading: ${filePath}`);
        const { content, totalLines } = await readFile(
          filePath,
          MAX_FILE_READ_BYTES,
          startLine,
          endLine
        );
        return {
          path: filePath,
          content,
          totalLines,
          lineRange: startLine ? { from: startLine, to: endLine ?? totalLines } : void 0,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, path: filePath, budget: budgetStatus() };
      }
    }
  });
  const strReplaceTool = (0, import_sdk2.tool)({
    name: "StrReplace",
    description: `Replace an exact unique string in a file with new content.

This is the preferred way to edit existing files \u2014 use it instead of rewriting the whole file with WriteFile.

Rules:
\u2022 oldStr must match the file exactly (whitespace, indentation included)
\u2022 oldStr must appear exactly once \u2014 make it unique by including surrounding lines
\u2022 Always ReadFile first to see the current content
\u2022 To delete a section, set newStr to an empty string`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe("File path inside the container."),
      oldStr: import_zod.z.string().min(1).describe(
        "The exact string to find and replace. Must be unique in the file."
      ),
      newStr: import_zod.z.string().describe("The replacement string. Use empty string to delete.")
    },
    implementation: async ({ path: filePath, oldStr, newStr }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        status(`Editing: ${filePath}`);
        const { replacements } = await strReplaceInFile(
          filePath,
          oldStr,
          newStr
        );
        return {
          edited: true,
          path: filePath,
          replacements,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, edited: false, budget: budgetStatus() };
      }
    }
  });
  const insertLinesTool = (0, import_sdk2.tool)({
    name: "InsertLines",
    description: `Insert lines into a file at a specific position.

Use this to add new content without replacing existing content. afterLine=0 prepends to the file. afterLine equal to the total line count appends.`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe("File path inside the container."),
      afterLine: import_zod.z.number().int().min(0).describe(
        "Insert after this line number (1-based). Use 0 to insert at the top."
      ),
      content: import_zod.z.string().describe("The lines to insert.")
    },
    implementation: async ({ path: filePath, afterLine, content }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        status(`Inserting into: ${filePath}`);
        await insertLinesInFile(filePath, afterLine, content);
        return {
          inserted: true,
          path: filePath,
          afterLine,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, inserted: false, budget: budgetStatus() };
      }
    }
  });
  const listDirTool = (0, import_sdk2.tool)({
    name: "ListDirectory",
    description: `List files and directories inside the computer.

Returns structured directory listing with file types, sizes, and permissions.`,
    parameters: {
      path: import_zod.z.string().optional().describe(`Directory path (default: ${CONTAINER_WORKDIR}).`),
      showHidden: import_zod.z.boolean().optional().describe("Include hidden files (dotfiles). Default: false."),
      recursive: import_zod.z.boolean().optional().describe("List recursively up to 3 levels deep. Default: false.")
    },
    implementation: async ({ path: dirPath, showHidden, recursive }, { status }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        const target = dirPath ?? CONTAINER_WORKDIR;
        const hidden = showHidden ? "-a" : "";
        let cmd;
        if (recursive) {
          cmd = `find '${target.replace(/'/g, "'\\''")}'  -maxdepth 3 ${showHidden ? "" : "-not -path '*/.*'"} -printf '%y %s %T@ %p\\n' 2>/dev/null | head -200`;
        } else {
          cmd = `ls -l ${hidden} --time-style=long-iso '${target.replace(/'/g, "'\\''")}'  2>/dev/null || ls -l ${hidden} '${target.replace(/'/g, "'\\''")}'`;
        }
        status(`Listing: ${target}`);
        const result = await exec(cmd, 10);
        if (result.exitCode !== 0) {
          return {
            ...classifyError(result.stderr || "Directory not found", {
              filePath: target
            }),
            path: target,
            budget: budgetStatus()
          };
        }
        return {
          path: target,
          listing: result.stdout,
          recursive: recursive ?? false,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        return { error, hint, budget: budgetStatus() };
      }
    }
  });
  const uploadFileTool = (0, import_sdk2.tool)({
    name: "UploadFile",
    description: `Transfer a file from the user's host computer into the container.

Use this when the user shares a file they want you to work with. The file will be copied into the container at the specified path.`,
    parameters: {
      hostPath: import_zod.z.string().min(1).max(1e3).describe("Absolute path to the file on the user's host machine."),
      containerPath: import_zod.z.string().optional().describe(
        `Destination path inside the container (default: ${CONTAINER_WORKDIR}/<filename>).`
      )
    },
    implementation: async ({ hostPath, containerPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        const filename = hostPath.split("/").pop() ?? hostPath.split("\\").pop() ?? "file";
        const dest = containerPath ?? `${CONTAINER_WORKDIR}/${filename}`;
        status(`Uploading: ${filename} \u2192 ${dest}`);
        await copyToContainer(hostPath, dest);
        return {
          uploaded: true,
          hostPath,
          containerPath: dest,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: hostPath });
        warn(error);
        return { error, hint, uploaded: false, budget: budgetStatus() };
      }
    }
  });
  const downloadFileTool = (0, import_sdk2.tool)({
    name: "DownloadFile",
    description: `Transfer a file from the container to the user's host computer.

Use this to give the user a file you created or modified inside the computer.`,
    parameters: {
      containerPath: import_zod.z.string().min(1).max(500).describe("Path to the file inside the container."),
      hostPath: import_zod.z.string().optional().describe(
        "Destination path on the host. Default: user's home directory + filename."
      )
    },
    implementation: async ({ containerPath, hostPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        const filename = containerPath.split("/").pop() ?? "file";
        const dest = hostPath ?? (0, import_path2.join)((0, import_os2.homedir)(), filename);
        status(`Downloading: ${containerPath} \u2192 ${dest}`);
        await copyFromContainer(containerPath, dest);
        return {
          downloaded: true,
          containerPath,
          hostPath: dest,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: containerPath });
        warn(error);
        return { error, hint, downloaded: false, budget: budgetStatus() };
      }
    }
  });
  const statusTool = (0, import_sdk2.tool)({
    name: "ComputerStatus",
    description: `Get information about the computer: OS, installed tools, disk/memory usage, running processes, network status, and resource limits.

Also shows the per-turn tool call budget.`,
    parameters: {
      showProcesses: import_zod.z.boolean().optional().describe("Include a list of running processes. Default: false."),
      killPid: import_zod.z.number().int().optional().describe(
        "Kill a process by PID. Combine with showProcesses to verify."
      )
    },
    implementation: async ({ showProcesses, killPid }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        if (killPid !== void 0) {
          const killed = await killProcess(killPid);
          if (!killed) warn(`Failed to kill PID ${killPid}`);
        }
        status("Gathering system info\u2026");
        const envInfo = await getEnvironmentInfo(
          cfg.internetAccess,
          cfg.diskLimitMB
        );
        const containerInfo = await getContainerInfo();
        let processes;
        if (showProcesses) {
          const procs = await listProcesses();
          processes = procs.map((p) => ({
            pid: p.pid,
            user: p.user,
            cpu: p.cpu + "%",
            memory: p.memory + "%",
            command: p.command
          }));
        }
        return {
          container: {
            id: containerInfo.id,
            state: containerInfo.state,
            image: containerInfo.image,
            cpuUsage: containerInfo.cpuUsage,
            memoryUsage: containerInfo.memoryUsage,
            networkMode: containerInfo.networkMode
          },
          environment: envInfo,
          config: {
            internetAccess: cfg.internetAccess,
            persistenceMode: cfg.persistenceMode,
            cpuLimit: cfg.cpuLimit > 0 ? `${cfg.cpuLimit} cores` : "unlimited",
            memoryLimit: `${cfg.memoryLimitMB} MB`,
            commandTimeout: `${cfg.commandTimeout}s`
          },
          ...processes ? { processes } : {},
          ...killPid !== void 0 ? { killedPid: killPid } : {},
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, budget: budgetStatus() };
      }
    }
  });
  const rebuildTool = (0, import_sdk2.tool)({
    name: "RebuildComputer",
    description: `Destroy the current container and rebuild it from scratch using the current settings.

Use this when:
- Internet access is not working after toggling the setting
- The container is broken or in a bad state
- Settings like base image or network were changed and need to take effect

WARNING: All data inside the container will be lost. Files in the shared folder are safe.`,
    parameters: {
      confirm: import_zod.z.boolean().describe(
        "Must be true to confirm you want to destroy and rebuild the container."
      )
    },
    implementation: async ({ confirm }, { status, warn }) => {
      if (!confirm) {
        return {
          error: "Set confirm=true to proceed with rebuild.",
          budget: budgetStatus()
        };
      }
      try {
        status("Stopping and removing existing container\u2026");
        await destroyContainer();
        status("Rebuilding container with current settings\u2026");
        await ensureReady({
          image: cfg.baseImage,
          network: cfg.internetAccess ? "bridge" : "none",
          cpuLimit: cfg.cpuLimit,
          memoryLimitMB: cfg.memoryLimitMB,
          diskLimitMB: cfg.diskLimitMB,
          autoInstallPreset: cfg.autoInstallPreset,
          portForwards: cfg.portForwards,
          hostMountPath: cfg.hostMountPath,
          persistenceMode: cfg.persistenceMode
        });
        const envInfo = await getEnvironmentInfo(
          cfg.internetAccess,
          cfg.diskLimitMB
        );
        return {
          rebuilt: true,
          os: envInfo.os,
          internetAccess: cfg.internetAccess,
          networkMode: cfg.internetAccess ? "enabled" : "disabled",
          message: "Container rebuilt successfully with current settings.",
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, rebuilt: false, budget: budgetStatus() };
      }
    }
  });
  const resetShellTool = (0, import_sdk2.tool)({
    name: "ResetShell",
    description: `Reset the persistent shell session back to a clean state.

Use this when:
\u2022 The shell is in a broken state (stuck command, corrupted env)
\u2022 You want to start fresh without rebuilding the whole container
\u2022 Environment variables or working directory are in an unexpected state

This does NOT wipe the container filesystem \u2014 files, installed packages, and running background processes are all preserved. It only resets the shell session (cwd back to home, env vars cleared).`,
    parameters: {},
    implementation: async (_, { status }) => {
      resetShellSession();
      status("Shell session reset.");
      return {
        reset: true,
        message: "Shell session reset. Working directory is back to /home/user with a clean environment.",
        budget: budgetStatus()
      };
    }
  });
  const executeBackgroundTool = (0, import_sdk2.tool)({
    name: "ExecuteBackground",
    description: `Run a command in the background and get a handle to check its output later.

Use this for long-running tasks that shouldn't block: servers, watchers, build processes, test suites, etc.

Returns a handleId. Use ReadProcessLogs with that handleId to stream output. Background processes survive across multiple turns.`,
    parameters: {
      command: import_zod.z.string().min(1).describe("Shell command to run in the background."),
      timeout: import_zod.z.number().int().min(5).max(3600).optional().describe("Max seconds before the process is killed. Default: 300.")
    },
    implementation: async ({ command, timeout }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        status(
          `Starting background: ${command.slice(0, 60)}${command.length > 60 ? "\u2026" : ""}`
        );
        const { handleId, pid } = await execBackground(
          command,
          timeout ?? 300
        );
        return {
          started: true,
          handleId,
          pid,
          message: `Process started. Use ReadProcessLogs with handleId ${handleId} to check output.`,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { error, hint, started: false, budget: budgetStatus() };
      }
    }
  });
  const readProcessLogsTool = (0, import_sdk2.tool)({
    name: "ReadProcessLogs",
    description: `Read buffered output from a background process started with ExecuteBackground.

Call this repeatedly to check on a running process. Returns stdout, stderr, whether the process is still running, and its exit code if done.`,
    parameters: {
      handleId: import_zod.z.number().int().describe("The handleId returned by ExecuteBackground.")
    },
    implementation: async ({ handleId }, { warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      const logs = readBgLogs(handleId, MAX_FILE_READ_BYTES);
      if (!logs.found) {
        return {
          error: `No process found with handleId ${handleId}.`,
          hint: "handleIds are only valid within the current LM Studio session.",
          budget: budgetStatus()
        };
      }
      return {
        handleId,
        stdout: logs.stdout || "(no output yet)",
        stderr: logs.stderr || "",
        running: !logs.done,
        exitCode: logs.exitCode,
        budget: budgetStatus()
      };
    }
  });
  const restartComputerTool = (0, import_sdk2.tool)({
    name: "RestartComputer",
    description: `Stop and restart the container without wiping any data.

Use this when:
- A runaway process is consuming too many resources
- The container feels sluggish or unresponsive
- You want a clean shell session but keep installed packages and files

Faster than RebuildComputer. All files and installed packages are preserved. Background processes will be stopped.`,
    parameters: {},
    implementation: async (_, { status, warn }) => {
      try {
        status("Restarting computer\u2026");
        await restartContainer();
        return {
          restarted: true,
          message: "Container restarted. Files and packages are intact.",
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, restarted: false, budget: budgetStatus() };
      }
    }
  });
  return [
    executeTool,
    writeFileTool,
    readFileTool,
    strReplaceTool,
    insertLinesTool,
    listDirTool,
    uploadFileTool,
    downloadFileTool,
    statusTool,
    restartComputerTool,
    rebuildTool,
    resetShellTool,
    executeBackgroundTool,
    readProcessLogsTool
  ];
}
var import_sdk2, import_os2, import_path2, import_zod, turnBudget;
var init_toolsProvider = __esm({
  "src/toolsProvider.ts"() {
    "use strict";
    import_sdk2 = require("@lmstudio/sdk");
    import_os2 = require("os");
    import_path2 = require("path");
    import_zod = require("zod");
    init_config();
    init_engine();
    init_guard();
    init_constants();
    turnBudget = {
      turnId: 0,
      callsUsed: 0,
      maxCalls: 10
    };
  }
});

// src/preprocessor.ts
function readConfig2(ctl) {
  const c = ctl.getPluginConfig(configSchematics);
  return {
    autoInject: c.get("autoInjectContext") === "on",
    maxToolCalls: c.get("maxToolCallsPerTurn") ?? 25,
    internetAccess: c.get("internetAccess") === "on",
    persistenceMode: c.get("persistenceMode") || "persistent",
    baseImage: c.get("baseImage") || "ubuntu:24.04"
  };
}
async function buildContextBlock(cfg) {
  if (!isReady()) {
    return [
      `[Computer \u2014 Available]`,
      `You have a dedicated Linux computer (${cfg.baseImage}) available via tools.`,
      `Internet: ${cfg.internetAccess ? "enabled" : "disabled"}.`,
      `Mode: ${cfg.persistenceMode}.`,
      `The computer will start automatically when you first use a tool (Execute, WriteFile, etc.).`,
      `Working directory: ${CONTAINER_WORKDIR}`
    ].join("\n");
  }
  try {
    const quickInfo = await exec(
      `echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')" && echo "TOOLS=$(which git curl wget python3 node gcc pip3 2>/dev/null | xargs -I{} basename {} | tr '\\n' ',')" && echo "FILES=$(ls ${CONTAINER_WORKDIR} 2>/dev/null | head -10 | tr '\\n' ',')" && echo "DISK=$(df -h ${CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4 " free / " $2 " total"}')"`,
      5,
      MAX_INJECTED_CONTEXT_CHARS
    );
    if (quickInfo.exitCode !== 0) {
      return `[Computer \u2014 Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
    }
    const lines = quickInfo.stdout.split("\n");
    const get = (prefix) => {
      const line = lines.find((l) => l.startsWith(prefix + "="));
      return line?.slice(prefix.length + 1)?.trim() ?? "";
    };
    const os = get("OS");
    const tools = get("TOOLS").split(",").filter(Boolean);
    const files = get("FILES").split(",").filter(Boolean);
    const disk = get("DISK");
    const parts = [
      `[Computer \u2014 Running]`,
      `OS: ${os}`,
      `Internet: ${cfg.internetAccess ? "enabled" : "disabled"}`,
      `Mode: ${cfg.persistenceMode}`,
      `Disk: ${disk}`
    ];
    if (tools.length > 0) {
      parts.push(`Installed: ${tools.join(", ")}`);
    }
    if (files.length > 0) {
      parts.push(
        `Workspace (${CONTAINER_WORKDIR}): ${files.join(", ")}${files.length >= 10 ? "\u2026" : ""}`
      );
    } else {
      parts.push(`Workspace (${CONTAINER_WORKDIR}): empty`);
    }
    parts.push(
      ``,
      `Use the Execute, WriteFile, ReadFile, ListDirectory, UploadFile, DownloadFile, or ComputerStatus tools to interact with the computer.`
    );
    return parts.join("\n");
  } catch {
    return `[Computer \u2014 Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
  }
}
async function promptPreprocessor(ctl, userMessage) {
  const cfg = readConfig2(ctl);
  advanceTurn(cfg.maxToolCalls);
  if (!cfg.autoInject) return userMessage;
  if (userMessage.length < 5) return userMessage;
  try {
    const context = await buildContextBlock(cfg);
    if (!context) return userMessage;
    return `${context}

---

${userMessage}`;
  } catch {
    return userMessage;
  }
}
var init_preprocessor = __esm({
  "src/preprocessor.ts"() {
    "use strict";
    init_config();
    init_toolsProvider();
    init_engine();
    init_constants();
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  main: () => main
});
async function main(context) {
  context.withConfigSchematics(configSchematics);
  context.withToolsProvider(toolsProvider);
  context.withPromptPreprocessor(promptPreprocessor);
}
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_config();
    init_toolsProvider();
    init_preprocessor();
  }
});

// .lmstudio/entry.ts
var import_sdk3 = require("@lmstudio/sdk");
var clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
var clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;
var baseUrl = process.env.LMS_PLUGIN_BASE_URL;
var client = new import_sdk3.LMStudioClient({
  clientIdentifier,
  clientPasskey,
  baseUrl
});
globalThis.__LMS_PLUGIN_CONTEXT = true;
var predictionLoopHandlerSet = false;
var promptPreprocessorSet = false;
var configSchematicsSet = false;
var globalConfigSchematicsSet = false;
var toolsProviderSet = false;
var generatorSet = false;
var selfRegistrationHost = client.plugins.getSelfRegistrationHost();
var pluginContext = {
  withPredictionLoopHandler: (generate) => {
    if (predictionLoopHandlerSet) {
      throw new Error("PredictionLoopHandler already registered");
    }
    if (toolsProviderSet) {
      throw new Error("PredictionLoopHandler cannot be used with a tools provider");
    }
    predictionLoopHandlerSet = true;
    selfRegistrationHost.setPredictionLoopHandler(generate);
    return pluginContext;
  },
  withPromptPreprocessor: (preprocess) => {
    if (promptPreprocessorSet) {
      throw new Error("PromptPreprocessor already registered");
    }
    promptPreprocessorSet = true;
    selfRegistrationHost.setPromptPreprocessor(preprocess);
    return pluginContext;
  },
  withConfigSchematics: (configSchematics2) => {
    if (configSchematicsSet) {
      throw new Error("Config schematics already registered");
    }
    configSchematicsSet = true;
    selfRegistrationHost.setConfigSchematics(configSchematics2);
    return pluginContext;
  },
  withGlobalConfigSchematics: (globalConfigSchematics) => {
    if (globalConfigSchematicsSet) {
      throw new Error("Global config schematics already registered");
    }
    globalConfigSchematicsSet = true;
    selfRegistrationHost.setGlobalConfigSchematics(globalConfigSchematics);
    return pluginContext;
  },
  withToolsProvider: (toolsProvider2) => {
    if (toolsProviderSet) {
      throw new Error("Tools provider already registered");
    }
    if (predictionLoopHandlerSet) {
      throw new Error("Tools provider cannot be used with a predictionLoopHandler");
    }
    toolsProviderSet = true;
    selfRegistrationHost.setToolsProvider(toolsProvider2);
    return pluginContext;
  },
  withGenerator: (generator) => {
    if (generatorSet) {
      throw new Error("Generator already registered");
    }
    generatorSet = true;
    selfRegistrationHost.setGenerator(generator);
    return pluginContext;
  }
};
Promise.resolve().then(() => (init_src(), src_exports)).then(async (module2) => {
  return await module2.main(pluginContext);
}).then(() => {
  selfRegistrationHost.initCompleted();
}).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvY29udGFpbmVyL3J1bnRpbWUudHMiLCAiLi4vc3JjL2NvbnN0YW50cy50cyIsICIuLi9zcmMvY29udGFpbmVyL2VuZ2luZS50cyIsICIuLi9zcmMvc2FmZXR5L2d1YXJkLnRzIiwgIi4uL3NyYy90b29sc1Byb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIEBmaWxlIGNvbmZpZy50c1xuICogUGx1Z2luIGNvbmZpZ3VyYXRpb24gc2NoZW1hIFx1MjAxNCBnZW5lcmF0ZXMgdGhlIExNIFN0dWRpbyBzZXR0aW5ncyBVSS5cbiAqXG4gKiBHaXZlcyB0aGUgdXNlciBoaWdoLWNvbnRyb2wgb3ZlciBldmVyeSBhc3BlY3Qgb2YgdGhlIGNvbXB1dGVyOlxuICogICBcdTIwMjIgTmV0d29yaywgcGVyc2lzdGVuY2UsIGJhc2UgaW1hZ2VcbiAqICAgXHUyMDIyIFJlc291cmNlIGxpbWl0cyAoQ1BVLCBSQU0sIGRpc2spXG4gKiAgIFx1MjAyMiBFeGVjdXRpb24gY29uc3RyYWludHMgKHRpbWVvdXQsIG91dHB1dCBjYXAsIHRvb2wgY2FsbCBidWRnZXQpXG4gKiAgIFx1MjAyMiBQYWNrYWdlIHByZXNldHMsIHBvcnQgZm9yd2FyZGluZywgaG9zdCBtb3VudHNcbiAqICAgXHUyMDIyIFNhZmV0eSBhbmQgY29udGV4dCBpbmplY3Rpb24gdG9nZ2xlc1xuICovXG5cbmltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJpbnRlcm5ldEFjY2Vzc1wiLFxuICAgIFwic2VsZWN0XCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiSW50ZXJuZXQgQWNjZXNzXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJBbGxvdyB0aGUgY29tcHV0ZXIgdG8gcmVhY2ggdGhlIGludGVybmV0ICh0b2dnbGUgY29udGFpbmVyIG5ldHdvcmsgbW9kZSlcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgeyB2YWx1ZTogXCJvblwiLCBkaXNwbGF5TmFtZTogXCJPbiBcdTIwMTQgY29udGFpbmVyIGhhcyBmdWxsIGludGVybmV0IGFjY2Vzc1wiIH0sXG4gICAgICAgIHsgdmFsdWU6IFwib2ZmXCIsIGRpc3BsYXlOYW1lOiBcIk9mZiBcdTIwMTQgY29tcGxldGVseSBhaXJnYXBwZWQsIG5vIG5ldHdvcmtcIiB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwib2ZmXCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJwZXJzaXN0ZW5jZU1vZGVcIixcbiAgICBcInNlbGVjdFwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBlcnNpc3RlbmNlIE1vZGVcIixcbiAgICAgIHN1YnRpdGxlOiBcIldoZXRoZXIgdGhlIGNvbXB1dGVyIGtlZXBzIGl0cyBzdGF0ZSB3aGVuIExNIFN0dWRpbyBjbG9zZXNcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcInBlcnNpc3RlbnRcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTpcbiAgICAgICAgICAgIFwiUGVyc2lzdGVudCBcdTIwMTQga2VlcCBmaWxlcywgcGFja2FnZXMsIGFuZCBzdGF0ZSBhY3Jvc3Mgc2Vzc2lvbnNcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcImVwaGVtZXJhbFwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVwaGVtZXJhbCBcdTIwMTQgZnJlc2ggY2xlYW4gZW52aXJvbm1lbnQgZXZlcnkgdGltZVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwicGVyc2lzdGVudFwiLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiYmFzZUltYWdlXCIsXG4gICAgXCJzZWxlY3RcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJCYXNlIEltYWdlXCIsXG4gICAgICBzdWJ0aXRsZTogXCJUaGUgTGludXggZGlzdHJpYnV0aW9uIHJ1bm5pbmcgaW5zaWRlIHRoZSBjb250YWluZXJcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcInVidW50dToyNC4wNFwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIlVidW50dSAyNC4wNCAocmVjb21tZW5kZWQgXHUyMDE0IHdpZGVzdCBjb21wYXRpYmlsaXR5KVwiLFxuICAgICAgICB9LFxuICAgICAgICB7IHZhbHVlOiBcInVidW50dToyMi4wNFwiLCBkaXNwbGF5TmFtZTogXCJVYnVudHUgMjIuMDQgKExUUyBzdGFibGUpXCIgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcImRlYmlhbjpib29rd29ybS1zbGltXCIsXG4gICAgICAgICAgZGlzcGxheU5hbWU6IFwiRGViaWFuIEJvb2t3b3JtIFNsaW0gKGxpZ2h0d2VpZ2h0KVwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IFwiYWxwaW5lOjMuMjBcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTogXCJBbHBpbmUgMy4yMCAodWx0cmEtbGlnaHR3ZWlnaHQgfjVNQiwgbXVzbCBsaWJjKVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwidWJ1bnR1OjI0LjA0XCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJjcHVMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNQVSBDb3JlIExpbWl0XCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIENQVSBjb3JlcyBhbGxvY2F0ZWQgdG8gdGhlIGNvbXB1dGVyICgwID0gbm8gbGltaXQpXCIsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDgsXG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBzbGlkZXI6IHsgc3RlcDogMSwgbWluOiAwLCBtYXg6IDggfSxcbiAgICB9LFxuICAgIDIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJtZW1vcnlMaW1pdE1CXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWVtb3J5IExpbWl0IChNQilcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gUkFNIGluIG1lZ2FieXRlcyAoMjU2LTgxOTIpXCIsXG4gICAgICBtaW46IDI1NixcbiAgICAgIG1heDogODE5MixcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIHNsaWRlcjogeyBzdGVwOiAyNTYsIG1pbjogMjU2LCBtYXg6IDgxOTIgfSxcbiAgICB9LFxuICAgIDEwMjQsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJkaXNrTGltaXRNQlwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRpc2sgTGltaXQgKE1CKVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiTWF4aW11bSBkaXNrIHNwYWNlIGluIG1lZ2FieXRlcyAoNTEyLTMyNzY4KS4gT25seSBlbmZvcmNlZCBvbiBuZXcgY29udGFpbmVycy5cIixcbiAgICAgIG1pbjogNTEyLFxuICAgICAgbWF4OiAzMjc2OCxcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIHNsaWRlcjogeyBzdGVwOiA1MTIsIG1pbjogNTEyLCBtYXg6IDMyNzY4IH0sXG4gICAgfSxcbiAgICA0MDk2LFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiY29tbWFuZFRpbWVvdXRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJDb21tYW5kIFRpbWVvdXQgKHNlY29uZHMpXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJNYXhpbXVtIHRpbWUgYSBzaW5nbGUgY29tbWFuZCBjYW4gcnVuIGJlZm9yZSBiZWluZyBraWxsZWQgKDUtMzAwKVwiLFxuICAgICAgbWluOiA1LFxuICAgICAgbWF4OiAzMDAsXG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBzbGlkZXI6IHsgc3RlcDogNSwgbWluOiA1LCBtYXg6IDMwMCB9LFxuICAgIH0sXG4gICAgMzAsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJtYXhPdXRwdXRTaXplXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWF4IE91dHB1dCBTaXplIChLQilcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIk1heGltdW0gc3Rkb3V0L3N0ZGVyciByZXR1cm5lZCB0byB0aGUgbW9kZWwgcGVyIGNvbW1hbmQgKDEtMTI4IEtCKS4gTGFyZ2VyIG91dHB1dCBpcyB0cnVuY2F0ZWQuXCIsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDEyOCxcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIHNsaWRlcjogeyBzdGVwOiAxLCBtaW46IDEsIG1heDogMTI4IH0sXG4gICAgfSxcbiAgICAzMixcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcIm1heFRvb2xDYWxsc1BlclR1cm5cIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJNYXggVG9vbCBDYWxscyBQZXIgVHVyblwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiTWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIG1vZGVsIGNhbiB1c2UgdGhlIGNvbXB1dGVyIHBlciBjb252ZXJzYXRpb25hbCB0dXJuICgxLTEwMCkuIEl0IHJlc2V0cyBlYWNoIHRpbWUgeW91IHNlbmQgYSBtZXNzYWdlLiBQcmV2ZW50cyBpbmZpbml0ZSBvciBsb25nIGxvb3BzLlwiLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAxMDAsXG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBzbGlkZXI6IHsgc3RlcDogMSwgbWluOiAxLCBtYXg6IDEwMCB9LFxuICAgIH0sXG4gICAgMTAsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJhdXRvSW5zdGFsbFByZXNldFwiLFxuICAgIFwic2VsZWN0XCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiQXV0by1JbnN0YWxsIFBhY2thZ2VzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJQcmUtaW5zdGFsbCBjb21tb24gdG9vbHMgd2hlbiB0aGUgY29udGFpbmVyIGlzIGZpcnN0IGNyZWF0ZWRcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgeyB2YWx1ZTogXCJub25lXCIsIGRpc3BsYXlOYW1lOiBcIk5vbmUgXHUyMDE0IGJhcmUgT1MsIGluc3RhbGwgbWFudWFsbHlcIiB9LFxuICAgICAgICB7IHZhbHVlOiBcIm1pbmltYWxcIiwgZGlzcGxheU5hbWU6IFwiTWluaW1hbCBcdTIwMTQgY3VybCwgd2dldCwgZ2l0LCB2aW0sIGpxXCIgfSxcbiAgICAgICAgeyB2YWx1ZTogXCJweXRob25cIiwgZGlzcGxheU5hbWU6IFwiUHl0aG9uIFx1MjAxNCBweXRob24zLCBwaXAsIHZlbnZcIiB9LFxuICAgICAgICB7IHZhbHVlOiBcIm5vZGVcIiwgZGlzcGxheU5hbWU6IFwiTm9kZS5qcyBcdTIwMTQgbm9kZWpzLCBucG1cIiB9LFxuICAgICAgICB7IHZhbHVlOiBcImJ1aWxkXCIsIGRpc3BsYXlOYW1lOiBcIkJ1aWxkIFRvb2xzIFx1MjAxNCBnY2MsIGNtYWtlLCBtYWtlXCIgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcImZ1bGxcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTogXCJGdWxsIFx1MjAxNCBhbGwgb2YgdGhlIGFib3ZlICsgbmV0d29ya2luZyB0b29sc1wiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwibWluaW1hbFwiLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwicG9ydEZvcndhcmRzXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJQb3J0IEZvcndhcmRzXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJDb21tYS1zZXBhcmF0ZWQgaG9zdDpjb250YWluZXIgcG9ydCBwYWlycyAoZS5nLiwgJzgwODA6ODAsMzAwMDozMDAwJykuIEFsbG93cyBhY2Nlc3Npbmcgc2VydmljZXMgcnVubmluZyBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJob3N0TW91bnRQYXRoXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJTaGFyZWQgRm9sZGVyIChIb3N0IE1vdW50KVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiQWJzb2x1dGUgcGF0aCB0byBhIGZvbGRlciBvbiB5b3VyIGNvbXB1dGVyIHRoYXQgd2lsbCBiZSBhY2Nlc3NpYmxlIGluc2lkZSB0aGUgY29udGFpbmVyIGF0IC9tbnQvc2hhcmVkLiBMZWF2ZSBlbXB0eSB0byBkaXNhYmxlLlwiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcInN0cmljdFNhZmV0eVwiLFxuICAgIFwic2VsZWN0XCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiU3RyaWN0IFNhZmV0eSBNb2RlXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJCbG9jayBrbm93biBkZXN0cnVjdGl2ZSBjb21tYW5kcyAoZm9yayBib21icywgZGlzayB3aXBlcnMpLiBEaXNhYmxlIG9ubHkgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXCIsXG4gICAgICBvcHRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogXCJvblwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOlxuICAgICAgICAgICAgXCJPbiBcdTIwMTQgYmxvY2sgb2J2aW91c2x5IGRlc3RydWN0aXZlIGNvbW1hbmRzIChyZWNvbW1lbmRlZClcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcIm9mZlwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIk9mZiBcdTIwMTQgYWxsb3cgZXZlcnl0aGluZywgSSBhY2NlcHQgdGhlIHJpc2tcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBcIm9uXCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJhdXRvSW5qZWN0Q29udGV4dFwiLFxuICAgIFwic2VsZWN0XCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiQXV0by1JbmplY3QgQ29tcHV0ZXIgQ29udGV4dFwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiQXV0b21hdGljYWxseSB0ZWxsIHRoZSBtb2RlbCBhYm91dCBpdHMgY29tcHV0ZXIgKE9TLCBpbnN0YWxsZWQgdG9vbHMsIHJ1bm5pbmcgcHJvY2Vzc2VzKSBhdCB0aGUgc3RhcnQgb2YgZWFjaCB0dXJuXCIsXG4gICAgICBvcHRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogXCJvblwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOlxuICAgICAgICAgICAgXCJPbiBcdTIwMTQgbW9kZWwgYWx3YXlzIGtub3dzIGl0cyBjb21wdXRlciBzdGF0ZSAocmVjb21tZW5kZWQpXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogXCJvZmZcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTogXCJPZmYgXHUyMDE0IG1vZGVsIGRpc2NvdmVycyBzdGF0ZSB2aWEgdG9vbHMgb25seVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwib25cIixcbiAgKVxuXG4gIC5idWlsZCgpO1xuIiwgIi8qKlxuICogQGZpbGUgY29udGFpbmVyL3J1bnRpbWUudHNcbiAqIEF1dG8tZGV0ZWN0cyBEb2NrZXIgb3IgUG9kbWFuIG9uIHRoZSBob3N0IHN5c3RlbS5cbiAqXG4gKiBQcmlvcml0eTogRG9ja2VyIGZpcnN0IChtb3N0IGNvbW1vbiksIHRoZW4gUG9kbWFuIGZhbGxiYWNrLlxuICogQ2FjaGVzIHRoZSByZXN1bHQgYWZ0ZXIgZmlyc3Qgc3VjY2Vzc2Z1bCBkZXRlY3Rpb24uXG4gKi9cblxuaW1wb3J0IHsgZXhlY0ZpbGUgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSBcInV0aWxcIjtcbmltcG9ydCB0eXBlIHsgUnVudGltZUluZm8sIFJ1bnRpbWVLaW5kIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNvbnN0IGV4ZWNBc3luYyA9IHByb21pc2lmeShleGVjRmlsZSk7XG5cbi8qKiBDYWNoZWQgcnVudGltZSBpbmZvIGFmdGVyIGZpcnN0IGRldGVjdGlvbi4gKi9cbmxldCBjYWNoZWRSdW50aW1lOiBSdW50aW1lSW5mbyB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIEF0dGVtcHQgdG8gZGV0ZWN0IGEgc3BlY2lmaWMgcnVudGltZSBieSBydW5uaW5nIGA8Y21kPiAtLXZlcnNpb25gLlxuICovXG5hc3luYyBmdW5jdGlvbiBwcm9iZShcbiAgY21kOiBzdHJpbmcsXG4gIGtpbmQ6IFJ1bnRpbWVLaW5kLFxuKTogUHJvbWlzZTxSdW50aW1lSW5mbyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlY0FzeW5jKGNtZCwgW1wiLS12ZXJzaW9uXCJdLCB7IHRpbWVvdXQ6IDVfMDAwIH0pO1xuICAgIGNvbnN0IHZlcnNpb24gPSBzdGRvdXQudHJpbSgpLnNwbGl0KFwiXFxuXCIpWzBdID8/IFwidW5rbm93blwiO1xuICAgIHJldHVybiB7IGtpbmQsIHBhdGg6IGNtZCwgdmVyc2lvbiB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgcnVudGltZSBjYW5kaWRhdGVzIG9yZGVyZWQgYnkgcHJpb3JpdHkuXG4gKiBPbiBXaW5kb3dzLCBhbHNvIHByb2JlcyBrbm93biBEb2NrZXIgRGVza3RvcCBpbnN0YWxsIHBhdGhzIHNpbmNlXG4gKiBMTSBTdHVkaW8gbWF5IGxhdW5jaCB3aXRoIGEgcmVzdHJpY3RlZCBQQVRIIHRoYXQgb21pdHMgUHJvZ3JhbSBGaWxlcy5cbiAqL1xuZnVuY3Rpb24gZ2V0UnVudGltZUNhbmRpZGF0ZXMoKTogQXJyYXk8eyBjbWQ6IHN0cmluZzsga2luZDogUnVudGltZUtpbmQgfT4ge1xuICBjb25zdCBjYW5kaWRhdGVzOiBBcnJheTx7IGNtZDogc3RyaW5nOyBraW5kOiBSdW50aW1lS2luZCB9PiA9IFtcbiAgICB7IGNtZDogXCJkb2NrZXJcIiwga2luZDogXCJkb2NrZXJcIiB9LFxuICAgIHsgY21kOiBcInBvZG1hblwiLCBraW5kOiBcInBvZG1hblwiIH0sXG4gIF07XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIpIHtcbiAgICBjYW5kaWRhdGVzLnB1c2goXG4gICAgICB7XG4gICAgICAgIGNtZDogXCJDOlxcXFxQcm9ncmFtIEZpbGVzXFxcXERvY2tlclxcXFxEb2NrZXJcXFxccmVzb3VyY2VzXFxcXGJpblxcXFxkb2NrZXIuZXhlXCIsXG4gICAgICAgIGtpbmQ6IFwiZG9ja2VyXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjbWQ6IFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1xcXFxkb2NrZXIuZXhlXCIsXG4gICAgICAgIGtpbmQ6IFwiZG9ja2VyXCIsXG4gICAgICB9LFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGNhbmRpZGF0ZXM7XG59XG5cbi8qKlxuICogRGV0ZWN0IHRoZSBhdmFpbGFibGUgY29udGFpbmVyIHJ1bnRpbWUuXG4gKiBUcmllcyBEb2NrZXIgZmlyc3QsIHRoZW4gUG9kbWFuLiBDYWNoZXMgdGhlIHJlc3VsdC5cbiAqXG4gKiBAdGhyb3dzIEVycm9yIGlmIG5laXRoZXIgRG9ja2VyIG5vciBQb2RtYW4gaXMgZm91bmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXRlY3RSdW50aW1lKCk6IFByb21pc2U8UnVudGltZUluZm8+IHtcbiAgaWYgKGNhY2hlZFJ1bnRpbWUpIHJldHVybiBjYWNoZWRSdW50aW1lO1xuXG4gIGZvciAoY29uc3QgeyBjbWQsIGtpbmQgfSBvZiBnZXRSdW50aW1lQ2FuZGlkYXRlcygpKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvYmUoY21kLCBraW5kKTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBjYWNoZWRSdW50aW1lID0gcmVzdWx0O1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpc1dpbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiTm8gY29udGFpbmVyIHJ1bnRpbWUgZm91bmQuIFBsZWFzZSBpbnN0YWxsIERvY2tlciBEZXNrdG9wXCIgK1xuICAgICAgKGlzV2luXG4gICAgICAgID8gXCIgZnJvbSBodHRwczovL2RvY3MuZG9ja2VyLmNvbS9kZXNrdG9wL3NldHVwL2luc3RhbGwvd2luZG93cy1pbnN0YWxsL1wiXG4gICAgICAgIDogXCIgKGh0dHBzOi8vZG9jcy5kb2NrZXIuY29tL2dldC1kb2NrZXIvKVwiKSArXG4gICAgICBcIiBvciBQb2RtYW4gKGh0dHBzOi8vcG9kbWFuLmlvL2dldHRpbmctc3RhcnRlZC9pbnN0YWxsYXRpb24pIHRvIHVzZSB0aGlzIHBsdWdpbi5cIixcbiAgKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGNvbnRhaW5lciBydW50aW1lIGlzIGF2YWlsYWJsZSB3aXRob3V0IHRocm93aW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNSdW50aW1lQXZhaWxhYmxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGF3YWl0IGRldGVjdFJ1bnRpbWUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBjYWNoZWQgcnVudGltZSwgb3IgbnVsbCBpZiBub3QgeWV0IGRldGVjdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGVkUnVudGltZSgpOiBSdW50aW1lSW5mbyB8IG51bGwge1xuICByZXR1cm4gY2FjaGVkUnVudGltZTtcbn1cblxuLyoqXG4gKiBDbGVhciB0aGUgY2FjaGVkIHJ1bnRpbWUgKHVzZWZ1bCBmb3IgdGVzdGluZyBvciByZS1kZXRlY3Rpb24pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJSdW50aW1lQ2FjaGUoKTogdm9pZCB7XG4gIGNhY2hlZFJ1bnRpbWUgPSBudWxsO1xufVxuIiwgIi8qKlxuICogQGZpbGUgY29uc3RhbnRzLnRzXG4gKiBTaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBldmVyeSB0dW5hYmxlIHBhcmFtZXRlci5cbiAqIEdyb3VwZWQgYnkgc3Vic3lzdGVtIGZvciBlYXN5IGRpc2NvdmVyeS5cbiAqL1xuXG4vKiogTmFtZSBwcmVmaXggZm9yIG1hbmFnZWQgY29udGFpbmVycy4gKi9cbmV4cG9ydCBjb25zdCBDT05UQUlORVJfTkFNRV9QUkVGSVggPSBcImxtcy1jb21wdXRlclwiO1xuLyoqIERlZmF1bHQgY29udGFpbmVyIGltYWdlLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfSU1BR0UgPSBcInVidW50dToyNC4wNFwiO1xuLyoqIExpZ2h0d2VpZ2h0IGFsdGVybmF0aXZlIGltYWdlLiAqL1xuZXhwb3J0IGNvbnN0IEFMUElORV9JTUFHRSA9IFwiYWxwaW5lOjMuMjBcIjtcbi8qKiBEZWZhdWx0IHdvcmtpbmcgZGlyZWN0b3J5IGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9XT1JLRElSID0gXCIvaG9tZS91c2VyXCI7XG4vKiogRGVmYXVsdCBzaGVsbCB0byBleGVjIGludG8uICovXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX1NIRUxMID0gXCIvYmluL2Jhc2hcIjtcbi8qKiBBbHBpbmUgc2hlbGwgZmFsbGJhY2suICovXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX1NIRUxMX0FMUElORSA9IFwiL2Jpbi9zaFwiO1xuXG4vKiogRGVmYXVsdCBDUFUgY29yZSBsaW1pdCAoMCA9IHVubGltaXRlZCkuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9DUFVfTElNSVQgPSAyO1xuLyoqIE1heGltdW0gYWxsb3dlZCBDUFUgY29yZXMuICovXG5leHBvcnQgY29uc3QgTUFYX0NQVV9MSU1JVCA9IDg7XG4vKiogRGVmYXVsdCBtZW1vcnkgbGltaXQgaW4gTUIuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9NRU1PUllfTElNSVRfTUIgPSAxMDI0O1xuLyoqIE1heGltdW0gbWVtb3J5IGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9NRU1PUllfTElNSVRfTUIgPSA4MTkyO1xuLyoqIERlZmF1bHQgZGlzayBzaXplIGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRElTS19MSU1JVF9NQiA9IDQwOTY7XG4vKiogTWF4aW11bSBkaXNrIGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9ESVNLX0xJTUlUX01CID0gMzI3Njg7XG5cbi8qKiBEZWZhdWx0IGNvbW1hbmQgdGltZW91dCBpbiBzZWNvbmRzLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfVElNRU9VVF9TRUNPTkRTID0gMzA7XG4vKiogTWluaW11bSB0aW1lb3V0LiAqL1xuZXhwb3J0IGNvbnN0IE1JTl9USU1FT1VUX1NFQ09ORFMgPSA1O1xuLyoqIE1heGltdW0gdGltZW91dC4gKi9cbmV4cG9ydCBjb25zdCBNQVhfVElNRU9VVF9TRUNPTkRTID0gMzAwO1xuLyoqIERlZmF1bHQgbWF4IG91dHB1dCBzaXplIGluIGJ5dGVzIHJldHVybmVkIHRvIHRoZSBtb2RlbC4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX01BWF9PVVRQVVRfQllURVMgPSAzMl83Njg7XG4vKiogQWJzb2x1dGUgbWF4IG91dHB1dCBieXRlcy4gKi9cbmV4cG9ydCBjb25zdCBNQVhfT1VUUFVUX0JZVEVTID0gMTMxXzA3Mjtcbi8qKiBEZWZhdWx0IG1heCB0b29sIGNhbGxzIHBlciB0dXJuLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUFYX1RPT0xfQ0FMTFNfUEVSX1RVUk4gPSAxMDtcbi8qKiBNaW5pbXVtIGFsbG93ZWQgdG9vbCBjYWxscyBwZXIgdHVybi4gKi9cbmV4cG9ydCBjb25zdCBNSU5fVE9PTF9DQUxMU19QRVJfVFVSTiA9IDE7XG4vKiogTWF4aW11bSBhbGxvd2VkIHRvb2wgY2FsbHMgcGVyIHR1cm4uICovXG5leHBvcnQgY29uc3QgTUFYX1RPT0xfQ0FMTFNfUEVSX1RVUk4gPSAxMDA7XG5cbi8qKiBNYXggZmlsZSBzaXplIGZvciByZWFkIG9wZXJhdGlvbnMgKGJ5dGVzKS4gKi9cbmV4cG9ydCBjb25zdCBNQVhfRklMRV9SRUFEX0JZVEVTID0gNTEyXzAwMDtcbi8qKiBNYXggZmlsZSBzaXplIGZvciB3cml0ZSBvcGVyYXRpb25zIChieXRlcykuICovXG5leHBvcnQgY29uc3QgTUFYX0ZJTEVfV1JJVEVfQllURVMgPSA1XzI0Ml84ODA7XG4vKiogTWF4IGZpbGUgc2l6ZSBmb3IgdXBsb2FkL2Rvd25sb2FkIChieXRlcykuICovXG5leHBvcnQgY29uc3QgTUFYX1RSQU5TRkVSX0JZVEVTID0gNTJfNDI4XzgwMDtcbi8qKiBEZWZhdWx0IGhvc3QgdHJhbnNmZXIgZGlyZWN0b3J5LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfVFJBTlNGRVJfRElSID0gXCJsbXMtY29tcHV0ZXItZmlsZXNcIjtcblxuLyoqIENvbW1hbmRzIGJsb2NrZWQgaW4gc3RyaWN0IG1vZGUgKHBhdHRlcm4tbWF0Y2hlZCkuICovXG5leHBvcnQgY29uc3QgQkxPQ0tFRF9DT01NQU5EU19TVFJJQ1Q6IHJlYWRvbmx5IHN0cmluZ1tdID0gW1xuICBcIjooKXsgOnw6JiB9OzpcIiwgLy8gZm9yayBib21iXG4gIFwicm0gLXJmIC9cIiwgLy8gcm9vdCB3aXBlXG4gIFwicm0gLXJmIC8qXCIsIC8vIHJvb3Qgd2lwZSB2YXJpYW50XG4gIFwibWtmc1wiLCAvLyBmb3JtYXQgZmlsZXN5c3RlbVxuICBcImRkIGlmPS9kZXYvemVyb1wiLCAvLyBkaXNrIGRlc3Ryb3llclxuICBcImRkIGlmPS9kZXYvcmFuZG9tXCIsIC8vIGRpc2sgZGVzdHJveWVyXG4gIFwiPiAvZGV2L3NkYVwiLCAvLyByYXcgZGlzayB3cml0ZVxuICBcImNobW9kIC1SIDc3NyAvXCIsIC8vIHBlcm1pc3Npb24gbnVrZVxuICBcImNob3duIC1SXCIsIC8vIG93bmVyc2hpcCBudWtlIG9uIHJvb3Rcbl07XG5cbi8qKlxuICogRW52aXJvbm1lbnQgdmFyaWFibGVzIGluamVjdGVkIGludG8gZXZlcnkgY29udGFpbmVyLlxuICogVGhlc2UgdGVsbCB0aGUgbW9kZWwgYWJvdXQgaXRzIGVudmlyb25tZW50LlxuICovXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX0VOVl9WQVJTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBURVJNOiBcInh0ZXJtLTI1NmNvbG9yXCIsXG4gIExBTkc6IFwiZW5fVVMuVVRGLThcIixcbiAgSE9NRTogQ09OVEFJTkVSX1dPUktESVIsXG4gIExNU19DT01QVVRFUjogXCIxXCIsXG59O1xuXG4vKiogUGFja2FnZSBzZXRzIGF2YWlsYWJsZSBmb3IgcHJlLWluc3RhbGxhdGlvbi4gKi9cbmV4cG9ydCBjb25zdCBQQUNLQUdFX1BSRVNFVFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcbiAgbWluaW1hbDogW1wiY3VybFwiLCBcIndnZXRcIiwgXCJnaXRcIiwgXCJ2aW0tdGlueVwiLCBcImpxXCJdLFxuICBweXRob246IFtcInB5dGhvbjNcIiwgXCJweXRob24zLXBpcFwiLCBcInB5dGhvbjMtdmVudlwiXSxcbiAgbm9kZTogW1wibm9kZWpzXCIsIFwibnBtXCJdLFxuICBidWlsZDogW1wiYnVpbGQtZXNzZW50aWFsXCIsIFwiY21ha2VcIiwgXCJwa2ctY29uZmlnXCJdLFxuICBuZXR3b3JrOiBbXCJuZXQtdG9vbHNcIiwgXCJpcHV0aWxzLXBpbmdcIiwgXCJkbnN1dGlsc1wiLCBcInRyYWNlcm91dGVcIiwgXCJubWFwXCJdLFxuICBmdWxsOiBbXG4gICAgXCJjdXJsXCIsXG4gICAgXCJ3Z2V0XCIsXG4gICAgXCJnaXRcIixcbiAgICBcInZpbS10aW55XCIsXG4gICAgXCJqcVwiLFxuICAgIFwicHl0aG9uM1wiLFxuICAgIFwicHl0aG9uMy1waXBcIixcbiAgICBcInB5dGhvbjMtdmVudlwiLFxuICAgIFwibm9kZWpzXCIsXG4gICAgXCJucG1cIixcbiAgICBcImJ1aWxkLWVzc2VudGlhbFwiLFxuICAgIFwiY21ha2VcIixcbiAgICBcIm5ldC10b29sc1wiLFxuICAgIFwiaXB1dGlscy1waW5nXCIsXG4gICAgXCJodG9wXCIsXG4gICAgXCJ0cmVlXCIsXG4gICAgXCJ1bnppcFwiLFxuICAgIFwiemlwXCIsXG4gIF0sXG59O1xuXG4vKiogQWxwaW5lIGVxdWl2YWxlbnRzIGZvciBwYWNrYWdlIHByZXNldHMuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9QUkVTRVRTX0FMUElORTogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBtaW5pbWFsOiBbXCJjdXJsXCIsIFwid2dldFwiLCBcImdpdFwiLCBcInZpbVwiLCBcImpxXCJdLFxuICBweXRob246IFtcInB5dGhvbjNcIiwgXCJweTMtcGlwXCJdLFxuICBub2RlOiBbXCJub2RlanNcIiwgXCJucG1cIl0sXG4gIGJ1aWxkOiBbXCJidWlsZC1iYXNlXCIsIFwiY21ha2VcIiwgXCJwa2djb25mXCJdLFxuICBuZXR3b3JrOiBbXCJuZXQtdG9vbHNcIiwgXCJpcHV0aWxzXCIsIFwiYmluZC10b29sc1wiLCBcInRyYWNlcm91dGVcIiwgXCJubWFwXCJdLFxuICBmdWxsOiBbXG4gICAgXCJjdXJsXCIsXG4gICAgXCJ3Z2V0XCIsXG4gICAgXCJnaXRcIixcbiAgICBcInZpbVwiLFxuICAgIFwianFcIixcbiAgICBcInB5dGhvbjNcIixcbiAgICBcInB5My1waXBcIixcbiAgICBcIm5vZGVqc1wiLFxuICAgIFwibnBtXCIsXG4gICAgXCJidWlsZC1iYXNlXCIsXG4gICAgXCJjbWFrZVwiLFxuICAgIFwibmV0LXRvb2xzXCIsXG4gICAgXCJpcHV0aWxzXCIsXG4gICAgXCJodG9wXCIsXG4gICAgXCJ0cmVlXCIsXG4gICAgXCJ1bnppcFwiLFxuICAgIFwiemlwXCIsXG4gIF0sXG59O1xuXG4vKiogTWF4IGNoYXJzIG9mIGluamVjdGVkIGNvbXB1dGVyIGNvbnRleHQuICovXG5leHBvcnQgY29uc3QgTUFYX0lOSkVDVEVEX0NPTlRFWFRfQ0hBUlMgPSAyXzAwMDtcblxuLyoqIFZhbGlkIGJhc2UgaW1hZ2VzIHRoZSB1c2VyIGNhbiBzZWxlY3QuICovXG5leHBvcnQgY29uc3QgVkFMSURfSU1BR0VTID0gW1xuICBcInVidW50dToyNC4wNFwiLFxuICBcInVidW50dToyMi4wNFwiLFxuICBcImFscGluZTozLjIwXCIsXG4gIFwiZGViaWFuOmJvb2t3b3JtLXNsaW1cIixcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBDb250YWluZXJJbWFnZSA9ICh0eXBlb2YgVkFMSURfSU1BR0VTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgTkVUV09SS19NT0RFUyA9IFtcbiAgXCJub25lXCIsXG4gIFwiYnJpZGdlXCIsXG4gIFwic2xpcnA0bmV0bnNcIixcbiAgXCJwYXN0YVwiLFxuICBcInBvZG1hbi1kZWZhdWx0XCIsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTmV0d29ya01vZGUgPSAodHlwZW9mIE5FVFdPUktfTU9ERVMpW251bWJlcl07XG5cbmV4cG9ydCBjb25zdCBQRVJTSVNURU5DRV9NT0RFUyA9IFtcInBlcnNpc3RlbnRcIiwgXCJlcGhlbWVyYWxcIl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBQZXJzaXN0ZW5jZU1vZGUgPSAodHlwZW9mIFBFUlNJU1RFTkNFX01PREVTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX1NUQVRFUyA9IFtcbiAgXCJydW5uaW5nXCIsXG4gIFwic3RvcHBlZFwiLFxuICBcIm5vdF9mb3VuZFwiLFxuICBcImVycm9yXCIsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQ29udGFpbmVyU3RhdGUgPSAodHlwZW9mIENPTlRBSU5FUl9TVEFURVMpW251bWJlcl07XG4iLCAiLyoqXG4gKiBAZmlsZSBjb250YWluZXIvZW5naW5lLnRzXG4gKiBDb250YWluZXIgbGlmZWN5Y2xlIGVuZ2luZSBcdTIwMTQgY3JlYXRlcywgc3RhcnRzLCBzdG9wcywgYW5kIGV4ZWN1dGVzXG4gKiBjb21tYW5kcyBpbnNpZGUgdGhlIG1vZGVsJ3MgZGVkaWNhdGVkIExpbnV4IGNvbXB1dGVyLlxuICpcbiAqIEFsbCBjb250YWluZXIgb3BlcmF0aW9ucyBnbyB0aHJvdWdoIHRoaXMgbW9kdWxlLiBUaGUgZW5naW5lIGlzXG4gKiBsYXp5LWluaXRpYWxpemVkOiB0aGUgY29udGFpbmVyIGlzIG9ubHkgY3JlYXRlZC9zdGFydGVkIHdoZW4gdGhlXG4gKiBmaXJzdCB0b29sIGNhbGwgaGFwcGVucy5cbiAqXG4gKiBTdXBwb3J0cyBEb2NrZXIgYW5kIFBvZG1hbiBpbnRlcmNoYW5nZWFibHkgdmlhIHRoZSBkZXRlY3RlZCBydW50aW1lLlxuICovXG5cbmltcG9ydCB7IGV4ZWNGaWxlLCBzcGF3biB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuaW1wb3J0IHsgbWtkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGhvbWVkaXIgfSBmcm9tIFwib3NcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGV0ZWN0UnVudGltZSB9IGZyb20gXCIuL3J1bnRpbWVcIjtcbmltcG9ydCB7XG4gIENPTlRBSU5FUl9OQU1FX1BSRUZJWCxcbiAgQ09OVEFJTkVSX1dPUktESVIsXG4gIENPTlRBSU5FUl9TSEVMTCxcbiAgQ09OVEFJTkVSX1NIRUxMX0FMUElORSxcbiAgQ09OVEFJTkVSX0VOVl9WQVJTLFxuICBERUZBVUxUX01BWF9PVVRQVVRfQllURVMsXG4gIE1BWF9PVVRQVVRfQllURVMsXG4gIFBBQ0tBR0VfUFJFU0VUUyxcbiAgUEFDS0FHRV9QUkVTRVRTX0FMUElORSxcbn0gZnJvbSBcIi4uL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBSdW50aW1lSW5mbyxcbiAgQ29udGFpbmVyQ3JlYXRlT3B0aW9ucyxcbiAgQ29udGFpbmVySW5mbyxcbiAgRXhlY1Jlc3VsdCxcbiAgRW52aXJvbm1lbnRJbmZvLFxuICBQcm9jZXNzSW5mbyxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IENvbnRhaW5lckltYWdlLCBDb250YWluZXJTdGF0ZSwgTmV0d29ya01vZGUgfSBmcm9tIFwiLi4vY29uc3RhbnRzXCI7XG5cbmNvbnN0IGV4ZWNBc3luYyA9IHByb21pc2lmeShleGVjRmlsZSk7XG5cbi8qKlxuICogQ29udmVydCBhIFdpbmRvd3MgaG9zdCBwYXRoIChDOlxcVXNlcnNcXGZvbykgdG8gdGhlIGZvcm1hdCBEb2NrZXJcbiAqIG9uIFdpbmRvd3MgZXhwZWN0cyBmb3Igdm9sdW1lIG1vdW50cyAoLy9jL1VzZXJzL2ZvbykuXG4gKiBOby1vcCBvbiBMaW51eC9NYWMuXG4gKi9cbmZ1bmN0aW9uIHRvRG9ja2VyUGF0aChob3N0UGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09IFwid2luMzJcIikgcmV0dXJuIGhvc3RQYXRoO1xuICByZXR1cm4gaG9zdFBhdGhcbiAgICAucmVwbGFjZSgvXihbQS1aYS16XSk6XFxcXC8sIChfLCBkKSA9PiBgLy8ke2QudG9Mb3dlckNhc2UoKX0vYClcbiAgICAucmVwbGFjZSgvXFxcXC9nLCBcIi9cIik7XG59XG5cbi8qKlxuICogQXVnbWVudCBQQVRIIHdpdGggcGxhdGZvcm0tc3BlY2lmaWMgbG9jYXRpb25zIHdoZXJlIERvY2tlci9Qb2RtYW5cbiAqIGhlbHBlciBiaW5hcmllcyBsaXZlLCBzbyB0aGV5J3JlIGZpbmRhYmxlIHJlZ2FyZGxlc3Mgb2Ygd2hhdCBQQVRIXG4gKiBMTSBTdHVkaW8gaW5oZXJpdGVkIGZyb20gdGhlIE9TIGxhdW5jaGVyLlxuICovXG5mdW5jdGlvbiBnZXRSdW50aW1lRW52KCk6IE5vZGVKUy5Qcm9jZXNzRW52IHtcbiAgY29uc3QgYmFzZSA9IHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIjtcbiAgY29uc3QgZXh0cmEgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIlxuICAgICAgPyBbXG4gICAgICAgICAgXCJDOlxcXFxQcm9ncmFtIEZpbGVzXFxcXERvY2tlclxcXFxEb2NrZXJcXFxccmVzb3VyY2VzXFxcXGJpblwiLFxuICAgICAgICAgIFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1wiLFxuICAgICAgICBdXG4gICAgICA6IFtcbiAgICAgICAgICBcIi91c3IvYmluXCIsXG4gICAgICAgICAgXCIvdXNyL2xvY2FsL2JpblwiLFxuICAgICAgICAgIFwiL3Vzci9saWIvcG9kbWFuXCIsXG4gICAgICAgICAgXCIvdXNyL2xpYmV4ZWMvcG9kbWFuXCIsXG4gICAgICAgICAgXCIvYmluXCIsXG4gICAgICAgIF07XG5cbiAgY29uc3Qgc2VwID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCI7XCIgOiBcIjpcIjtcbiAgcmV0dXJuIHtcbiAgICAuLi5wcm9jZXNzLmVudixcbiAgICBQQVRIOiBbYmFzZSwgLi4uZXh0cmFdLmZpbHRlcihCb29sZWFuKS5qb2luKHNlcCksXG4gIH07XG59XG5cbi8qKlxuICogRW5zdXJlIFBvZG1hbidzIGNvbnRhaW5lcnMuY29uZiBoYXMgZXhwbGljaXQgRE5TIHNlcnZlcnMgc2V0LlxuICogVGhpcyBmaXhlcyBETlMgcmVzb2x1dGlvbiBmYWlsdXJlcyBpbiByb290bGVzcyBjb250YWluZXJzIG9uIFVidW50dS9zeXN0ZW1kLXJlc29sdmVkIGhvc3RzLlxuICogU2FmZSB0byBjYWxsIG11bHRpcGxlIHRpbWVzIFx1MjAxNCBvbmx5IHdyaXRlcyBpZiB0aGUgY29uZmlnIGlzIG1pc3Npbmcgb3IgaW5jb21wbGV0ZS5cbiAqL1xuZnVuY3Rpb24gZW5zdXJlUG9kbWFuQ29uZmlnKCk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZ0RpciA9IGpvaW4oaG9tZWRpcigpLCBcIi5jb25maWdcIiwgXCJjb250YWluZXJzXCIpO1xuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBqb2luKGNvbmZpZ0RpciwgXCJjb250YWluZXJzLmNvbmZcIik7XG5cbiAgICBsZXQgZXhpc3RpbmcgPSBcIlwiO1xuICAgIGlmIChleGlzdHNTeW5jKGNvbmZpZ1BhdGgpKSB7XG4gICAgICBleGlzdGluZyA9IHJlYWRGaWxlU3luYyhjb25maWdQYXRoLCBcInV0Zi04XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5lZWRzRE5TID0gIWV4aXN0aW5nLmluY2x1ZGVzKFwiZG5zX3NlcnZlcnNcIik7XG4gICAgY29uc3QgbmVlZHNIZWxwZXJEaXIgPSAhZXhpc3RpbmcuaW5jbHVkZXMoXCJoZWxwZXJfYmluYXJpZXNfZGlyXCIpO1xuXG4gICAgaWYgKCFuZWVkc0ROUyAmJiAhbmVlZHNIZWxwZXJEaXIpIHJldHVybjtcblxuICAgIG1rZGlyU3luYyhjb25maWdEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgbGV0IHVwZGF0ZWQgPSBleGlzdGluZztcblxuICAgIGlmIChuZWVkc0hlbHBlckRpcikge1xuICAgICAgY29uc3QgaGVscGVyTGluZSA9XG4gICAgICAgICdoZWxwZXJfYmluYXJpZXNfZGlyID0gW1wiL3Vzci9iaW5cIiwgXCIvdXNyL2xvY2FsL2JpblwiLCBcIi91c3IvbGliL3BvZG1hblwiXSc7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5pbmNsdWRlcyhcIltuZXR3b3JrXVwiKVxuICAgICAgICA/IHVwZGF0ZWQucmVwbGFjZShcIltuZXR3b3JrXVwiLCBgW25ldHdvcmtdXFxuJHtoZWxwZXJMaW5lfWApXG4gICAgICAgIDogdXBkYXRlZCArIGBcXG5bbmV0d29ya11cXG4ke2hlbHBlckxpbmV9XFxuYDtcbiAgICB9XG5cbiAgICBpZiAobmVlZHNETlMpIHtcbiAgICAgIGNvbnN0IGRuc0xpbmUgPSAnZG5zX3NlcnZlcnMgPSBbXCI4LjguOC44XCIsIFwiOC44LjQuNFwiXSc7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5pbmNsdWRlcyhcIltjb250YWluZXJzXVwiKVxuICAgICAgICA/IHVwZGF0ZWQucmVwbGFjZShcIltjb250YWluZXJzXVwiLCBgW2NvbnRhaW5lcnNdXFxuJHtkbnNMaW5lfWApXG4gICAgICAgIDogdXBkYXRlZCArIGBcXG5bY29udGFpbmVyc11cXG4ke2Ruc0xpbmV9XFxuYDtcbiAgICB9XG5cbiAgICB3cml0ZUZpbGVTeW5jKGNvbmZpZ1BhdGgsIHVwZGF0ZWQsIFwidXRmLThcIik7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBcIltsbXMtY29tcHV0ZXJdIEF1dG8tY29uZmlndXJlZCBQb2RtYW4gY29udGFpbmVycy5jb25mIChoZWxwZXJfYmluYXJpZXNfZGlyICsgZG5zX3NlcnZlcnMpLlwiLFxuICAgICk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihcIltsbXMtY29tcHV0ZXJdIENvdWxkIG5vdCB3cml0ZSBQb2RtYW4gY29uZmlnOlwiLCBlcnIpO1xuICB9XG59XG5cbmxldCBydW50aW1lOiBSdW50aW1lSW5mbyB8IG51bGwgPSBudWxsO1xubGV0IGNvbnRhaW5lck5hbWU6IHN0cmluZyA9IFwiXCI7XG5sZXQgY29udGFpbmVyUmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbmxldCBjdXJyZW50TmV0d29yazogTmV0d29ya01vZGUgPSBcIm5vbmVcIjtcbmxldCBpbml0UHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuXG5pbnRlcmZhY2UgU2hlbGxTZXNzaW9uIHtcbiAgcHJvYzogUmV0dXJuVHlwZTx0eXBlb2Ygc3Bhd24+O1xuICB3cml0ZTogKGRhdGE6IHN0cmluZykgPT4gdm9pZDtcbiAga2lsbDogKCkgPT4gdm9pZDtcbn1cblxubGV0IHNoZWxsU2Vzc2lvbjogU2hlbGxTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG5cbmNvbnN0IFNFTlRJTkVMID0gYF9fTE1TX0RPTkVfJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKX1fX2A7XG5jb25zdCBTRU5USU5FTF9OTCA9IFNFTlRJTkVMICsgXCJcXG5cIjtcblxuLyoqXG4gKiBHZXQgdGhlIHNoZWxsIHBhdGggZm9yIHRoZSBnaXZlbiBpbWFnZS5cbiAqL1xuZnVuY3Rpb24gc2hlbGxGb3IoaW1hZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbWFnZS5zdGFydHNXaXRoKFwiYWxwaW5lXCIpID8gQ09OVEFJTkVSX1NIRUxMX0FMUElORSA6IENPTlRBSU5FUl9TSEVMTDtcbn1cblxuLyoqXG4gKiBTdGFydCBhIHBlcnNpc3RlbnQgYmFzaCBzZXNzaW9uIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICogVGhlIHNlc3Npb24gc3RheXMgYWxpdmUgYWNyb3NzIG11bHRpcGxlIEV4ZWN1dGUgY2FsbHMgc28gdGhhdFxuICogY2QsIGV4cG9ydCwgc291cmNlLCBudm0gdXNlLCBjb25kYSBhY3RpdmF0ZSwgZXRjLiBhbGwgcGVyc2lzdC5cbiAqL1xuZnVuY3Rpb24gc3RhcnRTaGVsbFNlc3Npb24oKTogU2hlbGxTZXNzaW9uIHtcbiAgaWYgKCFydW50aW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJSdW50aW1lIG5vdCBpbml0aWFsaXplZFwiKTtcblxuICBjb25zdCBpc0FscGluZSA9IGNvbnRhaW5lck5hbWUuaW5jbHVkZXMoXCJhbHBpbmVcIik7XG4gIGNvbnN0IHNoZWxsID0gaXNBbHBpbmUgPyBDT05UQUlORVJfU0hFTExfQUxQSU5FIDogQ09OVEFJTkVSX1NIRUxMO1xuXG4gIGNvbnN0IHByb2MgPSBzcGF3bihcbiAgICBydW50aW1lLnBhdGgsXG4gICAgW1wiZXhlY1wiLCBcIi1pXCIsIFwiLXdcIiwgQ09OVEFJTkVSX1dPUktESVIsIGNvbnRhaW5lck5hbWUsIHNoZWxsXSxcbiAgICB7XG4gICAgICBzdGRpbzogW1wicGlwZVwiLCBcInBpcGVcIiwgXCJwaXBlXCJdLFxuICAgICAgZW52OiBnZXRSdW50aW1lRW52KCksXG4gICAgfSxcbiAgKTtcblxuICBjb25zdCBpbml0ID0gW1xuICAgIFwiZXhwb3J0IFBTMT0nJ1wiLFxuICAgIFwiZXhwb3J0IFBTMj0nJ1wiLFxuICAgIFwiZXhwb3J0IFRFUk09eHRlcm0tMjU2Y29sb3JcIixcbiAgICBgY2QgJHtDT05UQUlORVJfV09SS0RJUn1gLFxuICAgIFwiXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbiAgcHJvYy5zdGRpbj8ud3JpdGUoaW5pdCk7XG5cbiAgY29uc3Qgc2Vzc2lvbjogU2hlbGxTZXNzaW9uID0ge1xuICAgIHByb2MsXG4gICAgd3JpdGU6IChkYXRhOiBzdHJpbmcpID0+IHByb2Muc3RkaW4/LndyaXRlKGRhdGEpLFxuICAgIGtpbGw6ICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHByb2Mua2lsbChcIlNJR0tJTExcIik7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogaWdub3JlICovXG4gICAgICB9XG4gICAgfSxcbiAgfTtcblxuICBwcm9jLm9uKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgaWYgKHNoZWxsU2Vzc2lvbiA9PT0gc2Vzc2lvbikgc2hlbGxTZXNzaW9uID0gbnVsbDtcbiAgfSk7XG5cbiAgcHJvYy5vbihcImVycm9yXCIsICgpID0+IHtcbiAgICBpZiAoc2hlbGxTZXNzaW9uID09PSBzZXNzaW9uKSBzaGVsbFNlc3Npb24gPSBudWxsO1xuICB9KTtcblxuICByZXR1cm4gc2Vzc2lvbjtcbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgY29tbWFuZCB0aHJvdWdoIHRoZSBwZXJzaXN0ZW50IHNoZWxsIHNlc3Npb24uXG4gKiBTdGF0ZSAoY3dkLCBlbnYgdmFycywgc291cmNlZCBmaWxlcykgcGVyc2lzdHMgYWNyb3NzIGNhbGxzLlxuICovXG5hc3luYyBmdW5jdGlvbiBleGVjSW5TZXNzaW9uKFxuICBjb21tYW5kOiBzdHJpbmcsXG4gIHRpbWVvdXRTZWNvbmRzOiBudW1iZXIsXG4gIG1heE91dHB1dEJ5dGVzOiBudW1iZXIsXG4pOiBQcm9taXNlPEV4ZWNSZXN1bHQ+IHtcbiAgaWYgKFxuICAgICFzaGVsbFNlc3Npb24gfHxcbiAgICBzaGVsbFNlc3Npb24ucHJvYy5leGl0Q29kZSAhPT0gbnVsbCB8fFxuICAgIHNoZWxsU2Vzc2lvbi5wcm9jLmtpbGxlZFxuICApIHtcbiAgICBzaGVsbFNlc3Npb24gPSBzdGFydFNoZWxsU2Vzc2lvbigpO1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMCkpO1xuICB9XG5cbiAgY29uc3Qgc2Vzc2lvbiA9IHNoZWxsU2Vzc2lvbjtcbiAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICBjb25zdCBlZmZlY3RpdmVNYXggPSBNYXRoLm1pbihtYXhPdXRwdXRCeXRlcywgTUFYX09VVFBVVF9CWVRFUyk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPEV4ZWNSZXN1bHQ+KChyZXNvbHZlKSA9PiB7XG4gICAgbGV0IHN0ZG91dCA9IFwiXCI7XG4gICAgbGV0IHN0ZGVyciA9IFwiXCI7XG4gICAgbGV0IGRvbmUgPSBmYWxzZTtcblxuICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICBzZXNzaW9uLnByb2Muc3Rkb3V0Py5yZW1vdmVMaXN0ZW5lcihcImRhdGFcIiwgb25TdGRvdXQpO1xuICAgICAgc2Vzc2lvbi5wcm9jLnN0ZGVycj8ucmVtb3ZlTGlzdGVuZXIoXCJkYXRhXCIsIG9uU3RkZXJyKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgfTtcblxuICAgIGNvbnN0IGZpbmlzaCA9ICh0aW1lZE91dDogYm9vbGVhbiwga2lsbGVkOiBib29sZWFuKSA9PiB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgZG9uZSA9IHRydWU7XG4gICAgICBjbGVhbnVwKCk7XG5cbiAgICAgIGxldCBleGl0Q29kZSA9IDA7XG4gICAgICBjb25zdCBleGl0TWF0Y2ggPSBzdGRvdXQubWF0Y2goL1xcbkVYSVRfQ09ERTooXFxkKylcXG4/JC8pO1xuICAgICAgaWYgKGV4aXRNYXRjaCkge1xuICAgICAgICBleGl0Q29kZSA9IHBhcnNlSW50KGV4aXRNYXRjaFsxXSwgMTApO1xuICAgICAgICBzdGRvdXQgPSBzdGRvdXQuc2xpY2UoMCwgZXhpdE1hdGNoLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgc3Rkb3V0ID0gc3Rkb3V0LnJlcGxhY2UobmV3IFJlZ0V4cChTRU5USU5FTCArIFwiXFxcXG4/JFwiKSwgXCJcIikudHJpbUVuZCgpO1xuXG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgZXhpdENvZGU6IGtpbGxlZCA/IDEzNyA6IGV4aXRDb2RlLFxuICAgICAgICBzdGRvdXQ6IHN0ZG91dC5zbGljZSgwLCBlZmZlY3RpdmVNYXgpLFxuICAgICAgICBzdGRlcnI6IHN0ZGVyci5zbGljZSgwLCBlZmZlY3RpdmVNYXgpLFxuICAgICAgICB0aW1lZE91dCxcbiAgICAgICAgZHVyYXRpb25NczogRGF0ZS5ub3coKSAtIHN0YXJ0LFxuICAgICAgICB0cnVuY2F0ZWQ6XG4gICAgICAgICAgc3Rkb3V0Lmxlbmd0aCA+PSBlZmZlY3RpdmVNYXggfHwgc3RkZXJyLmxlbmd0aCA+PSBlZmZlY3RpdmVNYXgsXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb25TdGRvdXQgPSAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgIHN0ZG91dCArPSBjaHVuay50b1N0cmluZyhcInV0Zi04XCIpO1xuICAgICAgaWYgKHN0ZG91dC5pbmNsdWRlcyhTRU5USU5FTF9OTCkgfHwgc3Rkb3V0LmVuZHNXaXRoKFNFTlRJTkVMKSkge1xuICAgICAgICBmaW5pc2goZmFsc2UsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgb25TdGRlcnIgPSAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgIGlmIChzdGRlcnIubGVuZ3RoIDwgZWZmZWN0aXZlTWF4KSBzdGRlcnIgKz0gY2h1bmsudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgICB9O1xuXG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgICBzZXNzaW9uLmtpbGwoKTtcbiAgICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gICAgICBmaW5pc2godHJ1ZSwgdHJ1ZSk7XG4gICAgfSwgdGltZW91dFNlY29uZHMgKiAxMDAwKTtcblxuICAgIHNlc3Npb24ucHJvYy5zdGRvdXQ/Lm9uKFwiZGF0YVwiLCBvblN0ZG91dCk7XG4gICAgc2Vzc2lvbi5wcm9jLnN0ZGVycj8ub24oXCJkYXRhXCIsIG9uU3RkZXJyKTtcblxuICAgIGNvbnN0IHdyYXBwZWQgPSBgJHtjb21tYW5kfVxcbmVjaG8gXCJFWElUX0NPREU6JD9cIlxcbmVjaG8gXCIke1NFTlRJTkVMfVwiXFxuYDtcbiAgICBzZXNzaW9uLndyaXRlKHdyYXBwZWQpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBSdW4gYSBjb250YWluZXIgcnVudGltZSBjb21tYW5kIGFuZCByZXR1cm4gc3Rkb3V0LlxuICovXG5hc3luYyBmdW5jdGlvbiBydW4oXG4gIGFyZ3M6IHN0cmluZ1tdLFxuICB0aW1lb3V0TXM6IG51bWJlciA9IDMwXzAwMCxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWRcIik7XG4gIGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBleGVjQXN5bmMocnVudGltZS5wYXRoLCBhcmdzLCB7XG4gICAgdGltZW91dDogdGltZW91dE1zLFxuICAgIG1heEJ1ZmZlcjogTUFYX09VVFBVVF9CWVRFUyxcbiAgICBlbnY6IGdldFJ1bnRpbWVFbnYoKSxcbiAgfSk7XG4gIHJldHVybiBzdGRvdXQudHJpbSgpO1xufVxuXG4vKipcbiAqIENoZWNrIGN1cnJlbnQgc3RhdGUgb2YgdGhlIG1hbmFnZWQgY29udGFpbmVyLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRDb250YWluZXJTdGF0ZSgpOiBQcm9taXNlPENvbnRhaW5lclN0YXRlPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3V0ID0gYXdhaXQgcnVuKFtcbiAgICAgIFwiaW5zcGVjdFwiLFxuICAgICAgY29udGFpbmVyTmFtZSxcbiAgICAgIFwiLS1mb3JtYXRcIixcbiAgICAgIFwie3suU3RhdGUuU3RhdHVzfX1cIixcbiAgICBdKTtcbiAgICBjb25zdCBzdGF0dXMgPSBvdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKHN0YXR1cyA9PT0gXCJydW5uaW5nXCIpIHJldHVybiBcInJ1bm5pbmdcIjtcbiAgICBpZiAoW1wiZXhpdGVkXCIsIFwic3RvcHBlZFwiLCBcImNyZWF0ZWRcIiwgXCJwYXVzZWRcIiwgXCJkZWFkXCJdLmluY2x1ZGVzKHN0YXR1cykpXG4gICAgICByZXR1cm4gXCJzdG9wcGVkXCI7XG4gICAgcmV0dXJuIFwiZXJyb3JcIjtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFwibm90X2ZvdW5kXCI7XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZCBgZG9ja2VyIHJ1bmAgLyBgcG9kbWFuIHJ1bmAgYXJndW1lbnRzIGZyb20gb3B0aW9ucy5cbiAqL1xuZnVuY3Rpb24gYnVpbGRSdW5BcmdzKG9wdHM6IENvbnRhaW5lckNyZWF0ZU9wdGlvbnMpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW1xuICAgIFwicnVuXCIsXG4gICAgXCItZFwiLFxuICAgIFwiLS1uYW1lXCIsXG4gICAgb3B0cy5uYW1lLFxuICAgIFwiLS1ob3N0bmFtZVwiLFxuICAgIFwibG1zLWNvbXB1dGVyXCIsXG4gICAgLi4uKG9wdHMubmV0d29yayAhPT0gXCJwb2RtYW4tZGVmYXVsdFwiID8gW1wiLS1uZXR3b3JrXCIsIG9wdHMubmV0d29ya10gOiBbXSksXG4gICAgLi4uKG9wdHMubmV0d29yayAhPT0gXCJub25lXCJcbiAgICAgID8gW1wiLS1kbnNcIiwgXCI4LjguOC44XCIsIFwiLS1kbnNcIiwgXCI4LjguNC40XCJdXG4gICAgICA6IFtdKSxcbiAgICBcIi13XCIsXG4gICAgXCIvcm9vdFwiLFxuICBdO1xuXG4gIGlmIChvcHRzLmNwdUxpbWl0ID4gMCkge1xuICAgIGFyZ3MucHVzaChcIi0tY3B1c1wiLCBTdHJpbmcob3B0cy5jcHVMaW1pdCkpO1xuICB9XG4gIGlmIChvcHRzLm1lbW9yeUxpbWl0TUIgPiAwKSB7XG4gICAgYXJncy5wdXNoKFwiLS1tZW1vcnlcIiwgYCR7b3B0cy5tZW1vcnlMaW1pdE1CfW1gKTtcbiAgICBhcmdzLnB1c2goXCItLW1lbW9yeS1zd2FwXCIsIGAke29wdHMubWVtb3J5TGltaXRNQn1tYCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhvcHRzLmVudlZhcnMpKSB7XG4gICAgYXJncy5wdXNoKFwiLWVcIiwgYCR7a309JHt2fWApO1xuICB9XG5cbiAgZm9yIChjb25zdCBwZiBvZiBvcHRzLnBvcnRGb3J3YXJkcykge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBwZi50cmltKCk7XG4gICAgaWYgKHRyaW1tZWQpIGFyZ3MucHVzaChcIi1wXCIsIHRyaW1tZWQpO1xuICB9XG5cbiAgaWYgKG9wdHMuaG9zdE1vdW50UGF0aCkge1xuICAgIGFyZ3MucHVzaChcIi12XCIsIGAke3RvRG9ja2VyUGF0aChvcHRzLmhvc3RNb3VudFBhdGgpfTovbW50L3NoYXJlZGApO1xuICB9XG5cbiAgYXJncy5wdXNoKG9wdHMuaW1hZ2UsIFwidGFpbFwiLCBcIi1mXCIsIFwiL2Rldi9udWxsXCIpO1xuXG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0aGUgdXNlciB3b3Jrc3BhY2UgYW5kIGluc3RhbGwgcGFja2FnZXMgaW5zaWRlIHRoZSBjb250YWluZXIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNldHVwQ29udGFpbmVyKFxuICBpbWFnZTogQ29udGFpbmVySW1hZ2UsXG4gIHByZXNldDogc3RyaW5nLFxuICBoYXNOZXR3b3JrOiBib29sZWFuID0gZmFsc2UsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc2hlbGwgPSBzaGVsbEZvcihpbWFnZSk7XG5cbiAgYXdhaXQgcnVuKFxuICAgIFtcbiAgICAgIFwiZXhlY1wiLFxuICAgICAgY29udGFpbmVyTmFtZSxcbiAgICAgIHNoZWxsLFxuICAgICAgXCItY1wiLFxuICAgICAgYG1rZGlyIC1wICR7Q09OVEFJTkVSX1dPUktESVJ9ICYmIGAgK1xuICAgICAgICBgKGlkIHVzZXIgPi9kZXYvbnVsbCAyPiYxIHx8IGFkZHVzZXIgLS1kaXNhYmxlZC1wYXNzd29yZCAtLWdlY29zIFwiXCIgLS1ob21lICR7Q09OVEFJTkVSX1dPUktESVJ9IHVzZXIgMj4vZGV2L251bGwgfHwgYCArXG4gICAgICAgIGBhZGR1c2VyIC1EIC1oICR7Q09OVEFJTkVSX1dPUktESVJ9IHVzZXIgMj4vZGV2L251bGwgfHwgdHJ1ZSlgLFxuICAgIF0sXG4gICAgMTVfMDAwLFxuICApO1xuXG4gIGlmIChwcmVzZXQgJiYgcHJlc2V0ICE9PSBcIm5vbmVcIiAmJiBoYXNOZXR3b3JrKSB7XG4gICAgY29uc3QgaXNBbHBpbmUgPSBpbWFnZS5zdGFydHNXaXRoKFwiYWxwaW5lXCIpO1xuICAgIGNvbnN0IHByZXNldHMgPSBpc0FscGluZSA/IFBBQ0tBR0VfUFJFU0VUU19BTFBJTkUgOiBQQUNLQUdFX1BSRVNFVFM7XG4gICAgY29uc3QgcGFja2FnZXMgPSBwcmVzZXRzW3ByZXNldF07XG4gICAgaWYgKHBhY2thZ2VzICYmIHBhY2thZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGluc3RhbGxDbWQgPSBpc0FscGluZVxuICAgICAgICA/IGBhcGsgdXBkYXRlICYmIGFwayBhZGQgLS1uby1jYWNoZSAke3BhY2thZ2VzLmpvaW4oXCIgXCIpfWBcbiAgICAgICAgOiBgYXB0LWdldCB1cGRhdGUgLXFxICYmIERFQklBTl9GUk9OVEVORD1ub25pbnRlcmFjdGl2ZSBhcHQtZ2V0IGluc3RhbGwgLXkgLXFxICR7cGFja2FnZXMuam9pbihcIiBcIil9ICYmIGFwdC1nZXQgY2xlYW4gJiYgcm0gLXJmIC92YXIvbGliL2FwdC9saXN0cy8qYDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFtcImV4ZWNcIiwgY29udGFpbmVyTmFtZSwgc2hlbGwsIFwiLWNcIiwgaW5zdGFsbENtZF0sIDE4MF8wMDApO1xuICAgICAgfSBjYXRjaCAoaW5zdGFsbEVycjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBcIltsbXMtY29tcHV0ZXJdIFBhY2thZ2UgaW5zdGFsbCBmYWlsZWQgKG5vbi1mYXRhbCk6XCIsXG4gICAgICAgICAgaW5zdGFsbEVycj8ubWVzc2FnZSA/PyBpbnN0YWxsRXJyLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIGNvbnRhaW5lciBlbmdpbmU6IGRldGVjdCBydW50aW1lLCBjcmVhdGUgb3Igc3RhcnRcbiAqIHRoZSBjb250YWluZXIgaWYgbmVlZGVkLiBTYWZlIHRvIGNhbGwgbXVsdGlwbGUgdGltZXMgKGlkZW1wb3RlbnQpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlUmVhZHkob3B0czoge1xuICBpbWFnZTogQ29udGFpbmVySW1hZ2U7XG4gIG5ldHdvcms6IE5ldHdvcmtNb2RlO1xuICBjcHVMaW1pdDogbnVtYmVyO1xuICBtZW1vcnlMaW1pdE1COiBudW1iZXI7XG4gIGRpc2tMaW1pdE1COiBudW1iZXI7XG4gIGF1dG9JbnN0YWxsUHJlc2V0OiBzdHJpbmc7XG4gIHBvcnRGb3J3YXJkczogc3RyaW5nO1xuICBob3N0TW91bnRQYXRoOiBzdHJpbmc7XG4gIHBlcnNpc3RlbmNlTW9kZTogc3RyaW5nO1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoY29udGFpbmVyUmVhZHkpIHtcbiAgICBjb25zdCB3YW50c05ldHdvcmsgPSBvcHRzLm5ldHdvcmsgIT09IFwibm9uZVwiO1xuICAgIGNvbnN0IGhhc05ldHdvcmsgPSBjdXJyZW50TmV0d29yayAhPT0gXCJub25lXCI7XG4gICAgaWYgKHdhbnRzTmV0d29yayA9PT0gaGFzTmV0d29yaykgcmV0dXJuO1xuXG4gICAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbiAgICBjdXJyZW50TmV0d29yayA9IFwibm9uZVwiO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8qIGlnbm9yZSAqL1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKFtcInJtXCIsIFwiLWZcIiwgY29udGFpbmVyTmFtZV0sIDEwXzAwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvKiBpZ25vcmUgKi9cbiAgICB9XG4gIH1cbiAgaWYgKGluaXRQcm9taXNlKSByZXR1cm4gaW5pdFByb21pc2U7XG5cbiAgaW5pdFByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgIHJ1bnRpbWUgPSBhd2FpdCBkZXRlY3RSdW50aW1lKCk7XG4gICAgY29udGFpbmVyTmFtZSA9IGAke0NPTlRBSU5FUl9OQU1FX1BSRUZJWH0tbWFpbmA7XG5cbiAgICBpZiAocnVudGltZS5raW5kID09PSBcInBvZG1hblwiKSB7XG4gICAgICBlbnN1cmVQb2RtYW5Db25maWcoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IGdldENvbnRhaW5lclN0YXRlKCk7XG5cbiAgICBpZiAoc3RhdGUgPT09IFwicnVubmluZ1wiKSB7XG4gICAgICBsZXQgYWN0dWFsbHlIYXNOZXR3b3JrID0gZmFsc2U7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBuZXRPdXQgPSBhd2FpdCBydW4oW1xuICAgICAgICAgIFwiaW5zcGVjdFwiLFxuICAgICAgICAgIGNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgXCItLWZvcm1hdFwiLFxuICAgICAgICAgIFwie3suSG9zdENvbmZpZy5OZXR3b3JrTW9kZX19XCIsXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCBhY3R1YWxOZXQgPSBuZXRPdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFjdHVhbGx5SGFzTmV0d29yayA9IGFjdHVhbE5ldCAhPT0gXCJub25lXCIgJiYgYWN0dWFsTmV0ICE9PSBcIlwiO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGFzc3VtZSBubyBuZXR3b3JrICovXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdhbnRzTmV0d29yayA9IG9wdHMubmV0d29yayAhPT0gXCJub25lXCI7XG5cbiAgICAgIGlmIChhY3R1YWxseUhhc05ldHdvcmsgPT09IHdhbnRzTmV0d29yaykge1xuICAgICAgICBjdXJyZW50TmV0d29yayA9IHdhbnRzTmV0d29yayA/IG9wdHMubmV0d29yayA6IFwibm9uZVwiO1xuICAgICAgICBjb250YWluZXJSZWFkeSA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbbG1zLWNvbXB1dGVyXSBOZXR3b3JrIG1pc21hdGNoIChjb250YWluZXIgaGFzICR7YWN0dWFsbHlIYXNOZXR3b3JrID8gXCJpbnRlcm5ldFwiIDogXCJubyBpbnRlcm5ldFwifSwgc2V0dGluZ3Mgd2FudCAke3dhbnRzTmV0d29yayA/IFwiaW50ZXJuZXRcIiA6IFwibm8gaW50ZXJuZXRcIn0pIFx1MjAxNCByZWNyZWF0aW5nIGNvbnRhaW5lci5gLFxuICAgICAgKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJzdG9wXCIsIGNvbnRhaW5lck5hbWVdLCAxNV8wMDApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGFscmVhZHkgc3RvcHBlZCAqL1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFtcInJtXCIsIFwiLWZcIiwgY29udGFpbmVyTmFtZV0sIDEwXzAwMCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYWxyZWFkeSBnb25lICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlID09PSBcInN0b3BwZWRcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFtcInN0YXJ0XCIsIGNvbnRhaW5lck5hbWVdKTtcbiAgICAgICAgY29udGFpbmVyUmVhZHkgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBjb25zdCBtc2c6IHN0cmluZyA9IGVycj8ubWVzc2FnZSA/PyBcIlwiO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbXNnLmluY2x1ZGVzKFwid29ya2RpclwiKSB8fFxuICAgICAgICAgIG1zZy5pbmNsdWRlcyhcImRvZXMgbm90IGV4aXN0XCIpIHx8XG4gICAgICAgICAgbXNnLmluY2x1ZGVzKFwibmV0bnNcIikgfHxcbiAgICAgICAgICBtc2cuaW5jbHVkZXMoXCJtb3VudCBydW50aW1lXCIpXG4gICAgICAgICkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBydW4oW1wicm1cIiwgXCItZlwiLCBjb250YWluZXJOYW1lXSwgMTBfMDAwKTtcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKFtcInB1bGxcIiwgb3B0cy5pbWFnZV0sIDMwMF8wMDApO1xuICAgIH0gY2F0Y2gge31cblxuICAgIGNvbnN0IHBvcnRGb3J3YXJkcyA9IG9wdHMucG9ydEZvcndhcmRzXG4gICAgICA/IG9wdHMucG9ydEZvcndhcmRzXG4gICAgICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgICAgIC5tYXAoKHMpID0+IHMudHJpbSgpKVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIDogW107XG5cbiAgICBsZXQgc2V0dXBOZXR3b3JrOiBOZXR3b3JrTW9kZSB8IFwicG9kbWFuLWRlZmF1bHRcIiA9IFwibm9uZVwiO1xuICAgIGlmIChydW50aW1lPy5raW5kID09PSBcImRvY2tlclwiKSB7XG4gICAgICBzZXR1cE5ldHdvcmsgPSBvcHRzLm5ldHdvcmsgPT09IFwibm9uZVwiID8gXCJub25lXCIgOiBcImJyaWRnZVwiO1xuICAgIH0gZWxzZSBpZiAocnVudGltZT8ua2luZCA9PT0gXCJwb2RtYW5cIiAmJiBvcHRzLm5ldHdvcmsgIT09IFwibm9uZVwiKSB7XG4gICAgICBzZXR1cE5ldHdvcmsgPSBcInBvZG1hbi1kZWZhdWx0XCI7XG4gICAgfVxuICAgIGNvbnN0IGNyZWF0ZUFyZ3MgPSBidWlsZFJ1bkFyZ3Moe1xuICAgICAgaW1hZ2U6IG9wdHMuaW1hZ2UsXG4gICAgICBuYW1lOiBjb250YWluZXJOYW1lLFxuICAgICAgbmV0d29yazogc2V0dXBOZXR3b3JrLFxuICAgICAgY3B1TGltaXQ6IG9wdHMuY3B1TGltaXQsXG4gICAgICBtZW1vcnlMaW1pdE1COiBvcHRzLm1lbW9yeUxpbWl0TUIsXG4gICAgICBkaXNrTGltaXRNQjogb3B0cy5kaXNrTGltaXRNQixcbiAgICAgIHdvcmtkaXI6IENPTlRBSU5FUl9XT1JLRElSLFxuICAgICAgZW52VmFyczogQ09OVEFJTkVSX0VOVl9WQVJTLFxuICAgICAgcG9ydEZvcndhcmRzLFxuICAgICAgaG9zdE1vdW50UGF0aDogb3B0cy5ob3N0TW91bnRQYXRoIHx8IG51bGwsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXNrT3B0QXJncyA9IFsuLi5jcmVhdGVBcmdzXTtcbiAgICBpZiAob3B0cy5kaXNrTGltaXRNQiA+IDApIHtcbiAgICAgIGRpc2tPcHRBcmdzLnNwbGljZShcbiAgICAgICAgZGlza09wdEFyZ3MuaW5kZXhPZihvcHRzLmltYWdlKSxcbiAgICAgICAgMCxcbiAgICAgICAgXCItLXN0b3JhZ2Utb3B0XCIsXG4gICAgICAgIGBzaXplPSR7b3B0cy5kaXNrTGltaXRNQn1tYCxcbiAgICAgICk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBydW4oZGlza09wdEFyZ3MsIDYwXzAwMCk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGNvbnN0IG1zZzogc3RyaW5nID0gZXJyPy5tZXNzYWdlID8/IFwiXCI7XG4gICAgICBpZiAoXG4gICAgICAgIG1zZy5pbmNsdWRlcyhcInN0b3JhZ2Utb3B0XCIpIHx8XG4gICAgICAgIG1zZy5pbmNsdWRlcyhcImJhY2tpbmdGU1wiKSB8fFxuICAgICAgICBtc2cuaW5jbHVkZXMoXCJvdmVybGF5LnNpemVcIilcbiAgICAgICkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgXCJbbG1zLWNvbXB1dGVyXSBEaXNrIHF1b3RhIG5vdCBzdXBwb3J0ZWQgYnkgc3RvcmFnZSBkcml2ZXIsIHN0YXJ0aW5nIHdpdGhvdXQgc2l6ZSBsaW1pdC5cIixcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgcnVuKGNyZWF0ZUFyZ3MsIDYwXzAwMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaGFzTmV0d29ya0ZvclNldHVwID0gc2V0dXBOZXR3b3JrICE9PSBcIm5vbmVcIjtcbiAgICBhd2FpdCBzZXR1cENvbnRhaW5lcihcbiAgICAgIG9wdHMuaW1hZ2UsXG4gICAgICBvcHRzLmF1dG9JbnN0YWxsUHJlc2V0LFxuICAgICAgaGFzTmV0d29ya0ZvclNldHVwLFxuICAgICk7XG5cbiAgICBpZiAob3B0cy5uZXR3b3JrID09PSBcIm5vbmVcIiAmJiBzZXR1cE5ldHdvcmsgIT09IFwibm9uZVwiKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW4oXG4gICAgICAgICAgW1wibmV0d29ya1wiLCBcImRpc2Nvbm5lY3RcIiwgc2V0dXBOZXR3b3JrLCBjb250YWluZXJOYW1lXSxcbiAgICAgICAgICAxMF8wMDAsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYmVzdCBlZmZvcnQgXHUyMDE0IGNvbnRhaW5lciBzdGlsbCB3b3JrcywganVzdCBoYXMgbmV0d29yayAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIGN1cnJlbnROZXR3b3JrID0gc2V0dXBOZXR3b3JrICE9PSBcIm5vbmVcIiA/IG9wdHMubmV0d29yayA6IFwibm9uZVwiO1xuICAgIGNvbnRhaW5lclJlYWR5ID0gdHJ1ZTtcbiAgfSkoKTtcblxuICB0cnkge1xuICAgIGF3YWl0IGluaXRQcm9taXNlO1xuICB9IGZpbmFsbHkge1xuICAgIGluaXRQcm9taXNlID0gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgYSBjb21tYW5kIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlYyhcbiAgY29tbWFuZDogc3RyaW5nLFxuICB0aW1lb3V0U2Vjb25kczogbnVtYmVyLFxuICBtYXhPdXRwdXRCeXRlczogbnVtYmVyID0gREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTLFxuICB3b3JrZGlyPzogc3RyaW5nLFxuKTogUHJvbWlzZTxFeGVjUmVzdWx0PiB7XG4gIGlmICghcnVudGltZSB8fCAhY29udGFpbmVyUmVhZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXIgbm90IHJlYWR5LiBDYWxsIGVuc3VyZVJlYWR5KCkgZmlyc3QuXCIpO1xuICB9XG5cbiAgY29uc3QgY21kVG9SdW4gPVxuICAgIHdvcmtkaXIgJiYgd29ya2RpciAhPT0gQ09OVEFJTkVSX1dPUktESVJcbiAgICAgID8gYGNkICR7d29ya2Rpcn0gJiYgJHtjb21tYW5kfWBcbiAgICAgIDogY29tbWFuZDtcblxuICByZXR1cm4gZXhlY0luU2Vzc2lvbihjbWRUb1J1biwgdGltZW91dFNlY29uZHMsIG1heE91dHB1dEJ5dGVzKTtcbn1cblxuLyoqXG4gKiBXcml0ZSBhIGZpbGUgaW5zaWRlIHRoZSBjb250YWluZXIgdXNpbmcgc3RkaW4gcGlwaW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVGaWxlKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBjb250ZW50OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFydW50aW1lIHx8ICFjb250YWluZXJSZWFkeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRhaW5lciBub3QgcmVhZHkuXCIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBzaGVsbCA9IGNvbnRhaW5lck5hbWUuaW5jbHVkZXMoXCJhbHBpbmVcIilcbiAgICAgID8gQ09OVEFJTkVSX1NIRUxMX0FMUElORVxuICAgICAgOiBDT05UQUlORVJfU0hFTEw7XG4gICAgY29uc3QgcHJvYyA9IHNwYXduKFxuICAgICAgcnVudGltZSEucGF0aCxcbiAgICAgIFtcbiAgICAgICAgXCJleGVjXCIsXG4gICAgICAgIFwiLWlcIixcbiAgICAgICAgY29udGFpbmVyTmFtZSxcbiAgICAgICAgc2hlbGwsXG4gICAgICAgIFwiLWNcIixcbiAgICAgICAgYGNhdCA+ICcke2ZpbGVQYXRoLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgLFxuICAgICAgXSxcbiAgICAgIHtcbiAgICAgICAgdGltZW91dDogMTVfMDAwLFxuICAgICAgICBzdGRpbzogW1wicGlwZVwiLCBcImlnbm9yZVwiLCBcInBpcGVcIl0sXG4gICAgICAgIGVudjogZ2V0UnVudGltZUVudigpLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGV0IHN0ZGVyciA9IFwiXCI7XG4gICAgcHJvYy5zdGRlcnI/Lm9uKFwiZGF0YVwiLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgc3RkZXJyICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcHJvYy5vbihcImNsb3NlXCIsIChjb2RlKSA9PiB7XG4gICAgICBpZiAoY29kZSA9PT0gMCkgcmVzb2x2ZSgpO1xuICAgICAgZWxzZSByZWplY3QobmV3IEVycm9yKGBXcml0ZSBmYWlsZWQgKGV4aXQgJHtjb2RlfSk6ICR7c3RkZXJyfWApKTtcbiAgICB9KTtcbiAgICBwcm9jLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcbiAgICBwcm9jLnN0ZGluPy53cml0ZShjb250ZW50KTtcbiAgICBwcm9jLnN0ZGluPy5lbmQoKTtcbiAgfSk7XG59XG5cbi8qKlxuICogUmVhZCBhIGZpbGUgZnJvbSB0aGUgY29udGFpbmVyLCBvcHRpb25hbGx5IGxpbWl0ZWQgdG8gYSBsaW5lIHJhbmdlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEZpbGUoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG1heEJ5dGVzOiBudW1iZXIsXG4gIHN0YXJ0TGluZT86IG51bWJlcixcbiAgZW5kTGluZT86IG51bWJlcixcbik6IFByb21pc2U8eyBjb250ZW50OiBzdHJpbmc7IHRvdGFsTGluZXM6IG51bWJlciB9PiB7XG4gIGlmICghcnVudGltZSB8fCAhY29udGFpbmVyUmVhZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXIgbm90IHJlYWR5LlwiKTtcbiAgfVxuXG4gIGNvbnN0IHEgPSBmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKTtcbiAgY29uc3QgdG90YWxSZXN1bHQgPSBhd2FpdCBleGVjKGB3YyAtbCA8ICcke3F9JyAyPi9kZXYvbnVsbCB8fCBlY2hvIDBgLCA1KTtcbiAgY29uc3QgdG90YWxMaW5lcyA9IHBhcnNlSW50KHRvdGFsUmVzdWx0LnN0ZG91dC50cmltKCksIDEwKSB8fCAwO1xuXG4gIGxldCBjbWQ6IHN0cmluZztcbiAgaWYgKHN0YXJ0TGluZSAhPT0gdW5kZWZpbmVkICYmIGVuZExpbmUgIT09IHVuZGVmaW5lZCkge1xuICAgIGNtZCA9IGBzZWQgLW4gJyR7c3RhcnRMaW5lfSwke2VuZExpbmV9cCcgJyR7cX0nYDtcbiAgfSBlbHNlIGlmIChzdGFydExpbmUgIT09IHVuZGVmaW5lZCkge1xuICAgIGNtZCA9IGB0YWlsIC1uICske3N0YXJ0TGluZX0gJyR7cX0nYDtcbiAgfSBlbHNlIHtcbiAgICBjbWQgPSBgY2F0ICcke3F9J2A7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjKGNtZCwgMTAsIG1heEJ5dGVzKTtcbiAgaWYgKHJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgUmVhZCBmYWlsZWQ6ICR7cmVzdWx0LnN0ZGVyciB8fCBcImZpbGUgbm90IGZvdW5kXCJ9YCk7XG4gIH1cbiAgcmV0dXJuIHsgY29udGVudDogcmVzdWx0LnN0ZG91dCwgdG90YWxMaW5lcyB9O1xufVxuXG4vKipcbiAqIFJlcGxhY2UgYW4gZXhhY3Qgc3RyaW5nIGluIGEgZmlsZS4gRmFpbHMgaWYgdGhlIHN0cmluZyBpcyBub3QgZm91bmRcbiAqIG9yIGFwcGVhcnMgbW9yZSB0aGFuIG9uY2UsIG1hdGNoaW5nIHRoZSBiZWhhdmlvdXIgb2Ygc3VyZ2ljYWwgZWRpdG9ycy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0clJlcGxhY2VJbkZpbGUoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG9sZFN0cjogc3RyaW5nLFxuICBuZXdTdHI6IHN0cmluZyxcbik6IFByb21pc2U8eyByZXBsYWNlbWVudHM6IG51bWJlciB9PiB7XG4gIGlmICghcnVudGltZSB8fCAhY29udGFpbmVyUmVhZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXIgbm90IHJlYWR5LlwiKTtcbiAgfVxuXG4gIGNvbnN0IHEgPSBmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKTtcbiAgY29uc3QgcmVhZFJlc3VsdCA9IGF3YWl0IGV4ZWMoYGNhdCAnJHtxfSdgLCAxMCwgTUFYX09VVFBVVF9CWVRFUyk7XG4gIGlmIChyZWFkUmVzdWx0LmV4aXRDb2RlICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlIG5vdCBmb3VuZDogJHtmaWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IG9yaWdpbmFsID0gcmVhZFJlc3VsdC5zdGRvdXQ7XG4gIGNvbnN0IG9jY3VycmVuY2VzID0gb3JpZ2luYWwuc3BsaXQob2xkU3RyKS5sZW5ndGggLSAxO1xuXG4gIGlmIChvY2N1cnJlbmNlcyA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBTdHJpbmcgbm90IGZvdW5kIGluICR7ZmlsZVBhdGh9LlxcbmAgK1xuICAgICAgICBgSGludDogdXNlIFJlYWRGaWxlIHRvIHZpZXcgdGhlIGN1cnJlbnQgY29udGVudHMgYmVmb3JlIGVkaXRpbmcuYCxcbiAgICApO1xuICB9XG4gIGlmIChvY2N1cnJlbmNlcyA+IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgU3RyaW5nIGFwcGVhcnMgJHtvY2N1cnJlbmNlc30gdGltZXMgaW4gJHtmaWxlUGF0aH0gXHUyMDE0IGl0IG11c3QgYmUgdW5pcXVlLlxcbmAgK1xuICAgICAgICBgSGludDogaW5jbHVkZSBtb3JlIHN1cnJvdW5kaW5nIGNvbnRleHQgdG8gbWFrZSB0aGUgbWF0Y2ggdW5pcXVlLmAsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPSBvcmlnaW5hbC5yZXBsYWNlKG9sZFN0ciwgbmV3U3RyKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGZpbGVQYXRoLCB1cGRhdGVkKTtcbiAgcmV0dXJuIHsgcmVwbGFjZW1lbnRzOiAxIH07XG59XG5cbi8qKlxuICogSW5zZXJ0IGxpbmVzIGludG8gYSBmaWxlIGF0IGEgZ2l2ZW4gbGluZSBudW1iZXIuXG4gKiBMaW5lIG51bWJlcnMgYXJlIDEtYmFzZWQuIFBhc3MgMCB0byBwcmVwZW5kLCBvciBhIG51bWJlciBwYXN0IEVPRiB0byBhcHBlbmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNlcnRMaW5lc0luRmlsZShcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgYWZ0ZXJMaW5lOiBudW1iZXIsXG4gIGNvbnRlbnQ6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS5cIik7XG4gIH1cblxuICBjb25zdCBxID0gZmlsZVBhdGgucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIik7XG4gIGNvbnN0IHJlYWRSZXN1bHQgPSBhd2FpdCBleGVjKGBjYXQgJyR7cX0nYCwgMTAsIE1BWF9PVVRQVVRfQllURVMpO1xuICBpZiAocmVhZFJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmlsZSBub3QgZm91bmQ6ICR7ZmlsZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCBsaW5lcyA9IHJlYWRSZXN1bHQuc3Rkb3V0LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBpbnNlcnRMaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGNsYW1wZWRMaW5lID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oYWZ0ZXJMaW5lLCBsaW5lcy5sZW5ndGgpKTtcbiAgbGluZXMuc3BsaWNlKGNsYW1wZWRMaW5lLCAwLCAuLi5pbnNlcnRMaW5lcyk7XG4gIGF3YWl0IHdyaXRlRmlsZShmaWxlUGF0aCwgbGluZXMuam9pbihcIlxcblwiKSk7XG59XG5cbmNvbnN0IGJnTG9ncyA9IG5ldyBNYXA8XG4gIG51bWJlcixcbiAgeyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmc7IGRvbmU6IGJvb2xlYW47IGV4aXRDb2RlOiBudW1iZXIgfCBudWxsIH1cbj4oKTtcblxuLyoqXG4gKiBSdW4gYSBjb21tYW5kIGluIHRoZSBiYWNrZ3JvdW5kIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICogUmV0dXJucyBhIGhhbmRsZSBJRCB0aGF0IGNhbiBiZSB1c2VkIHdpdGggcmVhZEJnTG9ncy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWNCYWNrZ3JvdW5kKFxuICBjb21tYW5kOiBzdHJpbmcsXG4gIHRpbWVvdXRTZWNvbmRzOiBudW1iZXIsXG4pOiBQcm9taXNlPHsgaGFuZGxlSWQ6IG51bWJlcjsgcGlkOiBudW1iZXIgfT4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS5cIik7XG4gIH1cblxuICBjb25zdCBzaGVsbCA9IGNvbnRhaW5lck5hbWUuaW5jbHVkZXMoXCJhbHBpbmVcIilcbiAgICA/IENPTlRBSU5FUl9TSEVMTF9BTFBJTkVcbiAgICA6IENPTlRBSU5FUl9TSEVMTDtcbiAgY29uc3QgaGFuZGxlSWQgPSBEYXRlLm5vdygpO1xuICBjb25zdCBlbnRyeSA9IHtcbiAgICBzdGRvdXQ6IFwiXCIsXG4gICAgc3RkZXJyOiBcIlwiLFxuICAgIGRvbmU6IGZhbHNlLFxuICAgIGV4aXRDb2RlOiBudWxsIGFzIG51bWJlciB8IG51bGwsXG4gIH07XG4gIGJnTG9ncy5zZXQoaGFuZGxlSWQsIGVudHJ5KTtcblxuICBjb25zdCBwcm9jID0gc3Bhd24oXG4gICAgcnVudGltZS5wYXRoLFxuICAgIFtcImV4ZWNcIiwgY29udGFpbmVyTmFtZSwgc2hlbGwsIFwiLWNcIiwgY29tbWFuZF0sXG4gICAge1xuICAgICAgc3RkaW86IFtcImlnbm9yZVwiLCBcInBpcGVcIiwgXCJwaXBlXCJdLFxuICAgICAgZW52OiBnZXRSdW50aW1lRW52KCksXG4gICAgfSxcbiAgKTtcblxuICBjb25zdCBjYXAgPSBNQVhfT1VUUFVUX0JZVEVTICogMjtcbiAgcHJvYy5zdGRvdXQ/Lm9uKFwiZGF0YVwiLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgIGlmIChlbnRyeS5zdGRvdXQubGVuZ3RoIDwgY2FwKSBlbnRyeS5zdGRvdXQgKz0gY2h1bmsudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgfSk7XG4gIHByb2Muc3RkZXJyPy5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICBpZiAoZW50cnkuc3RkZXJyLmxlbmd0aCA8IGNhcCkgZW50cnkuc3RkZXJyICs9IGNodW5rLnRvU3RyaW5nKFwidXRmLThcIik7XG4gIH0pO1xuICBwcm9jLm9uKFwiY2xvc2VcIiwgKGNvZGUpID0+IHtcbiAgICBlbnRyeS5kb25lID0gdHJ1ZTtcbiAgICBlbnRyeS5leGl0Q29kZSA9IGNvZGU7XG4gIH0pO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmICghZW50cnkuZG9uZSkge1xuICAgICAgcHJvYy5raWxsKFwiU0lHS0lMTFwiKTtcbiAgICAgIGVudHJ5LmRvbmUgPSB0cnVlO1xuICAgICAgZW50cnkuZXhpdENvZGUgPSAxMzc7XG4gICAgfVxuICB9LCB0aW1lb3V0U2Vjb25kcyAqIDFfMDAwKTtcblxuICByZXR1cm4geyBoYW5kbGVJZCwgcGlkOiBwcm9jLnBpZCA/PyAtMSB9O1xufVxuXG4vKipcbiAqIFJlYWQgYnVmZmVyZWQgb3V0cHV0IGZyb20gYSBiYWNrZ3JvdW5kIHByb2Nlc3MgYnkgaGFuZGxlIElELlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJnTG9ncyhcbiAgaGFuZGxlSWQ6IG51bWJlcixcbiAgbWF4Qnl0ZXM6IG51bWJlciA9IERFRkFVTFRfTUFYX09VVFBVVF9CWVRFUyxcbik6IHtcbiAgc3Rkb3V0OiBzdHJpbmc7XG4gIHN0ZGVycjogc3RyaW5nO1xuICBkb25lOiBib29sZWFuO1xuICBleGl0Q29kZTogbnVtYmVyIHwgbnVsbDtcbiAgZm91bmQ6IGJvb2xlYW47XG59IHtcbiAgY29uc3QgZW50cnkgPSBiZ0xvZ3MuZ2V0KGhhbmRsZUlkKTtcbiAgaWYgKCFlbnRyeSlcbiAgICByZXR1cm4geyBzdGRvdXQ6IFwiXCIsIHN0ZGVycjogXCJcIiwgZG9uZTogdHJ1ZSwgZXhpdENvZGU6IG51bGwsIGZvdW5kOiBmYWxzZSB9O1xuICByZXR1cm4ge1xuICAgIHN0ZG91dDogZW50cnkuc3Rkb3V0LnNsaWNlKC1tYXhCeXRlcyksXG4gICAgc3RkZXJyOiBlbnRyeS5zdGRlcnIuc2xpY2UoLW1heEJ5dGVzKSxcbiAgICBkb25lOiBlbnRyeS5kb25lLFxuICAgIGV4aXRDb2RlOiBlbnRyeS5leGl0Q29kZSxcbiAgICBmb3VuZDogdHJ1ZSxcbiAgfTtcbn1cblxuLyoqXG4gKiBDb3B5IGEgZmlsZSBmcm9tIHRoZSBob3N0IGludG8gdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvcHlUb0NvbnRhaW5lcihcbiAgaG9zdFBhdGg6IHN0cmluZyxcbiAgY29udGFpbmVyUGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWQuXCIpO1xuICBhd2FpdCBydW4oW1wiY3BcIiwgaG9zdFBhdGgsIGAke2NvbnRhaW5lck5hbWV9OiR7Y29udGFpbmVyUGF0aH1gXSwgNjBfMDAwKTtcbn1cblxuLyoqXG4gKiBDb3B5IGEgZmlsZSBmcm9tIHRoZSBjb250YWluZXIgdG8gdGhlIGhvc3QuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5RnJvbUNvbnRhaW5lcihcbiAgY29udGFpbmVyUGF0aDogc3RyaW5nLFxuICBob3N0UGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWQuXCIpO1xuICBhd2FpdCBydW4oW1wiY3BcIiwgYCR7Y29udGFpbmVyTmFtZX06JHtjb250YWluZXJQYXRofWAsIGhvc3RQYXRoXSwgNjBfMDAwKTtcbn1cblxuLyoqXG4gKiBHZXQgZW52aXJvbm1lbnQgaW5mbyBmcm9tIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RW52aXJvbm1lbnRJbmZvKFxuICBuZXR3b3JrOiBib29sZWFuLFxuICBkaXNrTGltaXRNQjogbnVtYmVyID0gMCxcbik6IFByb21pc2U8RW52aXJvbm1lbnRJbmZvPiB7XG4gIGNvbnN0IGluZm9TY3JpcHQgPSBgXG5lY2hvIFwiT1M9JChjYXQgL2V0Yy9vcy1yZWxlYXNlIDI+L2Rldi9udWxsIHwgZ3JlcCBQUkVUVFlfTkFNRSB8IGN1dCAtZD0gLWYyIHwgdHIgLWQgJ1wiJylcIlxuZWNobyBcIktFUk5FTD0kKHVuYW1lIC1yKVwiXG5lY2hvIFwiQVJDSD0kKHVuYW1lIC1tKVwiXG5lY2hvIFwiSE9TVE5BTUU9JChob3N0bmFtZSlcIlxuZWNobyBcIlVQVElNRT0kKHVwdGltZSAtcCAyPi9kZXYvbnVsbCB8fCB1cHRpbWUpXCJcbkRJU0tfVVNFRF9LQj0kKGR1IC1zayAke0NPTlRBSU5FUl9XT1JLRElSfSAyPi9kZXYvbnVsbCB8IGF3ayAne3ByaW50ICQxfScgfHwgZWNobyAwKVxuZWNobyBcIkRJU0tfVVNFRF9LQj1cXCRESVNLX1VTRURfS0JcIlxuZWNobyBcIkRJU0tfRlJFRV9SQVc9JChkZiAtayAke0NPTlRBSU5FUl9XT1JLRElSfSAyPi9kZXYvbnVsbCB8IHRhaWwgLTEgfCBhd2sgJ3twcmludCAkNH0nKVwiXG5NRU1fTElNSVRfQllURVM9XFwkKGNhdCAvc3lzL2ZzL2Nncm91cC9tZW1vcnkubWF4IDI+L2Rldi9udWxsIHx8IGNhdCAvc3lzL2ZzL2Nncm91cC9tZW1vcnkvbWVtb3J5LmxpbWl0X2luX2J5dGVzIDI+L2Rldi9udWxsIHx8IGVjaG8gJycpXG5NRU1fVVNBR0VfQllURVM9XFwkKGNhdCAvc3lzL2ZzL2Nncm91cC9tZW1vcnkuY3VycmVudCAyPi9kZXYvbnVsbCB8fCBjYXQgL3N5cy9mcy9jZ3JvdXAvbWVtb3J5L21lbW9yeS51c2FnZV9pbl9ieXRlcyAyPi9kZXYvbnVsbCB8fCBlY2hvICcnKVxuaWYgWyAtbiBcIlxcJE1FTV9MSU1JVF9CWVRFU1wiIF0gJiYgWyBcIlxcJE1FTV9MSU1JVF9CWVRFU1wiICE9IFwibWF4XCIgXSAmJiBbIFwiXFwkTUVNX0xJTUlUX0JZVEVTXCIgLWx0IDkwMDAwMDAwMDAwMDAgXSAyPi9kZXYvbnVsbDsgdGhlblxuICBNRU1fVE9UQUxfSD1cXCQoYXdrIFwiQkVHSU57cHJpbnRmIFxcXCIlLjBmTWlCXFxcIiwgXFwkTUVNX0xJTUlUX0JZVEVTLzEwNDg1NzZ9XCIpXG4gIE1FTV9VU0VEX0g9XFwkKGF3ayBcIkJFR0lOe3ByaW50ZiBcXFwiJS4wZk1pQlxcXCIsIFxcJHtNRU1fVVNBR0VfQllURVM6LTB9LzEwNDg1NzZ9XCIpXG4gIE1FTV9GUkVFX0g9XFwkKGF3ayBcIkJFR0lOe3ByaW50ZiBcXFwiJS4wZk1pQlxcXCIsIChcXCRNRU1fTElNSVRfQllURVMtXFwke01FTV9VU0FHRV9CWVRFUzotMH0pLzEwNDg1NzZ9XCIpXG5lbHNlXG4gIE1FTV9UT1RBTF9IPVxcJChmcmVlIC1oIDI+L2Rldi9udWxsIHwgZ3JlcCBNZW0gfCBhd2sgJ3twcmludCBcXCQyfScgfHwgZWNobyAnTi9BJylcbiAgTUVNX1VTRURfSD1cXCQoZnJlZSAtaCAyPi9kZXYvbnVsbCB8IGdyZXAgTWVtIHwgYXdrICd7cHJpbnQgXFwkM30nIHx8IGVjaG8gJ04vQScpXG4gIE1FTV9GUkVFX0g9XFwkKGZyZWUgLWggMj4vZGV2L251bGwgfCBncmVwIE1lbSB8IGF3ayAne3ByaW50IFxcJDR9JyB8fCBlY2hvICdOL0EnKVxuZmlcbmVjaG8gXCJNRU1fRlJFRT1cXCRNRU1fRlJFRV9IXCJcbmVjaG8gXCJNRU1fVE9UQUw9XFwkTUVNX1RPVEFMX0hcIlxuZWNobyBcIlBZVEhPTj0kKHB5dGhvbjMgLS12ZXJzaW9uIDI+L2Rldi9udWxsIHx8IGVjaG8gJycpXCJcbmVjaG8gXCJOT0RFPSQobm9kZSAtLXZlcnNpb24gMj4vZGV2L251bGwgfHwgZWNobyAnJylcIlxuZWNobyBcIkdDQz0kKGdjYyAtLXZlcnNpb24gMj4vZGV2L251bGwgfCBoZWFkIC0xIHx8IGVjaG8gJycpXCJcbmVjaG8gXCJUT09MUz0kKHdoaWNoIGdpdCBjdXJsIHdnZXQgdmltIG5hbm8gcHl0aG9uMyBub2RlIG5wbSBnY2MgbWFrZSBjbWFrZSBwaXAzIDI+L2Rldi9udWxsIHwgeGFyZ3MgLUl7fSBiYXNlbmFtZSB7fSB8IHRyICdcXFxcbicgJywnKVwiXG4gIGAudHJpbSgpO1xuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWMoaW5mb1NjcmlwdCwgMTApO1xuICBjb25zdCBsaW5lcyA9IHJlc3VsdC5zdGRvdXQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGdldCA9IChwcmVmaXg6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgbGluZSA9IGxpbmVzLmZpbmQoKGwpID0+IGwuc3RhcnRzV2l0aChwcmVmaXggKyBcIj1cIikpO1xuICAgIHJldHVybiBsaW5lPy5zbGljZShwcmVmaXgubGVuZ3RoICsgMSk/LnRyaW0oKSA/PyBcIk4vQVwiO1xuICB9O1xuXG4gIGNvbnN0IGRpc2tVc2VkS0IgPSBwYXJzZUludChnZXQoXCJESVNLX1VTRURfS0JcIikgfHwgXCIwXCIsIDEwKTtcbiAgY29uc3QgZGlza0ZyZWVSYXdLQiA9IHBhcnNlSW50KGdldChcIkRJU0tfRlJFRV9SQVdcIikgfHwgXCIwXCIsIDEwKTtcbiAgbGV0IGRpc2tUb3RhbDogc3RyaW5nO1xuICBsZXQgZGlza0ZyZWU6IHN0cmluZztcbiAgaWYgKGRpc2tMaW1pdE1CID4gMCkge1xuICAgIGNvbnN0IGRpc2tMaW1pdEtCID0gZGlza0xpbWl0TUIgKiAxMDI0O1xuICAgIGNvbnN0IGRpc2tGcmVlS0IgPSBNYXRoLm1heCgwLCBkaXNrTGltaXRLQiAtIGRpc2tVc2VkS0IpO1xuICAgIGNvbnN0IHRvTWlCID0gKGtiOiBudW1iZXIpID0+XG4gICAgICBrYiA+PSAxMDI0ICogMTAyNFxuICAgICAgICA/IGAkeyhrYiAvIDEwMjQgLyAxMDI0KS50b0ZpeGVkKDEpfUdpQmBcbiAgICAgICAgOiBgJHtNYXRoLnJvdW5kKGtiIC8gMTAyNCl9TWlCYDtcbiAgICBkaXNrVG90YWwgPSB0b01pQihkaXNrTGltaXRLQik7XG4gICAgZGlza0ZyZWUgPSB0b01pQihkaXNrRnJlZUtCKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0b01pQiA9IChrYjogbnVtYmVyKSA9PlxuICAgICAga2IgPj0gMTAyNCAqIDEwMjRcbiAgICAgICAgPyBgJHsoa2IgLyAxMDI0IC8gMTAyNCkudG9GaXhlZCgxKX1HaUJgXG4gICAgICAgIDogYCR7TWF0aC5yb3VuZChrYiAvIDEwMjQpfU1pQmA7XG4gICAgZGlza0ZyZWUgPSB0b01pQihkaXNrRnJlZVJhd0tCKTtcbiAgICBkaXNrVG90YWwgPSBcIk4vQVwiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvczogZ2V0KFwiT1NcIiksXG4gICAga2VybmVsOiBnZXQoXCJLRVJORUxcIiksXG4gICAgYXJjaDogZ2V0KFwiQVJDSFwiKSxcbiAgICBob3N0bmFtZTogZ2V0KFwiSE9TVE5BTUVcIiksXG4gICAgdXB0aW1lOiBnZXQoXCJVUFRJTUVcIiksXG4gICAgZGlza0ZyZWUsXG4gICAgZGlza1RvdGFsLFxuICAgIG1lbW9yeUZyZWU6IGdldChcIk1FTV9GUkVFXCIpLFxuICAgIG1lbW9yeVRvdGFsOiBnZXQoXCJNRU1fVE9UQUxcIiksXG4gICAgcHl0aG9uVmVyc2lvbjogZ2V0KFwiUFlUSE9OXCIpIHx8IG51bGwsXG4gICAgbm9kZVZlcnNpb246IGdldChcIk5PREVcIikgfHwgbnVsbCxcbiAgICBnY2NWZXJzaW9uOiBnZXQoXCJHQ0NcIikgfHwgbnVsbCxcbiAgICBpbnN0YWxsZWRUb29sczogZ2V0KFwiVE9PTFNcIikuc3BsaXQoXCIsXCIpLmZpbHRlcihCb29sZWFuKSxcbiAgICB3b3JrZGlyOiBDT05UQUlORVJfV09SS0RJUixcbiAgICBuZXR3b3JrRW5hYmxlZDogbmV0d29yayxcbiAgfTtcbn1cblxuLyoqXG4gKiBMaXN0IHByb2Nlc3NlcyBydW5uaW5nIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdFByb2Nlc3NlcygpOiBQcm9taXNlPFByb2Nlc3NJbmZvW10+IHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhcbiAgICBcInBzIGF1eCAtLW5vLWhlYWRlcnMgMj4vZGV2L251bGwgfHwgcHMgYXV4IDI+L2Rldi9udWxsXCIsXG4gICAgNSxcbiAgKTtcblxuICBpZiAocmVzdWx0LmV4aXRDb2RlICE9PSAwKSByZXR1cm4gW107XG5cbiAgcmV0dXJuIHJlc3VsdC5zdGRvdXRcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAuZmlsdGVyKChsaW5lKSA9PiBsaW5lLnRyaW0oKSAmJiAhbGluZS5pbmNsdWRlcyhcInBzIGF1eFwiKSlcbiAgICAubWFwKChsaW5lKSA9PiB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGxpbmUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwaWQ6IHBhcnNlSW50KHBhcnRzWzFdID8/IFwiMFwiLCAxMCksXG4gICAgICAgIHVzZXI6IHBhcnRzWzBdID8/IFwiP1wiLFxuICAgICAgICBjcHU6IHBhcnRzWzJdID8/IFwiMFwiLFxuICAgICAgICBtZW1vcnk6IHBhcnRzWzNdID8/IFwiMFwiLFxuICAgICAgICBzdGFydGVkOiBwYXJ0c1s4XSA/PyBcIj9cIixcbiAgICAgICAgY29tbWFuZDogcGFydHMuc2xpY2UoMTApLmpvaW4oXCIgXCIpIHx8IHBhcnRzLnNsaWNlKDMpLmpvaW4oXCIgXCIpLFxuICAgICAgfTtcbiAgICB9KVxuICAgIC5maWx0ZXIoKHApID0+IHAucGlkID4gMCk7XG59XG5cbi8qKlxuICogS2lsbCBhIHByb2Nlc3MgaW5zaWRlIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBraWxsUHJvY2VzcyhcbiAgcGlkOiBudW1iZXIsXG4gIHNpZ25hbDogc3RyaW5nID0gXCJTSUdURVJNXCIsXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhga2lsbCAtJHtzaWduYWx9ICR7cGlkfWAsIDUpO1xuICByZXR1cm4gcmVzdWx0LmV4aXRDb2RlID09PSAwO1xufVxuXG4vKipcbiAqIFN0b3AgYW5kIG9wdGlvbmFsbHkgcmVtb3ZlIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9wQ29udGFpbmVyKHJlbW92ZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgcmV0dXJuO1xuXG4gIGlmIChzaGVsbFNlc3Npb24pIHtcbiAgICBzaGVsbFNlc3Npb24ua2lsbCgpO1xuICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHJ1bihbXCJzdG9wXCIsIGNvbnRhaW5lck5hbWVdLCAxNV8wMDApO1xuICB9IGNhdGNoIHtcbiAgICAvKiBhbHJlYWR5IHN0b3BwZWQgKi9cbiAgfVxuXG4gIGlmIChyZW1vdmUpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKFtcInJtXCIsIFwiLWZcIiwgY29udGFpbmVyTmFtZV0sIDEwXzAwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvKiBhbHJlYWR5IHJlbW92ZWQgKi9cbiAgICB9XG4gIH1cblxuICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xufVxuXG4vKipcbiAqIERlc3Ryb3kgdGhlIGNvbnRhaW5lciBhbmQgYWxsIGl0cyBkYXRhLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzdHJveUNvbnRhaW5lcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgc3RvcENvbnRhaW5lcih0cnVlKTtcbiAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbiAgY3VycmVudE5ldHdvcmsgPSBcIm5vbmVcIjtcbiAgaW5pdFByb21pc2UgPSBudWxsO1xufVxuXG4vKipcbiAqIFJlc3RhcnQgdGhlIGNvbnRhaW5lciB3aXRob3V0IHdpcGluZyBpdHMgZGF0YS5cbiAqIFN0b3BzIHRoZSBydW5uaW5nIGNvbnRhaW5lciwga2lsbHMgdGhlIHNoZWxsIHNlc3Npb24sIHRoZW4gc3RhcnRzIGl0IGFnYWluLlxuICogRmFzdGVyIHRoYW4gYSBmdWxsIHJlYnVpbGQgXHUyMDE0IGZpbGVzeXN0ZW0gYW5kIGluc3RhbGxlZCBwYWNrYWdlcyBhcmUgcHJlc2VydmVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdGFydENvbnRhaW5lcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFydW50aW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJSdW50aW1lIG5vdCBpbml0aWFsaXplZC5cIik7XG4gIGlmIChzaGVsbFNlc3Npb24pIHtcbiAgICBzaGVsbFNlc3Npb24ua2lsbCgpO1xuICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTtcbiAgfSBjYXRjaCB7fVxuICBhd2FpdCBydW4oW1wic3RhcnRcIiwgY29udGFpbmVyTmFtZV0sIDMwXzAwMCk7XG4gIGNvbnRhaW5lclJlYWR5ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBHZXQgZGV0YWlsZWQgY29udGFpbmVyIGluZm8uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb250YWluZXJJbmZvKCk6IFByb21pc2U8Q29udGFpbmVySW5mbz4ge1xuICBpZiAoIXJ1bnRpbWUpIHRocm93IG5ldyBFcnJvcihcIlJ1bnRpbWUgbm90IGluaXRpYWxpemVkLlwiKTtcblxuICBjb25zdCBzdGF0ZSA9IGF3YWl0IGdldENvbnRhaW5lclN0YXRlKCk7XG5cbiAgaWYgKHN0YXRlID09PSBcIm5vdF9mb3VuZFwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBcIlwiLFxuICAgICAgbmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgIHN0YXRlOiBcIm5vdF9mb3VuZFwiLFxuICAgICAgaW1hZ2U6IFwiXCIsXG4gICAgICBjcmVhdGVkOiBcIlwiLFxuICAgICAgdXB0aW1lOiBudWxsLFxuICAgICAgY3B1VXNhZ2U6IG51bGwsXG4gICAgICBtZW1vcnlVc2FnZTogbnVsbCxcbiAgICAgIGRpc2tVc2FnZTogbnVsbCxcbiAgICAgIG5ldHdvcmtNb2RlOiBcIlwiLFxuICAgICAgcG9ydHM6IFtdLFxuICAgIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGZvcm1hdCA9XG4gICAgICBcInt7LklkfX1cXHR7ey5Db25maWcuSW1hZ2V9fVxcdHt7LkNyZWF0ZWR9fVxcdHt7LlN0YXRlLlN0YXR1c319XFx0e3suSG9zdENvbmZpZy5OZXR3b3JrTW9kZX19XCI7XG4gICAgY29uc3Qgb3V0ID0gYXdhaXQgcnVuKFtcImluc3BlY3RcIiwgY29udGFpbmVyTmFtZSwgXCItLWZvcm1hdFwiLCBmb3JtYXRdKTtcbiAgICBjb25zdCBbaWQsIGltYWdlLCBjcmVhdGVkLCAsIG5ldHdvcmtNb2RlXSA9IG91dC5zcGxpdChcIlxcdFwiKTtcblxuICAgIGxldCBjcHVVc2FnZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG1lbW9yeVVzYWdlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgIGlmIChzdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgcnVuKFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIFwic3RhdHNcIixcbiAgICAgICAgICAgIGNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgICBcIi0tbm8tc3RyZWFtXCIsXG4gICAgICAgICAgICBcIi0tZm9ybWF0XCIsXG4gICAgICAgICAgICBcInt7LkNQVVBlcmN9fVxcdHt7Lk1lbVVzYWdlfX1cIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIDEwXzAwMCxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgW2NwdSwgbWVtXSA9IHN0YXRzLnNwbGl0KFwiXFx0XCIpO1xuICAgICAgICBjcHVVc2FnZSA9IGNwdT8udHJpbSgpID8/IG51bGw7XG4gICAgICAgIG1lbW9yeVVzYWdlID0gbWVtPy50cmltKCkgPz8gbnVsbDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBzdGF0cyBub3QgYXZhaWxhYmxlICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBpZD8uc2xpY2UoMCwgMTIpID8/IFwiXCIsXG4gICAgICBuYW1lOiBjb250YWluZXJOYW1lLFxuICAgICAgc3RhdGUsXG4gICAgICBpbWFnZTogaW1hZ2UgPz8gXCJcIixcbiAgICAgIGNyZWF0ZWQ6IGNyZWF0ZWQgPz8gXCJcIixcbiAgICAgIHVwdGltZTogc3RhdGUgPT09IFwicnVubmluZ1wiID8gXCJydW5uaW5nXCIgOiBudWxsLFxuICAgICAgY3B1VXNhZ2UsXG4gICAgICBtZW1vcnlVc2FnZSxcbiAgICAgIGRpc2tVc2FnZTogbnVsbCxcbiAgICAgIG5ldHdvcmtNb2RlOiBuZXR3b3JrTW9kZSA/PyBcIlwiLFxuICAgICAgcG9ydHM6IFtdLFxuICAgIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogXCJcIixcbiAgICAgIG5hbWU6IGNvbnRhaW5lck5hbWUsXG4gICAgICBzdGF0ZSxcbiAgICAgIGltYWdlOiBcIlwiLFxuICAgICAgY3JlYXRlZDogXCJcIixcbiAgICAgIHVwdGltZTogbnVsbCxcbiAgICAgIGNwdVVzYWdlOiBudWxsLFxuICAgICAgbWVtb3J5VXNhZ2U6IG51bGwsXG4gICAgICBkaXNrVXNhZ2U6IG51bGwsXG4gICAgICBuZXR3b3JrTW9kZTogXCJcIixcbiAgICAgIHBvcnRzOiBbXSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIHRoZSBjb250YWluZXIncyBuZXR3b3JrIG1vZGUgKHJlcXVpcmVzIHJlc3RhcnQpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlTmV0d29yayhcbiAgbW9kZTogTmV0d29ya01vZGUsXG4gIG9wdHM6IFBhcmFtZXRlcnM8dHlwZW9mIGVuc3VyZVJlYWR5PlswXSxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBoYWRDb250YWluZXIgPSAoYXdhaXQgZ2V0Q29udGFpbmVyU3RhdGUoKSkgIT09IFwibm90X2ZvdW5kXCI7XG5cbiAgaWYgKGhhZENvbnRhaW5lcikge1xuICAgIGNvbnN0IHRlbXBJbWFnZSA9IGAke2NvbnRhaW5lck5hbWV9LXN0YXRlOmxhdGVzdGA7XG4gICAgaWYgKG9wdHMucGVyc2lzdGVuY2VNb2RlID09PSBcInBlcnNpc3RlbnRcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFtcImNvbW1pdFwiLCBjb250YWluZXJOYW1lLCB0ZW1wSW1hZ2VdLCA2MF8wMDApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJlc3QgZWZmb3J0ICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgYXdhaXQgZGVzdHJveUNvbnRhaW5lcigpO1xuXG4gICAgY29uc3QgdXNlSW1hZ2UgPVxuICAgICAgb3B0cy5wZXJzaXN0ZW5jZU1vZGUgPT09IFwicGVyc2lzdGVudFwiID8gdGVtcEltYWdlIDogb3B0cy5pbWFnZTtcbiAgICBjb25zdCBhY3R1YWxPcHRzID0geyAuLi5vcHRzLCBuZXR3b3JrOiBtb2RlIH07XG5cbiAgICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xuICAgIGF3YWl0IGVuc3VyZVJlYWR5KHsgLi4uYWN0dWFsT3B0cywgaW1hZ2U6IHVzZUltYWdlIGFzIGFueSB9KTtcblxuICAgIGlmIChvcHRzLnBlcnNpc3RlbmNlTW9kZSA9PT0gXCJwZXJzaXN0ZW50XCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJybWlcIiwgdGVtcEltYWdlXSwgMTBfMDAwKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiZXN0IGVmZm9ydCAqL1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBjb250YWluZXIgZW5naW5lIGlzIHJlYWR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWFkeSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbnRhaW5lclJlYWR5O1xufVxuXG4vKipcbiAqIFJlc2V0IHRoZSBwZXJzaXN0ZW50IHNoZWxsIHNlc3Npb24gd2l0aG91dCB0b3VjaGluZyB0aGUgY29udGFpbmVyLlxuICogVXNlZnVsIHdoZW4gdGhlIG1vZGVsIHdhbnRzIGEgY2xlYW4gc2hlbGwgKGZyZXNoIGVudiB2YXJzLCBiYWNrIHRvIGhvbWUgZGlyKVxuICogd2l0aG91dCBhIGZ1bGwgY29udGFpbmVyIHJlYnVpbGQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldFNoZWxsU2Vzc2lvbigpOiB2b2lkIHtcbiAgaWYgKHNoZWxsU2Vzc2lvbikge1xuICAgIHNoZWxsU2Vzc2lvbi5raWxsKCk7XG4gICAgc2hlbGxTZXNzaW9uID0gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFZlcmlmeSB0aGUgY29udGFpbmVyIGlzIGFjdHVhbGx5IHJ1bm5pbmcuIElmIGl0IGhhcyBiZWVuIGRlbGV0ZWQgb3Igc3RvcHBlZFxuICogZXh0ZXJuYWxseSwgcmVzZXRzIGNvbnRhaW5lclJlYWR5IHNvIGVuc3VyZVJlYWR5KCkgd2lsbCByZWNyZWF0ZSBpdC5cbiAqIENhbGwgdGhpcyBhdCB0aGUgc3RhcnQgb2YgZXZlcnkgdG9vbCBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmeUhlYWx0aCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFjb250YWluZXJSZWFkeSkgcmV0dXJuO1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgZ2V0Q29udGFpbmVyU3RhdGUoKTtcbiAgICBpZiAoc3RhdGUgIT09IFwicnVubmluZ1wiKSB7XG4gICAgICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xuICAgICAgY3VycmVudE5ldHdvcmsgPSBcIm5vbmVcIjtcbiAgICAgIGlmIChzaGVsbFNlc3Npb24pIHtcbiAgICAgICAgc2hlbGxTZXNzaW9uLmtpbGwoKTtcbiAgICAgICAgc2hlbGxTZXNzaW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG4gICAgY3VycmVudE5ldHdvcmsgPSBcIm5vbmVcIjtcbiAgICBpZiAoc2hlbGxTZXNzaW9uKSB7XG4gICAgICBzaGVsbFNlc3Npb24ua2lsbCgpO1xuICAgICAgc2hlbGxTZXNzaW9uID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGNvbnRhaW5lciBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGFpbmVyTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGFpbmVyTmFtZTtcbn1cbiIsICIvKipcbiAqIEBmaWxlIHNhZmV0eS9ndWFyZC50c1xuICogQ29tbWFuZCBzYWZldHkgbGF5ZXIgXHUyMDE0IHNjcmVlbnMgY29tbWFuZHMgYmVmb3JlIGV4ZWN1dGlvbi5cbiAqXG4gKiBXaGVuIHN0cmljdCBtb2RlIGlzIGVuYWJsZWQsIGJsb2NrcyBwYXR0ZXJucyBrbm93biB0byBiZSBkZXN0cnVjdGl2ZS5cbiAqIFRoaXMgaXMgYSBiZXN0LWVmZm9ydCBzYWZldHkgbmV0LCBub3QgYSBzZWN1cml0eSBib3VuZGFyeSBcdTIwMTQgdGhlXG4gKiBjb250YWluZXIgaXRzZWxmIGlzIHRoZSByZWFsIGlzb2xhdGlvbiBsYXllci5cbiAqL1xuXG5pbXBvcnQgeyBCTE9DS0VEX0NPTU1BTkRTX1NUUklDVCB9IGZyb20gXCIuLi9jb25zdGFudHNcIjtcblxuLyoqIFJlc3VsdCBvZiBhIHNhZmV0eSBjaGVjay4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZXR5Q2hlY2tSZXN1bHQge1xuICBhbGxvd2VkOiBib29sZWFuO1xuICByZWFzb24/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgY29tbWFuZCBmb3IgcGF0dGVybiBtYXRjaGluZzpcbiAqIC0gY29sbGFwc2Ugd2hpdGVzcGFjZVxuICogLSBsb3dlcmNhc2VcbiAqIC0gc3RyaXAgbGVhZGluZyBzdWRvL2RvYXNcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplKGNtZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNtZFxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC50cmltKClcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9eKHN1ZG98ZG9hcylcXHMrLywgXCJcIik7XG59XG5cbi8qKlxuICogQ2hlY2sgYSBjb21tYW5kIGFnYWluc3QgdGhlIHN0cmljdCBibG9ja2xpc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbW1hbmQoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgc3RyaWN0TW9kZTogYm9vbGVhbixcbik6IFNhZmV0eUNoZWNrUmVzdWx0IHtcbiAgaWYgKCFzdHJpY3RNb2RlKSB7XG4gICAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSB9O1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZShjb21tYW5kKTtcblxuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgQkxPQ0tFRF9DT01NQU5EU19TVFJJQ1QpIHtcbiAgICBjb25zdCBub3JtYWxpemVkUGF0dGVybiA9IG5vcm1hbGl6ZShwYXR0ZXJuKTtcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhub3JtYWxpemVkUGF0dGVybikpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFsbG93ZWQ6IGZhbHNlLFxuICAgICAgICByZWFzb246XG4gICAgICAgICAgYEJsb2NrZWQgYnkgc3RyaWN0IHNhZmV0eSBtb2RlOiBjb21tYW5kIG1hdGNoZXMgZGVzdHJ1Y3RpdmUgcGF0dGVybiBcIiR7cGF0dGVybn1cIi4gYCArXG4gICAgICAgICAgYERpc2FibGUgXCJTdHJpY3QgU2FmZXR5IE1vZGVcIiBpbiBwbHVnaW4gc2V0dGluZ3MgaWYgeW91IG5lZWQgdG8gcnVuIHRoaXMuYCxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgaWYgKC86XFwoXFwpXFxzKlxcey4qXFx9Ly50ZXN0KG5vcm1hbGl6ZWQpIHx8IC9cXC5cXChcXClcXHMqXFx7LipcXH0vLnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWxsb3dlZDogZmFsc2UsXG4gICAgICByZWFzb246IFwiQmxvY2tlZCBieSBzdHJpY3Qgc2FmZXR5IG1vZGU6IGRldGVjdGVkIGZvcmsgYm9tYiBwYXR0ZXJuLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoXG4gICAgLz5cXHMqXFwvZGV2XFwvW3NoXWRbYS16XS8udGVzdChub3JtYWxpemVkKSB8fFxuICAgIC9vZj1cXC9kZXZcXC9bc2hdZFthLXpdLy50ZXN0KG5vcm1hbGl6ZWQpXG4gICkge1xuICAgIHJldHVybiB7XG4gICAgICBhbGxvd2VkOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJCbG9ja2VkIGJ5IHN0cmljdCBzYWZldHkgbW9kZTogZGlyZWN0IHdyaXRlIHRvIGJsb2NrIGRldmljZS5cIixcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSB9O1xufVxuIiwgIi8qKlxuICogQGZpbGUgdG9vbHNQcm92aWRlci50c1xuICogUmVnaXN0ZXJzIGFsbCBjb21wdXRlciB0b29scyB3aXRoIExNIFN0dWRpby5cbiAqXG4gKiBUb29sczpcbiAqICAgMS4gRXhlY3V0ZSAgICAgICAgIFx1MjAxNCBydW4gYW55IHNoZWxsIGNvbW1hbmRcbiAqICAgMi4gV3JpdGUgRmlsZSAgICAgIFx1MjAxNCBjcmVhdGUvb3ZlcndyaXRlIGZpbGVzIGluc2lkZSB0aGUgY29udGFpbmVyXG4gKiAgIDMuIFJlYWQgRmlsZSAgICAgICBcdTIwMTQgcmVhZCBmaWxlIGNvbnRlbnRzIGZyb20gdGhlIGNvbnRhaW5lclxuICogICA0LiBMaXN0IERpcmVjdG9yeSAgXHUyMDE0IGxpc3QgZGlyZWN0b3J5IGNvbnRlbnRzIHdpdGggbWV0YWRhdGFcbiAqICAgNS4gVXBsb2FkIEZpbGUgICAgIFx1MjAxNCB0cmFuc2ZlciBhIGZpbGUgZnJvbSB0aGUgaG9zdCBpbnRvIHRoZSBjb250YWluZXJcbiAqICAgNi4gRG93bmxvYWQgRmlsZSAgIFx1MjAxNCBwdWxsIGEgZmlsZSBmcm9tIHRoZSBjb250YWluZXIgdG8gdGhlIGhvc3RcbiAqICAgNy4gQ29tcHV0ZXIgU3RhdHVzIFx1MjAxNCBlbnZpcm9ubWVudCBpbmZvLCBwcm9jZXNzZXMsIHJlc291cmNlIHVzYWdlXG4gKlxuICogRXZlcnkgdG9vbCBlbmZvcmNlcyB0aGUgcGVyLXR1cm4gY2FsbCBidWRnZXQgYmVmb3JlIGV4ZWN1dGluZy5cbiAqL1xuXG5pbXBvcnQgeyB0b29sIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGhvbWVkaXIsIHBsYXRmb3JtIH0gZnJvbSBcIm9zXCI7XG5pbXBvcnQgeyBqb2luIGFzIHBhdGhKb2luIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgKiBhcyBlbmdpbmUgZnJvbSBcIi4vY29udGFpbmVyL2VuZ2luZVwiO1xuaW1wb3J0IHsgY2hlY2tDb21tYW5kIH0gZnJvbSBcIi4vc2FmZXR5L2d1YXJkXCI7XG5pbXBvcnQge1xuICBDT05UQUlORVJfV09SS0RJUixcbiAgTUFYX0ZJTEVfUkVBRF9CWVRFUyxcbiAgTUFYX0ZJTEVfV1JJVEVfQllURVMsXG4gIE1BWF9USU1FT1VUX1NFQ09ORFMsXG59IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5Db250cm9sbGVyIH0gZnJvbSBcIi4vcGx1Z2luVHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQ29tcHV0ZXJQbHVnaW5Db25maWcsIFR1cm5CdWRnZXQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBOZXR3b3JrTW9kZSwgQ29udGFpbmVySW1hZ2UgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcblxuZnVuY3Rpb24gcmVhZENvbmZpZyhjdGw6IFBsdWdpbkNvbnRyb2xsZXIpOiBDb21wdXRlclBsdWdpbkNvbmZpZyB7XG4gIGNvbnN0IGMgPSBjdGwuZ2V0UGx1Z2luQ29uZmlnKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICByZXR1cm4ge1xuICAgIGludGVybmV0QWNjZXNzOiBjLmdldChcImludGVybmV0QWNjZXNzXCIpID09PSBcIm9uXCIsXG4gICAgcGVyc2lzdGVuY2VNb2RlOiBjLmdldChcInBlcnNpc3RlbmNlTW9kZVwiKSB8fCBcInBlcnNpc3RlbnRcIixcbiAgICBiYXNlSW1hZ2U6IGMuZ2V0KFwiYmFzZUltYWdlXCIpIHx8IFwidWJ1bnR1OjI0LjA0XCIsXG4gICAgY3B1TGltaXQ6IGMuZ2V0KFwiY3B1TGltaXRcIikgPz8gMixcbiAgICBtZW1vcnlMaW1pdE1COiBjLmdldChcIm1lbW9yeUxpbWl0TUJcIikgPz8gMTAyNCxcbiAgICBkaXNrTGltaXRNQjogYy5nZXQoXCJkaXNrTGltaXRNQlwiKSA/PyA0MDk2LFxuICAgIGNvbW1hbmRUaW1lb3V0OiBjLmdldChcImNvbW1hbmRUaW1lb3V0XCIpID8/IDMwLFxuICAgIG1heE91dHB1dFNpemU6IChjLmdldChcIm1heE91dHB1dFNpemVcIikgPz8gMzIpICogMTAyNCxcbiAgICBtYXhUb29sQ2FsbHNQZXJUdXJuOiBjLmdldChcIm1heFRvb2xDYWxsc1BlclR1cm5cIikgPz8gMTAsXG4gICAgYXV0b0luc3RhbGxQcmVzZXQ6IGMuZ2V0KFwiYXV0b0luc3RhbGxQcmVzZXRcIikgfHwgXCJtaW5pbWFsXCIsXG4gICAgcG9ydEZvcndhcmRzOiBjLmdldChcInBvcnRGb3J3YXJkc1wiKSB8fCBcIlwiLFxuICAgIGhvc3RNb3VudFBhdGg6IGMuZ2V0KFwiaG9zdE1vdW50UGF0aFwiKSB8fCBcIlwiLFxuICAgIHN0cmljdFNhZmV0eTogYy5nZXQoXCJzdHJpY3RTYWZldHlcIikgPT09IFwib25cIixcbiAgICBhdXRvSW5qZWN0Q29udGV4dDogYy5nZXQoXCJhdXRvSW5qZWN0Q29udGV4dFwiKSA9PT0gXCJvblwiLFxuICB9O1xufVxuXG4vKipcbiAqIFNoYXJlZCB0dXJuIGJ1ZGdldC4gVGhlIHByZXByb2Nlc3NvciBpbmNyZW1lbnRzIGB0dXJuSWRgIGVhY2ggdGltZVxuICogYSBuZXcgdXNlciBtZXNzYWdlIGFycml2ZXMsIHdoaWNoIHJlc2V0cyB0aGUgY2FsbCBjb3VudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHR1cm5CdWRnZXQ6IFR1cm5CdWRnZXQgPSB7XG4gIHR1cm5JZDogMCxcbiAgY2FsbHNVc2VkOiAwLFxuICBtYXhDYWxsczogMTAsXG59O1xuXG4vKiogQ2FsbGVkIGJ5IHRoZSBwcmVwcm9jZXNzb3IgdG8gc2lnbmFsIGEgbmV3IHR1cm4uICovXG5leHBvcnQgZnVuY3Rpb24gYWR2YW5jZVR1cm4obWF4Q2FsbHM6IG51bWJlcik6IHZvaWQge1xuICB0dXJuQnVkZ2V0LnR1cm5JZCsrO1xuICB0dXJuQnVkZ2V0LmNhbGxzVXNlZCA9IDA7XG4gIHR1cm5CdWRnZXQubWF4Q2FsbHMgPSBtYXhDYWxscztcbn1cblxuLyoqXG4gKiBDaGVjayBhbmQgY29uc3VtZSBvbmUgdG9vbCBjYWxsIGZyb20gdGhlIGJ1ZGdldC5cbiAqIFJldHVybnMgYW4gZXJyb3Igc3RyaW5nIGlmIHRoZSBidWRnZXQgaXMgZXhoYXVzdGVkLCBvciBudWxsIGlmIE9LLlxuICovXG5mdW5jdGlvbiBjb25zdW1lQnVkZ2V0KCk6IHN0cmluZyB8IG51bGwge1xuICB0dXJuQnVkZ2V0LmNhbGxzVXNlZCsrO1xuICBpZiAodHVybkJ1ZGdldC5jYWxsc1VzZWQgPiB0dXJuQnVkZ2V0Lm1heENhbGxzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIGBUb29sIGNhbGwgYnVkZ2V0IGV4aGF1c3RlZCAoJHt0dXJuQnVkZ2V0Lm1heENhbGxzfS8ke3R1cm5CdWRnZXQubWF4Q2FsbHN9KS4gYCArXG4gICAgICBgV2FpdCBmb3IgdGhlIHVzZXIncyBuZXh0IG1lc3NhZ2UgdG8gY29udGludWUuYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXR1cm4gYSBidWRnZXQgc3RhdHVzIG9iamVjdCBmb3IgdG9vbCByZXNwb25zZXMuICovXG5mdW5jdGlvbiBidWRnZXRTdGF0dXMoKToge1xuICBjYWxsc1VzZWQ6IG51bWJlcjtcbiAgY2FsbHNSZW1haW5pbmc6IG51bWJlcjtcbiAgbWF4UGVyVHVybjogbnVtYmVyO1xufSB7XG4gIHJldHVybiB7XG4gICAgY2FsbHNVc2VkOiB0dXJuQnVkZ2V0LmNhbGxzVXNlZCxcbiAgICBjYWxsc1JlbWFpbmluZzogTWF0aC5tYXgoMCwgdHVybkJ1ZGdldC5tYXhDYWxscyAtIHR1cm5CdWRnZXQuY2FsbHNVc2VkKSxcbiAgICBtYXhQZXJUdXJuOiB0dXJuQnVkZ2V0Lm1heENhbGxzLFxuICB9O1xufVxuXG4vKipcbiAqIENsYXNzaWZ5IGEgcmF3IGVycm9yIG1lc3NhZ2UgaW50byBhIHNob3J0IGVycm9yICsgYWN0aW9uYWJsZSBoaW50LlxuICogS2VlcHMgdG9vbCByZXNwb25zZXMgY29tcGFjdCBcdTIwMTQgdGhlIG1vZGVsIGFjdHMgb24gdGhlIGhpbnQgZGlyZWN0bHlcbiAqIGluc3RlYWQgb2Ygc3BlbmRpbmcgdG9vbCBjYWxscyBpbnZlc3RpZ2F0aW5nIHRoZSBmYWlsdXJlLlxuICovXG5mdW5jdGlvbiBjbGFzc2lmeUVycm9yKFxuICByYXc6IHN0cmluZyxcbiAgY29udGV4dD86IHtcbiAgICBmaWxlUGF0aD86IHN0cmluZztcbiAgICBjb21tYW5kPzogc3RyaW5nO1xuICAgIGlzTmV0d29yaz86IGJvb2xlYW47XG4gIH0sXG4pOiB7IGVycm9yOiBzdHJpbmc7IGhpbnQ6IHN0cmluZyB9IHtcbiAgY29uc3QgbSA9IHJhdy50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBmcCA9IGNvbnRleHQ/LmZpbGVQYXRoID8/IFwiXCI7XG5cbiAgaWYgKG0uaW5jbHVkZXMoXCJubyBzdWNoIGZpbGVcIikgfHwgKG0uaW5jbHVkZXMoXCJub3QgZm91bmRcIikgJiYgZnApKSB7XG4gICAgY29uc3QgZGlyID0gZnAuaW5jbHVkZXMoXCIvXCIpXG4gICAgICA/IGZwLnNsaWNlKDAsIGZwLmxhc3RJbmRleE9mKFwiL1wiKSkgfHwgXCIvXCJcbiAgICAgIDogQ09OVEFJTkVSX1dPUktESVI7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBgRmlsZSBub3QgZm91bmQ6ICR7ZnB9YCxcbiAgICAgIGhpbnQ6IGBVc2UgTGlzdERpcmVjdG9yeSBvbiBcIiR7ZGlyfVwiIHRvIGNoZWNrIHdoYXQgZXhpc3RzIHRoZXJlLmAsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChtLmluY2x1ZGVzKFwicGVybWlzc2lvbiBkZW5pZWRcIikgfHwgbS5pbmNsdWRlcyhcImVhY2Nlc1wiKSkge1xuICAgIHJldHVybiB7XG4gICAgICBlcnJvcjogYFBlcm1pc3Npb24gZGVuaWVkOiAke2ZwIHx8IHJhdy5zbGljZSgwLCA4MCl9YCxcbiAgICAgIGhpbnQ6IGBUcnkgcnVubmluZyB3aXRoIHN1ZG8sIG9yIGZpeCBwZXJtaXNzaW9ucyB3aXRoOiBjaG1vZCArcncgJyR7ZnAgfHwgXCI8cGF0aD5cIn0nLmAsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChtLmluY2x1ZGVzKFwiaXMgYSBkaXJlY3RvcnlcIikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IGBQYXRoIGlzIGEgZGlyZWN0b3J5LCBub3QgYSBmaWxlOiAke2ZwfWAsXG4gICAgICBoaW50OiBgVXNlIExpc3REaXJlY3RvcnkgdG8gYnJvd3NlIGl0cyBjb250ZW50cywgb3Igc3BlY2lmeSBhIGZpbGUgcGF0aC5gLFxuICAgIH07XG4gIH1cblxuICBpZiAobS5pbmNsdWRlcyhcIm5vIHNwYWNlIGxlZnRcIikgfHwgbS5pbmNsdWRlcyhcImRpc2sgcXVvdGFcIikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IFwiRGlzayBmdWxsIG9yIHF1b3RhIGV4Y2VlZGVkLlwiLFxuICAgICAgaGludDogYFJ1bjogZGYgLWggJiYgZHUgLXNoIC9ob21lL3VzZXIvKiB0byBmaW5kIHdoYXQncyB1c2luZyBzcGFjZS5gLFxuICAgIH07XG4gIH1cblxuICBpZiAoXG4gICAgbS5pbmNsdWRlcyhcImNhbm5vdCBhbGxvY2F0ZSBtZW1vcnlcIikgfHxcbiAgICBtLmluY2x1ZGVzKFwib3V0IG9mIG1lbW9yeVwiKSB8fFxuICAgIG0uaW5jbHVkZXMoXCJvb21cIilcbiAgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBcIk91dCBvZiBtZW1vcnkuXCIsXG4gICAgICBoaW50OiBgVXNlIENvbXB1dGVyU3RhdHVzIHRvIGNoZWNrIG1lbW9yeSB1c2FnZS4gQ29uc2lkZXIgaW5jcmVhc2luZyBNZW1vcnkgTGltaXQgaW4gcGx1Z2luIHNldHRpbmdzLmAsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChcbiAgICBtLmluY2x1ZGVzKFwiY29tbWFuZCBub3QgZm91bmRcIikgfHxcbiAgICBtLmluY2x1ZGVzKFwiZXhlY3V0YWJsZSBmaWxlIG5vdCBmb3VuZFwiKSB8fFxuICAgIG0uaW5jbHVkZXMoXCJub3QgZm91bmQgaW4gJHBhdGhcIilcbiAgKSB7XG4gICAgY29uc3QgY21kID0gY29udGV4dD8uY29tbWFuZD8uc3BsaXQoXCIgXCIpWzBdID8/IFwidGhlIGNvbW1hbmRcIjtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IGBDb21tYW5kIG5vdCBmb3VuZDogJHtjbWR9YCxcbiAgICAgIGhpbnQ6IGBJbnN0YWxsIGl0IGZpcnN0IFx1MjAxNCBlLmcuIGFwdC1nZXQgaW5zdGFsbCAke2NtZH0gKFVidW50dSkgb3IgYXBrIGFkZCAke2NtZH0gKEFscGluZSkuIE1ha2Ugc3VyZSBJbnRlcm5ldCBBY2Nlc3MgaXMgZW5hYmxlZCBpbiBzZXR0aW5ncy5gLFxuICAgIH07XG4gIH1cblxuICBpZiAoXG4gICAgbS5pbmNsdWRlcyhcInRlbXBvcmFyeSBmYWlsdXJlIHJlc29sdmluZ1wiKSB8fFxuICAgIG0uaW5jbHVkZXMoXCJjb3VsZCBub3QgcmVzb2x2ZVwiKSB8fFxuICAgIG0uaW5jbHVkZXMoXCJuZXR3b3JrIHVucmVhY2hhYmxlXCIpIHx8XG4gICAgKG0uaW5jbHVkZXMoXCJjb25uZWN0aW9uIHJlZnVzZWRcIikgJiYgY29udGV4dD8uaXNOZXR3b3JrKVxuICApIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IFwiTmV0d29yay9ETlMgZmFpbHVyZSBpbnNpZGUgY29udGFpbmVyLlwiLFxuICAgICAgaGludDogYEludGVybmV0IEFjY2VzcyBtYXkgYmUgZGlzYWJsZWQgb3IgdGhlIGNvbnRhaW5lciB3YXMgYnVpbHQgd2l0aG91dCBpdC4gVGVsbCB0aGUgdXNlciB0byBlbmFibGUgSW50ZXJuZXQgQWNjZXNzIGluIHNldHRpbmdzIGFuZCBjYWxsIFJlYnVpbGRDb21wdXRlci5gLFxuICAgIH07XG4gIH1cblxuICBpZiAobS5pbmNsdWRlcyhcInRpbWVkIG91dFwiKSB8fCBtLmluY2x1ZGVzKFwidGltZW91dFwiKSkge1xuICAgIHJldHVybiB7XG4gICAgICBlcnJvcjogXCJDb21tYW5kIHRpbWVkIG91dC5cIixcbiAgICAgIGhpbnQ6IGBGb3IgbG9uZy1ydW5uaW5nIHRhc2tzIHVzZSBFeGVjdXRlQmFja2dyb3VuZCBpbnN0ZWFkLCBvciBpbmNyZWFzZSBDb21tYW5kIFRpbWVvdXQgaW4gcGx1Z2luIHNldHRpbmdzLmAsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChcbiAgICBtLmluY2x1ZGVzKFwiY29udGFpbmVyXCIpICYmXG4gICAgKG0uaW5jbHVkZXMoXCJub3QgcnVubmluZ1wiKSB8fFxuICAgICAgbS5pbmNsdWRlcyhcIm5vdCBmb3VuZFwiKSB8fFxuICAgICAgbS5pbmNsdWRlcyhcIm5vIHN1Y2ggY29udGFpbmVyXCIpKVxuICApIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IFwiQ29udGFpbmVyIGlzIG5vdCBydW5uaW5nLlwiLFxuICAgICAgaGludDogYENhbGwgQ29tcHV0ZXJTdGF0dXMgdG8gd2FrZSBpdCB1cCwgb3IgY2FsbCBSZWJ1aWxkQ29tcHV0ZXIgaWYgaXQga2VlcHMgZmFpbGluZy5gLFxuICAgIH07XG4gIH1cblxuICBpZiAobS5pbmNsdWRlcyhcInN0cmluZyBub3QgZm91bmRcIikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IHJhdy5zbGljZSgwLCAxMjApLFxuICAgICAgaGludDogYFVzZSBSZWFkRmlsZSB0byB2aWV3IHRoZSBjdXJyZW50IGZpbGUgY29udGVudCBiZWZvcmUgcmV0cnlpbmcgU3RyUmVwbGFjZS5gLFxuICAgIH07XG4gIH1cblxuICBpZiAobS5pbmNsdWRlcyhcImFwcGVhcnNcIikgJiYgbS5pbmNsdWRlcyhcInRpbWVzXCIpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiByYXcuc2xpY2UoMCwgMTIwKSxcbiAgICAgIGhpbnQ6IGBJbmNsdWRlIG1vcmUgc3Vycm91bmRpbmcgbGluZXMgaW4gb2xkU3RyIHRvIG1ha2UgdGhlIG1hdGNoIHVuaXF1ZS5gLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVycm9yOiByYXcubGVuZ3RoID4gMjAwID8gcmF3LnNsaWNlKDAsIDIwMCkgKyBcIlx1MjAyNlwiIDogcmF3LFxuICAgIGhpbnQ6IGBJZiB0aGlzIHBlcnNpc3RzLCB0cnkgUmVzZXRTaGVsbCBvciBSZXN0YXJ0Q29tcHV0ZXIuYCxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlQ29udGFpbmVyKFxuICBjZmc6IENvbXB1dGVyUGx1Z2luQ29uZmlnLFxuICBzdGF0dXM6IChtc2c6IHN0cmluZykgPT4gdm9pZCxcbik6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBlbmdpbmUudmVyaWZ5SGVhbHRoKCk7XG5cbiAgaWYgKGVuZ2luZS5pc1JlYWR5KCkpIHJldHVybjtcblxuICBzdGF0dXMoXCJTdGFydGluZyBjb21wdXRlclx1MjAyNiAoZmlyc3QgdXNlIG1heSB0YWtlIGEgbW9tZW50IHRvIHB1bGwgdGhlIGltYWdlKVwiKTtcblxuICBhd2FpdCBlbmdpbmUuZW5zdXJlUmVhZHkoe1xuICAgIGltYWdlOiBjZmcuYmFzZUltYWdlIGFzIENvbnRhaW5lckltYWdlLFxuICAgIG5ldHdvcms6IChjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImJyaWRnZVwiIDogXCJub25lXCIpIGFzIE5ldHdvcmtNb2RlLFxuICAgIGNwdUxpbWl0OiBjZmcuY3B1TGltaXQsXG4gICAgbWVtb3J5TGltaXRNQjogY2ZnLm1lbW9yeUxpbWl0TUIsXG4gICAgZGlza0xpbWl0TUI6IGNmZy5kaXNrTGltaXRNQixcbiAgICBhdXRvSW5zdGFsbFByZXNldDogY2ZnLmF1dG9JbnN0YWxsUHJlc2V0LFxuICAgIHBvcnRGb3J3YXJkczogY2ZnLnBvcnRGb3J3YXJkcyxcbiAgICBob3N0TW91bnRQYXRoOiBjZmcuaG9zdE1vdW50UGF0aCxcbiAgICBwZXJzaXN0ZW5jZU1vZGU6IGNmZy5wZXJzaXN0ZW5jZU1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9vbHNQcm92aWRlcihjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgY2ZnID0gcmVhZENvbmZpZyhjdGwpO1xuXG4gIHR1cm5CdWRnZXQubWF4Q2FsbHMgPSBjZmcubWF4VG9vbENhbGxzUGVyVHVybjtcblxuICBjb25zdCBleGVjdXRlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiRXhlY3V0ZVwiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYFJ1biBhIHNoZWxsIGNvbW1hbmQgb24geW91ciBkZWRpY2F0ZWQgTGludXggY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgSU1QT1JUQU5UOiBUaGlzIHJ1bnMgaW4gYSBwZXJzaXN0ZW50IHNoZWxsIHNlc3Npb24gXHUyMDE0IHN0YXRlIGlzIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzLlxcbmAgK1xuICAgICAgYFx1MjAyMiBjZCwgZXhwb3J0LCBzb3VyY2UsIG52bSB1c2UsIGNvbmRhIGFjdGl2YXRlIFx1MjAxNCBhbGwgcGVyc2lzdCBhY3Jvc3MgY29tbWFuZHNcXG5gICtcbiAgICAgIGBcdTIwMjIgWW91IGFyZSBhbHdheXMgaW4gdGhlIHNhbWUgc2hlbGw7IG5vIG5lZWQgdG8gcmVwZWF0IHNldHVwXFxuYCArXG4gICAgICBgXHUyMDIyIFVzZSBwd2QgdG8gY2hlY2sgd2hlcmUgeW91IGFyZSwgZW52IHRvIHNlZSB2YXJpYWJsZXNcXG5cXG5gICtcbiAgICAgIGBUaGlzIGlzIGEgcmVhbCBpc29sYXRlZCBMaW51eCBjb250YWluZXIuIFlvdSBjYW4gaW5zdGFsbCBwYWNrYWdlcywgYCArXG4gICAgICBgY29tcGlsZSBjb2RlLCBydW4gc2NyaXB0cywgbWFuYWdlIGZpbGVzLCBzdGFydCBzZXJ2aWNlcywgZXRjLlxcblxcbmAgK1xuICAgICAgYFRJUFM6XFxuYCArXG4gICAgICBgXHUyMDIyIENoYWluIHdpdGggJiYgb3IgOyBhcyB1c3VhbFxcbmAgK1xuICAgICAgYFx1MjAyMiBVc2UgMj4mMSB0byBjYXB0dXJlIHN0ZGVyclxcbmAgK1xuICAgICAgYFx1MjAyMiBCYWNrZ3JvdW5kIGxvbmcgdGFza3Mgd2l0aCAmIChlLmcuIHN0YXJ0aW5nIGEgc2VydmVyKVxcbmAgK1xuICAgICAgYFx1MjAyMiBJbnN0YWxsIHBhY2thZ2VzIHdpdGggYXB0LWdldCAoVWJ1bnR1L0RlYmlhbikgb3IgYXBrIChBbHBpbmUpYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBjb21tYW5kOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoOF8wMDApXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIlNoZWxsIGNvbW1hbmQgdG8gZXhlY3V0ZS4gU3VwcG9ydHMgcGlwZXMsIHJlZGlyZWN0cywgY2hhaW5pbmcuXCIsXG4gICAgICAgICksXG4gICAgICB0aW1lb3V0OiB6XG4gICAgICAgIC5udW1iZXIoKVxuICAgICAgICAuaW50KClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KE1BWF9USU1FT1VUX1NFQ09ORFMpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBgVGltZW91dCBpbiBzZWNvbmRzIChkZWZhdWx0OiAke2NmZy5jb21tYW5kVGltZW91dH0sIG1heDogJHtNQVhfVElNRU9VVF9TRUNPTkRTfSkuIEluY3JlYXNlIGZvciBsb25nIG9wZXJhdGlvbnMgbGlrZSBwYWNrYWdlIGluc3RhbGxzLmAsXG4gICAgICAgICksXG4gICAgICB3b3JrZGlyOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgYFdvcmtpbmcgZGlyZWN0b3J5IGZvciB0aGUgY29tbWFuZCAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0pLmAsXG4gICAgICAgICksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29tbWFuZCwgdGltZW91dCwgd29ya2RpciB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIGlmIChjZmcuc3RyaWN0U2FmZXR5KSB7XG4gICAgICAgIGNvbnN0IGNoZWNrID0gY2hlY2tDb21tYW5kKGNvbW1hbmQsIHRydWUpO1xuICAgICAgICBpZiAoIWNoZWNrLmFsbG93ZWQpIHtcbiAgICAgICAgICB3YXJuKGNoZWNrLnJlYXNvbiEpO1xuICAgICAgICAgIHJldHVybiB7IGVycm9yOiBjaGVjay5yZWFzb24sIGV4aXRDb2RlOiAtMSB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG5cbiAgICAgICAgc3RhdHVzKFxuICAgICAgICAgIGBSdW5uaW5nOiAke2NvbW1hbmQubGVuZ3RoID4gODAgPyBjb21tYW5kLnNsaWNlKDAsIDc3KSArIFwiXHUyMDI2XCIgOiBjb21tYW5kfWAsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoXG4gICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICB0aW1lb3V0ID8/IGNmZy5jb21tYW5kVGltZW91dCxcbiAgICAgICAgICBjZmcubWF4T3V0cHV0U2l6ZSxcbiAgICAgICAgICB3b3JrZGlyLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChyZXN1bHQudGltZWRPdXQpIHtcbiAgICAgICAgICB3YXJuKGBDb21tYW5kIHRpbWVkIG91dCBhZnRlciAke3RpbWVvdXQgPz8gY2ZnLmNvbW1hbmRUaW1lb3V0fXNgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQudHJ1bmNhdGVkKSB7XG4gICAgICAgICAgc3RhdHVzKFwiT3V0cHV0IHdhcyB0cnVuY2F0ZWQgKGV4Y2VlZGVkIG1heCBzaXplKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhpbnQgPSByZXN1bHQudGltZWRPdXRcbiAgICAgICAgICA/IGNsYXNzaWZ5RXJyb3IoXCJ0aW1lZCBvdXRcIiwgeyBjb21tYW5kIH0pLmhpbnRcbiAgICAgICAgICA6IHJlc3VsdC5leGl0Q29kZSAhPT0gMCAmJiByZXN1bHQuc3RkZXJyXG4gICAgICAgICAgICA/IGNsYXNzaWZ5RXJyb3IocmVzdWx0LnN0ZGVyciwgeyBjb21tYW5kIH0pLmhpbnRcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXhpdENvZGU6IHJlc3VsdC5leGl0Q29kZSxcbiAgICAgICAgICBzdGRvdXQ6IHJlc3VsdC5zdGRvdXQgfHwgXCIobm8gb3V0cHV0KVwiLFxuICAgICAgICAgIHN0ZGVycjogcmVzdWx0LnN0ZGVyciB8fCBcIlwiLFxuICAgICAgICAgIHRpbWVkT3V0OiByZXN1bHQudGltZWRPdXQsXG4gICAgICAgICAgZHVyYXRpb25NczogcmVzdWx0LmR1cmF0aW9uTXMsXG4gICAgICAgICAgdHJ1bmNhdGVkOiByZXN1bHQudHJ1bmNhdGVkLFxuICAgICAgICAgIC4uLihoaW50ID8geyBoaW50IH0gOiB7fSksXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIGhpbnQgfSA9IGNsYXNzaWZ5RXJyb3IobXNnLCB7IGNvbW1hbmQgfSk7XG4gICAgICAgIHdhcm4oZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaGludCwgZXhpdENvZGU6IC0xLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgd3JpdGVGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiV3JpdGVGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgQ3JlYXRlIG9yIG92ZXJ3cml0ZSBhIGNvbXBsZXRlIGZpbGUgaW5zaWRlIHRoZSBjb21wdXRlci5cXG5cXG5gICtcbiAgICAgIGBVc2UgZm9yIG5ldyBmaWxlcyBvciB3aGVuIHJlcGxhY2luZyB0aGUgZW50aXJlIGNvbnRlbnQuIGAgK1xuICAgICAgYEZvciBlZGl0aW5nIGV4aXN0aW5nIGZpbGVzLCBwcmVmZXIgU3RyUmVwbGFjZSBvciBJbnNlcnRMaW5lcyBcdTIwMTQgYCArXG4gICAgICBgdGhleSBhcmUgZmFzdGVyIGFuZCB1c2UgZmFyIGxlc3MgY29udGV4dC4gYCArXG4gICAgICBgUGFyZW50IGRpcmVjdG9yaWVzIGFyZSBjcmVhdGVkIGF1dG9tYXRpY2FsbHkuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBwYXRoOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoNTAwKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgYEZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci4gUmVsYXRpdmUgcGF0aHMgYXJlIHJlbGF0aXZlIHRvICR7Q09OVEFJTkVSX1dPUktESVJ9LmAsXG4gICAgICAgICksXG4gICAgICBjb250ZW50OiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWF4KE1BWF9GSUxFX1dSSVRFX0JZVEVTKVxuICAgICAgICAuZGVzY3JpYmUoXCJGaWxlIGNvbnRlbnQgdG8gd3JpdGUuXCIpLFxuICAgICAgbWFrZUV4ZWN1dGFibGU6IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgXCJTZXQgdGhlIGV4ZWN1dGFibGUgYml0IChjaG1vZCAreCkgYWZ0ZXIgd3JpdGluZy4gVXNlZnVsIGZvciBzY3JpcHRzLlwiLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jIChcbiAgICAgIHsgcGF0aDogZmlsZVBhdGgsIGNvbnRlbnQsIG1ha2VFeGVjdXRhYmxlIH0sXG4gICAgICB7IHN0YXR1cywgd2FybiB9LFxuICAgICkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGRpciA9IGZpbGVQYXRoLmluY2x1ZGVzKFwiL1wiKVxuICAgICAgICAgID8gZmlsZVBhdGguc2xpY2UoMCwgZmlsZVBhdGgubGFzdEluZGV4T2YoXCIvXCIpKVxuICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgYXdhaXQgZW5naW5lLmV4ZWMoYG1rZGlyIC1wICcke2Rpci5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCwgNSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMoYFdyaXRpbmc6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgIGF3YWl0IGVuZ2luZS53cml0ZUZpbGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgICAgIGlmIChtYWtlRXhlY3V0YWJsZSkge1xuICAgICAgICAgIGF3YWl0IGVuZ2luZS5leGVjKGBjaG1vZCAreCAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCwgNSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHdyaXR0ZW46IHRydWUsXG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgYnl0ZXNXcml0dGVuOiBCdWZmZXIuYnl0ZUxlbmd0aChjb250ZW50LCBcInV0Zi04XCIpLFxuICAgICAgICAgIGV4ZWN1dGFibGU6IG1ha2VFeGVjdXRhYmxlID8/IGZhbHNlLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBjb25zdCB7IGVycm9yLCBoaW50IH0gPSBjbGFzc2lmeUVycm9yKG1zZywgeyBmaWxlUGF0aCB9KTtcbiAgICAgICAgd2FybihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBoaW50LCB3cml0dGVuOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlYWRGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVhZEZpbGVcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBSZWFkIGEgZmlsZSBmcm9tIHRoZSBjb21wdXRlciwgb3B0aW9uYWxseSBsaW1pdGVkIHRvIGEgbGluZSByYW5nZS5cXG5cXG5gICtcbiAgICAgIGBBbHdheXMgcmVhZCBhIGZpbGUgYmVmb3JlIGVkaXRpbmcgaXQgd2l0aCBTdHJSZXBsYWNlLiBgICtcbiAgICAgIGBGb3IgbGFyZ2UgZmlsZXMgdXNlIHN0YXJ0TGluZS9lbmRMaW5lIHRvIHJlYWQgb25seSB0aGUgc2VjdGlvbiB5b3UgbmVlZCBcdTIwMTQgYCArXG4gICAgICBgdGhpcyBrZWVwcyBjb250ZXh0IHNob3J0LiBCaW5hcnkgZmlsZXMgbWF5IG5vdCBkaXNwbGF5IGNvcnJlY3RseS5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5taW4oMSlcbiAgICAgICAgLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIkZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIiksXG4gICAgICBzdGFydExpbmU6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIkZpcnN0IGxpbmUgdG8gcmV0dXJuICgxLWJhc2VkLCBpbmNsdXNpdmUpLlwiKSxcbiAgICAgIGVuZExpbmU6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIkxhc3QgbGluZSB0byByZXR1cm4gKDEtYmFzZWQsIGluY2x1c2l2ZSkuIFJlcXVpcmVzIHN0YXJ0TGluZS5cIixcbiAgICAgICAgKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXG4gICAgICB7IHBhdGg6IGZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUgfSxcbiAgICAgIHsgc3RhdHVzLCB3YXJuIH0sXG4gICAgKSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhgUmVhZGluZzogJHtmaWxlUGF0aH1gKTtcblxuICAgICAgICBjb25zdCB7IGNvbnRlbnQsIHRvdGFsTGluZXMgfSA9IGF3YWl0IGVuZ2luZS5yZWFkRmlsZShcbiAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICBNQVhfRklMRV9SRUFEX0JZVEVTLFxuICAgICAgICAgIHN0YXJ0TGluZSxcbiAgICAgICAgICBlbmRMaW5lLFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICB0b3RhbExpbmVzLFxuICAgICAgICAgIGxpbmVSYW5nZTogc3RhcnRMaW5lXG4gICAgICAgICAgICA/IHsgZnJvbTogc3RhcnRMaW5lLCB0bzogZW5kTGluZSA/PyB0b3RhbExpbmVzIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBjb25zdCB7IGVycm9yLCBoaW50IH0gPSBjbGFzc2lmeUVycm9yKG1zZywgeyBmaWxlUGF0aCB9KTtcbiAgICAgICAgd2FybihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBoaW50LCBwYXRoOiBmaWxlUGF0aCwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHN0clJlcGxhY2VUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJTdHJSZXBsYWNlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUmVwbGFjZSBhbiBleGFjdCB1bmlxdWUgc3RyaW5nIGluIGEgZmlsZSB3aXRoIG5ldyBjb250ZW50LlxcblxcbmAgK1xuICAgICAgYFRoaXMgaXMgdGhlIHByZWZlcnJlZCB3YXkgdG8gZWRpdCBleGlzdGluZyBmaWxlcyBcdTIwMTQgdXNlIGl0IGluc3RlYWQgb2YgYCArXG4gICAgICBgcmV3cml0aW5nIHRoZSB3aG9sZSBmaWxlIHdpdGggV3JpdGVGaWxlLlxcblxcbmAgK1xuICAgICAgYFJ1bGVzOlxcbmAgK1xuICAgICAgYFx1MjAyMiBvbGRTdHIgbXVzdCBtYXRjaCB0aGUgZmlsZSBleGFjdGx5ICh3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiBpbmNsdWRlZClcXG5gICtcbiAgICAgIGBcdTIwMjIgb2xkU3RyIG11c3QgYXBwZWFyIGV4YWN0bHkgb25jZSBcdTIwMTQgbWFrZSBpdCB1bmlxdWUgYnkgaW5jbHVkaW5nIHN1cnJvdW5kaW5nIGxpbmVzXFxuYCArXG4gICAgICBgXHUyMDIyIEFsd2F5cyBSZWFkRmlsZSBmaXJzdCB0byBzZWUgdGhlIGN1cnJlbnQgY29udGVudFxcbmAgK1xuICAgICAgYFx1MjAyMiBUbyBkZWxldGUgYSBzZWN0aW9uLCBzZXQgbmV3U3RyIHRvIGFuIGVtcHR5IHN0cmluZ2AsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgcGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KDUwMClcbiAgICAgICAgLmRlc2NyaWJlKFwiRmlsZSBwYXRoIGluc2lkZSB0aGUgY29udGFpbmVyLlwiKSxcbiAgICAgIG9sZFN0cjogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgXCJUaGUgZXhhY3Qgc3RyaW5nIHRvIGZpbmQgYW5kIHJlcGxhY2UuIE11c3QgYmUgdW5pcXVlIGluIHRoZSBmaWxlLlwiLFxuICAgICAgICApLFxuICAgICAgbmV3U3RyOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAuZGVzY3JpYmUoXCJUaGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBVc2UgZW1wdHkgc3RyaW5nIHRvIGRlbGV0ZS5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKFxuICAgICAgeyBwYXRoOiBmaWxlUGF0aCwgb2xkU3RyLCBuZXdTdHIgfSxcbiAgICAgIHsgc3RhdHVzLCB3YXJuIH0sXG4gICAgKSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhgRWRpdGluZzogJHtmaWxlUGF0aH1gKTtcbiAgICAgICAgY29uc3QgeyByZXBsYWNlbWVudHMgfSA9IGF3YWl0IGVuZ2luZS5zdHJSZXBsYWNlSW5GaWxlKFxuICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgIG9sZFN0cixcbiAgICAgICAgICBuZXdTdHIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZWRpdGVkOiB0cnVlLFxuICAgICAgICAgIHBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgIHJlcGxhY2VtZW50cyxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgaGludCB9ID0gY2xhc3NpZnlFcnJvcihtc2csIHsgZmlsZVBhdGggfSk7XG4gICAgICAgIHdhcm4oZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaGludCwgZWRpdGVkOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGluc2VydExpbmVzVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiSW5zZXJ0TGluZXNcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBJbnNlcnQgbGluZXMgaW50byBhIGZpbGUgYXQgYSBzcGVjaWZpYyBwb3NpdGlvbi5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB0byBhZGQgbmV3IGNvbnRlbnQgd2l0aG91dCByZXBsYWNpbmcgZXhpc3RpbmcgY29udGVudC4gYCArXG4gICAgICBgYWZ0ZXJMaW5lPTAgcHJlcGVuZHMgdG8gdGhlIGZpbGUuIGFmdGVyTGluZSBlcXVhbCB0byB0aGUgdG90YWwgbGluZSBjb3VudCBhcHBlbmRzLmAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgcGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KDUwMClcbiAgICAgICAgLmRlc2NyaWJlKFwiRmlsZSBwYXRoIGluc2lkZSB0aGUgY29udGFpbmVyLlwiKSxcbiAgICAgIGFmdGVyTGluZTogelxuICAgICAgICAubnVtYmVyKClcbiAgICAgICAgLmludCgpXG4gICAgICAgIC5taW4oMClcbiAgICAgICAgLmRlc2NyaWJlKFxuICAgICAgICAgIFwiSW5zZXJ0IGFmdGVyIHRoaXMgbGluZSBudW1iZXIgKDEtYmFzZWQpLiBVc2UgMCB0byBpbnNlcnQgYXQgdGhlIHRvcC5cIixcbiAgICAgICAgKSxcbiAgICAgIGNvbnRlbnQ6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJUaGUgbGluZXMgdG8gaW5zZXJ0LlwiKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXG4gICAgICB7IHBhdGg6IGZpbGVQYXRoLCBhZnRlckxpbmUsIGNvbnRlbnQgfSxcbiAgICAgIHsgc3RhdHVzLCB3YXJuIH0sXG4gICAgKSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhgSW5zZXJ0aW5nIGludG86ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgIGF3YWl0IGVuZ2luZS5pbnNlcnRMaW5lc0luRmlsZShmaWxlUGF0aCwgYWZ0ZXJMaW5lLCBjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbnNlcnRlZDogdHJ1ZSxcbiAgICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgICBhZnRlckxpbmUsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIGhpbnQgfSA9IGNsYXNzaWZ5RXJyb3IobXNnLCB7IGZpbGVQYXRoIH0pO1xuICAgICAgICB3YXJuKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3IsIGhpbnQsIGluc2VydGVkOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGxpc3REaXJUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJMaXN0RGlyZWN0b3J5XCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgTGlzdCBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgaW5zaWRlIHRoZSBjb21wdXRlci5cXG5cXG5gICtcbiAgICAgIGBSZXR1cm5zIHN0cnVjdHVyZWQgZGlyZWN0b3J5IGxpc3Rpbmcgd2l0aCBmaWxlIHR5cGVzLCBzaXplcywgYW5kIHBlcm1pc3Npb25zLmAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgcGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKGBEaXJlY3RvcnkgcGF0aCAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0pLmApLFxuICAgICAgc2hvd0hpZGRlbjogelxuICAgICAgICAuYm9vbGVhbigpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIkluY2x1ZGUgaGlkZGVuIGZpbGVzIChkb3RmaWxlcykuIERlZmF1bHQ6IGZhbHNlLlwiKSxcbiAgICAgIHJlY3Vyc2l2ZTogelxuICAgICAgICAuYm9vbGVhbigpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIkxpc3QgcmVjdXJzaXZlbHkgdXAgdG8gMyBsZXZlbHMgZGVlcC4gRGVmYXVsdDogZmFsc2UuXCIpLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jIChcbiAgICAgIHsgcGF0aDogZGlyUGF0aCwgc2hvd0hpZGRlbiwgcmVjdXJzaXZlIH0sXG4gICAgICB7IHN0YXR1cyB9LFxuICAgICkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGRpclBhdGggPz8gQ09OVEFJTkVSX1dPUktESVI7XG4gICAgICAgIGNvbnN0IGhpZGRlbiA9IHNob3dIaWRkZW4gPyBcIi1hXCIgOiBcIlwiO1xuXG4gICAgICAgIGxldCBjbWQ6IHN0cmluZztcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgIGNtZCA9IGBmaW5kICcke3RhcmdldC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nICAtbWF4ZGVwdGggMyAke3Nob3dIaWRkZW4gPyBcIlwiIDogXCItbm90IC1wYXRoICcqLy4qJ1wifSAtcHJpbnRmICcleSAlcyAlVEAgJXBcXFxcbicgMj4vZGV2L251bGwgfCBoZWFkIC0yMDBgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNtZCA9IGBscyAtbCAke2hpZGRlbn0gLS10aW1lLXN0eWxlPWxvbmctaXNvICcke3RhcmdldC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nICAyPi9kZXYvbnVsbCB8fCBscyAtbCAke2hpZGRlbn0gJyR7dGFyZ2V0LnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzKGBMaXN0aW5nOiAke3RhcmdldH1gKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoY21kLCAxMCk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5jbGFzc2lmeUVycm9yKHJlc3VsdC5zdGRlcnIgfHwgXCJEaXJlY3Rvcnkgbm90IGZvdW5kXCIsIHtcbiAgICAgICAgICAgICAgZmlsZVBhdGg6IHRhcmdldCxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcGF0aDogdGFyZ2V0LFxuICAgICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXRoOiB0YXJnZXQsXG4gICAgICAgICAgbGlzdGluZzogcmVzdWx0LnN0ZG91dCxcbiAgICAgICAgICByZWN1cnNpdmU6IHJlY3Vyc2l2ZSA/PyBmYWxzZSxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgaGludCB9ID0gY2xhc3NpZnlFcnJvcihtc2cpO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaGludCwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHVwbG9hZEZpbGVUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJVcGxvYWRGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgVHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIHVzZXIncyBob3N0IGNvbXB1dGVyIGludG8gdGhlIGNvbnRhaW5lci5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB3aGVuIHRoZSB1c2VyIHNoYXJlcyBhIGZpbGUgdGhleSB3YW50IHlvdSB0byB3b3JrIHdpdGguIGAgK1xuICAgICAgYFRoZSBmaWxlIHdpbGwgYmUgY29waWVkIGludG8gdGhlIGNvbnRhaW5lciBhdCB0aGUgc3BlY2lmaWVkIHBhdGguYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBob3N0UGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KDEwMDApXG4gICAgICAgIC5kZXNjcmliZShcIkFic29sdXRlIHBhdGggdG8gdGhlIGZpbGUgb24gdGhlIHVzZXIncyBob3N0IG1hY2hpbmUuXCIpLFxuICAgICAgY29udGFpbmVyUGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFxuICAgICAgICAgIGBEZXN0aW5hdGlvbiBwYXRoIGluc2lkZSB0aGUgY29udGFpbmVyIChkZWZhdWx0OiAke0NPTlRBSU5FUl9XT1JLRElSfS88ZmlsZW5hbWU+KS5gLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGhvc3RQYXRoLCBjb250YWluZXJQYXRoIH0sIHsgc3RhdHVzLCB3YXJuIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9XG4gICAgICAgICAgaG9zdFBhdGguc3BsaXQoXCIvXCIpLnBvcCgpID8/IGhvc3RQYXRoLnNwbGl0KFwiXFxcXFwiKS5wb3AoKSA/PyBcImZpbGVcIjtcbiAgICAgICAgY29uc3QgZGVzdCA9IGNvbnRhaW5lclBhdGggPz8gYCR7Q09OVEFJTkVSX1dPUktESVJ9LyR7ZmlsZW5hbWV9YDtcblxuICAgICAgICBzdGF0dXMoYFVwbG9hZGluZzogJHtmaWxlbmFtZX0gXHUyMTkyICR7ZGVzdH1gKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLmNvcHlUb0NvbnRhaW5lcihob3N0UGF0aCwgZGVzdCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGxvYWRlZDogdHJ1ZSxcbiAgICAgICAgICBob3N0UGF0aCxcbiAgICAgICAgICBjb250YWluZXJQYXRoOiBkZXN0LFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBjb25zdCB7IGVycm9yLCBoaW50IH0gPSBjbGFzc2lmeUVycm9yKG1zZywgeyBmaWxlUGF0aDogaG9zdFBhdGggfSk7XG4gICAgICAgIHdhcm4oZXJyb3IpO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaGludCwgdXBsb2FkZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgZG93bmxvYWRGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiRG93bmxvYWRGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgVHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIGNvbnRhaW5lciB0byB0aGUgdXNlcidzIGhvc3QgY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgdG8gZ2l2ZSB0aGUgdXNlciBhIGZpbGUgeW91IGNyZWF0ZWQgb3IgbW9kaWZpZWQgaW5zaWRlIHRoZSBjb21wdXRlci5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGNvbnRhaW5lclBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5taW4oMSlcbiAgICAgICAgLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIlBhdGggdG8gdGhlIGZpbGUgaW5zaWRlIHRoZSBjb250YWluZXIuXCIpLFxuICAgICAgaG9zdFBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIkRlc3RpbmF0aW9uIHBhdGggb24gdGhlIGhvc3QuIERlZmF1bHQ6IHVzZXIncyBob21lIGRpcmVjdG9yeSArIGZpbGVuYW1lLlwiLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGNvbnRhaW5lclBhdGgsIGhvc3RQYXRoIH0sIHsgc3RhdHVzLCB3YXJuIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGNvbnRhaW5lclBhdGguc3BsaXQoXCIvXCIpLnBvcCgpID8/IFwiZmlsZVwiO1xuICAgICAgICBjb25zdCBkZXN0ID0gaG9zdFBhdGggPz8gcGF0aEpvaW4oaG9tZWRpcigpLCBmaWxlbmFtZSk7XG5cbiAgICAgICAgc3RhdHVzKGBEb3dubG9hZGluZzogJHtjb250YWluZXJQYXRofSBcdTIxOTIgJHtkZXN0fWApO1xuICAgICAgICBhd2FpdCBlbmdpbmUuY29weUZyb21Db250YWluZXIoY29udGFpbmVyUGF0aCwgZGVzdCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkb3dubG9hZGVkOiB0cnVlLFxuICAgICAgICAgIGNvbnRhaW5lclBhdGgsXG4gICAgICAgICAgaG9zdFBhdGg6IGRlc3QsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIGhpbnQgfSA9IGNsYXNzaWZ5RXJyb3IobXNnLCB7IGZpbGVQYXRoOiBjb250YWluZXJQYXRoIH0pO1xuICAgICAgICB3YXJuKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3IsIGhpbnQsIGRvd25sb2FkZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgc3RhdHVzVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiQ29tcHV0ZXJTdGF0dXNcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXB1dGVyOiBPUywgaW5zdGFsbGVkIHRvb2xzLCBkaXNrL21lbW9yeSB1c2FnZSwgYCArXG4gICAgICBgcnVubmluZyBwcm9jZXNzZXMsIG5ldHdvcmsgc3RhdHVzLCBhbmQgcmVzb3VyY2UgbGltaXRzLlxcblxcbmAgK1xuICAgICAgYEFsc28gc2hvd3MgdGhlIHBlci10dXJuIHRvb2wgY2FsbCBidWRnZXQuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBzaG93UHJvY2Vzc2VzOiB6XG4gICAgICAgIC5ib29sZWFuKClcbiAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiSW5jbHVkZSBhIGxpc3Qgb2YgcnVubmluZyBwcm9jZXNzZXMuIERlZmF1bHQ6IGZhbHNlLlwiKSxcbiAgICAgIGtpbGxQaWQ6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgXCJLaWxsIGEgcHJvY2VzcyBieSBQSUQuIENvbWJpbmUgd2l0aCBzaG93UHJvY2Vzc2VzIHRvIHZlcmlmeS5cIixcbiAgICAgICAgKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBzaG93UHJvY2Vzc2VzLCBraWxsUGlkIH0sIHsgc3RhdHVzLCB3YXJuIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBpZiAoa2lsbFBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3Qga2lsbGVkID0gYXdhaXQgZW5naW5lLmtpbGxQcm9jZXNzKGtpbGxQaWQpO1xuICAgICAgICAgIGlmICgha2lsbGVkKSB3YXJuKGBGYWlsZWQgdG8ga2lsbCBQSUQgJHtraWxsUGlkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzKFwiR2F0aGVyaW5nIHN5c3RlbSBpbmZvXHUyMDI2XCIpO1xuICAgICAgICBjb25zdCBlbnZJbmZvID0gYXdhaXQgZW5naW5lLmdldEVudmlyb25tZW50SW5mbyhcbiAgICAgICAgICBjZmcuaW50ZXJuZXRBY2Nlc3MsXG4gICAgICAgICAgY2ZnLmRpc2tMaW1pdE1CLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBjb250YWluZXJJbmZvID0gYXdhaXQgZW5naW5lLmdldENvbnRhaW5lckluZm8oKTtcblxuICAgICAgICBsZXQgcHJvY2Vzc2VzOiBhbnlbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHNob3dQcm9jZXNzZXMpIHtcbiAgICAgICAgICBjb25zdCBwcm9jcyA9IGF3YWl0IGVuZ2luZS5saXN0UHJvY2Vzc2VzKCk7XG4gICAgICAgICAgcHJvY2Vzc2VzID0gcHJvY3MubWFwKChwKSA9PiAoe1xuICAgICAgICAgICAgcGlkOiBwLnBpZCxcbiAgICAgICAgICAgIHVzZXI6IHAudXNlcixcbiAgICAgICAgICAgIGNwdTogcC5jcHUgKyBcIiVcIixcbiAgICAgICAgICAgIG1lbW9yeTogcC5tZW1vcnkgKyBcIiVcIixcbiAgICAgICAgICAgIGNvbW1hbmQ6IHAuY29tbWFuZCxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRhaW5lcjoge1xuICAgICAgICAgICAgaWQ6IGNvbnRhaW5lckluZm8uaWQsXG4gICAgICAgICAgICBzdGF0ZTogY29udGFpbmVySW5mby5zdGF0ZSxcbiAgICAgICAgICAgIGltYWdlOiBjb250YWluZXJJbmZvLmltYWdlLFxuICAgICAgICAgICAgY3B1VXNhZ2U6IGNvbnRhaW5lckluZm8uY3B1VXNhZ2UsXG4gICAgICAgICAgICBtZW1vcnlVc2FnZTogY29udGFpbmVySW5mby5tZW1vcnlVc2FnZSxcbiAgICAgICAgICAgIG5ldHdvcmtNb2RlOiBjb250YWluZXJJbmZvLm5ldHdvcmtNb2RlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IGVudkluZm8sXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBpbnRlcm5ldEFjY2VzczogY2ZnLmludGVybmV0QWNjZXNzLFxuICAgICAgICAgICAgcGVyc2lzdGVuY2VNb2RlOiBjZmcucGVyc2lzdGVuY2VNb2RlLFxuICAgICAgICAgICAgY3B1TGltaXQ6IGNmZy5jcHVMaW1pdCA+IDAgPyBgJHtjZmcuY3B1TGltaXR9IGNvcmVzYCA6IFwidW5saW1pdGVkXCIsXG4gICAgICAgICAgICBtZW1vcnlMaW1pdDogYCR7Y2ZnLm1lbW9yeUxpbWl0TUJ9IE1CYCxcbiAgICAgICAgICAgIGNvbW1hbmRUaW1lb3V0OiBgJHtjZmcuY29tbWFuZFRpbWVvdXR9c2AsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi4ocHJvY2Vzc2VzID8geyBwcm9jZXNzZXMgfSA6IHt9KSxcbiAgICAgICAgICAuLi4oa2lsbFBpZCAhPT0gdW5kZWZpbmVkID8geyBraWxsZWRQaWQ6IGtpbGxQaWQgfSA6IHt9KSxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgaGludCB9ID0gY2xhc3NpZnlFcnJvcihtc2cpO1xuICAgICAgICB3YXJuKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3IsIGhpbnQsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICBjb25zdCByZWJ1aWxkVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVidWlsZENvbXB1dGVyXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgRGVzdHJveSB0aGUgY3VycmVudCBjb250YWluZXIgYW5kIHJlYnVpbGQgaXQgZnJvbSBzY3JhdGNoIHVzaW5nIHRoZSBjdXJyZW50IHNldHRpbmdzLlxuXG5gICtcbiAgICAgIGBVc2UgdGhpcyB3aGVuOlxuYCArXG4gICAgICBgLSBJbnRlcm5ldCBhY2Nlc3MgaXMgbm90IHdvcmtpbmcgYWZ0ZXIgdG9nZ2xpbmcgdGhlIHNldHRpbmdcbmAgK1xuICAgICAgYC0gVGhlIGNvbnRhaW5lciBpcyBicm9rZW4gb3IgaW4gYSBiYWQgc3RhdGVcbmAgK1xuICAgICAgYC0gU2V0dGluZ3MgbGlrZSBiYXNlIGltYWdlIG9yIG5ldHdvcmsgd2VyZSBjaGFuZ2VkIGFuZCBuZWVkIHRvIHRha2UgZWZmZWN0XG5cbmAgK1xuICAgICAgYFdBUk5JTkc6IEFsbCBkYXRhIGluc2lkZSB0aGUgY29udGFpbmVyIHdpbGwgYmUgbG9zdC4gRmlsZXMgaW4gdGhlIHNoYXJlZCBmb2xkZXIgYXJlIHNhZmUuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBjb25maXJtOiB6XG4gICAgICAgIC5ib29sZWFuKClcbiAgICAgICAgLmRlc2NyaWJlKFxuICAgICAgICAgIFwiTXVzdCBiZSB0cnVlIHRvIGNvbmZpcm0geW91IHdhbnQgdG8gZGVzdHJveSBhbmQgcmVidWlsZCB0aGUgY29udGFpbmVyLlwiLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGNvbmZpcm0gfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgaWYgKCFjb25maXJtKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3I6IFwiU2V0IGNvbmZpcm09dHJ1ZSB0byBwcm9jZWVkIHdpdGggcmVidWlsZC5cIixcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBzdGF0dXMoXCJTdG9wcGluZyBhbmQgcmVtb3ZpbmcgZXhpc3RpbmcgY29udGFpbmVyXHUyMDI2XCIpO1xuICAgICAgICBhd2FpdCBlbmdpbmUuZGVzdHJveUNvbnRhaW5lcigpO1xuXG4gICAgICAgIHN0YXR1cyhcIlJlYnVpbGRpbmcgY29udGFpbmVyIHdpdGggY3VycmVudCBzZXR0aW5nc1x1MjAyNlwiKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLmVuc3VyZVJlYWR5KHtcbiAgICAgICAgICBpbWFnZTogY2ZnLmJhc2VJbWFnZSBhcyBDb250YWluZXJJbWFnZSxcbiAgICAgICAgICBuZXR3b3JrOiAoY2ZnLmludGVybmV0QWNjZXNzID8gXCJicmlkZ2VcIiA6IFwibm9uZVwiKSBhcyBOZXR3b3JrTW9kZSxcbiAgICAgICAgICBjcHVMaW1pdDogY2ZnLmNwdUxpbWl0LFxuICAgICAgICAgIG1lbW9yeUxpbWl0TUI6IGNmZy5tZW1vcnlMaW1pdE1CLFxuICAgICAgICAgIGRpc2tMaW1pdE1COiBjZmcuZGlza0xpbWl0TUIsXG4gICAgICAgICAgYXV0b0luc3RhbGxQcmVzZXQ6IGNmZy5hdXRvSW5zdGFsbFByZXNldCxcbiAgICAgICAgICBwb3J0Rm9yd2FyZHM6IGNmZy5wb3J0Rm9yd2FyZHMsXG4gICAgICAgICAgaG9zdE1vdW50UGF0aDogY2ZnLmhvc3RNb3VudFBhdGgsXG4gICAgICAgICAgcGVyc2lzdGVuY2VNb2RlOiBjZmcucGVyc2lzdGVuY2VNb2RlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBlbnZJbmZvID0gYXdhaXQgZW5naW5lLmdldEVudmlyb25tZW50SW5mbyhcbiAgICAgICAgICBjZmcuaW50ZXJuZXRBY2Nlc3MsXG4gICAgICAgICAgY2ZnLmRpc2tMaW1pdE1CLFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVidWlsdDogdHJ1ZSxcbiAgICAgICAgICBvczogZW52SW5mby5vcyxcbiAgICAgICAgICBpbnRlcm5ldEFjY2VzczogY2ZnLmludGVybmV0QWNjZXNzLFxuICAgICAgICAgIG5ldHdvcmtNb2RlOiBjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWRcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIkNvbnRhaW5lciByZWJ1aWx0IHN1Y2Nlc3NmdWxseSB3aXRoIGN1cnJlbnQgc2V0dGluZ3MuXCIsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIGhpbnQgfSA9IGNsYXNzaWZ5RXJyb3IobXNnKTtcbiAgICAgICAgd2FybihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBoaW50LCByZWJ1aWx0OiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlc2V0U2hlbGxUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJSZXNldFNoZWxsXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUmVzZXQgdGhlIHBlcnNpc3RlbnQgc2hlbGwgc2Vzc2lvbiBiYWNrIHRvIGEgY2xlYW4gc3RhdGUuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgd2hlbjpcXG5gICtcbiAgICAgIGBcdTIwMjIgVGhlIHNoZWxsIGlzIGluIGEgYnJva2VuIHN0YXRlIChzdHVjayBjb21tYW5kLCBjb3JydXB0ZWQgZW52KVxcbmAgK1xuICAgICAgYFx1MjAyMiBZb3Ugd2FudCB0byBzdGFydCBmcmVzaCB3aXRob3V0IHJlYnVpbGRpbmcgdGhlIHdob2xlIGNvbnRhaW5lclxcbmAgK1xuICAgICAgYFx1MjAyMiBFbnZpcm9ubWVudCB2YXJpYWJsZXMgb3Igd29ya2luZyBkaXJlY3RvcnkgYXJlIGluIGFuIHVuZXhwZWN0ZWQgc3RhdGVcXG5cXG5gICtcbiAgICAgIGBUaGlzIGRvZXMgTk9UIHdpcGUgdGhlIGNvbnRhaW5lciBmaWxlc3lzdGVtIFx1MjAxNCBmaWxlcywgaW5zdGFsbGVkIHBhY2thZ2VzLCBgICtcbiAgICAgIGBhbmQgcnVubmluZyBiYWNrZ3JvdW5kIHByb2Nlc3NlcyBhcmUgYWxsIHByZXNlcnZlZC4gYCArXG4gICAgICBgSXQgb25seSByZXNldHMgdGhlIHNoZWxsIHNlc3Npb24gKGN3ZCBiYWNrIHRvIGhvbWUsIGVudiB2YXJzIGNsZWFyZWQpLmAsXG4gICAgcGFyYW1ldGVyczoge30sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jIChfLCB7IHN0YXR1cyB9KSA9PiB7XG4gICAgICBlbmdpbmUucmVzZXRTaGVsbFNlc3Npb24oKTtcbiAgICAgIHN0YXR1cyhcIlNoZWxsIHNlc3Npb24gcmVzZXQuXCIpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzZXQ6IHRydWUsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgXCJTaGVsbCBzZXNzaW9uIHJlc2V0LiBXb3JraW5nIGRpcmVjdG9yeSBpcyBiYWNrIHRvIC9ob21lL3VzZXIgd2l0aCBhIGNsZWFuIGVudmlyb25tZW50LlwiLFxuICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgfTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBleGVjdXRlQmFja2dyb3VuZFRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIkV4ZWN1dGVCYWNrZ3JvdW5kXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUnVuIGEgY29tbWFuZCBpbiB0aGUgYmFja2dyb3VuZCBhbmQgZ2V0IGEgaGFuZGxlIHRvIGNoZWNrIGl0cyBvdXRwdXQgbGF0ZXIuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgZm9yIGxvbmctcnVubmluZyB0YXNrcyB0aGF0IHNob3VsZG4ndCBibG9jazogc2VydmVycywgd2F0Y2hlcnMsIGAgK1xuICAgICAgYGJ1aWxkIHByb2Nlc3NlcywgdGVzdCBzdWl0ZXMsIGV0Yy5cXG5cXG5gICtcbiAgICAgIGBSZXR1cm5zIGEgaGFuZGxlSWQuIFVzZSBSZWFkUHJvY2Vzc0xvZ3Mgd2l0aCB0aGF0IGhhbmRsZUlkIHRvIHN0cmVhbSBvdXRwdXQuIGAgK1xuICAgICAgYEJhY2tncm91bmQgcHJvY2Vzc2VzIHN1cnZpdmUgYWNyb3NzIG11bHRpcGxlIHR1cm5zLmAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgY29tbWFuZDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAuZGVzY3JpYmUoXCJTaGVsbCBjb21tYW5kIHRvIHJ1biBpbiB0aGUgYmFja2dyb3VuZC5cIiksXG4gICAgICB0aW1lb3V0OiB6XG4gICAgICAgIC5udW1iZXIoKVxuICAgICAgICAuaW50KClcbiAgICAgICAgLm1pbig1KVxuICAgICAgICAubWF4KDM2MDApXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIk1heCBzZWNvbmRzIGJlZm9yZSB0aGUgcHJvY2VzcyBpcyBraWxsZWQuIERlZmF1bHQ6IDMwMC5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29tbWFuZCwgdGltZW91dCB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhcbiAgICAgICAgICBgU3RhcnRpbmcgYmFja2dyb3VuZDogJHtjb21tYW5kLnNsaWNlKDAsIDYwKX0ke2NvbW1hbmQubGVuZ3RoID4gNjAgPyBcIlx1MjAyNlwiIDogXCJcIn1gLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCB7IGhhbmRsZUlkLCBwaWQgfSA9IGF3YWl0IGVuZ2luZS5leGVjQmFja2dyb3VuZChcbiAgICAgICAgICBjb21tYW5kLFxuICAgICAgICAgIHRpbWVvdXQgPz8gMzAwLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXJ0ZWQ6IHRydWUsXG4gICAgICAgICAgaGFuZGxlSWQsXG4gICAgICAgICAgcGlkLFxuICAgICAgICAgIG1lc3NhZ2U6IGBQcm9jZXNzIHN0YXJ0ZWQuIFVzZSBSZWFkUHJvY2Vzc0xvZ3Mgd2l0aCBoYW5kbGVJZCAke2hhbmRsZUlkfSB0byBjaGVjayBvdXRwdXQuYCxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgaGludCB9ID0gY2xhc3NpZnlFcnJvcihtc2csIHsgY29tbWFuZCB9KTtcbiAgICAgICAgd2FybihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBoaW50LCBzdGFydGVkOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlYWRQcm9jZXNzTG9nc1Rvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIlJlYWRQcm9jZXNzTG9nc1wiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYFJlYWQgYnVmZmVyZWQgb3V0cHV0IGZyb20gYSBiYWNrZ3JvdW5kIHByb2Nlc3Mgc3RhcnRlZCB3aXRoIEV4ZWN1dGVCYWNrZ3JvdW5kLlxcblxcbmAgK1xuICAgICAgYENhbGwgdGhpcyByZXBlYXRlZGx5IHRvIGNoZWNrIG9uIGEgcnVubmluZyBwcm9jZXNzLiBgICtcbiAgICAgIGBSZXR1cm5zIHN0ZG91dCwgc3RkZXJyLCB3aGV0aGVyIHRoZSBwcm9jZXNzIGlzIHN0aWxsIHJ1bm5pbmcsIGFuZCBpdHMgZXhpdCBjb2RlIGlmIGRvbmUuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBoYW5kbGVJZDogelxuICAgICAgICAubnVtYmVyKClcbiAgICAgICAgLmludCgpXG4gICAgICAgIC5kZXNjcmliZShcIlRoZSBoYW5kbGVJZCByZXR1cm5lZCBieSBFeGVjdXRlQmFja2dyb3VuZC5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgaGFuZGxlSWQgfSwgeyB3YXJuIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgY29uc3QgbG9ncyA9IGVuZ2luZS5yZWFkQmdMb2dzKGhhbmRsZUlkLCBNQVhfRklMRV9SRUFEX0JZVEVTKTtcbiAgICAgIGlmICghbG9ncy5mb3VuZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVycm9yOiBgTm8gcHJvY2VzcyBmb3VuZCB3aXRoIGhhbmRsZUlkICR7aGFuZGxlSWR9LmAsXG4gICAgICAgICAgaGludDogXCJoYW5kbGVJZHMgYXJlIG9ubHkgdmFsaWQgd2l0aGluIHRoZSBjdXJyZW50IExNIFN0dWRpbyBzZXNzaW9uLlwiLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhhbmRsZUlkLFxuICAgICAgICBzdGRvdXQ6IGxvZ3Muc3Rkb3V0IHx8IFwiKG5vIG91dHB1dCB5ZXQpXCIsXG4gICAgICAgIHN0ZGVycjogbG9ncy5zdGRlcnIgfHwgXCJcIixcbiAgICAgICAgcnVubmluZzogIWxvZ3MuZG9uZSxcbiAgICAgICAgZXhpdENvZGU6IGxvZ3MuZXhpdENvZGUsXG4gICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICB9O1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlc3RhcnRDb21wdXRlclRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIlJlc3RhcnRDb21wdXRlclwiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYFN0b3AgYW5kIHJlc3RhcnQgdGhlIGNvbnRhaW5lciB3aXRob3V0IHdpcGluZyBhbnkgZGF0YS5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB3aGVuOlxcbmAgK1xuICAgICAgYC0gQSBydW5hd2F5IHByb2Nlc3MgaXMgY29uc3VtaW5nIHRvbyBtYW55IHJlc291cmNlc1xcbmAgK1xuICAgICAgYC0gVGhlIGNvbnRhaW5lciBmZWVscyBzbHVnZ2lzaCBvciB1bnJlc3BvbnNpdmVcXG5gICtcbiAgICAgIGAtIFlvdSB3YW50IGEgY2xlYW4gc2hlbGwgc2Vzc2lvbiBidXQga2VlcCBpbnN0YWxsZWQgcGFja2FnZXMgYW5kIGZpbGVzXFxuXFxuYCArXG4gICAgICBgRmFzdGVyIHRoYW4gUmVidWlsZENvbXB1dGVyLiBBbGwgZmlsZXMgYW5kIGluc3RhbGxlZCBwYWNrYWdlcyBhcmUgcHJlc2VydmVkLiBgICtcbiAgICAgIGBCYWNrZ3JvdW5kIHByb2Nlc3NlcyB3aWxsIGJlIHN0b3BwZWQuYCxcbiAgICBwYXJhbWV0ZXJzOiB7fSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKF8sIHsgc3RhdHVzLCB3YXJuIH0pID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHN0YXR1cyhcIlJlc3RhcnRpbmcgY29tcHV0ZXJcdTIwMjZcIik7XG4gICAgICAgIGF3YWl0IGVuZ2luZS5yZXN0YXJ0Q29udGFpbmVyKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzdGFydGVkOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQ29udGFpbmVyIHJlc3RhcnRlZC4gRmlsZXMgYW5kIHBhY2thZ2VzIGFyZSBpbnRhY3QuXCIsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIGhpbnQgfSA9IGNsYXNzaWZ5RXJyb3IobXNnKTtcbiAgICAgICAgd2FybihlcnJvcik7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBoaW50LCByZXN0YXJ0ZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIFtcbiAgICBleGVjdXRlVG9vbCxcbiAgICB3cml0ZUZpbGVUb29sLFxuICAgIHJlYWRGaWxlVG9vbCxcbiAgICBzdHJSZXBsYWNlVG9vbCxcbiAgICBpbnNlcnRMaW5lc1Rvb2wsXG4gICAgbGlzdERpclRvb2wsXG4gICAgdXBsb2FkRmlsZVRvb2wsXG4gICAgZG93bmxvYWRGaWxlVG9vbCxcbiAgICBzdGF0dXNUb29sLFxuICAgIHJlc3RhcnRDb21wdXRlclRvb2wsXG4gICAgcmVidWlsZFRvb2wsXG4gICAgcmVzZXRTaGVsbFRvb2wsXG4gICAgZXhlY3V0ZUJhY2tncm91bmRUb29sLFxuICAgIHJlYWRQcm9jZXNzTG9nc1Rvb2wsXG4gIF07XG59XG4iLCAiLyoqXG4gKiBAZmlsZSBwcmVwcm9jZXNzb3IudHNcbiAqIFByb21wdCBwcmVwcm9jZXNzb3IgXHUyMDE0IHNlcnZlcyB0d28gcHVycG9zZXM6XG4gKlxuICogICAxLiBSZXNldHMgdGhlIHBlci10dXJuIHRvb2wgY2FsbCBidWRnZXQgZXZlcnkgdGltZSB0aGUgdXNlciBzZW5kcyBhIG5ldyBtZXNzYWdlLlxuICogICAyLiBPcHRpb25hbGx5IGluamVjdHMgY29tcHV0ZXIgc3RhdGUgKE9TLCB0b29scywgbmV0d29yaykgaW50byB0aGUgbW9kZWwnc1xuICogICAgICBjb250ZXh0IHNvIGl0IGtub3dzIHdoYXQgaXQncyB3b3JraW5nIHdpdGggd2l0aG91dCBuZWVkaW5nIHRvIGFzay5cbiAqXG4gKiBGbG93OlxuICogICAxLiBVc2VyIHR5cGVzIGEgbWVzc2FnZVxuICogICAyLiBQcmVwcm9jZXNzb3IgZmlyZXMgXHUyMTkyIHJlc2V0cyB0b29sIGNhbGwgYnVkZ2V0IFx1MjE5MiBnYXRoZXJzIGNvbXB1dGVyIHN0YXRlXG4gKiAgIDMuIFByZXBlbmRzIGNvbXB1dGVyIGNvbnRleHQgdG8gdGhlIHVzZXIncyBtZXNzYWdlXG4gKiAgIDQuIE1vZGVsIHNlZXMgdGhlIGNvbnRleHQgYW5kIGNhbiBzdGFydCB1c2luZyB0b29scyBpbW1lZGlhdGVseVxuICovXG5cbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IGFkdmFuY2VUdXJuIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xuaW1wb3J0ICogYXMgZW5naW5lIGZyb20gXCIuL2NvbnRhaW5lci9lbmdpbmVcIjtcbmltcG9ydCB7IE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTLCBDT05UQUlORVJfV09SS0RJUiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5Db250cm9sbGVyIH0gZnJvbSBcIi4vcGx1Z2luVHlwZXNcIjtcblxuZnVuY3Rpb24gcmVhZENvbmZpZyhjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgYyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG4gIHJldHVybiB7XG4gICAgYXV0b0luamVjdDogYy5nZXQoXCJhdXRvSW5qZWN0Q29udGV4dFwiKSA9PT0gXCJvblwiLFxuICAgIG1heFRvb2xDYWxsczogYy5nZXQoXCJtYXhUb29sQ2FsbHNQZXJUdXJuXCIpID8/IDI1LFxuICAgIGludGVybmV0QWNjZXNzOiBjLmdldChcImludGVybmV0QWNjZXNzXCIpID09PSBcIm9uXCIsXG4gICAgcGVyc2lzdGVuY2VNb2RlOiBjLmdldChcInBlcnNpc3RlbmNlTW9kZVwiKSB8fCBcInBlcnNpc3RlbnRcIixcbiAgICBiYXNlSW1hZ2U6IGMuZ2V0KFwiYmFzZUltYWdlXCIpIHx8IFwidWJ1bnR1OjI0LjA0XCIsXG4gIH07XG59XG5cbi8qKlxuICogQnVpbGQgYSBjb25jaXNlIGNvbnRleHQgYmxvY2sgYWJvdXQgdGhlIGNvbXB1dGVyJ3MgY3VycmVudCBzdGF0ZS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gYnVpbGRDb250ZXh0QmxvY2soXG4gIGNmZzogUmV0dXJuVHlwZTx0eXBlb2YgcmVhZENvbmZpZz4sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAoIWVuZ2luZS5pc1JlYWR5KCkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgYFtDb21wdXRlciBcdTIwMTQgQXZhaWxhYmxlXWAsXG4gICAgICBgWW91IGhhdmUgYSBkZWRpY2F0ZWQgTGludXggY29tcHV0ZXIgKCR7Y2ZnLmJhc2VJbWFnZX0pIGF2YWlsYWJsZSB2aWEgdG9vbHMuYCxcbiAgICAgIGBJbnRlcm5ldDogJHtjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWRcIn0uYCxcbiAgICAgIGBNb2RlOiAke2NmZy5wZXJzaXN0ZW5jZU1vZGV9LmAsXG4gICAgICBgVGhlIGNvbXB1dGVyIHdpbGwgc3RhcnQgYXV0b21hdGljYWxseSB3aGVuIHlvdSBmaXJzdCB1c2UgYSB0b29sIChFeGVjdXRlLCBXcml0ZUZpbGUsIGV0Yy4pLmAsXG4gICAgICBgV29ya2luZyBkaXJlY3Rvcnk6ICR7Q09OVEFJTkVSX1dPUktESVJ9YCxcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHF1aWNrSW5mbyA9IGF3YWl0IGVuZ2luZS5leGVjKFxuICAgICAgYGVjaG8gXCJPUz0kKGNhdCAvZXRjL29zLXJlbGVhc2UgMj4vZGV2L251bGwgfCBncmVwIFBSRVRUWV9OQU1FIHwgY3V0IC1kPSAtZjIgfCB0ciAtZCAnXFxcIicpXCIgJiYgYCArXG4gICAgICAgIGBlY2hvIFwiVE9PTFM9JCh3aGljaCBnaXQgY3VybCB3Z2V0IHB5dGhvbjMgbm9kZSBnY2MgcGlwMyAyPi9kZXYvbnVsbCB8IHhhcmdzIC1Je30gYmFzZW5hbWUge30gfCB0ciAnXFxcXG4nICcsJylcIiAmJiBgICtcbiAgICAgICAgYGVjaG8gXCJGSUxFUz0kKGxzICR7Q09OVEFJTkVSX1dPUktESVJ9IDI+L2Rldi9udWxsIHwgaGVhZCAtMTAgfCB0ciAnXFxcXG4nICcsJylcIiAmJiBgICtcbiAgICAgICAgYGVjaG8gXCJESVNLPSQoZGYgLWggJHtDT05UQUlORVJfV09SS0RJUn0gMj4vZGV2L251bGwgfCB0YWlsIC0xIHwgYXdrICd7cHJpbnQgJDQgXFxcIiBmcmVlIC8gXFxcIiAkMiBcXFwiIHRvdGFsXFxcIn0nKVwiYCxcbiAgICAgIDUsXG4gICAgICBNQVhfSU5KRUNURURfQ09OVEVYVF9DSEFSUyxcbiAgICApO1xuXG4gICAgaWYgKHF1aWNrSW5mby5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgcmV0dXJuIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmcgKCR7Y2ZnLmJhc2VJbWFnZX0pLCBJbnRlcm5ldDogJHtjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcIm9uXCIgOiBcIm9mZlwifV1gO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVzID0gcXVpY2tJbmZvLnN0ZG91dC5zcGxpdChcIlxcblwiKTtcbiAgICBjb25zdCBnZXQgPSAocHJlZml4OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgbGluZSA9IGxpbmVzLmZpbmQoKGwpID0+IGwuc3RhcnRzV2l0aChwcmVmaXggKyBcIj1cIikpO1xuICAgICAgcmV0dXJuIGxpbmU/LnNsaWNlKHByZWZpeC5sZW5ndGggKyAxKT8udHJpbSgpID8/IFwiXCI7XG4gICAgfTtcblxuICAgIGNvbnN0IG9zID0gZ2V0KFwiT1NcIik7XG4gICAgY29uc3QgdG9vbHMgPSBnZXQoXCJUT09MU1wiKS5zcGxpdChcIixcIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IGZpbGVzID0gZ2V0KFwiRklMRVNcIikuc3BsaXQoXCIsXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBkaXNrID0gZ2V0KFwiRElTS1wiKTtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtcbiAgICAgIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmddYCxcbiAgICAgIGBPUzogJHtvc31gLFxuICAgICAgYEludGVybmV0OiAke2NmZy5pbnRlcm5ldEFjY2VzcyA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZFwifWAsXG4gICAgICBgTW9kZTogJHtjZmcucGVyc2lzdGVuY2VNb2RlfWAsXG4gICAgICBgRGlzazogJHtkaXNrfWAsXG4gICAgXTtcblxuICAgIGlmICh0b29scy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKGBJbnN0YWxsZWQ6ICR7dG9vbHMuam9pbihcIiwgXCIpfWApO1xuICAgIH1cblxuICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICBgV29ya3NwYWNlICgke0NPTlRBSU5FUl9XT1JLRElSfSk6ICR7ZmlsZXMuam9pbihcIiwgXCIpfSR7ZmlsZXMubGVuZ3RoID49IDEwID8gXCJcdTIwMjZcIiA6IFwiXCJ9YCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYFdvcmtzcGFjZSAoJHtDT05UQUlORVJfV09SS0RJUn0pOiBlbXB0eWApO1xuICAgIH1cblxuICAgIHBhcnRzLnB1c2goXG4gICAgICBgYCxcbiAgICAgIGBVc2UgdGhlIEV4ZWN1dGUsIFdyaXRlRmlsZSwgUmVhZEZpbGUsIExpc3REaXJlY3RvcnksIFVwbG9hZEZpbGUsIERvd25sb2FkRmlsZSwgb3IgQ29tcHV0ZXJTdGF0dXMgdG9vbHMgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgY29tcHV0ZXIuYCxcbiAgICApO1xuXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBgW0NvbXB1dGVyIFx1MjAxNCBSdW5uaW5nICgke2NmZy5iYXNlSW1hZ2V9KSwgSW50ZXJuZXQ6ICR7Y2ZnLmludGVybmV0QWNjZXNzID8gXCJvblwiIDogXCJvZmZcIn1dYDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvbXB0UHJlcHJvY2Vzc29yKFxuICBjdGw6IFBsdWdpbkNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBjZmcgPSByZWFkQ29uZmlnKGN0bCk7XG5cbiAgYWR2YW5jZVR1cm4oY2ZnLm1heFRvb2xDYWxscyk7XG5cbiAgaWYgKCFjZmcuYXV0b0luamVjdCkgcmV0dXJuIHVzZXJNZXNzYWdlO1xuXG4gIGlmICh1c2VyTWVzc2FnZS5sZW5ndGggPCA1KSByZXR1cm4gdXNlck1lc3NhZ2U7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgYnVpbGRDb250ZXh0QmxvY2soY2ZnKTtcbiAgICBpZiAoIWNvbnRleHQpIHJldHVybiB1c2VyTWVzc2FnZTtcblxuICAgIHJldHVybiBgJHtjb250ZXh0fVxcblxcbi0tLVxcblxcbiR7dXNlck1lc3NhZ2V9YDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG4iLCAiLyoqXG4gKiBAZmlsZSBpbmRleC50c1xuICogTE0gU3R1ZGlvIHBsdWdpbiBlbnRyeSBwb2ludC5cbiAqXG4gKiBUaGUgY29udGFpbmVyIGlzIGxhenktaW5pdGlhbGl6ZWQ6IG5vdGhpbmcgaGVhdnkgaGFwcGVucyBhdCBwbHVnaW4gbG9hZCB0aW1lLlxuICogVGhlIGZpcnN0IHRvb2wgY2FsbCB0cmlnZ2VycyBpbWFnZSBwdWxsICsgY29udGFpbmVyIGNyZWF0aW9uLlxuICovXG5cbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHRvb2xzUHJvdmlkZXIgfSBmcm9tIFwiLi90b29sc1Byb3ZpZGVyXCI7XG5pbXBvcnQgeyBwcm9tcHRQcmVwcm9jZXNzb3IgfSBmcm9tIFwiLi9wcmVwcm9jZXNzb3JcIjtcbmltcG9ydCB0eXBlIHsgUGx1Z2luQ29udGV4dCB9IGZyb20gXCIuL3BsdWdpblR5cGVzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWluKGNvbnRleHQ6IFBsdWdpbkNvbnRleHQpIHtcbiAgY29udGV4dC53aXRoQ29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgY29udGV4dC53aXRoVG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgY29udGV4dC53aXRoUHJvbXB0UHJlcHJvY2Vzc29yKHByb21wdFByZXByb2Nlc3Nvcik7XG59XG4iLCAiaW1wb3J0IHsgTE1TdHVkaW9DbGllbnQsIHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmRlY2xhcmUgdmFyIHByb2Nlc3M6IGFueTtcblxuLy8gV2UgcmVjZWl2ZSBydW50aW1lIGluZm9ybWF0aW9uIGluIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG5jb25zdCBjbGllbnRJZGVudGlmaWVyID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfSURFTlRJRklFUjtcbmNvbnN0IGNsaWVudFBhc3NrZXkgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9QQVNTS0VZO1xuY29uc3QgYmFzZVVybCA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQkFTRV9VUkw7XG5cbmNvbnN0IGNsaWVudCA9IG5ldyBMTVN0dWRpb0NsaWVudCh7XG4gIGNsaWVudElkZW50aWZpZXIsXG4gIGNsaWVudFBhc3NrZXksXG4gIGJhc2VVcmwsXG59KTtcblxuKGdsb2JhbFRoaXMgYXMgYW55KS5fX0xNU19QTFVHSU5fQ09OVEVYVCA9IHRydWU7XG5cbmxldCBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSBmYWxzZTtcbmxldCBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSBmYWxzZTtcbmxldCBjb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IHRvb2xzUHJvdmlkZXJTZXQgPSBmYWxzZTtcbmxldCBnZW5lcmF0b3JTZXQgPSBmYWxzZTtcblxuY29uc3Qgc2VsZlJlZ2lzdHJhdGlvbkhvc3QgPSBjbGllbnQucGx1Z2lucy5nZXRTZWxmUmVnaXN0cmF0aW9uSG9zdCgpO1xuXG5jb25zdCBwbHVnaW5Db250ZXh0OiBQbHVnaW5Db250ZXh0ID0ge1xuICB3aXRoUHJlZGljdGlvbkxvb3BIYW5kbGVyOiAoZ2VuZXJhdGUpID0+IHtcbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSB0b29scyBwcm92aWRlclwiKTtcbiAgICB9XG5cbiAgICBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByZWRpY3Rpb25Mb29wSGFuZGxlcihnZW5lcmF0ZSk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhQcm9tcHRQcmVwcm9jZXNzb3I6IChwcmVwcm9jZXNzKSA9PiB7XG4gICAgaWYgKHByb21wdFByZXByb2Nlc3NvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvbXB0UHJlcHJvY2Vzc29yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhDb25maWdTY2hlbWF0aWNzOiAoY29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChjb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHbG9iYWxDb25maWdTY2hlbWF0aWNzOiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbG9iYWwgY29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHbG9iYWxDb25maWdTY2hlbWF0aWNzKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoVG9vbHNQcm92aWRlcjogKHRvb2xzUHJvdmlkZXIpID0+IHtcbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgcHJlZGljdGlvbkxvb3BIYW5kbGVyXCIpO1xuICAgIH1cblxuICAgIHRvb2xzUHJvdmlkZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFRvb2xzUHJvdmlkZXIodG9vbHNQcm92aWRlcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHZW5lcmF0b3I6IChnZW5lcmF0b3IpID0+IHtcbiAgICBpZiAoZ2VuZXJhdG9yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cblxuICAgIGdlbmVyYXRvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2VuZXJhdG9yKGdlbmVyYXRvcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG59O1xuXG5pbXBvcnQoXCIuLy4uL3NyYy9pbmRleC50c1wiKS50aGVuKGFzeW5jIG1vZHVsZSA9PiB7XG4gIHJldHVybiBhd2FpdCBtb2R1bGUubWFpbihwbHVnaW5Db250ZXh0KTtcbn0pLnRoZW4oKCkgPT4ge1xuICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5pbml0Q29tcGxldGVkKCk7XG59KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBleGVjdXRlIHRoZSBtYWluIGZ1bmN0aW9uIG9mIHRoZSBwbHVnaW4uXCIpO1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7O0FBQUEsSUFZQSxZQUVhO0FBZGI7QUFBQTtBQUFBO0FBWUEsaUJBQXVDO0FBRWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFDRTtBQUFBLFFBQ0YsU0FBUztBQUFBLFVBQ1AsRUFBRSxPQUFPLE1BQU0sYUFBYSwrQ0FBMEM7QUFBQSxVQUN0RSxFQUFFLE9BQU8sT0FBTyxhQUFhLDhDQUF5QztBQUFBLFFBQ3hFO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxPQUFPO0FBQUEsWUFDUCxhQUNFO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxZQUNFLE9BQU87QUFBQSxZQUNQLGFBQWE7QUFBQSxVQUNmO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixTQUFTO0FBQUEsVUFDUDtBQUFBLFlBQ0UsT0FBTztBQUFBLFlBQ1AsYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBLEVBQUUsT0FBTyxnQkFBZ0IsYUFBYSw0QkFBNEI7QUFBQSxVQUNsRTtBQUFBLFlBQ0UsT0FBTztBQUFBLFlBQ1AsYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxPQUFPO0FBQUEsWUFDUCxhQUFhO0FBQUEsVUFDZjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFFQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsUUFBUSxFQUFFLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQUEsTUFDcEM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQ0U7QUFBQSxRQUNGLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTTtBQUFBLE1BQzVDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFFQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFDRTtBQUFBLFFBQ0YsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsUUFBUSxFQUFFLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxJQUFJO0FBQUEsTUFDdEM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUNFO0FBQUEsUUFDRixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxRQUFRLEVBQUUsTUFBTSxHQUFHLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQSxNQUN0QztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQ0U7QUFBQSxRQUNGLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLFFBQVEsRUFBRSxNQUFNLEdBQUcs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QUFBLElBQzVEO0FBQ0EsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sNERBQTREO0FBQUEsSUFDOUU7QUFFQSwrQkFBMkI7QUFDM0IseUJBQXFCLHlCQUF5QixRQUFRO0FBQ3RELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSx3QkFBd0IsQ0FBQyxlQUFlO0FBQ3RDLFFBQUksdUJBQXVCO0FBQ3pCLFlBQU0sSUFBSSxNQUFNLHVDQUF1QztBQUFBLElBQ3pEO0FBQ0EsNEJBQXdCO0FBQ3hCLHlCQUFxQixzQkFBc0IsVUFBVTtBQUNyRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0Esc0JBQXNCLENBQUNDLHNCQUFxQjtBQUMxQyxRQUFJLHFCQUFxQjtBQUN2QixZQUFNLElBQUksTUFBTSxzQ0FBc0M7QUFBQSxJQUN4RDtBQUNBLDBCQUFzQjtBQUN0Qix5QkFBcUIsb0JBQW9CQSxpQkFBZ0I7QUFDekQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLDRCQUE0QixDQUFDLDJCQUEyQjtBQUN0RCxRQUFJLDJCQUEyQjtBQUM3QixZQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFBQSxJQUMvRDtBQUNBLGdDQUE0QjtBQUM1Qix5QkFBcUIsMEJBQTBCLHNCQUFzQjtBQUNyRSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsbUJBQW1CLENBQUNDLG1CQUFrQjtBQUNwQyxRQUFJLGtCQUFrQjtBQUNwQixZQUFNLElBQUksTUFBTSxtQ0FBbUM7QUFBQSxJQUNyRDtBQUNBLFFBQUksMEJBQTBCO0FBQzVCLFlBQU0sSUFBSSxNQUFNLDREQUE0RDtBQUFBLElBQzlFO0FBRUEsdUJBQW1CO0FBQ25CLHlCQUFxQixpQkFBaUJBLGNBQWE7QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGVBQWUsQ0FBQyxjQUFjO0FBQzVCLFFBQUksY0FBYztBQUNoQixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLG1CQUFlO0FBQ2YseUJBQXFCLGFBQWEsU0FBUztBQUMzQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsd0RBQTRCLEtBQUssT0FBTUMsWUFBVTtBQUMvQyxTQUFPLE1BQU1BLFFBQU8sS0FBSyxhQUFhO0FBQ3hDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDWix1QkFBcUIsY0FBYztBQUNyQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsVUFBUSxNQUFNLG9EQUFvRDtBQUNsRSxVQUFRLE1BQU0sS0FBSztBQUNyQixDQUFDOyIsCiAgIm5hbWVzIjogWyJleGVjQXN5bmMiLCAiaW1wb3J0X2NoaWxkX3Byb2Nlc3MiLCAiaW1wb3J0X3V0aWwiLCAicGF0aEpvaW4iLCAiaW1wb3J0X3NkayIsICJpbXBvcnRfb3MiLCAiaW1wb3J0X3BhdGgiLCAicmVhZENvbmZpZyIsICJpbXBvcnRfc2RrIiwgImNvbmZpZ1NjaGVtYXRpY3MiLCAidG9vbHNQcm92aWRlciIsICJtb2R1bGUiXQp9Cg==
