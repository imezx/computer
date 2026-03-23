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
        subtitle: "Maximum RAM in megabytes (256\u20138192)",
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
        subtitle: "Maximum disk space in megabytes (512\u201332768). Only enforced on new containers.",
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
        subtitle: "Maximum stdout/stderr returned to the model per command (1\u2013128 KB). Larger output is truncated.",
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
        subtitle: "Maximum number of times the model can use the computer per conversational turn (1-100). Resets each time you send a message. Prevents infinite loops.",
        min: 1,
        max: 100,
        int: true,
        slider: { step: 1, min: 1, max: 100 }
      },
      25
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
    maxToolCallsPerTurn: c.get("maxToolCallsPerTurn") ?? 25,
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
    return `Tool call budget exhausted: you've used ${turnBudget.maxCalls}/${turnBudget.maxCalls} calls this turn. Wait for the user's next message to continue. (Configurable in plugin settings \u2192 "Max Tool Calls Per Turn")`;
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
        return {
          exitCode: result.exitCode,
          stdout: result.stdout || "(no output)",
          stderr: result.stderr || "",
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          truncated: result.truncated,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        warn(`Execution failed: ${msg}`);
        return { error: msg, exitCode: -1, budget: budgetStatus() };
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
        warn(`Write failed: ${msg}`);
        return { error: msg, written: false, budget: budgetStatus() };
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
        warn(`Read failed: ${msg}`);
        return {
          error: msg,
          path: filePath,
          hint: "Check the path is correct with ListDirectory.",
          budget: budgetStatus()
        };
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
        warn(`StrReplace failed: ${msg}`);
        return { error: msg, edited: false, budget: budgetStatus() };
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
        warn(`InsertLines failed: ${msg}`);
        return { error: msg, inserted: false, budget: budgetStatus() };
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
            error: result.stderr || "Directory not found",
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
        return { error: msg, budget: budgetStatus() };
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
        warn(`Upload failed: ${msg}`);
        return { error: msg, uploaded: false, budget: budgetStatus() };
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
        warn(`Download failed: ${msg}`);
        return { error: msg, downloaded: false, budget: budgetStatus() };
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
        warn(`Status failed: ${msg}`);
        return { error: msg, budget: budgetStatus() };
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
        warn(`Rebuild failed: ${msg}`);
        return { error: msg, rebuilt: false, budget: budgetStatus() };
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
        warn(`Background exec failed: ${msg}`);
        return { error: msg, started: false, budget: budgetStatus() };
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
        warn(`Restart failed: ${msg}`);
        return { error: msg, restarted: false, budget: budgetStatus() };
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
      maxCalls: 25
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvY29udGFpbmVyL3J1bnRpbWUudHMiLCAiLi4vc3JjL2NvbnN0YW50cy50cyIsICIuLi9zcmMvY29udGFpbmVyL2VuZ2luZS50cyIsICIuLi9zcmMvc2FmZXR5L2d1YXJkLnRzIiwgIi4uL3NyYy90b29sc1Byb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIEBmaWxlIGNvbmZpZy50c1xuICogUGx1Z2luIGNvbmZpZ3VyYXRpb24gc2NoZW1hIFx1MjAxNCBnZW5lcmF0ZXMgdGhlIExNIFN0dWRpbyBzZXR0aW5ncyBVSS5cbiAqXG4gKiBHaXZlcyB0aGUgdXNlciBoaWdoLWNvbnRyb2wgb3ZlciBldmVyeSBhc3BlY3Qgb2YgdGhlIGNvbXB1dGVyOlxuICogICBcdTIwMjIgTmV0d29yaywgcGVyc2lzdGVuY2UsIGJhc2UgaW1hZ2VcbiAqICAgXHUyMDIyIFJlc291cmNlIGxpbWl0cyAoQ1BVLCBSQU0sIGRpc2spXG4gKiAgIFx1MjAyMiBFeGVjdXRpb24gY29uc3RyYWludHMgKHRpbWVvdXQsIG91dHB1dCBjYXAsIHRvb2wgY2FsbCBidWRnZXQpXG4gKiAgIFx1MjAyMiBQYWNrYWdlIHByZXNldHMsIHBvcnQgZm9yd2FyZGluZywgaG9zdCBtb3VudHNcbiAqICAgXHUyMDIyIFNhZmV0eSBhbmQgY29udGV4dCBpbmplY3Rpb24gdG9nZ2xlc1xuICovXG5cbmltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJpbnRlcm5ldEFjY2Vzc1wiLFxuICAgIFwic2VsZWN0XCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiSW50ZXJuZXQgQWNjZXNzXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJBbGxvdyB0aGUgY29tcHV0ZXIgdG8gcmVhY2ggdGhlIGludGVybmV0ICh0b2dnbGUgY29udGFpbmVyIG5ldHdvcmsgbW9kZSlcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgeyB2YWx1ZTogXCJvblwiLCBkaXNwbGF5TmFtZTogXCJPbiBcdTIwMTQgY29udGFpbmVyIGhhcyBmdWxsIGludGVybmV0IGFjY2Vzc1wiIH0sXG4gICAgICAgIHsgdmFsdWU6IFwib2ZmXCIsIGRpc3BsYXlOYW1lOiBcIk9mZiBcdTIwMTQgY29tcGxldGVseSBhaXJnYXBwZWQsIG5vIG5ldHdvcmtcIiB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwib2ZmXCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJwZXJzaXN0ZW5jZU1vZGVcIixcbiAgICBcInNlbGVjdFwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBlcnNpc3RlbmNlIE1vZGVcIixcbiAgICAgIHN1YnRpdGxlOiBcIldoZXRoZXIgdGhlIGNvbXB1dGVyIGtlZXBzIGl0cyBzdGF0ZSB3aGVuIExNIFN0dWRpbyBjbG9zZXNcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcInBlcnNpc3RlbnRcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTpcbiAgICAgICAgICAgIFwiUGVyc2lzdGVudCBcdTIwMTQga2VlcCBmaWxlcywgcGFja2FnZXMsIGFuZCBzdGF0ZSBhY3Jvc3Mgc2Vzc2lvbnNcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcImVwaGVtZXJhbFwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVwaGVtZXJhbCBcdTIwMTQgZnJlc2ggY2xlYW4gZW52aXJvbm1lbnQgZXZlcnkgdGltZVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwicGVyc2lzdGVudFwiLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiYmFzZUltYWdlXCIsXG4gICAgXCJzZWxlY3RcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJCYXNlIEltYWdlXCIsXG4gICAgICBzdWJ0aXRsZTogXCJUaGUgTGludXggZGlzdHJpYnV0aW9uIHJ1bm5pbmcgaW5zaWRlIHRoZSBjb250YWluZXJcIixcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcInVidW50dToyNC4wNFwiLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIlVidW50dSAyNC4wNCAocmVjb21tZW5kZWQgXHUyMDE0IHdpZGVzdCBjb21wYXRpYmlsaXR5KVwiLFxuICAgICAgICB9LFxuICAgICAgICB7IHZhbHVlOiBcInVidW50dToyMi4wNFwiLCBkaXNwbGF5TmFtZTogXCJVYnVudHUgMjIuMDQgKExUUyBzdGFibGUpXCIgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBcImRlYmlhbjpib29rd29ybS1zbGltXCIsXG4gICAgICAgICAgZGlzcGxheU5hbWU6IFwiRGViaWFuIEJvb2t3b3JtIFNsaW0gKGxpZ2h0d2VpZ2h0KVwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IFwiYWxwaW5lOjMuMjBcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTogXCJBbHBpbmUgMy4yMCAodWx0cmEtbGlnaHR3ZWlnaHQgfjVNQiwgbXVzbCBsaWJjKVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIFwidWJ1bnR1OjI0LjA0XCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJjcHVMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNQVSBDb3JlIExpbWl0XCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIENQVSBjb3JlcyBhbGxvY2F0ZWQgdG8gdGhlIGNvbXB1dGVyICgwID0gbm8gbGltaXQpXCIsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDgsXG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBzbGlkZXI6IHsgc3RlcDogMSwgbWluOiAwLCBtYXg6IDggfSxcbiAgICB9LFxuICAgIDIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJtZW1vcnlMaW1pdE1CXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWVtb3J5IExpbWl0IChNQilcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gUkFNIGluIG1lZ2FieXRlcyAoMjU2XHUyMDEzODE5MilcIixcbiAgICAgIG1pbjogMjU2LFxuICAgICAgbWF4OiA4MTkyLFxuICAgICAgaW50OiB0cnVlLFxuICAgICAgc2xpZGVyOiB7IHN0ZXA6IDI1NiwgbWluOiAyNTYsIG1heDogODE5MiB9LFxuICAgIH0sXG4gICAgMTAyNCxcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcImRpc2tMaW1pdE1CXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiRGlzayBMaW1pdCAoTUIpXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJNYXhpbXVtIGRpc2sgc3BhY2UgaW4gbWVnYWJ5dGVzICg1MTJcdTIwMTMzMjc2OCkuIE9ubHkgZW5mb3JjZWQgb24gbmV3IGNvbnRhaW5lcnMuXCIsXG4gICAgICBtaW46IDUxMixcbiAgICAgIG1heDogMzI3NjgsXG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBzbGlkZXI6IHsgc3RlcDogNTEyLCBtaW46IDUxMiwgbWF4OiAzMjc2OCB9LFxuICAgIH0sXG4gICAgNDA5NixcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcImNvbW1hbmRUaW1lb3V0XCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiQ29tbWFuZCBUaW1lb3V0IChzZWNvbmRzKVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiTWF4aW11bSB0aW1lIGEgc2luZ2xlIGNvbW1hbmQgY2FuIHJ1biBiZWZvcmUgYmVpbmcga2lsbGVkICg1LTMwMClcIixcbiAgICAgIG1pbjogNSxcbiAgICAgIG1heDogMzAwLFxuICAgICAgaW50OiB0cnVlLFxuICAgICAgc2xpZGVyOiB7IHN0ZXA6IDUsIG1pbjogNSwgbWF4OiAzMDAgfSxcbiAgICB9LFxuICAgIDMwLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwibWF4T3V0cHV0U2l6ZVwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1heCBPdXRwdXQgU2l6ZSAoS0IpXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJNYXhpbXVtIHN0ZG91dC9zdGRlcnIgcmV0dXJuZWQgdG8gdGhlIG1vZGVsIHBlciBjb21tYW5kICgxXHUyMDEzMTI4IEtCKS4gTGFyZ2VyIG91dHB1dCBpcyB0cnVuY2F0ZWQuXCIsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDEyOCxcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIHNsaWRlcjogeyBzdGVwOiAxLCBtaW46IDEsIG1heDogMTI4IH0sXG4gICAgfSxcbiAgICAzMixcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcIm1heFRvb2xDYWxsc1BlclR1cm5cIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJNYXggVG9vbCBDYWxscyBQZXIgVHVyblwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiTWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIG1vZGVsIGNhbiB1c2UgdGhlIGNvbXB1dGVyIHBlciBjb252ZXJzYXRpb25hbCB0dXJuICgxLTEwMCkuIFJlc2V0cyBlYWNoIHRpbWUgeW91IHNlbmQgYSBtZXNzYWdlLiBQcmV2ZW50cyBpbmZpbml0ZSBsb29wcy5cIixcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMTAwLFxuICAgICAgaW50OiB0cnVlLFxuICAgICAgc2xpZGVyOiB7IHN0ZXA6IDEsIG1pbjogMSwgbWF4OiAxMDAgfSxcbiAgICB9LFxuICAgIDI1LFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiYXV0b0luc3RhbGxQcmVzZXRcIixcbiAgICBcInNlbGVjdFwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkF1dG8tSW5zdGFsbCBQYWNrYWdlc1wiLFxuICAgICAgc3VidGl0bGU6IFwiUHJlLWluc3RhbGwgY29tbW9uIHRvb2xzIHdoZW4gdGhlIGNvbnRhaW5lciBpcyBmaXJzdCBjcmVhdGVkXCIsXG4gICAgICBvcHRpb25zOiBbXG4gICAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCBkaXNwbGF5TmFtZTogXCJOb25lIFx1MjAxNCBiYXJlIE9TLCBpbnN0YWxsIG1hbnVhbGx5XCIgfSxcbiAgICAgICAgeyB2YWx1ZTogXCJtaW5pbWFsXCIsIGRpc3BsYXlOYW1lOiBcIk1pbmltYWwgXHUyMDE0IGN1cmwsIHdnZXQsIGdpdCwgdmltLCBqcVwiIH0sXG4gICAgICAgIHsgdmFsdWU6IFwicHl0aG9uXCIsIGRpc3BsYXlOYW1lOiBcIlB5dGhvbiBcdTIwMTQgcHl0aG9uMywgcGlwLCB2ZW52XCIgfSxcbiAgICAgICAgeyB2YWx1ZTogXCJub2RlXCIsIGRpc3BsYXlOYW1lOiBcIk5vZGUuanMgXHUyMDE0IG5vZGVqcywgbnBtXCIgfSxcbiAgICAgICAgeyB2YWx1ZTogXCJidWlsZFwiLCBkaXNwbGF5TmFtZTogXCJCdWlsZCBUb29scyBcdTIwMTQgZ2NjLCBjbWFrZSwgbWFrZVwiIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogXCJmdWxsXCIsXG4gICAgICAgICAgZGlzcGxheU5hbWU6IFwiRnVsbCBcdTIwMTQgYWxsIG9mIHRoZSBhYm92ZSArIG5ldHdvcmtpbmcgdG9vbHNcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBcIm1pbmltYWxcIixcbiAgKVxuXG4gIC5maWVsZChcbiAgICBcInBvcnRGb3J3YXJkc1wiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiUG9ydCBGb3J3YXJkc1wiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiQ29tbWEtc2VwYXJhdGVkIGhvc3Q6Y29udGFpbmVyIHBvcnQgcGFpcnMgKGUuZy4sICc4MDgwOjgwLDMwMDA6MzAwMCcpLiBBbGxvd3MgYWNjZXNzaW5nIHNlcnZpY2VzIHJ1bm5pbmcgaW5zaWRlIHRoZSBjb250YWluZXIuXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiaG9zdE1vdW50UGF0aFwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiU2hhcmVkIEZvbGRlciAoSG9zdCBNb3VudClcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIkFic29sdXRlIHBhdGggdG8gYSBmb2xkZXIgb24geW91ciBjb21wdXRlciB0aGF0IHdpbGwgYmUgYWNjZXNzaWJsZSBpbnNpZGUgdGhlIGNvbnRhaW5lciBhdCAvbW50L3NoYXJlZC4gTGVhdmUgZW1wdHkgdG8gZGlzYWJsZS5cIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcblxuICAuZmllbGQoXG4gICAgXCJzdHJpY3RTYWZldHlcIixcbiAgICBcInNlbGVjdFwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlN0cmljdCBTYWZldHkgTW9kZVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiQmxvY2sga25vd24gZGVzdHJ1Y3RpdmUgY29tbWFuZHMgKGZvcmsgYm9tYnMsIGRpc2sgd2lwZXJzKS4gRGlzYWJsZSBvbmx5IGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlwiLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IFwib25cIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTpcbiAgICAgICAgICAgIFwiT24gXHUyMDE0IGJsb2NrIG9idmlvdXNseSBkZXN0cnVjdGl2ZSBjb21tYW5kcyAocmVjb21tZW5kZWQpXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogXCJvZmZcIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTogXCJPZmYgXHUyMDE0IGFsbG93IGV2ZXJ5dGhpbmcsIEkgYWNjZXB0IHRoZSByaXNrXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAgXCJvblwiLFxuICApXG5cbiAgLmZpZWxkKFxuICAgIFwiYXV0b0luamVjdENvbnRleHRcIixcbiAgICBcInNlbGVjdFwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkF1dG8tSW5qZWN0IENvbXB1dGVyIENvbnRleHRcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIkF1dG9tYXRpY2FsbHkgdGVsbCB0aGUgbW9kZWwgYWJvdXQgaXRzIGNvbXB1dGVyIChPUywgaW5zdGFsbGVkIHRvb2xzLCBydW5uaW5nIHByb2Nlc3NlcykgYXQgdGhlIHN0YXJ0IG9mIGVhY2ggdHVyblwiLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IFwib25cIixcbiAgICAgICAgICBkaXNwbGF5TmFtZTpcbiAgICAgICAgICAgIFwiT24gXHUyMDE0IG1vZGVsIGFsd2F5cyBrbm93cyBpdHMgY29tcHV0ZXIgc3RhdGUgKHJlY29tbWVuZGVkKVwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IFwib2ZmXCIsXG4gICAgICAgICAgZGlzcGxheU5hbWU6IFwiT2ZmIFx1MjAxNCBtb2RlbCBkaXNjb3ZlcnMgc3RhdGUgdmlhIHRvb2xzIG9ubHlcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBcIm9uXCIsXG4gIClcblxuICAuYnVpbGQoKTtcbiIsICIvKipcbiAqIEBmaWxlIGNvbnRhaW5lci9ydW50aW1lLnRzXG4gKiBBdXRvLWRldGVjdHMgRG9ja2VyIG9yIFBvZG1hbiBvbiB0aGUgaG9zdCBzeXN0ZW0uXG4gKlxuICogUHJpb3JpdHk6IERvY2tlciBmaXJzdCAobW9zdCBjb21tb24pLCB0aGVuIFBvZG1hbiBmYWxsYmFjay5cbiAqIENhY2hlcyB0aGUgcmVzdWx0IGFmdGVyIGZpcnN0IHN1Y2Nlc3NmdWwgZGV0ZWN0aW9uLlxuICovXG5cbmltcG9ydCB7IGV4ZWNGaWxlIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgdHlwZSB7IFJ1bnRpbWVJbmZvLCBSdW50aW1lS2luZCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5jb25zdCBleGVjQXN5bmMgPSBwcm9taXNpZnkoZXhlY0ZpbGUpO1xuXG4vKiogQ2FjaGVkIHJ1bnRpbWUgaW5mbyBhZnRlciBmaXJzdCBkZXRlY3Rpb24uICovXG5sZXQgY2FjaGVkUnVudGltZTogUnVudGltZUluZm8gfCBudWxsID0gbnVsbDtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGRldGVjdCBhIHNwZWNpZmljIHJ1bnRpbWUgYnkgcnVubmluZyBgPGNtZD4gLS12ZXJzaW9uYC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcHJvYmUoXG4gIGNtZDogc3RyaW5nLFxuICBraW5kOiBSdW50aW1lS2luZCxcbik6IFByb21pc2U8UnVudGltZUluZm8gfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGV4ZWNBc3luYyhjbWQsIFtcIi0tdmVyc2lvblwiXSwgeyB0aW1lb3V0OiA1XzAwMCB9KTtcbiAgICBjb25zdCB2ZXJzaW9uID0gc3Rkb3V0LnRyaW0oKS5zcGxpdChcIlxcblwiKVswXSA/PyBcInVua25vd25cIjtcbiAgICByZXR1cm4geyBraW5kLCBwYXRoOiBjbWQsIHZlcnNpb24gfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHJ1bnRpbWUgY2FuZGlkYXRlcyBvcmRlcmVkIGJ5IHByaW9yaXR5LlxuICogT24gV2luZG93cywgYWxzbyBwcm9iZXMga25vd24gRG9ja2VyIERlc2t0b3AgaW5zdGFsbCBwYXRocyBzaW5jZVxuICogTE0gU3R1ZGlvIG1heSBsYXVuY2ggd2l0aCBhIHJlc3RyaWN0ZWQgUEFUSCB0aGF0IG9taXRzIFByb2dyYW0gRmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGdldFJ1bnRpbWVDYW5kaWRhdGVzKCk6IEFycmF5PHsgY21kOiBzdHJpbmc7IGtpbmQ6IFJ1bnRpbWVLaW5kIH0+IHtcbiAgY29uc3QgY2FuZGlkYXRlczogQXJyYXk8eyBjbWQ6IHN0cmluZzsga2luZDogUnVudGltZUtpbmQgfT4gPSBbXG4gICAgeyBjbWQ6IFwiZG9ja2VyXCIsIGtpbmQ6IFwiZG9ja2VyXCIgfSxcbiAgICB7IGNtZDogXCJwb2RtYW5cIiwga2luZDogXCJwb2RtYW5cIiB9LFxuICBdO1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgY2FuZGlkYXRlcy5wdXNoKFxuICAgICAge1xuICAgICAgICBjbWQ6IFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1xcXFxiaW5cXFxcZG9ja2VyLmV4ZVwiLFxuICAgICAgICBraW5kOiBcImRvY2tlclwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY21kOiBcIkM6XFxcXFByb2dyYW0gRmlsZXNcXFxcRG9ja2VyXFxcXERvY2tlclxcXFxyZXNvdXJjZXNcXFxcZG9ja2VyLmV4ZVwiLFxuICAgICAgICBraW5kOiBcImRvY2tlclwiLFxuICAgICAgfSxcbiAgICApO1xuICB9XG4gIHJldHVybiBjYW5kaWRhdGVzO1xufVxuXG4vKipcbiAqIERldGVjdCB0aGUgYXZhaWxhYmxlIGNvbnRhaW5lciBydW50aW1lLlxuICogVHJpZXMgRG9ja2VyIGZpcnN0LCB0aGVuIFBvZG1hbi4gQ2FjaGVzIHRoZSByZXN1bHQuXG4gKlxuICogQHRocm93cyBFcnJvciBpZiBuZWl0aGVyIERvY2tlciBub3IgUG9kbWFuIGlzIGZvdW5kLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGV0ZWN0UnVudGltZSgpOiBQcm9taXNlPFJ1bnRpbWVJbmZvPiB7XG4gIGlmIChjYWNoZWRSdW50aW1lKSByZXR1cm4gY2FjaGVkUnVudGltZTtcblxuICBmb3IgKGNvbnN0IHsgY21kLCBraW5kIH0gb2YgZ2V0UnVudGltZUNhbmRpZGF0ZXMoKSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb2JlKGNtZCwga2luZCk7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgY2FjaGVkUnVudGltZSA9IHJlc3VsdDtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaXNXaW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBcIk5vIGNvbnRhaW5lciBydW50aW1lIGZvdW5kLiBQbGVhc2UgaW5zdGFsbCBEb2NrZXIgRGVza3RvcFwiICtcbiAgICAgIChpc1dpblxuICAgICAgICA/IFwiIGZyb20gaHR0cHM6Ly9kb2NzLmRvY2tlci5jb20vZGVza3RvcC9zZXR1cC9pbnN0YWxsL3dpbmRvd3MtaW5zdGFsbC9cIlxuICAgICAgICA6IFwiIChodHRwczovL2RvY3MuZG9ja2VyLmNvbS9nZXQtZG9ja2VyLylcIikgK1xuICAgICAgXCIgb3IgUG9kbWFuIChodHRwczovL3BvZG1hbi5pby9nZXR0aW5nLXN0YXJ0ZWQvaW5zdGFsbGF0aW9uKSB0byB1c2UgdGhpcyBwbHVnaW4uXCIsXG4gICk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBjb250YWluZXIgcnVudGltZSBpcyBhdmFpbGFibGUgd2l0aG91dCB0aHJvd2luZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzUnVudGltZUF2YWlsYWJsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBkZXRlY3RSdW50aW1lKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgY2FjaGVkIHJ1bnRpbWUsIG9yIG51bGwgaWYgbm90IHlldCBkZXRlY3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlZFJ1bnRpbWUoKTogUnVudGltZUluZm8gfCBudWxsIHtcbiAgcmV0dXJuIGNhY2hlZFJ1bnRpbWU7XG59XG5cbi8qKlxuICogQ2xlYXIgdGhlIGNhY2hlZCBydW50aW1lICh1c2VmdWwgZm9yIHRlc3Rpbmcgb3IgcmUtZGV0ZWN0aW9uKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUnVudGltZUNhY2hlKCk6IHZvaWQge1xuICBjYWNoZWRSdW50aW1lID0gbnVsbDtcbn1cbiIsICIvKipcbiAqIEBmaWxlIGNvbnN0YW50cy50c1xuICogU2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgZXZlcnkgdHVuYWJsZSBwYXJhbWV0ZXIuXG4gKiBHcm91cGVkIGJ5IHN1YnN5c3RlbSBmb3IgZWFzeSBkaXNjb3ZlcnkuXG4gKi9cblxuLyoqIE5hbWUgcHJlZml4IGZvciBtYW5hZ2VkIGNvbnRhaW5lcnMuICovXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX05BTUVfUFJFRklYID0gXCJsbXMtY29tcHV0ZXJcIjtcbi8qKiBEZWZhdWx0IGNvbnRhaW5lciBpbWFnZS4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0lNQUdFID0gXCJ1YnVudHU6MjQuMDRcIjtcbi8qKiBMaWdodHdlaWdodCBhbHRlcm5hdGl2ZSBpbWFnZS4gKi9cbmV4cG9ydCBjb25zdCBBTFBJTkVfSU1BR0UgPSBcImFscGluZTozLjIwXCI7XG4vKiogRGVmYXVsdCB3b3JraW5nIGRpcmVjdG9yeSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbmV4cG9ydCBjb25zdCBDT05UQUlORVJfV09SS0RJUiA9IFwiL2hvbWUvdXNlclwiO1xuLyoqIERlZmF1bHQgc2hlbGwgdG8gZXhlYyBpbnRvLiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9TSEVMTCA9IFwiL2Jpbi9iYXNoXCI7XG4vKiogQWxwaW5lIHNoZWxsIGZhbGxiYWNrLiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9TSEVMTF9BTFBJTkUgPSBcIi9iaW4vc2hcIjtcblxuLyoqIERlZmF1bHQgQ1BVIGNvcmUgbGltaXQgKDAgPSB1bmxpbWl0ZWQpLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ1BVX0xJTUlUID0gMjtcbi8qKiBNYXhpbXVtIGFsbG93ZWQgQ1BVIGNvcmVzLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9DUFVfTElNSVQgPSA4O1xuLyoqIERlZmF1bHQgbWVtb3J5IGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUVNT1JZX0xJTUlUX01CID0gMTAyNDtcbi8qKiBNYXhpbXVtIG1lbW9yeSBsaW1pdCBpbiBNQi4gKi9cbmV4cG9ydCBjb25zdCBNQVhfTUVNT1JZX0xJTUlUX01CID0gODE5Mjtcbi8qKiBEZWZhdWx0IGRpc2sgc2l6ZSBsaW1pdCBpbiBNQi4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0RJU0tfTElNSVRfTUIgPSA0MDk2O1xuLyoqIE1heGltdW0gZGlzayBsaW1pdCBpbiBNQi4gKi9cbmV4cG9ydCBjb25zdCBNQVhfRElTS19MSU1JVF9NQiA9IDMyNzY4O1xuXG4vKiogRGVmYXVsdCBjb21tYW5kIHRpbWVvdXQgaW4gc2Vjb25kcy4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RJTUVPVVRfU0VDT05EUyA9IDMwO1xuLyoqIE1pbmltdW0gdGltZW91dC4gKi9cbmV4cG9ydCBjb25zdCBNSU5fVElNRU9VVF9TRUNPTkRTID0gNTtcbi8qKiBNYXhpbXVtIHRpbWVvdXQuICovXG5leHBvcnQgY29uc3QgTUFYX1RJTUVPVVRfU0VDT05EUyA9IDMwMDtcbi8qKiBEZWZhdWx0IG1heCBvdXRwdXQgc2l6ZSBpbiBieXRlcyByZXR1cm5lZCB0byB0aGUgbW9kZWwuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTID0gMzJfNzY4O1xuLyoqIEFic29sdXRlIG1heCBvdXRwdXQgYnl0ZXMuICovXG5leHBvcnQgY29uc3QgTUFYX09VVFBVVF9CWVRFUyA9IDEzMV8wNzI7XG4vKiogRGVmYXVsdCBtYXggdG9vbCBjYWxscyBwZXIgdHVybi4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX01BWF9UT09MX0NBTExTX1BFUl9UVVJOID0gMjU7XG4vKiogTWluaW11bSBhbGxvd2VkIHRvb2wgY2FsbHMgcGVyIHR1cm4uICovXG5leHBvcnQgY29uc3QgTUlOX1RPT0xfQ0FMTFNfUEVSX1RVUk4gPSAxO1xuLyoqIE1heGltdW0gYWxsb3dlZCB0b29sIGNhbGxzIHBlciB0dXJuLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9UT09MX0NBTExTX1BFUl9UVVJOID0gMTAwO1xuXG4vKiogTWF4IGZpbGUgc2l6ZSBmb3IgcmVhZCBvcGVyYXRpb25zIChieXRlcykuICovXG5leHBvcnQgY29uc3QgTUFYX0ZJTEVfUkVBRF9CWVRFUyA9IDUxMl8wMDA7XG4vKiogTWF4IGZpbGUgc2l6ZSBmb3Igd3JpdGUgb3BlcmF0aW9ucyAoYnl0ZXMpLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9GSUxFX1dSSVRFX0JZVEVTID0gNV8yNDJfODgwO1xuLyoqIE1heCBmaWxlIHNpemUgZm9yIHVwbG9hZC9kb3dubG9hZCAoYnl0ZXMpLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9UUkFOU0ZFUl9CWVRFUyA9IDUyXzQyOF84MDA7XG4vKiogRGVmYXVsdCBob3N0IHRyYW5zZmVyIGRpcmVjdG9yeS4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RSQU5TRkVSX0RJUiA9IFwibG1zLWNvbXB1dGVyLWZpbGVzXCI7XG5cbi8qKiBDb21tYW5kcyBibG9ja2VkIGluIHN0cmljdCBtb2RlIChwYXR0ZXJuLW1hdGNoZWQpLiAqL1xuZXhwb3J0IGNvbnN0IEJMT0NLRURfQ09NTUFORFNfU1RSSUNUOiByZWFkb25seSBzdHJpbmdbXSA9IFtcbiAgXCI6KCl7IDp8OiYgfTs6XCIsIC8vIGZvcmsgYm9tYlxuICBcInJtIC1yZiAvXCIsIC8vIHJvb3Qgd2lwZVxuICBcInJtIC1yZiAvKlwiLCAvLyByb290IHdpcGUgdmFyaWFudFxuICBcIm1rZnNcIiwgLy8gZm9ybWF0IGZpbGVzeXN0ZW1cbiAgXCJkZCBpZj0vZGV2L3plcm9cIiwgLy8gZGlzayBkZXN0cm95ZXJcbiAgXCJkZCBpZj0vZGV2L3JhbmRvbVwiLCAvLyBkaXNrIGRlc3Ryb3llclxuICBcIj4gL2Rldi9zZGFcIiwgLy8gcmF3IGRpc2sgd3JpdGVcbiAgXCJjaG1vZCAtUiA3NzcgL1wiLCAvLyBwZXJtaXNzaW9uIG51a2VcbiAgXCJjaG93biAtUlwiLCAvLyBvd25lcnNoaXAgbnVrZSBvbiByb290XG5dO1xuXG4vKipcbiAqIEVudmlyb25tZW50IHZhcmlhYmxlcyBpbmplY3RlZCBpbnRvIGV2ZXJ5IGNvbnRhaW5lci5cbiAqIFRoZXNlIHRlbGwgdGhlIG1vZGVsIGFib3V0IGl0cyBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9FTlZfVkFSUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgVEVSTTogXCJ4dGVybS0yNTZjb2xvclwiLFxuICBMQU5HOiBcImVuX1VTLlVURi04XCIsXG4gIEhPTUU6IENPTlRBSU5FUl9XT1JLRElSLFxuICBMTVNfQ09NUFVURVI6IFwiMVwiLFxufTtcblxuLyoqIFBhY2thZ2Ugc2V0cyBhdmFpbGFibGUgZm9yIHByZS1pbnN0YWxsYXRpb24uICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9QUkVTRVRTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XG4gIG1pbmltYWw6IFtcImN1cmxcIiwgXCJ3Z2V0XCIsIFwiZ2l0XCIsIFwidmltLXRpbnlcIiwgXCJqcVwiXSxcbiAgcHl0aG9uOiBbXCJweXRob24zXCIsIFwicHl0aG9uMy1waXBcIiwgXCJweXRob24zLXZlbnZcIl0sXG4gIG5vZGU6IFtcIm5vZGVqc1wiLCBcIm5wbVwiXSxcbiAgYnVpbGQ6IFtcImJ1aWxkLWVzc2VudGlhbFwiLCBcImNtYWtlXCIsIFwicGtnLWNvbmZpZ1wiXSxcbiAgbmV0d29yazogW1wibmV0LXRvb2xzXCIsIFwiaXB1dGlscy1waW5nXCIsIFwiZG5zdXRpbHNcIiwgXCJ0cmFjZXJvdXRlXCIsIFwibm1hcFwiXSxcbiAgZnVsbDogW1xuICAgIFwiY3VybFwiLFxuICAgIFwid2dldFwiLFxuICAgIFwiZ2l0XCIsXG4gICAgXCJ2aW0tdGlueVwiLFxuICAgIFwianFcIixcbiAgICBcInB5dGhvbjNcIixcbiAgICBcInB5dGhvbjMtcGlwXCIsXG4gICAgXCJweXRob24zLXZlbnZcIixcbiAgICBcIm5vZGVqc1wiLFxuICAgIFwibnBtXCIsXG4gICAgXCJidWlsZC1lc3NlbnRpYWxcIixcbiAgICBcImNtYWtlXCIsXG4gICAgXCJuZXQtdG9vbHNcIixcbiAgICBcImlwdXRpbHMtcGluZ1wiLFxuICAgIFwiaHRvcFwiLFxuICAgIFwidHJlZVwiLFxuICAgIFwidW56aXBcIixcbiAgICBcInppcFwiLFxuICBdLFxufTtcblxuLyoqIEFscGluZSBlcXVpdmFsZW50cyBmb3IgcGFja2FnZSBwcmVzZXRzLiAqL1xuZXhwb3J0IGNvbnN0IFBBQ0tBR0VfUFJFU0VUU19BTFBJTkU6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcbiAgbWluaW1hbDogW1wiY3VybFwiLCBcIndnZXRcIiwgXCJnaXRcIiwgXCJ2aW1cIiwgXCJqcVwiXSxcbiAgcHl0aG9uOiBbXCJweXRob24zXCIsIFwicHkzLXBpcFwiXSxcbiAgbm9kZTogW1wibm9kZWpzXCIsIFwibnBtXCJdLFxuICBidWlsZDogW1wiYnVpbGQtYmFzZVwiLCBcImNtYWtlXCIsIFwicGtnY29uZlwiXSxcbiAgbmV0d29yazogW1wibmV0LXRvb2xzXCIsIFwiaXB1dGlsc1wiLCBcImJpbmQtdG9vbHNcIiwgXCJ0cmFjZXJvdXRlXCIsIFwibm1hcFwiXSxcbiAgZnVsbDogW1xuICAgIFwiY3VybFwiLFxuICAgIFwid2dldFwiLFxuICAgIFwiZ2l0XCIsXG4gICAgXCJ2aW1cIixcbiAgICBcImpxXCIsXG4gICAgXCJweXRob24zXCIsXG4gICAgXCJweTMtcGlwXCIsXG4gICAgXCJub2RlanNcIixcbiAgICBcIm5wbVwiLFxuICAgIFwiYnVpbGQtYmFzZVwiLFxuICAgIFwiY21ha2VcIixcbiAgICBcIm5ldC10b29sc1wiLFxuICAgIFwiaXB1dGlsc1wiLFxuICAgIFwiaHRvcFwiLFxuICAgIFwidHJlZVwiLFxuICAgIFwidW56aXBcIixcbiAgICBcInppcFwiLFxuICBdLFxufTtcblxuLyoqIE1heCBjaGFycyBvZiBpbmplY3RlZCBjb21wdXRlciBjb250ZXh0LiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTID0gMl8wMDA7XG5cbi8qKiBWYWxpZCBiYXNlIGltYWdlcyB0aGUgdXNlciBjYW4gc2VsZWN0LiAqL1xuZXhwb3J0IGNvbnN0IFZBTElEX0lNQUdFUyA9IFtcbiAgXCJ1YnVudHU6MjQuMDRcIixcbiAgXCJ1YnVudHU6MjIuMDRcIixcbiAgXCJhbHBpbmU6My4yMFwiLFxuICBcImRlYmlhbjpib29rd29ybS1zbGltXCIsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQ29udGFpbmVySW1hZ2UgPSAodHlwZW9mIFZBTElEX0lNQUdFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IE5FVFdPUktfTU9ERVMgPSBbXG4gIFwibm9uZVwiLFxuICBcImJyaWRnZVwiLFxuICBcInNsaXJwNG5ldG5zXCIsXG4gIFwicGFzdGFcIixcbiAgXCJwb2RtYW4tZGVmYXVsdFwiLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIE5ldHdvcmtNb2RlID0gKHR5cGVvZiBORVRXT1JLX01PREVTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgUEVSU0lTVEVOQ0VfTU9ERVMgPSBbXCJwZXJzaXN0ZW50XCIsIFwiZXBoZW1lcmFsXCJdIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgUGVyc2lzdGVuY2VNb2RlID0gKHR5cGVvZiBQRVJTSVNURU5DRV9NT0RFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9TVEFURVMgPSBbXG4gIFwicnVubmluZ1wiLFxuICBcInN0b3BwZWRcIixcbiAgXCJub3RfZm91bmRcIixcbiAgXCJlcnJvclwiLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIENvbnRhaW5lclN0YXRlID0gKHR5cGVvZiBDT05UQUlORVJfU1RBVEVTKVtudW1iZXJdO1xuIiwgIi8qKlxuICogQGZpbGUgY29udGFpbmVyL2VuZ2luZS50c1xuICogQ29udGFpbmVyIGxpZmVjeWNsZSBlbmdpbmUgXHUyMDE0IGNyZWF0ZXMsIHN0YXJ0cywgc3RvcHMsIGFuZCBleGVjdXRlc1xuICogY29tbWFuZHMgaW5zaWRlIHRoZSBtb2RlbCdzIGRlZGljYXRlZCBMaW51eCBjb21wdXRlci5cbiAqXG4gKiBBbGwgY29udGFpbmVyIG9wZXJhdGlvbnMgZ28gdGhyb3VnaCB0aGlzIG1vZHVsZS4gVGhlIGVuZ2luZSBpc1xuICogbGF6eS1pbml0aWFsaXplZDogdGhlIGNvbnRhaW5lciBpcyBvbmx5IGNyZWF0ZWQvc3RhcnRlZCB3aGVuIHRoZVxuICogZmlyc3QgdG9vbCBjYWxsIGhhcHBlbnMuXG4gKlxuICogU3VwcG9ydHMgRG9ja2VyIGFuZCBQb2RtYW4gaW50ZXJjaGFuZ2VhYmx5IHZpYSB0aGUgZGV0ZWN0ZWQgcnVudGltZS5cbiAqL1xuXG5pbXBvcnQgeyBleGVjRmlsZSwgc3Bhd24gfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSBcInV0aWxcIjtcbmltcG9ydCB7IG1rZGlyU3luYywgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSBcIm9zXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRldGVjdFJ1bnRpbWUgfSBmcm9tIFwiLi9ydW50aW1lXCI7XG5pbXBvcnQge1xuICBDT05UQUlORVJfTkFNRV9QUkVGSVgsXG4gIENPTlRBSU5FUl9XT1JLRElSLFxuICBDT05UQUlORVJfU0hFTEwsXG4gIENPTlRBSU5FUl9TSEVMTF9BTFBJTkUsXG4gIENPTlRBSU5FUl9FTlZfVkFSUyxcbiAgREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTLFxuICBNQVhfT1VUUFVUX0JZVEVTLFxuICBQQUNLQUdFX1BSRVNFVFMsXG4gIFBBQ0tBR0VfUFJFU0VUU19BTFBJTkUsXG59IGZyb20gXCIuLi9jb25zdGFudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgUnVudGltZUluZm8sXG4gIENvbnRhaW5lckNyZWF0ZU9wdGlvbnMsXG4gIENvbnRhaW5lckluZm8sXG4gIEV4ZWNSZXN1bHQsXG4gIEVudmlyb25tZW50SW5mbyxcbiAgUHJvY2Vzc0luZm8sXG59IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBDb250YWluZXJJbWFnZSwgQ29udGFpbmVyU3RhdGUsIE5ldHdvcmtNb2RlIH0gZnJvbSBcIi4uL2NvbnN0YW50c1wiO1xuXG5jb25zdCBleGVjQXN5bmMgPSBwcm9taXNpZnkoZXhlY0ZpbGUpO1xuXG4vKipcbiAqIENvbnZlcnQgYSBXaW5kb3dzIGhvc3QgcGF0aCAoQzpcXFVzZXJzXFxmb28pIHRvIHRoZSBmb3JtYXQgRG9ja2VyXG4gKiBvbiBXaW5kb3dzIGV4cGVjdHMgZm9yIHZvbHVtZSBtb3VudHMgKC8vYy9Vc2Vycy9mb28pLlxuICogTm8tb3Agb24gTGludXgvTWFjLlxuICovXG5mdW5jdGlvbiB0b0RvY2tlclBhdGgoaG9zdFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcIndpbjMyXCIpIHJldHVybiBob3N0UGF0aDtcbiAgcmV0dXJuIGhvc3RQYXRoXG4gICAgLnJlcGxhY2UoL14oW0EtWmEtel0pOlxcXFwvLCAoXywgZCkgPT4gYC8vJHtkLnRvTG93ZXJDYXNlKCl9L2ApXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xufVxuXG4vKipcbiAqIEF1Z21lbnQgUEFUSCB3aXRoIHBsYXRmb3JtLXNwZWNpZmljIGxvY2F0aW9ucyB3aGVyZSBEb2NrZXIvUG9kbWFuXG4gKiBoZWxwZXIgYmluYXJpZXMgbGl2ZSwgc28gdGhleSdyZSBmaW5kYWJsZSByZWdhcmRsZXNzIG9mIHdoYXQgUEFUSFxuICogTE0gU3R1ZGlvIGluaGVyaXRlZCBmcm9tIHRoZSBPUyBsYXVuY2hlci5cbiAqL1xuZnVuY3Rpb24gZ2V0UnVudGltZUVudigpOiBOb2RlSlMuUHJvY2Vzc0VudiB7XG4gIGNvbnN0IGJhc2UgPSBwcm9jZXNzLmVudi5QQVRIID8/IFwiXCI7XG4gIGNvbnN0IGV4dHJhID1cbiAgICBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCJcbiAgICAgID8gW1xuICAgICAgICAgIFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1xcXFxiaW5cIixcbiAgICAgICAgICBcIkM6XFxcXFByb2dyYW0gRmlsZXNcXFxcRG9ja2VyXFxcXERvY2tlclxcXFxyZXNvdXJjZXNcIixcbiAgICAgICAgXVxuICAgICAgOiBbXG4gICAgICAgICAgXCIvdXNyL2JpblwiLFxuICAgICAgICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICAgICAgICBcIi91c3IvbGliL3BvZG1hblwiLFxuICAgICAgICAgIFwiL3Vzci9saWJleGVjL3BvZG1hblwiLFxuICAgICAgICAgIFwiL2JpblwiLFxuICAgICAgICBdO1xuXG4gIGNvbnN0IHNlcCA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIiA/IFwiO1wiIDogXCI6XCI7XG4gIHJldHVybiB7XG4gICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgUEFUSDogW2Jhc2UsIC4uLmV4dHJhXS5maWx0ZXIoQm9vbGVhbikuam9pbihzZXApLFxuICB9O1xufVxuXG4vKipcbiAqIEVuc3VyZSBQb2RtYW4ncyBjb250YWluZXJzLmNvbmYgaGFzIGV4cGxpY2l0IEROUyBzZXJ2ZXJzIHNldC5cbiAqIFRoaXMgZml4ZXMgRE5TIHJlc29sdXRpb24gZmFpbHVyZXMgaW4gcm9vdGxlc3MgY29udGFpbmVycyBvbiBVYnVudHUvc3lzdGVtZC1yZXNvbHZlZCBob3N0cy5cbiAqIFNhZmUgdG8gY2FsbCBtdWx0aXBsZSB0aW1lcyBcdTIwMTQgb25seSB3cml0ZXMgaWYgdGhlIGNvbmZpZyBpcyBtaXNzaW5nIG9yIGluY29tcGxldGUuXG4gKi9cbmZ1bmN0aW9uIGVuc3VyZVBvZG1hbkNvbmZpZygpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWdEaXIgPSBqb2luKGhvbWVkaXIoKSwgXCIuY29uZmlnXCIsIFwiY29udGFpbmVyc1wiKTtcbiAgICBjb25zdCBjb25maWdQYXRoID0gam9pbihjb25maWdEaXIsIFwiY29udGFpbmVycy5jb25mXCIpO1xuXG4gICAgbGV0IGV4aXN0aW5nID0gXCJcIjtcbiAgICBpZiAoZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgZXhpc3RpbmcgPSByZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZWVkc0ROUyA9ICFleGlzdGluZy5pbmNsdWRlcyhcImRuc19zZXJ2ZXJzXCIpO1xuICAgIGNvbnN0IG5lZWRzSGVscGVyRGlyID0gIWV4aXN0aW5nLmluY2x1ZGVzKFwiaGVscGVyX2JpbmFyaWVzX2RpclwiKTtcblxuICAgIGlmICghbmVlZHNETlMgJiYgIW5lZWRzSGVscGVyRGlyKSByZXR1cm47XG5cbiAgICBta2RpclN5bmMoY29uZmlnRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIGxldCB1cGRhdGVkID0gZXhpc3Rpbmc7XG5cbiAgICBpZiAobmVlZHNIZWxwZXJEaXIpIHtcbiAgICAgIGNvbnN0IGhlbHBlckxpbmUgPVxuICAgICAgICAnaGVscGVyX2JpbmFyaWVzX2RpciA9IFtcIi91c3IvYmluXCIsIFwiL3Vzci9sb2NhbC9iaW5cIiwgXCIvdXNyL2xpYi9wb2RtYW5cIl0nO1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZWQuaW5jbHVkZXMoXCJbbmV0d29ya11cIilcbiAgICAgICAgPyB1cGRhdGVkLnJlcGxhY2UoXCJbbmV0d29ya11cIiwgYFtuZXR3b3JrXVxcbiR7aGVscGVyTGluZX1gKVxuICAgICAgICA6IHVwZGF0ZWQgKyBgXFxuW25ldHdvcmtdXFxuJHtoZWxwZXJMaW5lfVxcbmA7XG4gICAgfVxuXG4gICAgaWYgKG5lZWRzRE5TKSB7XG4gICAgICBjb25zdCBkbnNMaW5lID0gJ2Ruc19zZXJ2ZXJzID0gW1wiOC44LjguOFwiLCBcIjguOC40LjRcIl0nO1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZWQuaW5jbHVkZXMoXCJbY29udGFpbmVyc11cIilcbiAgICAgICAgPyB1cGRhdGVkLnJlcGxhY2UoXCJbY29udGFpbmVyc11cIiwgYFtjb250YWluZXJzXVxcbiR7ZG5zTGluZX1gKVxuICAgICAgICA6IHVwZGF0ZWQgKyBgXFxuW2NvbnRhaW5lcnNdXFxuJHtkbnNMaW5lfVxcbmA7XG4gICAgfVxuXG4gICAgd3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCB1cGRhdGVkLCBcInV0Zi04XCIpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgXCJbbG1zLWNvbXB1dGVyXSBBdXRvLWNvbmZpZ3VyZWQgUG9kbWFuIGNvbnRhaW5lcnMuY29uZiAoaGVscGVyX2JpbmFyaWVzX2RpciArIGRuc19zZXJ2ZXJzKS5cIixcbiAgICApO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbbG1zLWNvbXB1dGVyXSBDb3VsZCBub3Qgd3JpdGUgUG9kbWFuIGNvbmZpZzpcIiwgZXJyKTtcbiAgfVxufVxuXG5sZXQgcnVudGltZTogUnVudGltZUluZm8gfCBudWxsID0gbnVsbDtcbmxldCBjb250YWluZXJOYW1lOiBzdHJpbmcgPSBcIlwiO1xubGV0IGNvbnRhaW5lclJlYWR5OiBib29sZWFuID0gZmFsc2U7XG5sZXQgY3VycmVudE5ldHdvcms6IE5ldHdvcmtNb2RlID0gXCJub25lXCI7XG5sZXQgaW5pdFByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDtcblxuaW50ZXJmYWNlIFNoZWxsU2Vzc2lvbiB7XG4gIHByb2M6IFJldHVyblR5cGU8dHlwZW9mIHNwYXduPjtcbiAgd3JpdGU6IChkYXRhOiBzdHJpbmcpID0+IHZvaWQ7XG4gIGtpbGw6ICgpID0+IHZvaWQ7XG59XG5cbmxldCBzaGVsbFNlc3Npb246IFNoZWxsU2Vzc2lvbiB8IG51bGwgPSBudWxsO1xuXG5jb25zdCBTRU5USU5FTCA9IGBfX0xNU19ET05FXyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMil9X19gO1xuY29uc3QgU0VOVElORUxfTkwgPSBTRU5USU5FTCArIFwiXFxuXCI7XG5cbi8qKlxuICogR2V0IHRoZSBzaGVsbCBwYXRoIGZvciB0aGUgZ2l2ZW4gaW1hZ2UuXG4gKi9cbmZ1bmN0aW9uIHNoZWxsRm9yKGltYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW1hZ2Uuc3RhcnRzV2l0aChcImFscGluZVwiKSA/IENPTlRBSU5FUl9TSEVMTF9BTFBJTkUgOiBDT05UQUlORVJfU0hFTEw7XG59XG5cbi8qKlxuICogU3RhcnQgYSBwZXJzaXN0ZW50IGJhc2ggc2Vzc2lvbiBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqIFRoZSBzZXNzaW9uIHN0YXlzIGFsaXZlIGFjcm9zcyBtdWx0aXBsZSBFeGVjdXRlIGNhbGxzIHNvIHRoYXRcbiAqIGNkLCBleHBvcnQsIHNvdXJjZSwgbnZtIHVzZSwgY29uZGEgYWN0aXZhdGUsIGV0Yy4gYWxsIHBlcnNpc3QuXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0U2hlbGxTZXNzaW9uKCk6IFNoZWxsU2Vzc2lvbiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWRcIik7XG5cbiAgY29uc3QgaXNBbHBpbmUgPSBjb250YWluZXJOYW1lLmluY2x1ZGVzKFwiYWxwaW5lXCIpO1xuICBjb25zdCBzaGVsbCA9IGlzQWxwaW5lID8gQ09OVEFJTkVSX1NIRUxMX0FMUElORSA6IENPTlRBSU5FUl9TSEVMTDtcblxuICBjb25zdCBwcm9jID0gc3Bhd24oXG4gICAgcnVudGltZS5wYXRoLFxuICAgIFtcImV4ZWNcIiwgXCItaVwiLCBcIi13XCIsIENPTlRBSU5FUl9XT1JLRElSLCBjb250YWluZXJOYW1lLCBzaGVsbF0sXG4gICAge1xuICAgICAgc3RkaW86IFtcInBpcGVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgICAgIGVudjogZ2V0UnVudGltZUVudigpLFxuICAgIH0sXG4gICk7XG5cbiAgY29uc3QgaW5pdCA9IFtcbiAgICBcImV4cG9ydCBQUzE9JydcIixcbiAgICBcImV4cG9ydCBQUzI9JydcIixcbiAgICBcImV4cG9ydCBURVJNPXh0ZXJtLTI1NmNvbG9yXCIsXG4gICAgYGNkICR7Q09OVEFJTkVSX1dPUktESVJ9YCxcbiAgICBcIlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG4gIHByb2Muc3RkaW4/LndyaXRlKGluaXQpO1xuXG4gIGNvbnN0IHNlc3Npb246IFNoZWxsU2Vzc2lvbiA9IHtcbiAgICBwcm9jLFxuICAgIHdyaXRlOiAoZGF0YTogc3RyaW5nKSA9PiBwcm9jLnN0ZGluPy53cml0ZShkYXRhKSxcbiAgICBraWxsOiAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBwcm9jLmtpbGwoXCJTSUdLSUxMXCIpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgfVxuICAgIH0sXG4gIH07XG5cbiAgcHJvYy5vbihcImV4aXRcIiwgKCkgPT4ge1xuICAgIGlmIChzaGVsbFNlc3Npb24gPT09IHNlc3Npb24pIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gIH0pO1xuXG4gIHByb2Mub24oXCJlcnJvclwiLCAoKSA9PiB7XG4gICAgaWYgKHNoZWxsU2Vzc2lvbiA9PT0gc2Vzc2lvbikgc2hlbGxTZXNzaW9uID0gbnVsbDtcbiAgfSk7XG5cbiAgcmV0dXJuIHNlc3Npb247XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIGNvbW1hbmQgdGhyb3VnaCB0aGUgcGVyc2lzdGVudCBzaGVsbCBzZXNzaW9uLlxuICogU3RhdGUgKGN3ZCwgZW52IHZhcnMsIHNvdXJjZWQgZmlsZXMpIHBlcnNpc3RzIGFjcm9zcyBjYWxscy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXhlY0luU2Vzc2lvbihcbiAgY29tbWFuZDogc3RyaW5nLFxuICB0aW1lb3V0U2Vjb25kczogbnVtYmVyLFxuICBtYXhPdXRwdXRCeXRlczogbnVtYmVyLFxuKTogUHJvbWlzZTxFeGVjUmVzdWx0PiB7XG4gIGlmIChcbiAgICAhc2hlbGxTZXNzaW9uIHx8XG4gICAgc2hlbGxTZXNzaW9uLnByb2MuZXhpdENvZGUgIT09IG51bGwgfHxcbiAgICBzaGVsbFNlc3Npb24ucHJvYy5raWxsZWRcbiAgKSB7XG4gICAgc2hlbGxTZXNzaW9uID0gc3RhcnRTaGVsbFNlc3Npb24oKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAxMDApKTtcbiAgfVxuXG4gIGNvbnN0IHNlc3Npb24gPSBzaGVsbFNlc3Npb247XG4gIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgZWZmZWN0aXZlTWF4ID0gTWF0aC5taW4obWF4T3V0cHV0Qnl0ZXMsIE1BWF9PVVRQVVRfQllURVMpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZTxFeGVjUmVzdWx0PigocmVzb2x2ZSkgPT4ge1xuICAgIGxldCBzdGRvdXQgPSBcIlwiO1xuICAgIGxldCBzdGRlcnIgPSBcIlwiO1xuICAgIGxldCBkb25lID0gZmFsc2U7XG5cbiAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgc2Vzc2lvbi5wcm9jLnN0ZG91dD8ucmVtb3ZlTGlzdGVuZXIoXCJkYXRhXCIsIG9uU3Rkb3V0KTtcbiAgICAgIHNlc3Npb24ucHJvYy5zdGRlcnI/LnJlbW92ZUxpc3RlbmVyKFwiZGF0YVwiLCBvblN0ZGVycik7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIH07XG5cbiAgICBjb25zdCBmaW5pc2ggPSAodGltZWRPdXQ6IGJvb2xlYW4sIGtpbGxlZDogYm9vbGVhbikgPT4ge1xuICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgY2xlYW51cCgpO1xuXG4gICAgICBsZXQgZXhpdENvZGUgPSAwO1xuICAgICAgY29uc3QgZXhpdE1hdGNoID0gc3Rkb3V0Lm1hdGNoKC9cXG5FWElUX0NPREU6KFxcZCspXFxuPyQvKTtcbiAgICAgIGlmIChleGl0TWF0Y2gpIHtcbiAgICAgICAgZXhpdENvZGUgPSBwYXJzZUludChleGl0TWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgc3Rkb3V0ID0gc3Rkb3V0LnNsaWNlKDAsIGV4aXRNYXRjaC5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIHN0ZG91dCA9IHN0ZG91dC5yZXBsYWNlKG5ldyBSZWdFeHAoU0VOVElORUwgKyBcIlxcXFxuPyRcIiksIFwiXCIpLnRyaW1FbmQoKTtcblxuICAgICAgcmVzb2x2ZSh7XG4gICAgICAgIGV4aXRDb2RlOiBraWxsZWQgPyAxMzcgOiBleGl0Q29kZSxcbiAgICAgICAgc3Rkb3V0OiBzdGRvdXQuc2xpY2UoMCwgZWZmZWN0aXZlTWF4KSxcbiAgICAgICAgc3RkZXJyOiBzdGRlcnIuc2xpY2UoMCwgZWZmZWN0aXZlTWF4KSxcbiAgICAgICAgdGltZWRPdXQsXG4gICAgICAgIGR1cmF0aW9uTXM6IERhdGUubm93KCkgLSBzdGFydCxcbiAgICAgICAgdHJ1bmNhdGVkOlxuICAgICAgICAgIHN0ZG91dC5sZW5ndGggPj0gZWZmZWN0aXZlTWF4IHx8IHN0ZGVyci5sZW5ndGggPj0gZWZmZWN0aXZlTWF4LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IG9uU3Rkb3V0ID0gKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgICBzdGRvdXQgKz0gY2h1bmsudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgICAgIGlmIChzdGRvdXQuaW5jbHVkZXMoU0VOVElORUxfTkwpIHx8IHN0ZG91dC5lbmRzV2l0aChTRU5USU5FTCkpIHtcbiAgICAgICAgZmluaXNoKGZhbHNlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG9uU3RkZXJyID0gKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgICBpZiAoc3RkZXJyLmxlbmd0aCA8IGVmZmVjdGl2ZU1heCkgc3RkZXJyICs9IGNodW5rLnRvU3RyaW5nKFwidXRmLThcIik7XG4gICAgfTtcblxuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgc2Vzc2lvbi5raWxsKCk7XG4gICAgICBzaGVsbFNlc3Npb24gPSBudWxsO1xuICAgICAgZmluaXNoKHRydWUsIHRydWUpO1xuICAgIH0sIHRpbWVvdXRTZWNvbmRzICogMTAwMCk7XG5cbiAgICBzZXNzaW9uLnByb2Muc3Rkb3V0Py5vbihcImRhdGFcIiwgb25TdGRvdXQpO1xuICAgIHNlc3Npb24ucHJvYy5zdGRlcnI/Lm9uKFwiZGF0YVwiLCBvblN0ZGVycik7XG5cbiAgICBjb25zdCB3cmFwcGVkID0gYCR7Y29tbWFuZH1cXG5lY2hvIFwiRVhJVF9DT0RFOiQ/XCJcXG5lY2hvIFwiJHtTRU5USU5FTH1cIlxcbmA7XG4gICAgc2Vzc2lvbi53cml0ZSh3cmFwcGVkKTtcbiAgfSk7XG59XG5cbi8qKlxuICogUnVuIGEgY29udGFpbmVyIHJ1bnRpbWUgY29tbWFuZCBhbmQgcmV0dXJuIHN0ZG91dC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuKFxuICBhcmdzOiBzdHJpbmdbXSxcbiAgdGltZW91dE1zOiBudW1iZXIgPSAzMF8wMDAsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAoIXJ1bnRpbWUpIHRocm93IG5ldyBFcnJvcihcIlJ1bnRpbWUgbm90IGluaXRpYWxpemVkXCIpO1xuICBjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlY0FzeW5jKHJ1bnRpbWUucGF0aCwgYXJncywge1xuICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyxcbiAgICBtYXhCdWZmZXI6IE1BWF9PVVRQVVRfQllURVMsXG4gICAgZW52OiBnZXRSdW50aW1lRW52KCksXG4gIH0pO1xuICByZXR1cm4gc3Rkb3V0LnRyaW0oKTtcbn1cblxuLyoqXG4gKiBDaGVjayBjdXJyZW50IHN0YXRlIG9mIHRoZSBtYW5hZ2VkIGNvbnRhaW5lci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0Q29udGFpbmVyU3RhdGUoKTogUHJvbWlzZTxDb250YWluZXJTdGF0ZT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG91dCA9IGF3YWl0IHJ1bihbXG4gICAgICBcImluc3BlY3RcIixcbiAgICAgIGNvbnRhaW5lck5hbWUsXG4gICAgICBcIi0tZm9ybWF0XCIsXG4gICAgICBcInt7LlN0YXRlLlN0YXR1c319XCIsXG4gICAgXSk7XG4gICAgY29uc3Qgc3RhdHVzID0gb3V0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChzdGF0dXMgPT09IFwicnVubmluZ1wiKSByZXR1cm4gXCJydW5uaW5nXCI7XG4gICAgaWYgKFtcImV4aXRlZFwiLCBcInN0b3BwZWRcIiwgXCJjcmVhdGVkXCIsIFwicGF1c2VkXCIsIFwiZGVhZFwiXS5pbmNsdWRlcyhzdGF0dXMpKVxuICAgICAgcmV0dXJuIFwic3RvcHBlZFwiO1xuICAgIHJldHVybiBcImVycm9yXCI7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIm5vdF9mb3VuZFwiO1xuICB9XG59XG5cbi8qKlxuICogQnVpbGQgYGRvY2tlciBydW5gIC8gYHBvZG1hbiBydW5gIGFyZ3VtZW50cyBmcm9tIG9wdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkUnVuQXJncyhvcHRzOiBDb250YWluZXJDcmVhdGVPcHRpb25zKTogc3RyaW5nW10ge1xuICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtcbiAgICBcInJ1blwiLFxuICAgIFwiLWRcIixcbiAgICBcIi0tbmFtZVwiLFxuICAgIG9wdHMubmFtZSxcbiAgICBcIi0taG9zdG5hbWVcIixcbiAgICBcImxtcy1jb21wdXRlclwiLFxuICAgIC4uLihvcHRzLm5ldHdvcmsgIT09IFwicG9kbWFuLWRlZmF1bHRcIiA/IFtcIi0tbmV0d29ya1wiLCBvcHRzLm5ldHdvcmtdIDogW10pLFxuICAgIC4uLihvcHRzLm5ldHdvcmsgIT09IFwibm9uZVwiXG4gICAgICA/IFtcIi0tZG5zXCIsIFwiOC44LjguOFwiLCBcIi0tZG5zXCIsIFwiOC44LjQuNFwiXVxuICAgICAgOiBbXSksXG4gICAgXCItd1wiLFxuICAgIFwiL3Jvb3RcIixcbiAgXTtcblxuICBpZiAob3B0cy5jcHVMaW1pdCA+IDApIHtcbiAgICBhcmdzLnB1c2goXCItLWNwdXNcIiwgU3RyaW5nKG9wdHMuY3B1TGltaXQpKTtcbiAgfVxuICBpZiAob3B0cy5tZW1vcnlMaW1pdE1CID4gMCkge1xuICAgIGFyZ3MucHVzaChcIi0tbWVtb3J5XCIsIGAke29wdHMubWVtb3J5TGltaXRNQn1tYCk7XG4gICAgYXJncy5wdXNoKFwiLS1tZW1vcnktc3dhcFwiLCBgJHtvcHRzLm1lbW9yeUxpbWl0TUJ9bWApO1xuICB9XG5cbiAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMob3B0cy5lbnZWYXJzKSkge1xuICAgIGFyZ3MucHVzaChcIi1lXCIsIGAke2t9PSR7dn1gKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgcGYgb2Ygb3B0cy5wb3J0Rm9yd2FyZHMpIHtcbiAgICBjb25zdCB0cmltbWVkID0gcGYudHJpbSgpO1xuICAgIGlmICh0cmltbWVkKSBhcmdzLnB1c2goXCItcFwiLCB0cmltbWVkKTtcbiAgfVxuXG4gIGlmIChvcHRzLmhvc3RNb3VudFBhdGgpIHtcbiAgICBhcmdzLnB1c2goXCItdlwiLCBgJHt0b0RvY2tlclBhdGgob3B0cy5ob3N0TW91bnRQYXRoKX06L21udC9zaGFyZWRgKTtcbiAgfVxuXG4gIGFyZ3MucHVzaChvcHRzLmltYWdlLCBcInRhaWxcIiwgXCItZlwiLCBcIi9kZXYvbnVsbFwiKTtcblxuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGhlIHVzZXIgd29ya3NwYWNlIGFuZCBpbnN0YWxsIHBhY2thZ2VzIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5hc3luYyBmdW5jdGlvbiBzZXR1cENvbnRhaW5lcihcbiAgaW1hZ2U6IENvbnRhaW5lckltYWdlLFxuICBwcmVzZXQ6IHN0cmluZyxcbiAgaGFzTmV0d29yazogYm9vbGVhbiA9IGZhbHNlLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNoZWxsID0gc2hlbGxGb3IoaW1hZ2UpO1xuXG4gIGF3YWl0IHJ1bihcbiAgICBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIGNvbnRhaW5lck5hbWUsXG4gICAgICBzaGVsbCxcbiAgICAgIFwiLWNcIixcbiAgICAgIGBta2RpciAtcCAke0NPTlRBSU5FUl9XT1JLRElSfSAmJiBgICtcbiAgICAgICAgYChpZCB1c2VyID4vZGV2L251bGwgMj4mMSB8fCBhZGR1c2VyIC0tZGlzYWJsZWQtcGFzc3dvcmQgLS1nZWNvcyBcIlwiIC0taG9tZSAke0NPTlRBSU5FUl9XT1JLRElSfSB1c2VyIDI+L2Rldi9udWxsIHx8IGAgK1xuICAgICAgICBgYWRkdXNlciAtRCAtaCAke0NPTlRBSU5FUl9XT1JLRElSfSB1c2VyIDI+L2Rldi9udWxsIHx8IHRydWUpYCxcbiAgICBdLFxuICAgIDE1XzAwMCxcbiAgKTtcblxuICBpZiAocHJlc2V0ICYmIHByZXNldCAhPT0gXCJub25lXCIgJiYgaGFzTmV0d29yaykge1xuICAgIGNvbnN0IGlzQWxwaW5lID0gaW1hZ2Uuc3RhcnRzV2l0aChcImFscGluZVwiKTtcbiAgICBjb25zdCBwcmVzZXRzID0gaXNBbHBpbmUgPyBQQUNLQUdFX1BSRVNFVFNfQUxQSU5FIDogUEFDS0FHRV9QUkVTRVRTO1xuICAgIGNvbnN0IHBhY2thZ2VzID0gcHJlc2V0c1twcmVzZXRdO1xuICAgIGlmIChwYWNrYWdlcyAmJiBwYWNrYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBpbnN0YWxsQ21kID0gaXNBbHBpbmVcbiAgICAgICAgPyBgYXBrIHVwZGF0ZSAmJiBhcGsgYWRkIC0tbm8tY2FjaGUgJHtwYWNrYWdlcy5qb2luKFwiIFwiKX1gXG4gICAgICAgIDogYGFwdC1nZXQgdXBkYXRlIC1xcSAmJiBERUJJQU5fRlJPTlRFTkQ9bm9uaW50ZXJhY3RpdmUgYXB0LWdldCBpbnN0YWxsIC15IC1xcSAke3BhY2thZ2VzLmpvaW4oXCIgXCIpfSAmJiBhcHQtZ2V0IGNsZWFuICYmIHJtIC1yZiAvdmFyL2xpYi9hcHQvbGlzdHMvKmA7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJleGVjXCIsIGNvbnRhaW5lck5hbWUsIHNoZWxsLCBcIi1jXCIsIGluc3RhbGxDbWRdLCAxODBfMDAwKTtcbiAgICAgIH0gY2F0Y2ggKGluc3RhbGxFcnI6IGFueSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgXCJbbG1zLWNvbXB1dGVyXSBQYWNrYWdlIGluc3RhbGwgZmFpbGVkIChub24tZmF0YWwpOlwiLFxuICAgICAgICAgIGluc3RhbGxFcnI/Lm1lc3NhZ2UgPz8gaW5zdGFsbEVycixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBjb250YWluZXIgZW5naW5lOiBkZXRlY3QgcnVudGltZSwgY3JlYXRlIG9yIHN0YXJ0XG4gKiB0aGUgY29udGFpbmVyIGlmIG5lZWRlZC4gU2FmZSB0byBjYWxsIG11bHRpcGxlIHRpbWVzIChpZGVtcG90ZW50KS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZVJlYWR5KG9wdHM6IHtcbiAgaW1hZ2U6IENvbnRhaW5lckltYWdlO1xuICBuZXR3b3JrOiBOZXR3b3JrTW9kZTtcbiAgY3B1TGltaXQ6IG51bWJlcjtcbiAgbWVtb3J5TGltaXRNQjogbnVtYmVyO1xuICBkaXNrTGltaXRNQjogbnVtYmVyO1xuICBhdXRvSW5zdGFsbFByZXNldDogc3RyaW5nO1xuICBwb3J0Rm9yd2FyZHM6IHN0cmluZztcbiAgaG9zdE1vdW50UGF0aDogc3RyaW5nO1xuICBwZXJzaXN0ZW5jZU1vZGU6IHN0cmluZztcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGNvbnRhaW5lclJlYWR5KSB7XG4gICAgY29uc3Qgd2FudHNOZXR3b3JrID0gb3B0cy5uZXR3b3JrICE9PSBcIm5vbmVcIjtcbiAgICBjb25zdCBoYXNOZXR3b3JrID0gY3VycmVudE5ldHdvcmsgIT09IFwibm9uZVwiO1xuICAgIGlmICh3YW50c05ldHdvcmsgPT09IGhhc05ldHdvcmspIHJldHVybjtcblxuICAgIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG4gICAgY3VycmVudE5ldHdvcmsgPSBcIm5vbmVcIjtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKFtcInN0b3BcIiwgY29udGFpbmVyTmFtZV0sIDE1XzAwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvKiBpZ25vcmUgKi9cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJ1bihbXCJybVwiLCBcIi1mXCIsIGNvbnRhaW5lck5hbWVdLCAxMF8wMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLyogaWdub3JlICovXG4gICAgfVxuICB9XG4gIGlmIChpbml0UHJvbWlzZSkgcmV0dXJuIGluaXRQcm9taXNlO1xuXG4gIGluaXRQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICBydW50aW1lID0gYXdhaXQgZGV0ZWN0UnVudGltZSgpO1xuICAgIGNvbnRhaW5lck5hbWUgPSBgJHtDT05UQUlORVJfTkFNRV9QUkVGSVh9LW1haW5gO1xuXG4gICAgaWYgKHJ1bnRpbWUua2luZCA9PT0gXCJwb2RtYW5cIikge1xuICAgICAgZW5zdXJlUG9kbWFuQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdGUgPSBhd2FpdCBnZXRDb250YWluZXJTdGF0ZSgpO1xuXG4gICAgaWYgKHN0YXRlID09PSBcInJ1bm5pbmdcIikge1xuICAgICAgbGV0IGFjdHVhbGx5SGFzTmV0d29yayA9IGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbmV0T3V0ID0gYXdhaXQgcnVuKFtcbiAgICAgICAgICBcImluc3BlY3RcIixcbiAgICAgICAgICBjb250YWluZXJOYW1lLFxuICAgICAgICAgIFwiLS1mb3JtYXRcIixcbiAgICAgICAgICBcInt7Lkhvc3RDb25maWcuTmV0d29ya01vZGV9fVwiLFxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgYWN0dWFsTmV0ID0gbmV0T3V0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBhY3R1YWxseUhhc05ldHdvcmsgPSBhY3R1YWxOZXQgIT09IFwibm9uZVwiICYmIGFjdHVhbE5ldCAhPT0gXCJcIjtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBhc3N1bWUgbm8gbmV0d29yayAqL1xuICAgICAgfVxuXG4gICAgICBjb25zdCB3YW50c05ldHdvcmsgPSBvcHRzLm5ldHdvcmsgIT09IFwibm9uZVwiO1xuXG4gICAgICBpZiAoYWN0dWFsbHlIYXNOZXR3b3JrID09PSB3YW50c05ldHdvcmspIHtcbiAgICAgICAgY3VycmVudE5ldHdvcmsgPSB3YW50c05ldHdvcmsgPyBvcHRzLm5ldHdvcmsgOiBcIm5vbmVcIjtcbiAgICAgICAgY29udGFpbmVyUmVhZHkgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW2xtcy1jb21wdXRlcl0gTmV0d29yayBtaXNtYXRjaCAoY29udGFpbmVyIGhhcyAke2FjdHVhbGx5SGFzTmV0d29yayA/IFwiaW50ZXJuZXRcIiA6IFwibm8gaW50ZXJuZXRcIn0sIHNldHRpbmdzIHdhbnQgJHt3YW50c05ldHdvcmsgPyBcImludGVybmV0XCIgOiBcIm5vIGludGVybmV0XCJ9KSBcdTIwMTQgcmVjcmVhdGluZyBjb250YWluZXIuYCxcbiAgICAgICk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBhbHJlYWR5IHN0b3BwZWQgKi9cbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJybVwiLCBcIi1mXCIsIGNvbnRhaW5lck5hbWVdLCAxMF8wMDApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGFscmVhZHkgZ29uZSAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGF0ZSA9PT0gXCJzdG9wcGVkXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJzdGFydFwiLCBjb250YWluZXJOYW1lXSk7XG4gICAgICAgIGNvbnRhaW5lclJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgY29uc3QgbXNnOiBzdHJpbmcgPSBlcnI/Lm1lc3NhZ2UgPz8gXCJcIjtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1zZy5pbmNsdWRlcyhcIndvcmtkaXJcIikgfHxcbiAgICAgICAgICBtc2cuaW5jbHVkZXMoXCJkb2VzIG5vdCBleGlzdFwiKSB8fFxuICAgICAgICAgIG1zZy5pbmNsdWRlcyhcIm5ldG5zXCIpIHx8XG4gICAgICAgICAgbXNnLmluY2x1ZGVzKFwibW91bnQgcnVudGltZVwiKVxuICAgICAgICApIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgcnVuKFtcInJtXCIsIFwiLWZcIiwgY29udGFpbmVyTmFtZV0sIDEwXzAwMCk7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJ1bihbXCJwdWxsXCIsIG9wdHMuaW1hZ2VdLCAzMDBfMDAwKTtcbiAgICB9IGNhdGNoIHt9XG5cbiAgICBjb25zdCBwb3J0Rm9yd2FyZHMgPSBvcHRzLnBvcnRGb3J3YXJkc1xuICAgICAgPyBvcHRzLnBvcnRGb3J3YXJkc1xuICAgICAgICAgIC5zcGxpdChcIixcIilcbiAgICAgICAgICAubWFwKChzKSA9PiBzLnRyaW0oKSlcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICA6IFtdO1xuXG4gICAgbGV0IHNldHVwTmV0d29yazogTmV0d29ya01vZGUgfCBcInBvZG1hbi1kZWZhdWx0XCIgPSBcIm5vbmVcIjtcbiAgICBpZiAocnVudGltZT8ua2luZCA9PT0gXCJkb2NrZXJcIikge1xuICAgICAgc2V0dXBOZXR3b3JrID0gb3B0cy5uZXR3b3JrID09PSBcIm5vbmVcIiA/IFwibm9uZVwiIDogXCJicmlkZ2VcIjtcbiAgICB9IGVsc2UgaWYgKHJ1bnRpbWU/LmtpbmQgPT09IFwicG9kbWFuXCIgJiYgb3B0cy5uZXR3b3JrICE9PSBcIm5vbmVcIikge1xuICAgICAgc2V0dXBOZXR3b3JrID0gXCJwb2RtYW4tZGVmYXVsdFwiO1xuICAgIH1cbiAgICBjb25zdCBjcmVhdGVBcmdzID0gYnVpbGRSdW5BcmdzKHtcbiAgICAgIGltYWdlOiBvcHRzLmltYWdlLFxuICAgICAgbmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgIG5ldHdvcms6IHNldHVwTmV0d29yayxcbiAgICAgIGNwdUxpbWl0OiBvcHRzLmNwdUxpbWl0LFxuICAgICAgbWVtb3J5TGltaXRNQjogb3B0cy5tZW1vcnlMaW1pdE1CLFxuICAgICAgZGlza0xpbWl0TUI6IG9wdHMuZGlza0xpbWl0TUIsXG4gICAgICB3b3JrZGlyOiBDT05UQUlORVJfV09SS0RJUixcbiAgICAgIGVudlZhcnM6IENPTlRBSU5FUl9FTlZfVkFSUyxcbiAgICAgIHBvcnRGb3J3YXJkcyxcbiAgICAgIGhvc3RNb3VudFBhdGg6IG9wdHMuaG9zdE1vdW50UGF0aCB8fCBudWxsLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlza09wdEFyZ3MgPSBbLi4uY3JlYXRlQXJnc107XG4gICAgaWYgKG9wdHMuZGlza0xpbWl0TUIgPiAwKSB7XG4gICAgICBkaXNrT3B0QXJncy5zcGxpY2UoXG4gICAgICAgIGRpc2tPcHRBcmdzLmluZGV4T2Yob3B0cy5pbWFnZSksXG4gICAgICAgIDAsXG4gICAgICAgIFwiLS1zdG9yYWdlLW9wdFwiLFxuICAgICAgICBgc2l6ZT0ke29wdHMuZGlza0xpbWl0TUJ9bWAsXG4gICAgICApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKGRpc2tPcHRBcmdzLCA2MF8wMDApO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zdCBtc2c6IHN0cmluZyA9IGVycj8ubWVzc2FnZSA/PyBcIlwiO1xuICAgICAgaWYgKFxuICAgICAgICBtc2cuaW5jbHVkZXMoXCJzdG9yYWdlLW9wdFwiKSB8fFxuICAgICAgICBtc2cuaW5jbHVkZXMoXCJiYWNraW5nRlNcIikgfHxcbiAgICAgICAgbXNnLmluY2x1ZGVzKFwib3ZlcmxheS5zaXplXCIpXG4gICAgICApIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIFwiW2xtcy1jb21wdXRlcl0gRGlzayBxdW90YSBub3Qgc3VwcG9ydGVkIGJ5IHN0b3JhZ2UgZHJpdmVyLCBzdGFydGluZyB3aXRob3V0IHNpemUgbGltaXQuXCIsXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IHJ1bihjcmVhdGVBcmdzLCA2MF8wMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGhhc05ldHdvcmtGb3JTZXR1cCA9IHNldHVwTmV0d29yayAhPT0gXCJub25lXCI7XG4gICAgYXdhaXQgc2V0dXBDb250YWluZXIoXG4gICAgICBvcHRzLmltYWdlLFxuICAgICAgb3B0cy5hdXRvSW5zdGFsbFByZXNldCxcbiAgICAgIGhhc05ldHdvcmtGb3JTZXR1cCxcbiAgICApO1xuXG4gICAgaWYgKG9wdHMubmV0d29yayA9PT0gXCJub25lXCIgJiYgc2V0dXBOZXR3b3JrICE9PSBcIm5vbmVcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFxuICAgICAgICAgIFtcIm5ldHdvcmtcIiwgXCJkaXNjb25uZWN0XCIsIHNldHVwTmV0d29yaywgY29udGFpbmVyTmFtZV0sXG4gICAgICAgICAgMTBfMDAwLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8qIGJlc3QgZWZmb3J0IFx1MjAxNCBjb250YWluZXIgc3RpbGwgd29ya3MsIGp1c3QgaGFzIG5ldHdvcmsgKi9cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdXJyZW50TmV0d29yayA9IHNldHVwTmV0d29yayAhPT0gXCJub25lXCIgPyBvcHRzLm5ldHdvcmsgOiBcIm5vbmVcIjtcbiAgICBjb250YWluZXJSZWFkeSA9IHRydWU7XG4gIH0pKCk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBpbml0UHJvbWlzZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpbml0UHJvbWlzZSA9IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgY29tbWFuZCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWMoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgdGltZW91dFNlY29uZHM6IG51bWJlcixcbiAgbWF4T3V0cHV0Qnl0ZXM6IG51bWJlciA9IERFRkFVTFRfTUFYX09VVFBVVF9CWVRFUyxcbiAgd29ya2Rpcj86IHN0cmluZyxcbik6IFByb21pc2U8RXhlY1Jlc3VsdD4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS4gQ2FsbCBlbnN1cmVSZWFkeSgpIGZpcnN0LlwiKTtcbiAgfVxuXG4gIGNvbnN0IGNtZFRvUnVuID1cbiAgICB3b3JrZGlyICYmIHdvcmtkaXIgIT09IENPTlRBSU5FUl9XT1JLRElSXG4gICAgICA/IGBjZCAke3dvcmtkaXJ9ICYmICR7Y29tbWFuZH1gXG4gICAgICA6IGNvbW1hbmQ7XG5cbiAgcmV0dXJuIGV4ZWNJblNlc3Npb24oY21kVG9SdW4sIHRpbWVvdXRTZWNvbmRzLCBtYXhPdXRwdXRCeXRlcyk7XG59XG5cbi8qKlxuICogV3JpdGUgYSBmaWxlIGluc2lkZSB0aGUgY29udGFpbmVyIHVzaW5nIHN0ZGluIHBpcGluZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlRmlsZShcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgY29udGVudDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSB8fCAhY29udGFpbmVyUmVhZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXIgbm90IHJlYWR5LlwiKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3Qgc2hlbGwgPSBjb250YWluZXJOYW1lLmluY2x1ZGVzKFwiYWxwaW5lXCIpXG4gICAgICA/IENPTlRBSU5FUl9TSEVMTF9BTFBJTkVcbiAgICAgIDogQ09OVEFJTkVSX1NIRUxMO1xuICAgIGNvbnN0IHByb2MgPSBzcGF3bihcbiAgICAgIHJ1bnRpbWUhLnBhdGgsXG4gICAgICBbXG4gICAgICAgIFwiZXhlY1wiLFxuICAgICAgICBcIi1pXCIsXG4gICAgICAgIGNvbnRhaW5lck5hbWUsXG4gICAgICAgIHNoZWxsLFxuICAgICAgICBcIi1jXCIsXG4gICAgICAgIGBjYXQgPiAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCxcbiAgICAgIF0sXG4gICAgICB7XG4gICAgICAgIHRpbWVvdXQ6IDE1XzAwMCxcbiAgICAgICAgc3RkaW86IFtcInBpcGVcIiwgXCJpZ25vcmVcIiwgXCJwaXBlXCJdLFxuICAgICAgICBlbnY6IGdldFJ1bnRpbWVFbnYoKSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGxldCBzdGRlcnIgPSBcIlwiO1xuICAgIHByb2Muc3RkZXJyPy5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIHN0ZGVyciArPSBjaHVuay50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIHByb2Mub24oXCJjbG9zZVwiLCAoY29kZSkgPT4ge1xuICAgICAgaWYgKGNvZGUgPT09IDApIHJlc29sdmUoKTtcbiAgICAgIGVsc2UgcmVqZWN0KG5ldyBFcnJvcihgV3JpdGUgZmFpbGVkIChleGl0ICR7Y29kZX0pOiAke3N0ZGVycn1gKSk7XG4gICAgfSk7XG4gICAgcHJvYy5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gICAgcHJvYy5zdGRpbj8ud3JpdGUoY29udGVudCk7XG4gICAgcHJvYy5zdGRpbj8uZW5kKCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFJlYWQgYSBmaWxlIGZyb20gdGhlIGNvbnRhaW5lciwgb3B0aW9uYWxseSBsaW1pdGVkIHRvIGEgbGluZSByYW5nZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRGaWxlKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBtYXhCeXRlczogbnVtYmVyLFxuICBzdGFydExpbmU/OiBudW1iZXIsXG4gIGVuZExpbmU/OiBudW1iZXIsXG4pOiBQcm9taXNlPHsgY29udGVudDogc3RyaW5nOyB0b3RhbExpbmVzOiBudW1iZXIgfT4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS5cIik7XG4gIH1cblxuICBjb25zdCBxID0gZmlsZVBhdGgucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIik7XG4gIGNvbnN0IHRvdGFsUmVzdWx0ID0gYXdhaXQgZXhlYyhgd2MgLWwgPCAnJHtxfScgMj4vZGV2L251bGwgfHwgZWNobyAwYCwgNSk7XG4gIGNvbnN0IHRvdGFsTGluZXMgPSBwYXJzZUludCh0b3RhbFJlc3VsdC5zdGRvdXQudHJpbSgpLCAxMCkgfHwgMDtcblxuICBsZXQgY21kOiBzdHJpbmc7XG4gIGlmIChzdGFydExpbmUgIT09IHVuZGVmaW5lZCAmJiBlbmRMaW5lICE9PSB1bmRlZmluZWQpIHtcbiAgICBjbWQgPSBgc2VkIC1uICcke3N0YXJ0TGluZX0sJHtlbmRMaW5lfXAnICcke3F9J2A7XG4gIH0gZWxzZSBpZiAoc3RhcnRMaW5lICE9PSB1bmRlZmluZWQpIHtcbiAgICBjbWQgPSBgdGFpbCAtbiArJHtzdGFydExpbmV9ICcke3F9J2A7XG4gIH0gZWxzZSB7XG4gICAgY21kID0gYGNhdCAnJHtxfSdgO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhjbWQsIDEwLCBtYXhCeXRlcyk7XG4gIGlmIChyZXN1bHQuZXhpdENvZGUgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFJlYWQgZmFpbGVkOiAke3Jlc3VsdC5zdGRlcnIgfHwgXCJmaWxlIG5vdCBmb3VuZFwifWApO1xuICB9XG4gIHJldHVybiB7IGNvbnRlbnQ6IHJlc3VsdC5zdGRvdXQsIHRvdGFsTGluZXMgfTtcbn1cblxuLyoqXG4gKiBSZXBsYWNlIGFuIGV4YWN0IHN0cmluZyBpbiBhIGZpbGUuIEZhaWxzIGlmIHRoZSBzdHJpbmcgaXMgbm90IGZvdW5kXG4gKiBvciBhcHBlYXJzIG1vcmUgdGhhbiBvbmNlLCBtYXRjaGluZyB0aGUgYmVoYXZpb3VyIG9mIHN1cmdpY2FsIGVkaXRvcnMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdHJSZXBsYWNlSW5GaWxlKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBvbGRTdHI6IHN0cmluZyxcbiAgbmV3U3RyOiBzdHJpbmcsXG4pOiBQcm9taXNlPHsgcmVwbGFjZW1lbnRzOiBudW1iZXIgfT4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS5cIik7XG4gIH1cblxuICBjb25zdCBxID0gZmlsZVBhdGgucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIik7XG4gIGNvbnN0IHJlYWRSZXN1bHQgPSBhd2FpdCBleGVjKGBjYXQgJyR7cX0nYCwgMTAsIE1BWF9PVVRQVVRfQllURVMpO1xuICBpZiAocmVhZFJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmlsZSBub3QgZm91bmQ6ICR7ZmlsZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCBvcmlnaW5hbCA9IHJlYWRSZXN1bHQuc3Rkb3V0O1xuICBjb25zdCBvY2N1cnJlbmNlcyA9IG9yaWdpbmFsLnNwbGl0KG9sZFN0cikubGVuZ3RoIC0gMTtcblxuICBpZiAob2NjdXJyZW5jZXMgPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgU3RyaW5nIG5vdCBmb3VuZCBpbiAke2ZpbGVQYXRofS5cXG5gICtcbiAgICAgICAgYEhpbnQ6IHVzZSBSZWFkRmlsZSB0byB2aWV3IHRoZSBjdXJyZW50IGNvbnRlbnRzIGJlZm9yZSBlZGl0aW5nLmAsXG4gICAgKTtcbiAgfVxuICBpZiAob2NjdXJyZW5jZXMgPiAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFN0cmluZyBhcHBlYXJzICR7b2NjdXJyZW5jZXN9IHRpbWVzIGluICR7ZmlsZVBhdGh9IFx1MjAxNCBpdCBtdXN0IGJlIHVuaXF1ZS5cXG5gICtcbiAgICAgICAgYEhpbnQ6IGluY2x1ZGUgbW9yZSBzdXJyb3VuZGluZyBjb250ZXh0IHRvIG1ha2UgdGhlIG1hdGNoIHVuaXF1ZS5gLFxuICAgICk7XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gb3JpZ2luYWwucmVwbGFjZShvbGRTdHIsIG5ld1N0cik7XG4gIGF3YWl0IHdyaXRlRmlsZShmaWxlUGF0aCwgdXBkYXRlZCk7XG4gIHJldHVybiB7IHJlcGxhY2VtZW50czogMSB9O1xufVxuXG4vKipcbiAqIEluc2VydCBsaW5lcyBpbnRvIGEgZmlsZSBhdCBhIGdpdmVuIGxpbmUgbnVtYmVyLlxuICogTGluZSBudW1iZXJzIGFyZSAxLWJhc2VkLiBQYXNzIDAgdG8gcHJlcGVuZCwgb3IgYSBudW1iZXIgcGFzdCBFT0YgdG8gYXBwZW5kLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zZXJ0TGluZXNJbkZpbGUoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGFmdGVyTGluZTogbnVtYmVyLFxuICBjb250ZW50OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFydW50aW1lIHx8ICFjb250YWluZXJSZWFkeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRhaW5lciBub3QgcmVhZHkuXCIpO1xuICB9XG5cbiAgY29uc3QgcSA9IGZpbGVQYXRoLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpO1xuICBjb25zdCByZWFkUmVzdWx0ID0gYXdhaXQgZXhlYyhgY2F0ICcke3F9J2AsIDEwLCBNQVhfT1VUUFVUX0JZVEVTKTtcbiAgaWYgKHJlYWRSZXN1bHQuZXhpdENvZGUgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZpbGUgbm90IGZvdW5kOiAke2ZpbGVQYXRofWApO1xuICB9XG5cbiAgY29uc3QgbGluZXMgPSByZWFkUmVzdWx0LnN0ZG91dC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgaW5zZXJ0TGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBjbGFtcGVkTGluZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKGFmdGVyTGluZSwgbGluZXMubGVuZ3RoKSk7XG4gIGxpbmVzLnNwbGljZShjbGFtcGVkTGluZSwgMCwgLi4uaW5zZXJ0TGluZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZmlsZVBhdGgsIGxpbmVzLmpvaW4oXCJcXG5cIikpO1xufVxuXG5jb25zdCBiZ0xvZ3MgPSBuZXcgTWFwPFxuICBudW1iZXIsXG4gIHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nOyBkb25lOiBib29sZWFuOyBleGl0Q29kZTogbnVtYmVyIHwgbnVsbCB9XG4+KCk7XG5cbi8qKlxuICogUnVuIGEgY29tbWFuZCBpbiB0aGUgYmFja2dyb3VuZCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqIFJldHVybnMgYSBoYW5kbGUgSUQgdGhhdCBjYW4gYmUgdXNlZCB3aXRoIHJlYWRCZ0xvZ3MuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjQmFja2dyb3VuZChcbiAgY29tbWFuZDogc3RyaW5nLFxuICB0aW1lb3V0U2Vjb25kczogbnVtYmVyLFxuKTogUHJvbWlzZTx7IGhhbmRsZUlkOiBudW1iZXI7IHBpZDogbnVtYmVyIH0+IHtcbiAgaWYgKCFydW50aW1lIHx8ICFjb250YWluZXJSZWFkeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRhaW5lciBub3QgcmVhZHkuXCIpO1xuICB9XG5cbiAgY29uc3Qgc2hlbGwgPSBjb250YWluZXJOYW1lLmluY2x1ZGVzKFwiYWxwaW5lXCIpXG4gICAgPyBDT05UQUlORVJfU0hFTExfQUxQSU5FXG4gICAgOiBDT05UQUlORVJfU0hFTEw7XG4gIGNvbnN0IGhhbmRsZUlkID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgZW50cnkgPSB7XG4gICAgc3Rkb3V0OiBcIlwiLFxuICAgIHN0ZGVycjogXCJcIixcbiAgICBkb25lOiBmYWxzZSxcbiAgICBleGl0Q29kZTogbnVsbCBhcyBudW1iZXIgfCBudWxsLFxuICB9O1xuICBiZ0xvZ3Muc2V0KGhhbmRsZUlkLCBlbnRyeSk7XG5cbiAgY29uc3QgcHJvYyA9IHNwYXduKFxuICAgIHJ1bnRpbWUucGF0aCxcbiAgICBbXCJleGVjXCIsIGNvbnRhaW5lck5hbWUsIHNoZWxsLCBcIi1jXCIsIGNvbW1hbmRdLFxuICAgIHtcbiAgICAgIHN0ZGlvOiBbXCJpZ25vcmVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgICAgIGVudjogZ2V0UnVudGltZUVudigpLFxuICAgIH0sXG4gICk7XG5cbiAgY29uc3QgY2FwID0gTUFYX09VVFBVVF9CWVRFUyAqIDI7XG4gIHByb2Muc3Rkb3V0Py5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICBpZiAoZW50cnkuc3Rkb3V0Lmxlbmd0aCA8IGNhcCkgZW50cnkuc3Rkb3V0ICs9IGNodW5rLnRvU3RyaW5nKFwidXRmLThcIik7XG4gIH0pO1xuICBwcm9jLnN0ZGVycj8ub24oXCJkYXRhXCIsIChjaHVuazogQnVmZmVyKSA9PiB7XG4gICAgaWYgKGVudHJ5LnN0ZGVyci5sZW5ndGggPCBjYXApIGVudHJ5LnN0ZGVyciArPSBjaHVuay50b1N0cmluZyhcInV0Zi04XCIpO1xuICB9KTtcbiAgcHJvYy5vbihcImNsb3NlXCIsIChjb2RlKSA9PiB7XG4gICAgZW50cnkuZG9uZSA9IHRydWU7XG4gICAgZW50cnkuZXhpdENvZGUgPSBjb2RlO1xuICB9KTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoIWVudHJ5LmRvbmUpIHtcbiAgICAgIHByb2Mua2lsbChcIlNJR0tJTExcIik7XG4gICAgICBlbnRyeS5kb25lID0gdHJ1ZTtcbiAgICAgIGVudHJ5LmV4aXRDb2RlID0gMTM3O1xuICAgIH1cbiAgfSwgdGltZW91dFNlY29uZHMgKiAxXzAwMCk7XG5cbiAgcmV0dXJuIHsgaGFuZGxlSWQsIHBpZDogcHJvYy5waWQgPz8gLTEgfTtcbn1cblxuLyoqXG4gKiBSZWFkIGJ1ZmZlcmVkIG91dHB1dCBmcm9tIGEgYmFja2dyb3VuZCBwcm9jZXNzIGJ5IGhhbmRsZSBJRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRCZ0xvZ3MoXG4gIGhhbmRsZUlkOiBudW1iZXIsXG4gIG1heEJ5dGVzOiBudW1iZXIgPSBERUZBVUxUX01BWF9PVVRQVVRfQllURVMsXG4pOiB7XG4gIHN0ZG91dDogc3RyaW5nO1xuICBzdGRlcnI6IHN0cmluZztcbiAgZG9uZTogYm9vbGVhbjtcbiAgZXhpdENvZGU6IG51bWJlciB8IG51bGw7XG4gIGZvdW5kOiBib29sZWFuO1xufSB7XG4gIGNvbnN0IGVudHJ5ID0gYmdMb2dzLmdldChoYW5kbGVJZCk7XG4gIGlmICghZW50cnkpXG4gICAgcmV0dXJuIHsgc3Rkb3V0OiBcIlwiLCBzdGRlcnI6IFwiXCIsIGRvbmU6IHRydWUsIGV4aXRDb2RlOiBudWxsLCBmb3VuZDogZmFsc2UgfTtcbiAgcmV0dXJuIHtcbiAgICBzdGRvdXQ6IGVudHJ5LnN0ZG91dC5zbGljZSgtbWF4Qnl0ZXMpLFxuICAgIHN0ZGVycjogZW50cnkuc3RkZXJyLnNsaWNlKC1tYXhCeXRlcyksXG4gICAgZG9uZTogZW50cnkuZG9uZSxcbiAgICBleGl0Q29kZTogZW50cnkuZXhpdENvZGUsXG4gICAgZm91bmQ6IHRydWUsXG4gIH07XG59XG5cbi8qKlxuICogQ29weSBhIGZpbGUgZnJvbSB0aGUgaG9zdCBpbnRvIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5VG9Db250YWluZXIoXG4gIGhvc3RQYXRoOiBzdHJpbmcsXG4gIGNvbnRhaW5lclBhdGg6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXJ1bnRpbWUpIHRocm93IG5ldyBFcnJvcihcIlJ1bnRpbWUgbm90IGluaXRpYWxpemVkLlwiKTtcbiAgYXdhaXQgcnVuKFtcImNwXCIsIGhvc3RQYXRoLCBgJHtjb250YWluZXJOYW1lfToke2NvbnRhaW5lclBhdGh9YF0sIDYwXzAwMCk7XG59XG5cbi8qKlxuICogQ29weSBhIGZpbGUgZnJvbSB0aGUgY29udGFpbmVyIHRvIHRoZSBob3N0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weUZyb21Db250YWluZXIoXG4gIGNvbnRhaW5lclBhdGg6IHN0cmluZyxcbiAgaG9zdFBhdGg6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXJ1bnRpbWUpIHRocm93IG5ldyBFcnJvcihcIlJ1bnRpbWUgbm90IGluaXRpYWxpemVkLlwiKTtcbiAgYXdhaXQgcnVuKFtcImNwXCIsIGAke2NvbnRhaW5lck5hbWV9OiR7Y29udGFpbmVyUGF0aH1gLCBob3N0UGF0aF0sIDYwXzAwMCk7XG59XG5cbi8qKlxuICogR2V0IGVudmlyb25tZW50IGluZm8gZnJvbSBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVudmlyb25tZW50SW5mbyhcbiAgbmV0d29yazogYm9vbGVhbixcbiAgZGlza0xpbWl0TUI6IG51bWJlciA9IDAsXG4pOiBQcm9taXNlPEVudmlyb25tZW50SW5mbz4ge1xuICBjb25zdCBpbmZvU2NyaXB0ID0gYFxuZWNobyBcIk9TPSQoY2F0IC9ldGMvb3MtcmVsZWFzZSAyPi9kZXYvbnVsbCB8IGdyZXAgUFJFVFRZX05BTUUgfCBjdXQgLWQ9IC1mMiB8IHRyIC1kICdcIicpXCJcbmVjaG8gXCJLRVJORUw9JCh1bmFtZSAtcilcIlxuZWNobyBcIkFSQ0g9JCh1bmFtZSAtbSlcIlxuZWNobyBcIkhPU1ROQU1FPSQoaG9zdG5hbWUpXCJcbmVjaG8gXCJVUFRJTUU9JCh1cHRpbWUgLXAgMj4vZGV2L251bGwgfHwgdXB0aW1lKVwiXG5ESVNLX1VTRURfS0I9JChkdSAtc2sgJHtDT05UQUlORVJfV09SS0RJUn0gMj4vZGV2L251bGwgfCBhd2sgJ3twcmludCAkMX0nIHx8IGVjaG8gMClcbmVjaG8gXCJESVNLX1VTRURfS0I9XFwkRElTS19VU0VEX0tCXCJcbmVjaG8gXCJESVNLX0ZSRUVfUkFXPSQoZGYgLWsgJHtDT05UQUlORVJfV09SS0RJUn0gMj4vZGV2L251bGwgfCB0YWlsIC0xIHwgYXdrICd7cHJpbnQgJDR9JylcIlxuTUVNX0xJTUlUX0JZVEVTPVxcJChjYXQgL3N5cy9mcy9jZ3JvdXAvbWVtb3J5Lm1heCAyPi9kZXYvbnVsbCB8fCBjYXQgL3N5cy9mcy9jZ3JvdXAvbWVtb3J5L21lbW9yeS5saW1pdF9pbl9ieXRlcyAyPi9kZXYvbnVsbCB8fCBlY2hvICcnKVxuTUVNX1VTQUdFX0JZVEVTPVxcJChjYXQgL3N5cy9mcy9jZ3JvdXAvbWVtb3J5LmN1cnJlbnQgMj4vZGV2L251bGwgfHwgY2F0IC9zeXMvZnMvY2dyb3VwL21lbW9yeS9tZW1vcnkudXNhZ2VfaW5fYnl0ZXMgMj4vZGV2L251bGwgfHwgZWNobyAnJylcbmlmIFsgLW4gXCJcXCRNRU1fTElNSVRfQllURVNcIiBdICYmIFsgXCJcXCRNRU1fTElNSVRfQllURVNcIiAhPSBcIm1heFwiIF0gJiYgWyBcIlxcJE1FTV9MSU1JVF9CWVRFU1wiIC1sdCA5MDAwMDAwMDAwMDAwIF0gMj4vZGV2L251bGw7IHRoZW5cbiAgTUVNX1RPVEFMX0g9XFwkKGF3ayBcIkJFR0lOe3ByaW50ZiBcXFwiJS4wZk1pQlxcXCIsIFxcJE1FTV9MSU1JVF9CWVRFUy8xMDQ4NTc2fVwiKVxuICBNRU1fVVNFRF9IPVxcJChhd2sgXCJCRUdJTntwcmludGYgXFxcIiUuMGZNaUJcXFwiLCBcXCR7TUVNX1VTQUdFX0JZVEVTOi0wfS8xMDQ4NTc2fVwiKVxuICBNRU1fRlJFRV9IPVxcJChhd2sgXCJCRUdJTntwcmludGYgXFxcIiUuMGZNaUJcXFwiLCAoXFwkTUVNX0xJTUlUX0JZVEVTLVxcJHtNRU1fVVNBR0VfQllURVM6LTB9KS8xMDQ4NTc2fVwiKVxuZWxzZVxuICBNRU1fVE9UQUxfSD1cXCQoZnJlZSAtaCAyPi9kZXYvbnVsbCB8IGdyZXAgTWVtIHwgYXdrICd7cHJpbnQgXFwkMn0nIHx8IGVjaG8gJ04vQScpXG4gIE1FTV9VU0VEX0g9XFwkKGZyZWUgLWggMj4vZGV2L251bGwgfCBncmVwIE1lbSB8IGF3ayAne3ByaW50IFxcJDN9JyB8fCBlY2hvICdOL0EnKVxuICBNRU1fRlJFRV9IPVxcJChmcmVlIC1oIDI+L2Rldi9udWxsIHwgZ3JlcCBNZW0gfCBhd2sgJ3twcmludCBcXCQ0fScgfHwgZWNobyAnTi9BJylcbmZpXG5lY2hvIFwiTUVNX0ZSRUU9XFwkTUVNX0ZSRUVfSFwiXG5lY2hvIFwiTUVNX1RPVEFMPVxcJE1FTV9UT1RBTF9IXCJcbmVjaG8gXCJQWVRIT049JChweXRob24zIC0tdmVyc2lvbiAyPi9kZXYvbnVsbCB8fCBlY2hvICcnKVwiXG5lY2hvIFwiTk9ERT0kKG5vZGUgLS12ZXJzaW9uIDI+L2Rldi9udWxsIHx8IGVjaG8gJycpXCJcbmVjaG8gXCJHQ0M9JChnY2MgLS12ZXJzaW9uIDI+L2Rldi9udWxsIHwgaGVhZCAtMSB8fCBlY2hvICcnKVwiXG5lY2hvIFwiVE9PTFM9JCh3aGljaCBnaXQgY3VybCB3Z2V0IHZpbSBuYW5vIHB5dGhvbjMgbm9kZSBucG0gZ2NjIG1ha2UgY21ha2UgcGlwMyAyPi9kZXYvbnVsbCB8IHhhcmdzIC1Je30gYmFzZW5hbWUge30gfCB0ciAnXFxcXG4nICcsJylcIlxuICBgLnRyaW0oKTtcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjKGluZm9TY3JpcHQsIDEwKTtcbiAgY29uc3QgbGluZXMgPSByZXN1bHQuc3Rkb3V0LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBnZXQgPSAocHJlZml4OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGxpbmUgPSBsaW5lcy5maW5kKChsKSA9PiBsLnN0YXJ0c1dpdGgocHJlZml4ICsgXCI9XCIpKTtcbiAgICByZXR1cm4gbGluZT8uc2xpY2UocHJlZml4Lmxlbmd0aCArIDEpPy50cmltKCkgPz8gXCJOL0FcIjtcbiAgfTtcblxuICBjb25zdCBkaXNrVXNlZEtCID0gcGFyc2VJbnQoZ2V0KFwiRElTS19VU0VEX0tCXCIpIHx8IFwiMFwiLCAxMCk7XG4gIGNvbnN0IGRpc2tGcmVlUmF3S0IgPSBwYXJzZUludChnZXQoXCJESVNLX0ZSRUVfUkFXXCIpIHx8IFwiMFwiLCAxMCk7XG4gIGxldCBkaXNrVG90YWw6IHN0cmluZztcbiAgbGV0IGRpc2tGcmVlOiBzdHJpbmc7XG4gIGlmIChkaXNrTGltaXRNQiA+IDApIHtcbiAgICBjb25zdCBkaXNrTGltaXRLQiA9IGRpc2tMaW1pdE1CICogMTAyNDtcbiAgICBjb25zdCBkaXNrRnJlZUtCID0gTWF0aC5tYXgoMCwgZGlza0xpbWl0S0IgLSBkaXNrVXNlZEtCKTtcbiAgICBjb25zdCB0b01pQiA9IChrYjogbnVtYmVyKSA9PlxuICAgICAga2IgPj0gMTAyNCAqIDEwMjRcbiAgICAgICAgPyBgJHsoa2IgLyAxMDI0IC8gMTAyNCkudG9GaXhlZCgxKX1HaUJgXG4gICAgICAgIDogYCR7TWF0aC5yb3VuZChrYiAvIDEwMjQpfU1pQmA7XG4gICAgZGlza1RvdGFsID0gdG9NaUIoZGlza0xpbWl0S0IpO1xuICAgIGRpc2tGcmVlID0gdG9NaUIoZGlza0ZyZWVLQik7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdG9NaUIgPSAoa2I6IG51bWJlcikgPT5cbiAgICAgIGtiID49IDEwMjQgKiAxMDI0XG4gICAgICAgID8gYCR7KGtiIC8gMTAyNCAvIDEwMjQpLnRvRml4ZWQoMSl9R2lCYFxuICAgICAgICA6IGAke01hdGgucm91bmQoa2IgLyAxMDI0KX1NaUJgO1xuICAgIGRpc2tGcmVlID0gdG9NaUIoZGlza0ZyZWVSYXdLQik7XG4gICAgZGlza1RvdGFsID0gXCJOL0FcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3M6IGdldChcIk9TXCIpLFxuICAgIGtlcm5lbDogZ2V0KFwiS0VSTkVMXCIpLFxuICAgIGFyY2g6IGdldChcIkFSQ0hcIiksXG4gICAgaG9zdG5hbWU6IGdldChcIkhPU1ROQU1FXCIpLFxuICAgIHVwdGltZTogZ2V0KFwiVVBUSU1FXCIpLFxuICAgIGRpc2tGcmVlLFxuICAgIGRpc2tUb3RhbCxcbiAgICBtZW1vcnlGcmVlOiBnZXQoXCJNRU1fRlJFRVwiKSxcbiAgICBtZW1vcnlUb3RhbDogZ2V0KFwiTUVNX1RPVEFMXCIpLFxuICAgIHB5dGhvblZlcnNpb246IGdldChcIlBZVEhPTlwiKSB8fCBudWxsLFxuICAgIG5vZGVWZXJzaW9uOiBnZXQoXCJOT0RFXCIpIHx8IG51bGwsXG4gICAgZ2NjVmVyc2lvbjogZ2V0KFwiR0NDXCIpIHx8IG51bGwsXG4gICAgaW5zdGFsbGVkVG9vbHM6IGdldChcIlRPT0xTXCIpLnNwbGl0KFwiLFwiKS5maWx0ZXIoQm9vbGVhbiksXG4gICAgd29ya2RpcjogQ09OVEFJTkVSX1dPUktESVIsXG4gICAgbmV0d29ya0VuYWJsZWQ6IG5ldHdvcmssXG4gIH07XG59XG5cbi8qKlxuICogTGlzdCBwcm9jZXNzZXMgcnVubmluZyBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3RQcm9jZXNzZXMoKTogUHJvbWlzZTxQcm9jZXNzSW5mb1tdPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWMoXG4gICAgXCJwcyBhdXggLS1uby1oZWFkZXJzIDI+L2Rldi9udWxsIHx8IHBzIGF1eCAyPi9kZXYvbnVsbFwiLFxuICAgIDUsXG4gICk7XG5cbiAgaWYgKHJlc3VsdC5leGl0Q29kZSAhPT0gMCkgcmV0dXJuIFtdO1xuXG4gIHJldHVybiByZXN1bHQuc3Rkb3V0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLmZpbHRlcigobGluZSkgPT4gbGluZS50cmltKCkgJiYgIWxpbmUuaW5jbHVkZXMoXCJwcyBhdXhcIikpXG4gICAgLm1hcCgobGluZSkgPT4ge1xuICAgICAgY29uc3QgcGFydHMgPSBsaW5lLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGlkOiBwYXJzZUludChwYXJ0c1sxXSA/PyBcIjBcIiwgMTApLFxuICAgICAgICB1c2VyOiBwYXJ0c1swXSA/PyBcIj9cIixcbiAgICAgICAgY3B1OiBwYXJ0c1syXSA/PyBcIjBcIixcbiAgICAgICAgbWVtb3J5OiBwYXJ0c1szXSA/PyBcIjBcIixcbiAgICAgICAgc3RhcnRlZDogcGFydHNbOF0gPz8gXCI/XCIsXG4gICAgICAgIGNvbW1hbmQ6IHBhcnRzLnNsaWNlKDEwKS5qb2luKFwiIFwiKSB8fCBwYXJ0cy5zbGljZSgzKS5qb2luKFwiIFwiKSxcbiAgICAgIH07XG4gICAgfSlcbiAgICAuZmlsdGVyKChwKSA9PiBwLnBpZCA+IDApO1xufVxuXG4vKipcbiAqIEtpbGwgYSBwcm9jZXNzIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24ga2lsbFByb2Nlc3MoXG4gIHBpZDogbnVtYmVyLFxuICBzaWduYWw6IHN0cmluZyA9IFwiU0lHVEVSTVwiLFxuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWMoYGtpbGwgLSR7c2lnbmFsfSAke3BpZH1gLCA1KTtcbiAgcmV0dXJuIHJlc3VsdC5leGl0Q29kZSA9PT0gMDtcbn1cblxuLyoqXG4gKiBTdG9wIGFuZCBvcHRpb25hbGx5IHJlbW92ZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcENvbnRhaW5lcihyZW1vdmU6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXJ1bnRpbWUpIHJldHVybjtcblxuICBpZiAoc2hlbGxTZXNzaW9uKSB7XG4gICAgc2hlbGxTZXNzaW9uLmtpbGwoKTtcbiAgICBzaGVsbFNlc3Npb24gPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTtcbiAgfSBjYXRjaCB7XG4gICAgLyogYWxyZWFkeSBzdG9wcGVkICovXG4gIH1cblxuICBpZiAocmVtb3ZlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJ1bihbXCJybVwiLCBcIi1mXCIsIGNvbnRhaW5lck5hbWVdLCAxMF8wMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLyogYWxyZWFkeSByZW1vdmVkICovXG4gICAgfVxuICB9XG5cbiAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBEZXN0cm95IHRoZSBjb250YWluZXIgYW5kIGFsbCBpdHMgZGF0YS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc3Ryb3lDb250YWluZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IHN0b3BDb250YWluZXIodHJ1ZSk7XG4gIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG4gIGN1cnJlbnROZXR3b3JrID0gXCJub25lXCI7XG4gIGluaXRQcm9taXNlID0gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXN0YXJ0IHRoZSBjb250YWluZXIgd2l0aG91dCB3aXBpbmcgaXRzIGRhdGEuXG4gKiBTdG9wcyB0aGUgcnVubmluZyBjb250YWluZXIsIGtpbGxzIHRoZSBzaGVsbCBzZXNzaW9uLCB0aGVuIHN0YXJ0cyBpdCBhZ2Fpbi5cbiAqIEZhc3RlciB0aGFuIGEgZnVsbCByZWJ1aWxkIFx1MjAxNCBmaWxlc3lzdGVtIGFuZCBpbnN0YWxsZWQgcGFja2FnZXMgYXJlIHByZXNlcnZlZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RhcnRDb250YWluZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWQuXCIpO1xuICBpZiAoc2hlbGxTZXNzaW9uKSB7XG4gICAgc2hlbGxTZXNzaW9uLmtpbGwoKTtcbiAgICBzaGVsbFNlc3Npb24gPSBudWxsO1xuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgcnVuKFtcInN0b3BcIiwgY29udGFpbmVyTmFtZV0sIDE1XzAwMCk7XG4gIH0gY2F0Y2gge31cbiAgYXdhaXQgcnVuKFtcInN0YXJ0XCIsIGNvbnRhaW5lck5hbWVdLCAzMF8wMDApO1xuICBjb250YWluZXJSZWFkeSA9IHRydWU7XG59XG5cbi8qKlxuICogR2V0IGRldGFpbGVkIGNvbnRhaW5lciBpbmZvLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29udGFpbmVySW5mbygpOiBQcm9taXNlPENvbnRhaW5lckluZm8+IHtcbiAgaWYgKCFydW50aW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJSdW50aW1lIG5vdCBpbml0aWFsaXplZC5cIik7XG5cbiAgY29uc3Qgc3RhdGUgPSBhd2FpdCBnZXRDb250YWluZXJTdGF0ZSgpO1xuXG4gIGlmIChzdGF0ZSA9PT0gXCJub3RfZm91bmRcIikge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogXCJcIixcbiAgICAgIG5hbWU6IGNvbnRhaW5lck5hbWUsXG4gICAgICBzdGF0ZTogXCJub3RfZm91bmRcIixcbiAgICAgIGltYWdlOiBcIlwiLFxuICAgICAgY3JlYXRlZDogXCJcIixcbiAgICAgIHVwdGltZTogbnVsbCxcbiAgICAgIGNwdVVzYWdlOiBudWxsLFxuICAgICAgbWVtb3J5VXNhZ2U6IG51bGwsXG4gICAgICBkaXNrVXNhZ2U6IG51bGwsXG4gICAgICBuZXR3b3JrTW9kZTogXCJcIixcbiAgICAgIHBvcnRzOiBbXSxcbiAgICB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBmb3JtYXQgPVxuICAgICAgXCJ7ey5JZH19XFx0e3suQ29uZmlnLkltYWdlfX1cXHR7ey5DcmVhdGVkfX1cXHR7ey5TdGF0ZS5TdGF0dXN9fVxcdHt7Lkhvc3RDb25maWcuTmV0d29ya01vZGV9fVwiO1xuICAgIGNvbnN0IG91dCA9IGF3YWl0IHJ1bihbXCJpbnNwZWN0XCIsIGNvbnRhaW5lck5hbWUsIFwiLS1mb3JtYXRcIiwgZm9ybWF0XSk7XG4gICAgY29uc3QgW2lkLCBpbWFnZSwgY3JlYXRlZCwgLCBuZXR3b3JrTW9kZV0gPSBvdXQuc3BsaXQoXCJcXHRcIik7XG5cbiAgICBsZXQgY3B1VXNhZ2U6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIGxldCBtZW1vcnlVc2FnZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAoc3RhdGUgPT09IFwicnVubmluZ1wiKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IHJ1bihcbiAgICAgICAgICBbXG4gICAgICAgICAgICBcInN0YXRzXCIsXG4gICAgICAgICAgICBjb250YWluZXJOYW1lLFxuICAgICAgICAgICAgXCItLW5vLXN0cmVhbVwiLFxuICAgICAgICAgICAgXCItLWZvcm1hdFwiLFxuICAgICAgICAgICAgXCJ7ey5DUFVQZXJjfX1cXHR7ey5NZW1Vc2FnZX19XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICAxMF8wMDAsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IFtjcHUsIG1lbV0gPSBzdGF0cy5zcGxpdChcIlxcdFwiKTtcbiAgICAgICAgY3B1VXNhZ2UgPSBjcHU/LnRyaW0oKSA/PyBudWxsO1xuICAgICAgICBtZW1vcnlVc2FnZSA9IG1lbT8udHJpbSgpID8/IG51bGw7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogc3RhdHMgbm90IGF2YWlsYWJsZSAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpZDogaWQ/LnNsaWNlKDAsIDEyKSA/PyBcIlwiLFxuICAgICAgbmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgIHN0YXRlLFxuICAgICAgaW1hZ2U6IGltYWdlID8/IFwiXCIsXG4gICAgICBjcmVhdGVkOiBjcmVhdGVkID8/IFwiXCIsXG4gICAgICB1cHRpbWU6IHN0YXRlID09PSBcInJ1bm5pbmdcIiA/IFwicnVubmluZ1wiIDogbnVsbCxcbiAgICAgIGNwdVVzYWdlLFxuICAgICAgbWVtb3J5VXNhZ2UsXG4gICAgICBkaXNrVXNhZ2U6IG51bGwsXG4gICAgICBuZXR3b3JrTW9kZTogbmV0d29ya01vZGUgPz8gXCJcIixcbiAgICAgIHBvcnRzOiBbXSxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IFwiXCIsXG4gICAgICBuYW1lOiBjb250YWluZXJOYW1lLFxuICAgICAgc3RhdGUsXG4gICAgICBpbWFnZTogXCJcIixcbiAgICAgIGNyZWF0ZWQ6IFwiXCIsXG4gICAgICB1cHRpbWU6IG51bGwsXG4gICAgICBjcHVVc2FnZTogbnVsbCxcbiAgICAgIG1lbW9yeVVzYWdlOiBudWxsLFxuICAgICAgZGlza1VzYWdlOiBudWxsLFxuICAgICAgbmV0d29ya01vZGU6IFwiXCIsXG4gICAgICBwb3J0czogW10sXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgY29udGFpbmVyJ3MgbmV0d29yayBtb2RlIChyZXF1aXJlcyByZXN0YXJ0KS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZU5ldHdvcmsoXG4gIG1vZGU6IE5ldHdvcmtNb2RlLFxuICBvcHRzOiBQYXJhbWV0ZXJzPHR5cGVvZiBlbnN1cmVSZWFkeT5bMF0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaGFkQ29udGFpbmVyID0gKGF3YWl0IGdldENvbnRhaW5lclN0YXRlKCkpICE9PSBcIm5vdF9mb3VuZFwiO1xuXG4gIGlmIChoYWRDb250YWluZXIpIHtcbiAgICBjb25zdCB0ZW1wSW1hZ2UgPSBgJHtjb250YWluZXJOYW1lfS1zdGF0ZTpsYXRlc3RgO1xuICAgIGlmIChvcHRzLnBlcnNpc3RlbmNlTW9kZSA9PT0gXCJwZXJzaXN0ZW50XCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJjb21taXRcIiwgY29udGFpbmVyTmFtZSwgdGVtcEltYWdlXSwgNjBfMDAwKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvKiBiZXN0IGVmZm9ydCAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIGF3YWl0IGRlc3Ryb3lDb250YWluZXIoKTtcblxuICAgIGNvbnN0IHVzZUltYWdlID1cbiAgICAgIG9wdHMucGVyc2lzdGVuY2VNb2RlID09PSBcInBlcnNpc3RlbnRcIiA/IHRlbXBJbWFnZSA6IG9wdHMuaW1hZ2U7XG4gICAgY29uc3QgYWN0dWFsT3B0cyA9IHsgLi4ub3B0cywgbmV0d29yazogbW9kZSB9O1xuXG4gICAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbiAgICBhd2FpdCBlbnN1cmVSZWFkeSh7IC4uLmFjdHVhbE9wdHMsIGltYWdlOiB1c2VJbWFnZSBhcyBhbnkgfSk7XG5cbiAgICBpZiAob3B0cy5wZXJzaXN0ZW5jZU1vZGUgPT09IFwicGVyc2lzdGVudFwiKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW4oW1wicm1pXCIsIHRlbXBJbWFnZV0sIDEwXzAwMCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogYmVzdCBlZmZvcnQgKi9cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgY29udGFpbmVyIGVuZ2luZSBpcyByZWFkeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVhZHkoKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb250YWluZXJSZWFkeTtcbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgcGVyc2lzdGVudCBzaGVsbCBzZXNzaW9uIHdpdGhvdXQgdG91Y2hpbmcgdGhlIGNvbnRhaW5lci5cbiAqIFVzZWZ1bCB3aGVuIHRoZSBtb2RlbCB3YW50cyBhIGNsZWFuIHNoZWxsIChmcmVzaCBlbnYgdmFycywgYmFjayB0byBob21lIGRpcilcbiAqIHdpdGhvdXQgYSBmdWxsIGNvbnRhaW5lciByZWJ1aWxkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTaGVsbFNlc3Npb24oKTogdm9pZCB7XG4gIGlmIChzaGVsbFNlc3Npb24pIHtcbiAgICBzaGVsbFNlc3Npb24ua2lsbCgpO1xuICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBWZXJpZnkgdGhlIGNvbnRhaW5lciBpcyBhY3R1YWxseSBydW5uaW5nLiBJZiBpdCBoYXMgYmVlbiBkZWxldGVkIG9yIHN0b3BwZWRcbiAqIGV4dGVybmFsbHksIHJlc2V0cyBjb250YWluZXJSZWFkeSBzbyBlbnN1cmVSZWFkeSgpIHdpbGwgcmVjcmVhdGUgaXQuXG4gKiBDYWxsIHRoaXMgYXQgdGhlIHN0YXJ0IG9mIGV2ZXJ5IHRvb2wgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlIZWFsdGgoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghY29udGFpbmVyUmVhZHkpIHJldHVybjtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IGdldENvbnRhaW5lclN0YXRlKCk7XG4gICAgaWYgKHN0YXRlICE9PSBcInJ1bm5pbmdcIikge1xuICAgICAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnROZXR3b3JrID0gXCJub25lXCI7XG4gICAgICBpZiAoc2hlbGxTZXNzaW9uKSB7XG4gICAgICAgIHNoZWxsU2Vzc2lvbi5raWxsKCk7XG4gICAgICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xuICAgIGN1cnJlbnROZXR3b3JrID0gXCJub25lXCI7XG4gICAgaWYgKHNoZWxsU2Vzc2lvbikge1xuICAgICAgc2hlbGxTZXNzaW9uLmtpbGwoKTtcbiAgICAgIHNoZWxsU2Vzc2lvbiA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBjb250YWluZXIgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lck5hbWUoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRhaW5lck5hbWU7XG59XG4iLCAiLyoqXG4gKiBAZmlsZSBzYWZldHkvZ3VhcmQudHNcbiAqIENvbW1hbmQgc2FmZXR5IGxheWVyIFx1MjAxNCBzY3JlZW5zIGNvbW1hbmRzIGJlZm9yZSBleGVjdXRpb24uXG4gKlxuICogV2hlbiBzdHJpY3QgbW9kZSBpcyBlbmFibGVkLCBibG9ja3MgcGF0dGVybnMga25vd24gdG8gYmUgZGVzdHJ1Y3RpdmUuXG4gKiBUaGlzIGlzIGEgYmVzdC1lZmZvcnQgc2FmZXR5IG5ldCwgbm90IGEgc2VjdXJpdHkgYm91bmRhcnkgXHUyMDE0IHRoZVxuICogY29udGFpbmVyIGl0c2VsZiBpcyB0aGUgcmVhbCBpc29sYXRpb24gbGF5ZXIuXG4gKi9cblxuaW1wb3J0IHsgQkxPQ0tFRF9DT01NQU5EU19TVFJJQ1QgfSBmcm9tIFwiLi4vY29uc3RhbnRzXCI7XG5cbi8qKiBSZXN1bHQgb2YgYSBzYWZldHkgY2hlY2suICovXG5leHBvcnQgaW50ZXJmYWNlIFNhZmV0eUNoZWNrUmVzdWx0IHtcbiAgYWxsb3dlZDogYm9vbGVhbjtcbiAgcmVhc29uPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGNvbW1hbmQgZm9yIHBhdHRlcm4gbWF0Y2hpbmc6XG4gKiAtIGNvbGxhcHNlIHdoaXRlc3BhY2VcbiAqIC0gbG93ZXJjYXNlXG4gKiAtIHN0cmlwIGxlYWRpbmcgc3Vkby9kb2FzXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZShjbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjbWRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAudHJpbSgpXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvXihzdWRvfGRvYXMpXFxzKy8sIFwiXCIpO1xufVxuXG4vKipcbiAqIENoZWNrIGEgY29tbWFuZCBhZ2FpbnN0IHRoZSBzdHJpY3QgYmxvY2tsaXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb21tYW5kKFxuICBjb21tYW5kOiBzdHJpbmcsXG4gIHN0cmljdE1vZGU6IGJvb2xlYW4sXG4pOiBTYWZldHlDaGVja1Jlc3VsdCB7XG4gIGlmICghc3RyaWN0TW9kZSkge1xuICAgIHJldHVybiB7IGFsbG93ZWQ6IHRydWUgfTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemUoY29tbWFuZCk7XG5cbiAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIEJMT0NLRURfQ09NTUFORFNfU1RSSUNUKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFBhdHRlcm4gPSBub3JtYWxpemUocGF0dGVybik7XG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMobm9ybWFsaXplZFBhdHRlcm4pKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbGxvd2VkOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOlxuICAgICAgICAgIGBCbG9ja2VkIGJ5IHN0cmljdCBzYWZldHkgbW9kZTogY29tbWFuZCBtYXRjaGVzIGRlc3RydWN0aXZlIHBhdHRlcm4gXCIke3BhdHRlcm59XCIuIGAgK1xuICAgICAgICAgIGBEaXNhYmxlIFwiU3RyaWN0IFNhZmV0eSBNb2RlXCIgaW4gcGx1Z2luIHNldHRpbmdzIGlmIHlvdSBuZWVkIHRvIHJ1biB0aGlzLmAsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGlmICgvOlxcKFxcKVxccypcXHsuKlxcfS8udGVzdChub3JtYWxpemVkKSB8fCAvXFwuXFwoXFwpXFxzKlxcey4qXFx9Ly50ZXN0KG5vcm1hbGl6ZWQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFsbG93ZWQ6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcIkJsb2NrZWQgYnkgc3RyaWN0IHNhZmV0eSBtb2RlOiBkZXRlY3RlZCBmb3JrIGJvbWIgcGF0dGVybi5cIixcbiAgICB9O1xuICB9XG5cbiAgaWYgKFxuICAgIC8+XFxzKlxcL2RldlxcL1tzaF1kW2Etel0vLnRlc3Qobm9ybWFsaXplZCkgfHxcbiAgICAvb2Y9XFwvZGV2XFwvW3NoXWRbYS16XS8udGVzdChub3JtYWxpemVkKVxuICApIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWxsb3dlZDogZmFsc2UsXG4gICAgICByZWFzb246IFwiQmxvY2tlZCBieSBzdHJpY3Qgc2FmZXR5IG1vZGU6IGRpcmVjdCB3cml0ZSB0byBibG9jayBkZXZpY2UuXCIsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7IGFsbG93ZWQ6IHRydWUgfTtcbn1cbiIsICIvKipcbiAqIEBmaWxlIHRvb2xzUHJvdmlkZXIudHNcbiAqIFJlZ2lzdGVycyBhbGwgY29tcHV0ZXIgdG9vbHMgd2l0aCBMTSBTdHVkaW8uXG4gKlxuICogVG9vbHM6XG4gKiAgIDEuIEV4ZWN1dGUgICAgICAgICBcdTIwMTQgcnVuIGFueSBzaGVsbCBjb21tYW5kXG4gKiAgIDIuIFdyaXRlIEZpbGUgICAgICBcdTIwMTQgY3JlYXRlL292ZXJ3cml0ZSBmaWxlcyBpbnNpZGUgdGhlIGNvbnRhaW5lclxuICogICAzLiBSZWFkIEZpbGUgICAgICAgXHUyMDE0IHJlYWQgZmlsZSBjb250ZW50cyBmcm9tIHRoZSBjb250YWluZXJcbiAqICAgNC4gTGlzdCBEaXJlY3RvcnkgIFx1MjAxNCBsaXN0IGRpcmVjdG9yeSBjb250ZW50cyB3aXRoIG1ldGFkYXRhXG4gKiAgIDUuIFVwbG9hZCBGaWxlICAgICBcdTIwMTQgdHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIGhvc3QgaW50byB0aGUgY29udGFpbmVyXG4gKiAgIDYuIERvd25sb2FkIEZpbGUgICBcdTIwMTQgcHVsbCBhIGZpbGUgZnJvbSB0aGUgY29udGFpbmVyIHRvIHRoZSBob3N0XG4gKiAgIDcuIENvbXB1dGVyIFN0YXR1cyBcdTIwMTQgZW52aXJvbm1lbnQgaW5mbywgcHJvY2Vzc2VzLCByZXNvdXJjZSB1c2FnZVxuICpcbiAqIEV2ZXJ5IHRvb2wgZW5mb3JjZXMgdGhlIHBlci10dXJuIGNhbGwgYnVkZ2V0IGJlZm9yZSBleGVjdXRpbmcuXG4gKi9cblxuaW1wb3J0IHsgdG9vbCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBob21lZGlyLCBwbGF0Zm9ybSB9IGZyb20gXCJvc1wiO1xuaW1wb3J0IHsgam9pbiBhcyBwYXRoSm9pbiB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0ICogYXMgZW5naW5lIGZyb20gXCIuL2NvbnRhaW5lci9lbmdpbmVcIjtcbmltcG9ydCB7IGNoZWNrQ29tbWFuZCB9IGZyb20gXCIuL3NhZmV0eS9ndWFyZFwiO1xuaW1wb3J0IHtcbiAgQ09OVEFJTkVSX1dPUktESVIsXG4gIE1BWF9GSUxFX1JFQURfQllURVMsXG4gIE1BWF9GSUxFX1dSSVRFX0JZVEVTLFxuICBNQVhfVElNRU9VVF9TRUNPTkRTLFxufSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB0eXBlIHsgUGx1Z2luQ29udHJvbGxlciB9IGZyb20gXCIuL3BsdWdpblR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IENvbXB1dGVyUGx1Z2luQ29uZmlnLCBUdXJuQnVkZ2V0IH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgTmV0d29ya01vZGUsIENvbnRhaW5lckltYWdlIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbmZ1bmN0aW9uIHJlYWRDb25maWcoY3RsOiBQbHVnaW5Db250cm9sbGVyKTogQ29tcHV0ZXJQbHVnaW5Db25maWcge1xuICBjb25zdCBjID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcbiAgcmV0dXJuIHtcbiAgICBpbnRlcm5ldEFjY2VzczogYy5nZXQoXCJpbnRlcm5ldEFjY2Vzc1wiKSA9PT0gXCJvblwiLFxuICAgIHBlcnNpc3RlbmNlTW9kZTogYy5nZXQoXCJwZXJzaXN0ZW5jZU1vZGVcIikgfHwgXCJwZXJzaXN0ZW50XCIsXG4gICAgYmFzZUltYWdlOiBjLmdldChcImJhc2VJbWFnZVwiKSB8fCBcInVidW50dToyNC4wNFwiLFxuICAgIGNwdUxpbWl0OiBjLmdldChcImNwdUxpbWl0XCIpID8/IDIsXG4gICAgbWVtb3J5TGltaXRNQjogYy5nZXQoXCJtZW1vcnlMaW1pdE1CXCIpID8/IDEwMjQsXG4gICAgZGlza0xpbWl0TUI6IGMuZ2V0KFwiZGlza0xpbWl0TUJcIikgPz8gNDA5NixcbiAgICBjb21tYW5kVGltZW91dDogYy5nZXQoXCJjb21tYW5kVGltZW91dFwiKSA/PyAzMCxcbiAgICBtYXhPdXRwdXRTaXplOiAoYy5nZXQoXCJtYXhPdXRwdXRTaXplXCIpID8/IDMyKSAqIDEwMjQsXG4gICAgbWF4VG9vbENhbGxzUGVyVHVybjogYy5nZXQoXCJtYXhUb29sQ2FsbHNQZXJUdXJuXCIpID8/IDI1LFxuICAgIGF1dG9JbnN0YWxsUHJlc2V0OiBjLmdldChcImF1dG9JbnN0YWxsUHJlc2V0XCIpIHx8IFwibWluaW1hbFwiLFxuICAgIHBvcnRGb3J3YXJkczogYy5nZXQoXCJwb3J0Rm9yd2FyZHNcIikgfHwgXCJcIixcbiAgICBob3N0TW91bnRQYXRoOiBjLmdldChcImhvc3RNb3VudFBhdGhcIikgfHwgXCJcIixcbiAgICBzdHJpY3RTYWZldHk6IGMuZ2V0KFwic3RyaWN0U2FmZXR5XCIpID09PSBcIm9uXCIsXG4gICAgYXV0b0luamVjdENvbnRleHQ6IGMuZ2V0KFwiYXV0b0luamVjdENvbnRleHRcIikgPT09IFwib25cIixcbiAgfTtcbn1cblxuLyoqXG4gKiBTaGFyZWQgdHVybiBidWRnZXQuIFRoZSBwcmVwcm9jZXNzb3IgaW5jcmVtZW50cyBgdHVybklkYCBlYWNoIHRpbWVcbiAqIGEgbmV3IHVzZXIgbWVzc2FnZSBhcnJpdmVzLCB3aGljaCByZXNldHMgdGhlIGNhbGwgY291bnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0dXJuQnVkZ2V0OiBUdXJuQnVkZ2V0ID0ge1xuICB0dXJuSWQ6IDAsXG4gIGNhbGxzVXNlZDogMCxcbiAgbWF4Q2FsbHM6IDI1LFxufTtcblxuLyoqIENhbGxlZCBieSB0aGUgcHJlcHJvY2Vzc29yIHRvIHNpZ25hbCBhIG5ldyB0dXJuLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkdmFuY2VUdXJuKG1heENhbGxzOiBudW1iZXIpOiB2b2lkIHtcbiAgdHVybkJ1ZGdldC50dXJuSWQrKztcbiAgdHVybkJ1ZGdldC5jYWxsc1VzZWQgPSAwO1xuICB0dXJuQnVkZ2V0Lm1heENhbGxzID0gbWF4Q2FsbHM7XG59XG5cbi8qKlxuICogQ2hlY2sgYW5kIGNvbnN1bWUgb25lIHRvb2wgY2FsbCBmcm9tIHRoZSBidWRnZXQuXG4gKiBSZXR1cm5zIGFuIGVycm9yIHN0cmluZyBpZiB0aGUgYnVkZ2V0IGlzIGV4aGF1c3RlZCwgb3IgbnVsbCBpZiBPSy5cbiAqL1xuZnVuY3Rpb24gY29uc3VtZUJ1ZGdldCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHVybkJ1ZGdldC5jYWxsc1VzZWQrKztcbiAgaWYgKHR1cm5CdWRnZXQuY2FsbHNVc2VkID4gdHVybkJ1ZGdldC5tYXhDYWxscykge1xuICAgIHJldHVybiAoXG4gICAgICBgVG9vbCBjYWxsIGJ1ZGdldCBleGhhdXN0ZWQ6IHlvdSd2ZSB1c2VkICR7dHVybkJ1ZGdldC5tYXhDYWxsc30vJHt0dXJuQnVkZ2V0Lm1heENhbGxzfSBgICtcbiAgICAgIGBjYWxscyB0aGlzIHR1cm4uIFdhaXQgZm9yIHRoZSB1c2VyJ3MgbmV4dCBtZXNzYWdlIHRvIGNvbnRpbnVlLiBgICtcbiAgICAgIGAoQ29uZmlndXJhYmxlIGluIHBsdWdpbiBzZXR0aW5ncyBcdTIxOTIgXCJNYXggVG9vbCBDYWxscyBQZXIgVHVyblwiKWBcbiAgICApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogUmV0dXJuIGEgYnVkZ2V0IHN0YXR1cyBzdHJpbmcgZm9yIHRvb2wgcmVzcG9uc2VzLiAqL1xuZnVuY3Rpb24gYnVkZ2V0U3RhdHVzKCk6IHtcbiAgY2FsbHNVc2VkOiBudW1iZXI7XG4gIGNhbGxzUmVtYWluaW5nOiBudW1iZXI7XG4gIG1heFBlclR1cm46IG51bWJlcjtcbn0ge1xuICByZXR1cm4ge1xuICAgIGNhbGxzVXNlZDogdHVybkJ1ZGdldC5jYWxsc1VzZWQsXG4gICAgY2FsbHNSZW1haW5pbmc6IE1hdGgubWF4KDAsIHR1cm5CdWRnZXQubWF4Q2FsbHMgLSB0dXJuQnVkZ2V0LmNhbGxzVXNlZCksXG4gICAgbWF4UGVyVHVybjogdHVybkJ1ZGdldC5tYXhDYWxscyxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlQ29udGFpbmVyKFxuICBjZmc6IENvbXB1dGVyUGx1Z2luQ29uZmlnLFxuICBzdGF0dXM6IChtc2c6IHN0cmluZykgPT4gdm9pZCxcbik6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBlbmdpbmUudmVyaWZ5SGVhbHRoKCk7XG5cbiAgaWYgKGVuZ2luZS5pc1JlYWR5KCkpIHJldHVybjtcblxuICBzdGF0dXMoXCJTdGFydGluZyBjb21wdXRlclx1MjAyNiAoZmlyc3QgdXNlIG1heSB0YWtlIGEgbW9tZW50IHRvIHB1bGwgdGhlIGltYWdlKVwiKTtcblxuICBhd2FpdCBlbmdpbmUuZW5zdXJlUmVhZHkoe1xuICAgIGltYWdlOiBjZmcuYmFzZUltYWdlIGFzIENvbnRhaW5lckltYWdlLFxuICAgIG5ldHdvcms6IChjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImJyaWRnZVwiIDogXCJub25lXCIpIGFzIE5ldHdvcmtNb2RlLFxuICAgIGNwdUxpbWl0OiBjZmcuY3B1TGltaXQsXG4gICAgbWVtb3J5TGltaXRNQjogY2ZnLm1lbW9yeUxpbWl0TUIsXG4gICAgZGlza0xpbWl0TUI6IGNmZy5kaXNrTGltaXRNQixcbiAgICBhdXRvSW5zdGFsbFByZXNldDogY2ZnLmF1dG9JbnN0YWxsUHJlc2V0LFxuICAgIHBvcnRGb3J3YXJkczogY2ZnLnBvcnRGb3J3YXJkcyxcbiAgICBob3N0TW91bnRQYXRoOiBjZmcuaG9zdE1vdW50UGF0aCxcbiAgICBwZXJzaXN0ZW5jZU1vZGU6IGNmZy5wZXJzaXN0ZW5jZU1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9vbHNQcm92aWRlcihjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgY2ZnID0gcmVhZENvbmZpZyhjdGwpO1xuXG4gIHR1cm5CdWRnZXQubWF4Q2FsbHMgPSBjZmcubWF4VG9vbENhbGxzUGVyVHVybjtcblxuICBjb25zdCBleGVjdXRlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiRXhlY3V0ZVwiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYFJ1biBhIHNoZWxsIGNvbW1hbmQgb24geW91ciBkZWRpY2F0ZWQgTGludXggY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgSU1QT1JUQU5UOiBUaGlzIHJ1bnMgaW4gYSBwZXJzaXN0ZW50IHNoZWxsIHNlc3Npb24gXHUyMDE0IHN0YXRlIGlzIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzLlxcbmAgK1xuICAgICAgYFx1MjAyMiBjZCwgZXhwb3J0LCBzb3VyY2UsIG52bSB1c2UsIGNvbmRhIGFjdGl2YXRlIFx1MjAxNCBhbGwgcGVyc2lzdCBhY3Jvc3MgY29tbWFuZHNcXG5gICtcbiAgICAgIGBcdTIwMjIgWW91IGFyZSBhbHdheXMgaW4gdGhlIHNhbWUgc2hlbGw7IG5vIG5lZWQgdG8gcmVwZWF0IHNldHVwXFxuYCArXG4gICAgICBgXHUyMDIyIFVzZSBwd2QgdG8gY2hlY2sgd2hlcmUgeW91IGFyZSwgZW52IHRvIHNlZSB2YXJpYWJsZXNcXG5cXG5gICtcbiAgICAgIGBUaGlzIGlzIGEgcmVhbCBpc29sYXRlZCBMaW51eCBjb250YWluZXIuIFlvdSBjYW4gaW5zdGFsbCBwYWNrYWdlcywgYCArXG4gICAgICBgY29tcGlsZSBjb2RlLCBydW4gc2NyaXB0cywgbWFuYWdlIGZpbGVzLCBzdGFydCBzZXJ2aWNlcywgZXRjLlxcblxcbmAgK1xuICAgICAgYFRJUFM6XFxuYCArXG4gICAgICBgXHUyMDIyIENoYWluIHdpdGggJiYgb3IgOyBhcyB1c3VhbFxcbmAgK1xuICAgICAgYFx1MjAyMiBVc2UgMj4mMSB0byBjYXB0dXJlIHN0ZGVyclxcbmAgK1xuICAgICAgYFx1MjAyMiBCYWNrZ3JvdW5kIGxvbmcgdGFza3Mgd2l0aCAmIChlLmcuIHN0YXJ0aW5nIGEgc2VydmVyKVxcbmAgK1xuICAgICAgYFx1MjAyMiBJbnN0YWxsIHBhY2thZ2VzIHdpdGggYXB0LWdldCAoVWJ1bnR1L0RlYmlhbikgb3IgYXBrIChBbHBpbmUpYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBjb21tYW5kOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoOF8wMDApXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIlNoZWxsIGNvbW1hbmQgdG8gZXhlY3V0ZS4gU3VwcG9ydHMgcGlwZXMsIHJlZGlyZWN0cywgY2hhaW5pbmcuXCIsXG4gICAgICAgICksXG4gICAgICB0aW1lb3V0OiB6XG4gICAgICAgIC5udW1iZXIoKVxuICAgICAgICAuaW50KClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KE1BWF9USU1FT1VUX1NFQ09ORFMpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBgVGltZW91dCBpbiBzZWNvbmRzIChkZWZhdWx0OiAke2NmZy5jb21tYW5kVGltZW91dH0sIG1heDogJHtNQVhfVElNRU9VVF9TRUNPTkRTfSkuIEluY3JlYXNlIGZvciBsb25nIG9wZXJhdGlvbnMgbGlrZSBwYWNrYWdlIGluc3RhbGxzLmAsXG4gICAgICAgICksXG4gICAgICB3b3JrZGlyOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgYFdvcmtpbmcgZGlyZWN0b3J5IGZvciB0aGUgY29tbWFuZCAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0pLmAsXG4gICAgICAgICksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29tbWFuZCwgdGltZW91dCwgd29ya2RpciB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIGlmIChjZmcuc3RyaWN0U2FmZXR5KSB7XG4gICAgICAgIGNvbnN0IGNoZWNrID0gY2hlY2tDb21tYW5kKGNvbW1hbmQsIHRydWUpO1xuICAgICAgICBpZiAoIWNoZWNrLmFsbG93ZWQpIHtcbiAgICAgICAgICB3YXJuKGNoZWNrLnJlYXNvbiEpO1xuICAgICAgICAgIHJldHVybiB7IGVycm9yOiBjaGVjay5yZWFzb24sIGV4aXRDb2RlOiAtMSB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG5cbiAgICAgICAgc3RhdHVzKFxuICAgICAgICAgIGBSdW5uaW5nOiAke2NvbW1hbmQubGVuZ3RoID4gODAgPyBjb21tYW5kLnNsaWNlKDAsIDc3KSArIFwiXHUyMDI2XCIgOiBjb21tYW5kfWAsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoXG4gICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICB0aW1lb3V0ID8/IGNmZy5jb21tYW5kVGltZW91dCxcbiAgICAgICAgICBjZmcubWF4T3V0cHV0U2l6ZSxcbiAgICAgICAgICB3b3JrZGlyLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChyZXN1bHQudGltZWRPdXQpIHtcbiAgICAgICAgICB3YXJuKGBDb21tYW5kIHRpbWVkIG91dCBhZnRlciAke3RpbWVvdXQgPz8gY2ZnLmNvbW1hbmRUaW1lb3V0fXNgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQudHJ1bmNhdGVkKSB7XG4gICAgICAgICAgc3RhdHVzKFwiT3V0cHV0IHdhcyB0cnVuY2F0ZWQgKGV4Y2VlZGVkIG1heCBzaXplKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXhpdENvZGU6IHJlc3VsdC5leGl0Q29kZSxcbiAgICAgICAgICBzdGRvdXQ6IHJlc3VsdC5zdGRvdXQgfHwgXCIobm8gb3V0cHV0KVwiLFxuICAgICAgICAgIHN0ZGVycjogcmVzdWx0LnN0ZGVyciB8fCBcIlwiLFxuICAgICAgICAgIHRpbWVkT3V0OiByZXN1bHQudGltZWRPdXQsXG4gICAgICAgICAgZHVyYXRpb25NczogcmVzdWx0LmR1cmF0aW9uTXMsXG4gICAgICAgICAgdHJ1bmNhdGVkOiByZXN1bHQudHJ1bmNhdGVkLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBFeGVjdXRpb24gZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgZXhpdENvZGU6IC0xLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgd3JpdGVGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiV3JpdGVGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgQ3JlYXRlIG9yIG92ZXJ3cml0ZSBhIGNvbXBsZXRlIGZpbGUgaW5zaWRlIHRoZSBjb21wdXRlci5cXG5cXG5gICtcbiAgICAgIGBVc2UgZm9yIG5ldyBmaWxlcyBvciB3aGVuIHJlcGxhY2luZyB0aGUgZW50aXJlIGNvbnRlbnQuIGAgK1xuICAgICAgYEZvciBlZGl0aW5nIGV4aXN0aW5nIGZpbGVzLCBwcmVmZXIgU3RyUmVwbGFjZSBvciBJbnNlcnRMaW5lcyBcdTIwMTQgYCArXG4gICAgICBgdGhleSBhcmUgZmFzdGVyIGFuZCB1c2UgZmFyIGxlc3MgY29udGV4dC4gYCArXG4gICAgICBgUGFyZW50IGRpcmVjdG9yaWVzIGFyZSBjcmVhdGVkIGF1dG9tYXRpY2FsbHkuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBwYXRoOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoNTAwKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgYEZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci4gUmVsYXRpdmUgcGF0aHMgYXJlIHJlbGF0aXZlIHRvICR7Q09OVEFJTkVSX1dPUktESVJ9LmAsXG4gICAgICAgICksXG4gICAgICBjb250ZW50OiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWF4KE1BWF9GSUxFX1dSSVRFX0JZVEVTKVxuICAgICAgICAuZGVzY3JpYmUoXCJGaWxlIGNvbnRlbnQgdG8gd3JpdGUuXCIpLFxuICAgICAgbWFrZUV4ZWN1dGFibGU6IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgXCJTZXQgdGhlIGV4ZWN1dGFibGUgYml0IChjaG1vZCAreCkgYWZ0ZXIgd3JpdGluZy4gVXNlZnVsIGZvciBzY3JpcHRzLlwiLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jIChcbiAgICAgIHsgcGF0aDogZmlsZVBhdGgsIGNvbnRlbnQsIG1ha2VFeGVjdXRhYmxlIH0sXG4gICAgICB7IHN0YXR1cywgd2FybiB9LFxuICAgICkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGRpciA9IGZpbGVQYXRoLmluY2x1ZGVzKFwiL1wiKVxuICAgICAgICAgID8gZmlsZVBhdGguc2xpY2UoMCwgZmlsZVBhdGgubGFzdEluZGV4T2YoXCIvXCIpKVxuICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgYXdhaXQgZW5naW5lLmV4ZWMoYG1rZGlyIC1wICcke2Rpci5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCwgNSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMoYFdyaXRpbmc6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgIGF3YWl0IGVuZ2luZS53cml0ZUZpbGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgICAgIGlmIChtYWtlRXhlY3V0YWJsZSkge1xuICAgICAgICAgIGF3YWl0IGVuZ2luZS5leGVjKGBjaG1vZCAreCAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCwgNSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHdyaXR0ZW46IHRydWUsXG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgYnl0ZXNXcml0dGVuOiBCdWZmZXIuYnl0ZUxlbmd0aChjb250ZW50LCBcInV0Zi04XCIpLFxuICAgICAgICAgIGV4ZWN1dGFibGU6IG1ha2VFeGVjdXRhYmxlID8/IGZhbHNlLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBXcml0ZSBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCB3cml0dGVuOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlYWRGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVhZEZpbGVcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBSZWFkIGEgZmlsZSBmcm9tIHRoZSBjb21wdXRlciwgb3B0aW9uYWxseSBsaW1pdGVkIHRvIGEgbGluZSByYW5nZS5cXG5cXG5gICtcbiAgICAgIGBBbHdheXMgcmVhZCBhIGZpbGUgYmVmb3JlIGVkaXRpbmcgaXQgd2l0aCBTdHJSZXBsYWNlLiBgICtcbiAgICAgIGBGb3IgbGFyZ2UgZmlsZXMgdXNlIHN0YXJ0TGluZS9lbmRMaW5lIHRvIHJlYWQgb25seSB0aGUgc2VjdGlvbiB5b3UgbmVlZCBcdTIwMTQgYCArXG4gICAgICBgdGhpcyBrZWVwcyBjb250ZXh0IHNob3J0LiBCaW5hcnkgZmlsZXMgbWF5IG5vdCBkaXNwbGF5IGNvcnJlY3RseS5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5taW4oMSlcbiAgICAgICAgLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIkZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIiksXG4gICAgICBzdGFydExpbmU6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIkZpcnN0IGxpbmUgdG8gcmV0dXJuICgxLWJhc2VkLCBpbmNsdXNpdmUpLlwiKSxcbiAgICAgIGVuZExpbmU6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIkxhc3QgbGluZSB0byByZXR1cm4gKDEtYmFzZWQsIGluY2x1c2l2ZSkuIFJlcXVpcmVzIHN0YXJ0TGluZS5cIixcbiAgICAgICAgKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXG4gICAgICB7IHBhdGg6IGZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUgfSxcbiAgICAgIHsgc3RhdHVzLCB3YXJuIH0sXG4gICAgKSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhgUmVhZGluZzogJHtmaWxlUGF0aH1gKTtcblxuICAgICAgICBjb25zdCB7IGNvbnRlbnQsIHRvdGFsTGluZXMgfSA9IGF3YWl0IGVuZ2luZS5yZWFkRmlsZShcbiAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICBNQVhfRklMRV9SRUFEX0JZVEVTLFxuICAgICAgICAgIHN0YXJ0TGluZSxcbiAgICAgICAgICBlbmRMaW5lLFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICB0b3RhbExpbmVzLFxuICAgICAgICAgIGxpbmVSYW5nZTogc3RhcnRMaW5lXG4gICAgICAgICAgICA/IHsgZnJvbTogc3RhcnRMaW5lLCB0bzogZW5kTGluZSA/PyB0b3RhbExpbmVzIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBSZWFkIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3I6IG1zZyxcbiAgICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgICBoaW50OiBcIkNoZWNrIHRoZSBwYXRoIGlzIGNvcnJlY3Qgd2l0aCBMaXN0RGlyZWN0b3J5LlwiLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgc3RyUmVwbGFjZVRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIlN0clJlcGxhY2VcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBSZXBsYWNlIGFuIGV4YWN0IHVuaXF1ZSBzdHJpbmcgaW4gYSBmaWxlIHdpdGggbmV3IGNvbnRlbnQuXFxuXFxuYCArXG4gICAgICBgVGhpcyBpcyB0aGUgcHJlZmVycmVkIHdheSB0byBlZGl0IGV4aXN0aW5nIGZpbGVzIFx1MjAxNCB1c2UgaXQgaW5zdGVhZCBvZiBgICtcbiAgICAgIGByZXdyaXRpbmcgdGhlIHdob2xlIGZpbGUgd2l0aCBXcml0ZUZpbGUuXFxuXFxuYCArXG4gICAgICBgUnVsZXM6XFxuYCArXG4gICAgICBgXHUyMDIyIG9sZFN0ciBtdXN0IG1hdGNoIHRoZSBmaWxlIGV4YWN0bHkgKHdoaXRlc3BhY2UsIGluZGVudGF0aW9uIGluY2x1ZGVkKVxcbmAgK1xuICAgICAgYFx1MjAyMiBvbGRTdHIgbXVzdCBhcHBlYXIgZXhhY3RseSBvbmNlIFx1MjAxNCBtYWtlIGl0IHVuaXF1ZSBieSBpbmNsdWRpbmcgc3Vycm91bmRpbmcgbGluZXNcXG5gICtcbiAgICAgIGBcdTIwMjIgQWx3YXlzIFJlYWRGaWxlIGZpcnN0IHRvIHNlZSB0aGUgY3VycmVudCBjb250ZW50XFxuYCArXG4gICAgICBgXHUyMDIyIFRvIGRlbGV0ZSBhIHNlY3Rpb24sIHNldCBuZXdTdHIgdG8gYW4gZW1wdHkgc3RyaW5nYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBwYXRoOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoNTAwKVxuICAgICAgICAuZGVzY3JpYmUoXCJGaWxlIHBhdGggaW5zaWRlIHRoZSBjb250YWluZXIuXCIpLFxuICAgICAgb2xkU3RyOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIlRoZSBleGFjdCBzdHJpbmcgdG8gZmluZCBhbmQgcmVwbGFjZS4gTXVzdCBiZSB1bmlxdWUgaW4gdGhlIGZpbGUuXCIsXG4gICAgICAgICksXG4gICAgICBuZXdTdHI6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5kZXNjcmliZShcIlRoZSByZXBsYWNlbWVudCBzdHJpbmcuIFVzZSBlbXB0eSBzdHJpbmcgdG8gZGVsZXRlLlwiKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXG4gICAgICB7IHBhdGg6IGZpbGVQYXRoLCBvbGRTdHIsIG5ld1N0ciB9LFxuICAgICAgeyBzdGF0dXMsIHdhcm4gfSxcbiAgICApID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcbiAgICAgICAgc3RhdHVzKGBFZGl0aW5nOiAke2ZpbGVQYXRofWApO1xuICAgICAgICBjb25zdCB7IHJlcGxhY2VtZW50cyB9ID0gYXdhaXQgZW5naW5lLnN0clJlcGxhY2VJbkZpbGUoXG4gICAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgICAgb2xkU3RyLFxuICAgICAgICAgIG5ld1N0cixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlZGl0ZWQ6IHRydWUsXG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgcmVwbGFjZW1lbnRzLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBTdHJSZXBsYWNlIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBtc2csIGVkaXRlZDogZmFsc2UsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBpbnNlcnRMaW5lc1Rvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIkluc2VydExpbmVzXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgSW5zZXJ0IGxpbmVzIGludG8gYSBmaWxlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgdG8gYWRkIG5ldyBjb250ZW50IHdpdGhvdXQgcmVwbGFjaW5nIGV4aXN0aW5nIGNvbnRlbnQuIGAgK1xuICAgICAgYGFmdGVyTGluZT0wIHByZXBlbmRzIHRvIHRoZSBmaWxlLiBhZnRlckxpbmUgZXF1YWwgdG8gdGhlIHRvdGFsIGxpbmUgY291bnQgYXBwZW5kcy5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5taW4oMSlcbiAgICAgICAgLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIkZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIiksXG4gICAgICBhZnRlckxpbmU6IHpcbiAgICAgICAgLm51bWJlcigpXG4gICAgICAgIC5pbnQoKVxuICAgICAgICAubWluKDApXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIkluc2VydCBhZnRlciB0aGlzIGxpbmUgbnVtYmVyICgxLWJhc2VkKS4gVXNlIDAgdG8gaW5zZXJ0IGF0IHRoZSB0b3AuXCIsXG4gICAgICAgICksXG4gICAgICBjb250ZW50OiB6LnN0cmluZygpLmRlc2NyaWJlKFwiVGhlIGxpbmVzIHRvIGluc2VydC5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKFxuICAgICAgeyBwYXRoOiBmaWxlUGF0aCwgYWZ0ZXJMaW5lLCBjb250ZW50IH0sXG4gICAgICB7IHN0YXR1cywgd2FybiB9LFxuICAgICkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuICAgICAgICBzdGF0dXMoYEluc2VydGluZyBpbnRvOiAke2ZpbGVQYXRofWApO1xuICAgICAgICBhd2FpdCBlbmdpbmUuaW5zZXJ0TGluZXNJbkZpbGUoZmlsZVBhdGgsIGFmdGVyTGluZSwgY29udGVudCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5zZXJ0ZWQ6IHRydWUsXG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgYWZ0ZXJMaW5lLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBJbnNlcnRMaW5lcyBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCBpbnNlcnRlZDogZmFsc2UsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBsaXN0RGlyVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiTGlzdERpcmVjdG9yeVwiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYExpc3QgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIGluc2lkZSB0aGUgY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgUmV0dXJucyBzdHJ1Y3R1cmVkIGRpcmVjdG9yeSBsaXN0aW5nIHdpdGggZmlsZSB0eXBlcywgc2l6ZXMsIGFuZCBwZXJtaXNzaW9ucy5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHBhdGg6IHpcbiAgICAgICAgLnN0cmluZygpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShgRGlyZWN0b3J5IHBhdGggKGRlZmF1bHQ6ICR7Q09OVEFJTkVSX1dPUktESVJ9KS5gKSxcbiAgICAgIHNob3dIaWRkZW46IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXCJJbmNsdWRlIGhpZGRlbiBmaWxlcyAoZG90ZmlsZXMpLiBEZWZhdWx0OiBmYWxzZS5cIiksXG4gICAgICByZWN1cnNpdmU6IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXCJMaXN0IHJlY3Vyc2l2ZWx5IHVwIHRvIDMgbGV2ZWxzIGRlZXAuIERlZmF1bHQ6IGZhbHNlLlwiKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXG4gICAgICB7IHBhdGg6IGRpclBhdGgsIHNob3dIaWRkZW4sIHJlY3Vyc2l2ZSB9LFxuICAgICAgeyBzdGF0dXMgfSxcbiAgICApID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBjb25zdCB0YXJnZXQgPSBkaXJQYXRoID8/IENPTlRBSU5FUl9XT1JLRElSO1xuICAgICAgICBjb25zdCBoaWRkZW4gPSBzaG93SGlkZGVuID8gXCItYVwiIDogXCJcIjtcblxuICAgICAgICBsZXQgY21kOiBzdHJpbmc7XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICBjbWQgPSBgZmluZCAnJHt0YXJnZXQucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9JyAgLW1heGRlcHRoIDMgJHtzaG93SGlkZGVuID8gXCJcIiA6IFwiLW5vdCAtcGF0aCAnKi8uKidcIn0gLXByaW50ZiAnJXkgJXMgJVRAICVwXFxcXG4nIDI+L2Rldi9udWxsIHwgaGVhZCAtMjAwYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbWQgPSBgbHMgLWwgJHtoaWRkZW59IC0tdGltZS1zdHlsZT1sb25nLWlzbyAnJHt0YXJnZXQucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9JyAgMj4vZGV2L251bGwgfHwgbHMgLWwgJHtoaWRkZW59ICcke3RhcmdldC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyhgTGlzdGluZzogJHt0YXJnZXR9YCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGVuZ2luZS5leGVjKGNtZCwgMTApO1xuXG4gICAgICAgIGlmIChyZXN1bHQuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3I6IHJlc3VsdC5zdGRlcnIgfHwgXCJEaXJlY3Rvcnkgbm90IGZvdW5kXCIsXG4gICAgICAgICAgICBwYXRoOiB0YXJnZXQsXG4gICAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IHRhcmdldCxcbiAgICAgICAgICBsaXN0aW5nOiByZXN1bHQuc3Rkb3V0LFxuICAgICAgICAgIHJlY3Vyc2l2ZTogcmVjdXJzaXZlID8/IGZhbHNlLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgdXBsb2FkRmlsZVRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIlVwbG9hZEZpbGVcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBUcmFuc2ZlciBhIGZpbGUgZnJvbSB0aGUgdXNlcidzIGhvc3QgY29tcHV0ZXIgaW50byB0aGUgY29udGFpbmVyLlxcblxcbmAgK1xuICAgICAgYFVzZSB0aGlzIHdoZW4gdGhlIHVzZXIgc2hhcmVzIGEgZmlsZSB0aGV5IHdhbnQgeW91IHRvIHdvcmsgd2l0aC4gYCArXG4gICAgICBgVGhlIGZpbGUgd2lsbCBiZSBjb3BpZWQgaW50byB0aGUgY29udGFpbmVyIGF0IHRoZSBzcGVjaWZpZWQgcGF0aC5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGhvc3RQYXRoOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAubWluKDEpXG4gICAgICAgIC5tYXgoMTAwMClcbiAgICAgICAgLmRlc2NyaWJlKFwiQWJzb2x1dGUgcGF0aCB0byB0aGUgZmlsZSBvbiB0aGUgdXNlcidzIGhvc3QgbWFjaGluZS5cIiksXG4gICAgICBjb250YWluZXJQYXRoOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgYERlc3RpbmF0aW9uIHBhdGggaW5zaWRlIHRoZSBjb250YWluZXIgKGRlZmF1bHQ6ICR7Q09OVEFJTkVSX1dPUktESVJ9LzxmaWxlbmFtZT4pLmAsXG4gICAgICAgICksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgaG9zdFBhdGgsIGNvbnRhaW5lclBhdGggfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID1cbiAgICAgICAgICBob3N0UGF0aC5zcGxpdChcIi9cIikucG9wKCkgPz8gaG9zdFBhdGguc3BsaXQoXCJcXFxcXCIpLnBvcCgpID8/IFwiZmlsZVwiO1xuICAgICAgICBjb25zdCBkZXN0ID0gY29udGFpbmVyUGF0aCA/PyBgJHtDT05UQUlORVJfV09SS0RJUn0vJHtmaWxlbmFtZX1gO1xuXG4gICAgICAgIHN0YXR1cyhgVXBsb2FkaW5nOiAke2ZpbGVuYW1lfSBcdTIxOTIgJHtkZXN0fWApO1xuICAgICAgICBhd2FpdCBlbmdpbmUuY29weVRvQ29udGFpbmVyKGhvc3RQYXRoLCBkZXN0KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwbG9hZGVkOiB0cnVlLFxuICAgICAgICAgIGhvc3RQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lclBhdGg6IGRlc3QsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIHdhcm4oYFVwbG9hZCBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCB1cGxvYWRlZDogZmFsc2UsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBkb3dubG9hZEZpbGVUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJEb3dubG9hZEZpbGVcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBUcmFuc2ZlciBhIGZpbGUgZnJvbSB0aGUgY29udGFpbmVyIHRvIHRoZSB1c2VyJ3MgaG9zdCBjb21wdXRlci5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB0byBnaXZlIHRoZSB1c2VyIGEgZmlsZSB5b3UgY3JlYXRlZCBvciBtb2RpZmllZCBpbnNpZGUgdGhlIGNvbXB1dGVyLmAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgY29udGFpbmVyUGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KDUwMClcbiAgICAgICAgLmRlc2NyaWJlKFwiUGF0aCB0byB0aGUgZmlsZSBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIiksXG4gICAgICBob3N0UGF0aDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFxuICAgICAgICAgIFwiRGVzdGluYXRpb24gcGF0aCBvbiB0aGUgaG9zdC4gRGVmYXVsdDogdXNlcidzIGhvbWUgZGlyZWN0b3J5ICsgZmlsZW5hbWUuXCIsXG4gICAgICAgICksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29udGFpbmVyUGF0aCwgaG9zdFBhdGggfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gY29udGFpbmVyUGF0aC5zcGxpdChcIi9cIikucG9wKCkgPz8gXCJmaWxlXCI7XG4gICAgICAgIGNvbnN0IGRlc3QgPSBob3N0UGF0aCA/PyBwYXRoSm9pbihob21lZGlyKCksIGZpbGVuYW1lKTtcblxuICAgICAgICBzdGF0dXMoYERvd25sb2FkaW5nOiAke2NvbnRhaW5lclBhdGh9IFx1MjE5MiAke2Rlc3R9YCk7XG4gICAgICAgIGF3YWl0IGVuZ2luZS5jb3B5RnJvbUNvbnRhaW5lcihjb250YWluZXJQYXRoLCBkZXN0KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRvd25sb2FkZWQ6IHRydWUsXG4gICAgICAgICAgY29udGFpbmVyUGF0aCxcbiAgICAgICAgICBob3N0UGF0aDogZGVzdCxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgd2FybihgRG93bmxvYWQgZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgZG93bmxvYWRlZDogZmFsc2UsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBzdGF0dXNUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJDb21wdXRlclN0YXR1c1wiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYEdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29tcHV0ZXI6IE9TLCBpbnN0YWxsZWQgdG9vbHMsIGRpc2svbWVtb3J5IHVzYWdlLCBgICtcbiAgICAgIGBydW5uaW5nIHByb2Nlc3NlcywgbmV0d29yayBzdGF0dXMsIGFuZCByZXNvdXJjZSBsaW1pdHMuXFxuXFxuYCArXG4gICAgICBgQWxzbyBzaG93cyB0aGUgcGVyLXR1cm4gdG9vbCBjYWxsIGJ1ZGdldC5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHNob3dQcm9jZXNzZXM6IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXCJJbmNsdWRlIGEgbGlzdCBvZiBydW5uaW5nIHByb2Nlc3Nlcy4gRGVmYXVsdDogZmFsc2UuXCIpLFxuICAgICAga2lsbFBpZDogelxuICAgICAgICAubnVtYmVyKClcbiAgICAgICAgLmludCgpXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcbiAgICAgICAgICBcIktpbGwgYSBwcm9jZXNzIGJ5IFBJRC4gQ29tYmluZSB3aXRoIHNob3dQcm9jZXNzZXMgdG8gdmVyaWZ5LlwiLFxuICAgICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IHNob3dQcm9jZXNzZXMsIGtpbGxQaWQgfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGlmIChraWxsUGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBraWxsZWQgPSBhd2FpdCBlbmdpbmUua2lsbFByb2Nlc3Moa2lsbFBpZCk7XG4gICAgICAgICAgaWYgKCFraWxsZWQpIHdhcm4oYEZhaWxlZCB0byBraWxsIFBJRCAke2tpbGxQaWR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMoXCJHYXRoZXJpbmcgc3lzdGVtIGluZm9cdTIwMjZcIik7XG4gICAgICAgIGNvbnN0IGVudkluZm8gPSBhd2FpdCBlbmdpbmUuZ2V0RW52aXJvbm1lbnRJbmZvKFxuICAgICAgICAgIGNmZy5pbnRlcm5ldEFjY2VzcyxcbiAgICAgICAgICBjZmcuZGlza0xpbWl0TUIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lckluZm8gPSBhd2FpdCBlbmdpbmUuZ2V0Q29udGFpbmVySW5mbygpO1xuXG4gICAgICAgIGxldCBwcm9jZXNzZXM6IGFueVtdIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoc2hvd1Byb2Nlc3Nlcykge1xuICAgICAgICAgIGNvbnN0IHByb2NzID0gYXdhaXQgZW5naW5lLmxpc3RQcm9jZXNzZXMoKTtcbiAgICAgICAgICBwcm9jZXNzZXMgPSBwcm9jcy5tYXAoKHApID0+ICh7XG4gICAgICAgICAgICBwaWQ6IHAucGlkLFxuICAgICAgICAgICAgdXNlcjogcC51c2VyLFxuICAgICAgICAgICAgY3B1OiBwLmNwdSArIFwiJVwiLFxuICAgICAgICAgICAgbWVtb3J5OiBwLm1lbW9yeSArIFwiJVwiLFxuICAgICAgICAgICAgY29tbWFuZDogcC5jb21tYW5kLFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGFpbmVyOiB7XG4gICAgICAgICAgICBpZDogY29udGFpbmVySW5mby5pZCxcbiAgICAgICAgICAgIHN0YXRlOiBjb250YWluZXJJbmZvLnN0YXRlLFxuICAgICAgICAgICAgaW1hZ2U6IGNvbnRhaW5lckluZm8uaW1hZ2UsXG4gICAgICAgICAgICBjcHVVc2FnZTogY29udGFpbmVySW5mby5jcHVVc2FnZSxcbiAgICAgICAgICAgIG1lbW9yeVVzYWdlOiBjb250YWluZXJJbmZvLm1lbW9yeVVzYWdlLFxuICAgICAgICAgICAgbmV0d29ya01vZGU6IGNvbnRhaW5lckluZm8ubmV0d29ya01vZGUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbnZpcm9ubWVudDogZW52SW5mbyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIGludGVybmV0QWNjZXNzOiBjZmcuaW50ZXJuZXRBY2Nlc3MsXG4gICAgICAgICAgICBwZXJzaXN0ZW5jZU1vZGU6IGNmZy5wZXJzaXN0ZW5jZU1vZGUsXG4gICAgICAgICAgICBjcHVMaW1pdDogY2ZnLmNwdUxpbWl0ID4gMCA/IGAke2NmZy5jcHVMaW1pdH0gY29yZXNgIDogXCJ1bmxpbWl0ZWRcIixcbiAgICAgICAgICAgIG1lbW9yeUxpbWl0OiBgJHtjZmcubWVtb3J5TGltaXRNQn0gTUJgLFxuICAgICAgICAgICAgY29tbWFuZFRpbWVvdXQ6IGAke2NmZy5jb21tYW5kVGltZW91dH1zYCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC4uLihwcm9jZXNzZXMgPyB7IHByb2Nlc3NlcyB9IDoge30pLFxuICAgICAgICAgIC4uLihraWxsUGlkICE9PSB1bmRlZmluZWQgPyB7IGtpbGxlZFBpZDoga2lsbFBpZCB9IDoge30pLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBTdGF0dXMgZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlYnVpbGRUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJSZWJ1aWxkQ29tcHV0ZXJcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBEZXN0cm95IHRoZSBjdXJyZW50IGNvbnRhaW5lciBhbmQgcmVidWlsZCBpdCBmcm9tIHNjcmF0Y2ggdXNpbmcgdGhlIGN1cnJlbnQgc2V0dGluZ3MuXG5cbmAgK1xuICAgICAgYFVzZSB0aGlzIHdoZW46XG5gICtcbiAgICAgIGAtIEludGVybmV0IGFjY2VzcyBpcyBub3Qgd29ya2luZyBhZnRlciB0b2dnbGluZyB0aGUgc2V0dGluZ1xuYCArXG4gICAgICBgLSBUaGUgY29udGFpbmVyIGlzIGJyb2tlbiBvciBpbiBhIGJhZCBzdGF0ZVxuYCArXG4gICAgICBgLSBTZXR0aW5ncyBsaWtlIGJhc2UgaW1hZ2Ugb3IgbmV0d29yayB3ZXJlIGNoYW5nZWQgYW5kIG5lZWQgdG8gdGFrZSBlZmZlY3RcblxuYCArXG4gICAgICBgV0FSTklORzogQWxsIGRhdGEgaW5zaWRlIHRoZSBjb250YWluZXIgd2lsbCBiZSBsb3N0LiBGaWxlcyBpbiB0aGUgc2hhcmVkIGZvbGRlciBhcmUgc2FmZS5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGNvbmZpcm06IHpcbiAgICAgICAgLmJvb2xlYW4oKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgXCJNdXN0IGJlIHRydWUgdG8gY29uZmlybSB5b3Ugd2FudCB0byBkZXN0cm95IGFuZCByZWJ1aWxkIHRoZSBjb250YWluZXIuXCIsXG4gICAgICAgICksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29uZmlybSB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBpZiAoIWNvbmZpcm0pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlcnJvcjogXCJTZXQgY29uZmlybT10cnVlIHRvIHByb2NlZWQgd2l0aCByZWJ1aWxkLlwiLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHN0YXR1cyhcIlN0b3BwaW5nIGFuZCByZW1vdmluZyBleGlzdGluZyBjb250YWluZXJcdTIwMjZcIik7XG4gICAgICAgIGF3YWl0IGVuZ2luZS5kZXN0cm95Q29udGFpbmVyKCk7XG5cbiAgICAgICAgc3RhdHVzKFwiUmVidWlsZGluZyBjb250YWluZXIgd2l0aCBjdXJyZW50IHNldHRpbmdzXHUyMDI2XCIpO1xuICAgICAgICBhd2FpdCBlbmdpbmUuZW5zdXJlUmVhZHkoe1xuICAgICAgICAgIGltYWdlOiBjZmcuYmFzZUltYWdlIGFzIENvbnRhaW5lckltYWdlLFxuICAgICAgICAgIG5ldHdvcms6IChjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImJyaWRnZVwiIDogXCJub25lXCIpIGFzIE5ldHdvcmtNb2RlLFxuICAgICAgICAgIGNwdUxpbWl0OiBjZmcuY3B1TGltaXQsXG4gICAgICAgICAgbWVtb3J5TGltaXRNQjogY2ZnLm1lbW9yeUxpbWl0TUIsXG4gICAgICAgICAgZGlza0xpbWl0TUI6IGNmZy5kaXNrTGltaXRNQixcbiAgICAgICAgICBhdXRvSW5zdGFsbFByZXNldDogY2ZnLmF1dG9JbnN0YWxsUHJlc2V0LFxuICAgICAgICAgIHBvcnRGb3J3YXJkczogY2ZnLnBvcnRGb3J3YXJkcyxcbiAgICAgICAgICBob3N0TW91bnRQYXRoOiBjZmcuaG9zdE1vdW50UGF0aCxcbiAgICAgICAgICBwZXJzaXN0ZW5jZU1vZGU6IGNmZy5wZXJzaXN0ZW5jZU1vZGUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGVudkluZm8gPSBhd2FpdCBlbmdpbmUuZ2V0RW52aXJvbm1lbnRJbmZvKFxuICAgICAgICAgIGNmZy5pbnRlcm5ldEFjY2VzcyxcbiAgICAgICAgICBjZmcuZGlza0xpbWl0TUIsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZWJ1aWx0OiB0cnVlLFxuICAgICAgICAgIG9zOiBlbnZJbmZvLm9zLFxuICAgICAgICAgIGludGVybmV0QWNjZXNzOiBjZmcuaW50ZXJuZXRBY2Nlc3MsXG4gICAgICAgICAgbmV0d29ya01vZGU6IGNmZy5pbnRlcm5ldEFjY2VzcyA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZFwiLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQ29udGFpbmVyIHJlYnVpbHQgc3VjY2Vzc2Z1bGx5IHdpdGggY3VycmVudCBzZXR0aW5ncy5cIixcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgd2FybihgUmVidWlsZCBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCByZWJ1aWx0OiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlc2V0U2hlbGxUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJSZXNldFNoZWxsXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUmVzZXQgdGhlIHBlcnNpc3RlbnQgc2hlbGwgc2Vzc2lvbiBiYWNrIHRvIGEgY2xlYW4gc3RhdGUuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgd2hlbjpcXG5gICtcbiAgICAgIGBcdTIwMjIgVGhlIHNoZWxsIGlzIGluIGEgYnJva2VuIHN0YXRlIChzdHVjayBjb21tYW5kLCBjb3JydXB0ZWQgZW52KVxcbmAgK1xuICAgICAgYFx1MjAyMiBZb3Ugd2FudCB0byBzdGFydCBmcmVzaCB3aXRob3V0IHJlYnVpbGRpbmcgdGhlIHdob2xlIGNvbnRhaW5lclxcbmAgK1xuICAgICAgYFx1MjAyMiBFbnZpcm9ubWVudCB2YXJpYWJsZXMgb3Igd29ya2luZyBkaXJlY3RvcnkgYXJlIGluIGFuIHVuZXhwZWN0ZWQgc3RhdGVcXG5cXG5gICtcbiAgICAgIGBUaGlzIGRvZXMgTk9UIHdpcGUgdGhlIGNvbnRhaW5lciBmaWxlc3lzdGVtIFx1MjAxNCBmaWxlcywgaW5zdGFsbGVkIHBhY2thZ2VzLCBgICtcbiAgICAgIGBhbmQgcnVubmluZyBiYWNrZ3JvdW5kIHByb2Nlc3NlcyBhcmUgYWxsIHByZXNlcnZlZC4gYCArXG4gICAgICBgSXQgb25seSByZXNldHMgdGhlIHNoZWxsIHNlc3Npb24gKGN3ZCBiYWNrIHRvIGhvbWUsIGVudiB2YXJzIGNsZWFyZWQpLmAsXG4gICAgcGFyYW1ldGVyczoge30sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jIChfLCB7IHN0YXR1cyB9KSA9PiB7XG4gICAgICBlbmdpbmUucmVzZXRTaGVsbFNlc3Npb24oKTtcbiAgICAgIHN0YXR1cyhcIlNoZWxsIHNlc3Npb24gcmVzZXQuXCIpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzZXQ6IHRydWUsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgXCJTaGVsbCBzZXNzaW9uIHJlc2V0LiBXb3JraW5nIGRpcmVjdG9yeSBpcyBiYWNrIHRvIC9ob21lL3VzZXIgd2l0aCBhIGNsZWFuIGVudmlyb25tZW50LlwiLFxuICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgfTtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBleGVjdXRlQmFja2dyb3VuZFRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIkV4ZWN1dGVCYWNrZ3JvdW5kXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUnVuIGEgY29tbWFuZCBpbiB0aGUgYmFja2dyb3VuZCBhbmQgZ2V0IGEgaGFuZGxlIHRvIGNoZWNrIGl0cyBvdXRwdXQgbGF0ZXIuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgZm9yIGxvbmctcnVubmluZyB0YXNrcyB0aGF0IHNob3VsZG4ndCBibG9jazogc2VydmVycywgd2F0Y2hlcnMsIGAgK1xuICAgICAgYGJ1aWxkIHByb2Nlc3NlcywgdGVzdCBzdWl0ZXMsIGV0Yy5cXG5cXG5gICtcbiAgICAgIGBSZXR1cm5zIGEgaGFuZGxlSWQuIFVzZSBSZWFkUHJvY2Vzc0xvZ3Mgd2l0aCB0aGF0IGhhbmRsZUlkIHRvIHN0cmVhbSBvdXRwdXQuIGAgK1xuICAgICAgYEJhY2tncm91bmQgcHJvY2Vzc2VzIHN1cnZpdmUgYWNyb3NzIG11bHRpcGxlIHR1cm5zLmAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgY29tbWFuZDogelxuICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAuZGVzY3JpYmUoXCJTaGVsbCBjb21tYW5kIHRvIHJ1biBpbiB0aGUgYmFja2dyb3VuZC5cIiksXG4gICAgICB0aW1lb3V0OiB6XG4gICAgICAgIC5udW1iZXIoKVxuICAgICAgICAuaW50KClcbiAgICAgICAgLm1pbig1KVxuICAgICAgICAubWF4KDM2MDApXG4gICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIk1heCBzZWNvbmRzIGJlZm9yZSB0aGUgcHJvY2VzcyBpcyBraWxsZWQuIERlZmF1bHQ6IDMwMC5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29tbWFuZCwgdGltZW91dCB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG4gICAgICAgIHN0YXR1cyhcbiAgICAgICAgICBgU3RhcnRpbmcgYmFja2dyb3VuZDogJHtjb21tYW5kLnNsaWNlKDAsIDYwKX0ke2NvbW1hbmQubGVuZ3RoID4gNjAgPyBcIlx1MjAyNlwiIDogXCJcIn1gLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCB7IGhhbmRsZUlkLCBwaWQgfSA9IGF3YWl0IGVuZ2luZS5leGVjQmFja2dyb3VuZChcbiAgICAgICAgICBjb21tYW5kLFxuICAgICAgICAgIHRpbWVvdXQgPz8gMzAwLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXJ0ZWQ6IHRydWUsXG4gICAgICAgICAgaGFuZGxlSWQsXG4gICAgICAgICAgcGlkLFxuICAgICAgICAgIG1lc3NhZ2U6IGBQcm9jZXNzIHN0YXJ0ZWQuIFVzZSBSZWFkUHJvY2Vzc0xvZ3Mgd2l0aCBoYW5kbGVJZCAke2hhbmRsZUlkfSB0byBjaGVjayBvdXRwdXQuYCxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgd2FybihgQmFja2dyb3VuZCBleGVjIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBtc2csIHN0YXJ0ZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgcmVhZFByb2Nlc3NMb2dzVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVhZFByb2Nlc3NMb2dzXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUmVhZCBidWZmZXJlZCBvdXRwdXQgZnJvbSBhIGJhY2tncm91bmQgcHJvY2VzcyBzdGFydGVkIHdpdGggRXhlY3V0ZUJhY2tncm91bmQuXFxuXFxuYCArXG4gICAgICBgQ2FsbCB0aGlzIHJlcGVhdGVkbHkgdG8gY2hlY2sgb24gYSBydW5uaW5nIHByb2Nlc3MuIGAgK1xuICAgICAgYFJldHVybnMgc3Rkb3V0LCBzdGRlcnIsIHdoZXRoZXIgdGhlIHByb2Nlc3MgaXMgc3RpbGwgcnVubmluZywgYW5kIGl0cyBleGl0IGNvZGUgaWYgZG9uZS5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGhhbmRsZUlkOiB6XG4gICAgICAgIC5udW1iZXIoKVxuICAgICAgICAuaW50KClcbiAgICAgICAgLmRlc2NyaWJlKFwiVGhlIGhhbmRsZUlkIHJldHVybmVkIGJ5IEV4ZWN1dGVCYWNrZ3JvdW5kLlwiKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBoYW5kbGVJZCB9LCB7IHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICBjb25zdCBsb2dzID0gZW5naW5lLnJlYWRCZ0xvZ3MoaGFuZGxlSWQsIE1BWF9GSUxFX1JFQURfQllURVMpO1xuICAgICAgaWYgKCFsb2dzLmZvdW5kKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3I6IGBObyBwcm9jZXNzIGZvdW5kIHdpdGggaGFuZGxlSWQgJHtoYW5kbGVJZH0uYCxcbiAgICAgICAgICBoaW50OiBcImhhbmRsZUlkcyBhcmUgb25seSB2YWxpZCB3aXRoaW4gdGhlIGN1cnJlbnQgTE0gU3R1ZGlvIHNlc3Npb24uXCIsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGFuZGxlSWQsXG4gICAgICAgIHN0ZG91dDogbG9ncy5zdGRvdXQgfHwgXCIobm8gb3V0cHV0IHlldClcIixcbiAgICAgICAgc3RkZXJyOiBsb2dzLnN0ZGVyciB8fCBcIlwiLFxuICAgICAgICBydW5uaW5nOiAhbG9ncy5kb25lLFxuICAgICAgICBleGl0Q29kZTogbG9ncy5leGl0Q29kZSxcbiAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgIH07XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgcmVzdGFydENvbXB1dGVyVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVzdGFydENvbXB1dGVyXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgU3RvcCBhbmQgcmVzdGFydCB0aGUgY29udGFpbmVyIHdpdGhvdXQgd2lwaW5nIGFueSBkYXRhLlxcblxcbmAgK1xuICAgICAgYFVzZSB0aGlzIHdoZW46XFxuYCArXG4gICAgICBgLSBBIHJ1bmF3YXkgcHJvY2VzcyBpcyBjb25zdW1pbmcgdG9vIG1hbnkgcmVzb3VyY2VzXFxuYCArXG4gICAgICBgLSBUaGUgY29udGFpbmVyIGZlZWxzIHNsdWdnaXNoIG9yIHVucmVzcG9uc2l2ZVxcbmAgK1xuICAgICAgYC0gWW91IHdhbnQgYSBjbGVhbiBzaGVsbCBzZXNzaW9uIGJ1dCBrZWVwIGluc3RhbGxlZCBwYWNrYWdlcyBhbmQgZmlsZXNcXG5cXG5gICtcbiAgICAgIGBGYXN0ZXIgdGhhbiBSZWJ1aWxkQ29tcHV0ZXIuIEFsbCBmaWxlcyBhbmQgaW5zdGFsbGVkIHBhY2thZ2VzIGFyZSBwcmVzZXJ2ZWQuIGAgK1xuICAgICAgYEJhY2tncm91bmQgcHJvY2Vzc2VzIHdpbGwgYmUgc3RvcHBlZC5gLFxuICAgIHBhcmFtZXRlcnM6IHt9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoXywgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgc3RhdHVzKFwiUmVzdGFydGluZyBjb21wdXRlclx1MjAyNlwiKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLnJlc3RhcnRDb250YWluZXIoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXN0YXJ0ZWQ6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogXCJDb250YWluZXIgcmVzdGFydGVkLiBGaWxlcyBhbmQgcGFja2FnZXMgYXJlIGludGFjdC5cIixcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgd2FybihgUmVzdGFydCBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCByZXN0YXJ0ZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIFtcbiAgICBleGVjdXRlVG9vbCxcbiAgICB3cml0ZUZpbGVUb29sLFxuICAgIHJlYWRGaWxlVG9vbCxcbiAgICBzdHJSZXBsYWNlVG9vbCxcbiAgICBpbnNlcnRMaW5lc1Rvb2wsXG4gICAgbGlzdERpclRvb2wsXG4gICAgdXBsb2FkRmlsZVRvb2wsXG4gICAgZG93bmxvYWRGaWxlVG9vbCxcbiAgICBzdGF0dXNUb29sLFxuICAgIHJlc3RhcnRDb21wdXRlclRvb2wsXG4gICAgcmVidWlsZFRvb2wsXG4gICAgcmVzZXRTaGVsbFRvb2wsXG4gICAgZXhlY3V0ZUJhY2tncm91bmRUb29sLFxuICAgIHJlYWRQcm9jZXNzTG9nc1Rvb2wsXG4gIF07XG59XG4iLCAiLyoqXG4gKiBAZmlsZSBwcmVwcm9jZXNzb3IudHNcbiAqIFByb21wdCBwcmVwcm9jZXNzb3IgXHUyMDE0IHNlcnZlcyB0d28gcHVycG9zZXM6XG4gKlxuICogICAxLiBSZXNldHMgdGhlIHBlci10dXJuIHRvb2wgY2FsbCBidWRnZXQgZXZlcnkgdGltZSB0aGUgdXNlciBzZW5kcyBhIG5ldyBtZXNzYWdlLlxuICogICAyLiBPcHRpb25hbGx5IGluamVjdHMgY29tcHV0ZXIgc3RhdGUgKE9TLCB0b29scywgbmV0d29yaykgaW50byB0aGUgbW9kZWwnc1xuICogICAgICBjb250ZXh0IHNvIGl0IGtub3dzIHdoYXQgaXQncyB3b3JraW5nIHdpdGggd2l0aG91dCBuZWVkaW5nIHRvIGFzay5cbiAqXG4gKiBGbG93OlxuICogICAxLiBVc2VyIHR5cGVzIGEgbWVzc2FnZVxuICogICAyLiBQcmVwcm9jZXNzb3IgZmlyZXMgXHUyMTkyIHJlc2V0cyB0b29sIGNhbGwgYnVkZ2V0IFx1MjE5MiBnYXRoZXJzIGNvbXB1dGVyIHN0YXRlXG4gKiAgIDMuIFByZXBlbmRzIGNvbXB1dGVyIGNvbnRleHQgdG8gdGhlIHVzZXIncyBtZXNzYWdlXG4gKiAgIDQuIE1vZGVsIHNlZXMgdGhlIGNvbnRleHQgYW5kIGNhbiBzdGFydCB1c2luZyB0b29scyBpbW1lZGlhdGVseVxuICovXG5cbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IGFkdmFuY2VUdXJuIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xuaW1wb3J0ICogYXMgZW5naW5lIGZyb20gXCIuL2NvbnRhaW5lci9lbmdpbmVcIjtcbmltcG9ydCB7IE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTLCBDT05UQUlORVJfV09SS0RJUiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5Db250cm9sbGVyIH0gZnJvbSBcIi4vcGx1Z2luVHlwZXNcIjtcblxuZnVuY3Rpb24gcmVhZENvbmZpZyhjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgYyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG4gIHJldHVybiB7XG4gICAgYXV0b0luamVjdDogYy5nZXQoXCJhdXRvSW5qZWN0Q29udGV4dFwiKSA9PT0gXCJvblwiLFxuICAgIG1heFRvb2xDYWxsczogYy5nZXQoXCJtYXhUb29sQ2FsbHNQZXJUdXJuXCIpID8/IDI1LFxuICAgIGludGVybmV0QWNjZXNzOiBjLmdldChcImludGVybmV0QWNjZXNzXCIpID09PSBcIm9uXCIsXG4gICAgcGVyc2lzdGVuY2VNb2RlOiBjLmdldChcInBlcnNpc3RlbmNlTW9kZVwiKSB8fCBcInBlcnNpc3RlbnRcIixcbiAgICBiYXNlSW1hZ2U6IGMuZ2V0KFwiYmFzZUltYWdlXCIpIHx8IFwidWJ1bnR1OjI0LjA0XCIsXG4gIH07XG59XG5cbi8qKlxuICogQnVpbGQgYSBjb25jaXNlIGNvbnRleHQgYmxvY2sgYWJvdXQgdGhlIGNvbXB1dGVyJ3MgY3VycmVudCBzdGF0ZS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gYnVpbGRDb250ZXh0QmxvY2soXG4gIGNmZzogUmV0dXJuVHlwZTx0eXBlb2YgcmVhZENvbmZpZz4sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAoIWVuZ2luZS5pc1JlYWR5KCkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgYFtDb21wdXRlciBcdTIwMTQgQXZhaWxhYmxlXWAsXG4gICAgICBgWW91IGhhdmUgYSBkZWRpY2F0ZWQgTGludXggY29tcHV0ZXIgKCR7Y2ZnLmJhc2VJbWFnZX0pIGF2YWlsYWJsZSB2aWEgdG9vbHMuYCxcbiAgICAgIGBJbnRlcm5ldDogJHtjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWRcIn0uYCxcbiAgICAgIGBNb2RlOiAke2NmZy5wZXJzaXN0ZW5jZU1vZGV9LmAsXG4gICAgICBgVGhlIGNvbXB1dGVyIHdpbGwgc3RhcnQgYXV0b21hdGljYWxseSB3aGVuIHlvdSBmaXJzdCB1c2UgYSB0b29sIChFeGVjdXRlLCBXcml0ZUZpbGUsIGV0Yy4pLmAsXG4gICAgICBgV29ya2luZyBkaXJlY3Rvcnk6ICR7Q09OVEFJTkVSX1dPUktESVJ9YCxcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHF1aWNrSW5mbyA9IGF3YWl0IGVuZ2luZS5leGVjKFxuICAgICAgYGVjaG8gXCJPUz0kKGNhdCAvZXRjL29zLXJlbGVhc2UgMj4vZGV2L251bGwgfCBncmVwIFBSRVRUWV9OQU1FIHwgY3V0IC1kPSAtZjIgfCB0ciAtZCAnXFxcIicpXCIgJiYgYCArXG4gICAgICAgIGBlY2hvIFwiVE9PTFM9JCh3aGljaCBnaXQgY3VybCB3Z2V0IHB5dGhvbjMgbm9kZSBnY2MgcGlwMyAyPi9kZXYvbnVsbCB8IHhhcmdzIC1Je30gYmFzZW5hbWUge30gfCB0ciAnXFxcXG4nICcsJylcIiAmJiBgICtcbiAgICAgICAgYGVjaG8gXCJGSUxFUz0kKGxzICR7Q09OVEFJTkVSX1dPUktESVJ9IDI+L2Rldi9udWxsIHwgaGVhZCAtMTAgfCB0ciAnXFxcXG4nICcsJylcIiAmJiBgICtcbiAgICAgICAgYGVjaG8gXCJESVNLPSQoZGYgLWggJHtDT05UQUlORVJfV09SS0RJUn0gMj4vZGV2L251bGwgfCB0YWlsIC0xIHwgYXdrICd7cHJpbnQgJDQgXFxcIiBmcmVlIC8gXFxcIiAkMiBcXFwiIHRvdGFsXFxcIn0nKVwiYCxcbiAgICAgIDUsXG4gICAgICBNQVhfSU5KRUNURURfQ09OVEVYVF9DSEFSUyxcbiAgICApO1xuXG4gICAgaWYgKHF1aWNrSW5mby5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgcmV0dXJuIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmcgKCR7Y2ZnLmJhc2VJbWFnZX0pLCBJbnRlcm5ldDogJHtjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcIm9uXCIgOiBcIm9mZlwifV1gO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVzID0gcXVpY2tJbmZvLnN0ZG91dC5zcGxpdChcIlxcblwiKTtcbiAgICBjb25zdCBnZXQgPSAocHJlZml4OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgbGluZSA9IGxpbmVzLmZpbmQoKGwpID0+IGwuc3RhcnRzV2l0aChwcmVmaXggKyBcIj1cIikpO1xuICAgICAgcmV0dXJuIGxpbmU/LnNsaWNlKHByZWZpeC5sZW5ndGggKyAxKT8udHJpbSgpID8/IFwiXCI7XG4gICAgfTtcblxuICAgIGNvbnN0IG9zID0gZ2V0KFwiT1NcIik7XG4gICAgY29uc3QgdG9vbHMgPSBnZXQoXCJUT09MU1wiKS5zcGxpdChcIixcIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IGZpbGVzID0gZ2V0KFwiRklMRVNcIikuc3BsaXQoXCIsXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBkaXNrID0gZ2V0KFwiRElTS1wiKTtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtcbiAgICAgIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmddYCxcbiAgICAgIGBPUzogJHtvc31gLFxuICAgICAgYEludGVybmV0OiAke2NmZy5pbnRlcm5ldEFjY2VzcyA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZFwifWAsXG4gICAgICBgTW9kZTogJHtjZmcucGVyc2lzdGVuY2VNb2RlfWAsXG4gICAgICBgRGlzazogJHtkaXNrfWAsXG4gICAgXTtcblxuICAgIGlmICh0b29scy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKGBJbnN0YWxsZWQ6ICR7dG9vbHMuam9pbihcIiwgXCIpfWApO1xuICAgIH1cblxuICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICBgV29ya3NwYWNlICgke0NPTlRBSU5FUl9XT1JLRElSfSk6ICR7ZmlsZXMuam9pbihcIiwgXCIpfSR7ZmlsZXMubGVuZ3RoID49IDEwID8gXCJcdTIwMjZcIiA6IFwiXCJ9YCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYFdvcmtzcGFjZSAoJHtDT05UQUlORVJfV09SS0RJUn0pOiBlbXB0eWApO1xuICAgIH1cblxuICAgIHBhcnRzLnB1c2goXG4gICAgICBgYCxcbiAgICAgIGBVc2UgdGhlIEV4ZWN1dGUsIFdyaXRlRmlsZSwgUmVhZEZpbGUsIExpc3REaXJlY3RvcnksIFVwbG9hZEZpbGUsIERvd25sb2FkRmlsZSwgb3IgQ29tcHV0ZXJTdGF0dXMgdG9vbHMgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgY29tcHV0ZXIuYCxcbiAgICApO1xuXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBgW0NvbXB1dGVyIFx1MjAxNCBSdW5uaW5nICgke2NmZy5iYXNlSW1hZ2V9KSwgSW50ZXJuZXQ6ICR7Y2ZnLmludGVybmV0QWNjZXNzID8gXCJvblwiIDogXCJvZmZcIn1dYDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvbXB0UHJlcHJvY2Vzc29yKFxuICBjdGw6IFBsdWdpbkNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBjZmcgPSByZWFkQ29uZmlnKGN0bCk7XG5cbiAgYWR2YW5jZVR1cm4oY2ZnLm1heFRvb2xDYWxscyk7XG5cbiAgaWYgKCFjZmcuYXV0b0luamVjdCkgcmV0dXJuIHVzZXJNZXNzYWdlO1xuXG4gIGlmICh1c2VyTWVzc2FnZS5sZW5ndGggPCA1KSByZXR1cm4gdXNlck1lc3NhZ2U7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgYnVpbGRDb250ZXh0QmxvY2soY2ZnKTtcbiAgICBpZiAoIWNvbnRleHQpIHJldHVybiB1c2VyTWVzc2FnZTtcblxuICAgIHJldHVybiBgJHtjb250ZXh0fVxcblxcbi0tLVxcblxcbiR7dXNlck1lc3NhZ2V9YDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG4iLCAiLyoqXG4gKiBAZmlsZSBpbmRleC50c1xuICogTE0gU3R1ZGlvIHBsdWdpbiBlbnRyeSBwb2ludC5cbiAqXG4gKiBUaGUgY29udGFpbmVyIGlzIGxhenktaW5pdGlhbGl6ZWQ6IG5vdGhpbmcgaGVhdnkgaGFwcGVucyBhdCBwbHVnaW4gbG9hZCB0aW1lLlxuICogVGhlIGZpcnN0IHRvb2wgY2FsbCB0cmlnZ2VycyBpbWFnZSBwdWxsICsgY29udGFpbmVyIGNyZWF0aW9uLlxuICovXG5cbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHRvb2xzUHJvdmlkZXIgfSBmcm9tIFwiLi90b29sc1Byb3ZpZGVyXCI7XG5pbXBvcnQgeyBwcm9tcHRQcmVwcm9jZXNzb3IgfSBmcm9tIFwiLi9wcmVwcm9jZXNzb3JcIjtcbmltcG9ydCB0eXBlIHsgUGx1Z2luQ29udGV4dCB9IGZyb20gXCIuL3BsdWdpblR5cGVzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWluKGNvbnRleHQ6IFBsdWdpbkNvbnRleHQpIHtcbiAgY29udGV4dC53aXRoQ29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgY29udGV4dC53aXRoVG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgY29udGV4dC53aXRoUHJvbXB0UHJlcHJvY2Vzc29yKHByb21wdFByZXByb2Nlc3Nvcik7XG59XG4iLCAiaW1wb3J0IHsgTE1TdHVkaW9DbGllbnQsIHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmRlY2xhcmUgdmFyIHByb2Nlc3M6IGFueTtcblxuLy8gV2UgcmVjZWl2ZSBydW50aW1lIGluZm9ybWF0aW9uIGluIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG5jb25zdCBjbGllbnRJZGVudGlmaWVyID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfSURFTlRJRklFUjtcbmNvbnN0IGNsaWVudFBhc3NrZXkgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9QQVNTS0VZO1xuY29uc3QgYmFzZVVybCA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQkFTRV9VUkw7XG5cbmNvbnN0IGNsaWVudCA9IG5ldyBMTVN0dWRpb0NsaWVudCh7XG4gIGNsaWVudElkZW50aWZpZXIsXG4gIGNsaWVudFBhc3NrZXksXG4gIGJhc2VVcmwsXG59KTtcblxuKGdsb2JhbFRoaXMgYXMgYW55KS5fX0xNU19QTFVHSU5fQ09OVEVYVCA9IHRydWU7XG5cbmxldCBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSBmYWxzZTtcbmxldCBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSBmYWxzZTtcbmxldCBjb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IHRvb2xzUHJvdmlkZXJTZXQgPSBmYWxzZTtcbmxldCBnZW5lcmF0b3JTZXQgPSBmYWxzZTtcblxuY29uc3Qgc2VsZlJlZ2lzdHJhdGlvbkhvc3QgPSBjbGllbnQucGx1Z2lucy5nZXRTZWxmUmVnaXN0cmF0aW9uSG9zdCgpO1xuXG5jb25zdCBwbHVnaW5Db250ZXh0OiBQbHVnaW5Db250ZXh0ID0ge1xuICB3aXRoUHJlZGljdGlvbkxvb3BIYW5kbGVyOiAoZ2VuZXJhdGUpID0+IHtcbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSB0b29scyBwcm92aWRlclwiKTtcbiAgICB9XG5cbiAgICBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByZWRpY3Rpb25Mb29wSGFuZGxlcihnZW5lcmF0ZSk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhQcm9tcHRQcmVwcm9jZXNzb3I6IChwcmVwcm9jZXNzKSA9PiB7XG4gICAgaWYgKHByb21wdFByZXByb2Nlc3NvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvbXB0UHJlcHJvY2Vzc29yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhDb25maWdTY2hlbWF0aWNzOiAoY29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChjb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHbG9iYWxDb25maWdTY2hlbWF0aWNzOiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbG9iYWwgY29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHbG9iYWxDb25maWdTY2hlbWF0aWNzKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoVG9vbHNQcm92aWRlcjogKHRvb2xzUHJvdmlkZXIpID0+IHtcbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgcHJlZGljdGlvbkxvb3BIYW5kbGVyXCIpO1xuICAgIH1cblxuICAgIHRvb2xzUHJvdmlkZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFRvb2xzUHJvdmlkZXIodG9vbHNQcm92aWRlcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHZW5lcmF0b3I6IChnZW5lcmF0b3IpID0+IHtcbiAgICBpZiAoZ2VuZXJhdG9yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cblxuICAgIGdlbmVyYXRvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2VuZXJhdG9yKGdlbmVyYXRvcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG59O1xuXG5pbXBvcnQoXCIuLy4uL3NyYy9pbmRleC50c1wiKS50aGVuKGFzeW5jIG1vZHVsZSA9PiB7XG4gIHJldHVybiBhd2FpdCBtb2R1bGUubWFpbihwbHVnaW5Db250ZXh0KTtcbn0pLnRoZW4oKCkgPT4ge1xuICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5pbml0Q29tcGxldGVkKCk7XG59KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBleGVjdXRlIHRoZSBtYWluIGZ1bmN0aW9uIG9mIHRoZSBwbHVnaW4uXCIpO1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7O0FBQUEsSUFZQSxZQUVhO0FBZGI7QUFBQTtBQUFBO0FBWUEsaUJBQXVDO0FBRWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFDRTtBQUFBLFFBQ0YsU0FBUztBQUFBLFVBQ1AsRUFBRSxPQUFPLE1BQU0sYUFBYSwrQ0FBMEM7QUFBQSxVQUN0RSxFQUFFLE9BQU8sT0FBTyxhQUFhLDhDQUF5QztBQUFBLFFBQ3hFO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxPQUFPO0FBQUEsWUFDUCxhQUNFO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxZQUNFLE9BQU87QUFBQSxZQUNQLGFBQWE7QUFBQSxVQUNmO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixTQUFTO0FBQUEsVUFDUDtBQUFBLFlBQ0UsT0FBTztBQUFBLFlBQ1AsYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBLEVBQUUsT0FBTyxnQkFBZ0IsYUFBYSw0QkFBNEI7QUFBQSxVQUNsRTtBQUFBLFlBQ0UsT0FBTztBQUFBLFlBQ1AsYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxPQUFPO0FBQUEsWUFDUCxhQUFhO0FBQUEsVUFDZjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFFQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsUUFBUSxFQUFFLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQUEsTUFDcEM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQ0U7QUFBQSxRQUNGLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTTtBQUFBLE1BQzVDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFFQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFDRTtBQUFBLFFBQ0YsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsUUFBUSxFQUFFLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxJQUFJO0FBQUEsTUFDdEM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUVDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUNFO0FBQUEsUUFDRixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxRQUFRLEVBQUUsTUFBTSxHQUFHLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQSxNQUN0QztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBRUM7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQ0U7QUFBQSxRQUNGLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLFFBQVEsRUFBRSxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssSUFBSTtBQUFBLE1B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eUJBQXFCLGlCQUFpQkEsY0FBYTtBQUNuRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsZUFBZSxDQUFDLGNBQWM7QUFDNUIsUUFBSSxjQUFjO0FBQ2hCLFlBQU0sSUFBSSxNQUFNLDhCQUE4QjtBQUFBLElBQ2hEO0FBRUEsbUJBQWU7QUFDZix5QkFBcUIsYUFBYSxTQUFTO0FBQzNDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSx3REFBNEIsS0FBSyxPQUFNQyxZQUFVO0FBQy9DLFNBQU8sTUFBTUEsUUFBTyxLQUFLLGFBQWE7QUFDeEMsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUNaLHVCQUFxQixjQUFjO0FBQ3JDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNsQixVQUFRLE1BQU0sb0RBQW9EO0FBQ2xFLFVBQVEsTUFBTSxLQUFLO0FBQ3JCLENBQUM7IiwKICAibmFtZXMiOiBbImV4ZWNBc3luYyIsICJpbXBvcnRfY2hpbGRfcHJvY2VzcyIsICJpbXBvcnRfdXRpbCIsICJwYXRoSm9pbiIsICJpbXBvcnRfc2RrIiwgImltcG9ydF9vcyIsICJpbXBvcnRfcGF0aCIsICJyZWFkQ29uZmlnIiwgImltcG9ydF9zZGsiLCAiY29uZmlnU2NoZW1hdGljcyIsICJ0b29sc1Byb3ZpZGVyIiwgIm1vZHVsZSJdCn0K
