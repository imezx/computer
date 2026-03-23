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
    configSchematics = (0, import_sdk.createConfigSchematics)().field("internetAccess", "select", {
      displayName: "Internet Access",
      subtitle: "Allow the computer to reach the internet (toggle container network mode)",
      options: [
        { value: "on", displayName: "On \u2014 container has full internet access" },
        { value: "off", displayName: "Off \u2014 completely airgapped, no network" }
      ]
    }, "off").field("persistenceMode", "select", {
      displayName: "Persistence Mode",
      subtitle: "Whether the computer keeps its state when LM Studio closes",
      options: [
        { value: "persistent", displayName: "Persistent \u2014 keep files, packages, and state across sessions" },
        { value: "ephemeral", displayName: "Ephemeral \u2014 fresh clean environment every time" }
      ]
    }, "persistent").field("baseImage", "select", {
      displayName: "Base Image",
      subtitle: "The Linux distribution running inside the container",
      options: [
        { value: "ubuntu:24.04", displayName: "Ubuntu 24.04 (recommended \u2014 widest compatibility)" },
        { value: "ubuntu:22.04", displayName: "Ubuntu 22.04 (LTS stable)" },
        { value: "debian:bookworm-slim", displayName: "Debian Bookworm Slim (lightweight)" },
        { value: "alpine:3.20", displayName: "Alpine 3.20 (ultra-lightweight ~5MB, musl libc)" }
      ]
    }, "ubuntu:24.04").field("cpuLimit", "numeric", {
      displayName: "CPU Core Limit",
      subtitle: "Maximum CPU cores allocated to the computer (0 = no limit)",
      min: 0,
      max: 8,
      int: true,
      slider: { step: 1, min: 0, max: 8 }
    }, 2).field("memoryLimitMB", "numeric", {
      displayName: "Memory Limit (MB)",
      subtitle: "Maximum RAM in megabytes (256\u20138192)",
      min: 256,
      max: 8192,
      int: true,
      slider: { step: 256, min: 256, max: 8192 }
    }, 1024).field("diskLimitMB", "numeric", {
      displayName: "Disk Limit (MB)",
      subtitle: "Maximum disk space in megabytes (512\u201332768). Only enforced on new containers.",
      min: 512,
      max: 32768,
      int: true,
      slider: { step: 512, min: 512, max: 32768 }
    }, 4096).field("commandTimeout", "numeric", {
      displayName: "Command Timeout (seconds)",
      subtitle: "Maximum time a single command can run before being killed (5\u2013300)",
      min: 5,
      max: 300,
      int: true,
      slider: { step: 5, min: 5, max: 300 }
    }, 30).field("maxOutputSize", "numeric", {
      displayName: "Max Output Size (KB)",
      subtitle: "Maximum stdout/stderr returned to the model per command (1\u2013128 KB). Larger output is truncated.",
      min: 1,
      max: 128,
      int: true,
      slider: { step: 1, min: 1, max: 128 }
    }, 32).field("maxToolCallsPerTurn", "numeric", {
      displayName: "Max Tool Calls Per Turn",
      subtitle: "Maximum number of times the model can use the computer per conversational turn (1\u2013100). Resets each time you send a message. Prevents infinite loops.",
      min: 1,
      max: 100,
      int: true,
      slider: { step: 1, min: 1, max: 100 }
    }, 25).field("autoInstallPreset", "select", {
      displayName: "Auto-Install Packages",
      subtitle: "Pre-install common tools when the container is first created",
      options: [
        { value: "none", displayName: "None \u2014 bare OS, install manually" },
        { value: "minimal", displayName: "Minimal \u2014 curl, wget, git, vim, jq" },
        { value: "python", displayName: "Python \u2014 python3, pip, venv" },
        { value: "node", displayName: "Node.js \u2014 nodejs, npm" },
        { value: "build", displayName: "Build Tools \u2014 gcc, cmake, make" },
        { value: "full", displayName: "Full \u2014 all of the above + networking tools" }
      ]
    }, "minimal").field("portForwards", "string", {
      displayName: "Port Forwards",
      subtitle: "Comma-separated host:container port pairs (e.g., '8080:80,3000:3000'). Allows accessing services running inside the container."
    }, "").field("hostMountPath", "string", {
      displayName: "Shared Folder (Host Mount)",
      subtitle: "Absolute path to a folder on your computer that will be accessible inside the container at /mnt/shared. Leave empty to disable."
    }, "").field("strictSafety", "select", {
      displayName: "Strict Safety Mode",
      subtitle: "Block known destructive commands (fork bombs, disk wipers). Disable only if you know what you're doing.",
      options: [
        { value: "on", displayName: "On \u2014 block obviously destructive commands (recommended)" },
        { value: "off", displayName: "Off \u2014 allow everything, I accept the risk" }
      ]
    }, "on").field("autoInjectContext", "select", {
      displayName: "Auto-Inject Computer Context",
      subtitle: "Automatically tell the model about its computer (OS, installed tools, running processes) at the start of each turn",
      options: [
        { value: "on", displayName: "On \u2014 model always knows its computer state (recommended)" },
        { value: "off", displayName: "Off \u2014 model discovers state via tools only" }
      ]
    }, "on").build();
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
      { cmd: "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe", kind: "docker" },
      { cmd: "C:\\Program Files\\Docker\\Docker\\resources\\docker.exe", kind: "docker" }
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
  ] : ["/usr/bin", "/usr/local/bin", "/usr/lib/podman", "/usr/libexec/podman", "/bin"];
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
    console.log("[lms-computer] Auto-configured Podman containers.conf (helper_binaries_dir + dns_servers).");
  } catch (err) {
    console.warn("[lms-computer] Could not write Podman config:", err);
  }
}
function shellFor(image) {
  return image.startsWith("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
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
    if (["exited", "stopped", "created", "paused", "dead"].includes(status)) return "stopped";
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
    // For Podman rootless with internet enabled, omit --network entirely so Podman
    // uses its own configured default (respects ~/.config/containers/containers.conf
    // dns_servers). Passing --network bridge fails without kernel privileges.
    // For Docker or network=none, pass the flag explicitly.
    ...opts.network !== "podman-default" ? ["--network", opts.network] : [],
    // Inject explicit DNS servers to bypass systemd-resolved's 127.0.0.53 stub
    // which is unreachable from inside rootless containers.
    ...opts.network !== "none" ? ["--dns", "8.8.8.8", "--dns", "8.8.4.4"] : [],
    // Use /root as the initial workdir — it always exists in any base image.
    // The real workdir (/home/user) is created later by setupContainer.
    // Podman (unlike Docker) validates the workdir at start time, so we must
    // start with a directory that is guaranteed to exist.
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
  await run([
    "exec",
    containerName,
    shell,
    "-c",
    `mkdir -p ${CONTAINER_WORKDIR} && (id user >/dev/null 2>&1 || adduser --disabled-password --gecos "" --home ${CONTAINER_WORKDIR} user 2>/dev/null || adduser -D -h ${CONTAINER_WORKDIR} user 2>/dev/null || true)`
  ], 15e3);
  if (preset && preset !== "none" && hasNetwork) {
    const isAlpine = image.startsWith("alpine");
    const presets = isAlpine ? PACKAGE_PRESETS_ALPINE : PACKAGE_PRESETS;
    const packages = presets[preset];
    if (packages && packages.length > 0) {
      const installCmd = isAlpine ? `apk update && apk add --no-cache ${packages.join(" ")}` : `apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${packages.join(" ")} && apt-get clean && rm -rf /var/lib/apt/lists/*`;
      try {
        await run(
          ["exec", containerName, shell, "-c", installCmd],
          18e4
        );
      } catch (installErr) {
        console.warn("[lms-computer] Package install failed (non-fatal):", installErr?.message ?? installErr);
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
        const netOut = await run(["inspect", containerName, "--format", "{{.HostConfig.NetworkMode}}"]);
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
      console.log(`[lms-computer] Network mismatch (container has ${actuallyHasNetwork ? "internet" : "no internet"}, settings want ${wantsNetwork ? "internet" : "no internet"}) \u2014 recreating container.`);
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
      diskOptArgs.splice(diskOptArgs.indexOf(opts.image), 0, "--storage-opt", `size=${opts.diskLimitMB}m`);
    }
    try {
      await run(diskOptArgs, 6e4);
    } catch (err) {
      const msg = err?.message ?? "";
      if (msg.includes("storage-opt") || msg.includes("backingFS") || msg.includes("overlay.size")) {
        console.warn("[lms-computer] Disk quota not supported by storage driver, starting without size limit.");
        await run(createArgs, 6e4);
      } else {
        throw err;
      }
    }
    const hasNetworkForSetup = setupNetwork !== "none";
    await setupContainer(opts.image, opts.autoInstallPreset, hasNetworkForSetup);
    if (opts.network === "none" && setupNetwork !== "none") {
      try {
        await run(["network", "disconnect", setupNetwork, containerName], 1e4);
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
  const start = Date.now();
  const cwd = workdir ?? CONTAINER_WORKDIR;
  const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
  return new Promise((resolve) => {
    const args = [
      "exec",
      "-w",
      cwd,
      containerName,
      shell,
      "-c",
      command
    ];
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killed = false;
    const proc = (0, import_child_process2.spawn)(runtime.path, args, {
      timeout: timeoutSeconds * 1e3,
      stdio: ["ignore", "pipe", "pipe"],
      env: getRuntimeEnv()
    });
    const effectiveMax = Math.min(maxOutputBytes, MAX_OUTPUT_BYTES);
    proc.stdout?.on("data", (chunk) => {
      if (stdout.length < effectiveMax) {
        stdout += chunk.toString("utf-8");
      }
    });
    proc.stderr?.on("data", (chunk) => {
      if (stderr.length < effectiveMax) {
        stderr += chunk.toString("utf-8");
      }
    });
    const timer = setTimeout(() => {
      timedOut = true;
      killed = true;
      proc.kill("SIGKILL");
    }, timeoutSeconds * 1e3 + 500);
    proc.on("close", (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - start;
      const stdoutTruncated = stdout.length >= effectiveMax;
      const stderrTruncated = stderr.length >= effectiveMax;
      resolve({
        exitCode: code ?? (killed ? 137 : 1),
        stdout: stdout.slice(0, effectiveMax),
        stderr: stderr.slice(0, effectiveMax),
        timedOut,
        durationMs,
        truncated: stdoutTruncated || stderrTruncated
      });
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout: "",
        stderr: err.message,
        timedOut: false,
        durationMs: Date.now() - start,
        truncated: false
      });
    });
  });
}
async function writeFile(filePath, content) {
  if (!runtime || !containerReady) {
    throw new Error("Container not ready.");
  }
  return new Promise((resolve, reject) => {
    const shell = containerName.includes("alpine") ? CONTAINER_SHELL_ALPINE : CONTAINER_SHELL;
    const proc = (0, import_child_process2.spawn)(runtime.path, [
      "exec",
      "-i",
      containerName,
      shell,
      "-c",
      `cat > '${filePath.replace(/'/g, "'\\''")}'`
    ], {
      timeout: 15e3,
      stdio: ["pipe", "ignore", "pipe"],
      env: getRuntimeEnv()
    });
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
        const stats = await run([
          "stats",
          containerName,
          "--no-stream",
          "--format",
          "{{.CPUPerc}}	{{.MemUsage}}"
        ], 1e4);
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
async function verifyHealth() {
  if (!containerReady) return;
  try {
    const state = await getContainerState();
    if (state !== "running") {
      containerReady = false;
      currentNetwork = "none";
    }
  } catch {
    containerReady = false;
    currentNetwork = "none";
  }
}
var import_child_process2, import_util2, import_fs, import_os, import_path, execAsync2, runtime, containerName, containerReady, currentNetwork, initPromise;
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
    // KB → bytes
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

This is a real, isolated Linux container \u2014 you can install packages, compile code, run scripts, manage files, start services, etc.

The working directory is ${CONTAINER_WORKDIR}. You have full shell access (bash on Ubuntu/Debian, sh on Alpine).

TIPS:
\u2022 Chain commands with && or ;
\u2022 Use 2>&1 to merge stderr into stdout
\u2022 For long-running tasks, consider backgrounding with & and checking later
\u2022 Install packages with apt-get (Ubuntu/Debian) or apk (Alpine)
\u2022 The computer persists between messages (unless ephemeral mode is on)`,
    parameters: {
      command: import_zod.z.string().min(1).max(8e3).describe("Shell command to execute. Supports pipes, redirects, chaining."),
      timeout: import_zod.z.number().int().min(1).max(MAX_TIMEOUT_SECONDS).optional().describe(`Timeout in seconds (default: ${cfg.commandTimeout}, max: ${MAX_TIMEOUT_SECONDS}). Increase for long operations like package installs.`),
      workdir: import_zod.z.string().optional().describe(`Working directory for the command (default: ${CONTAINER_WORKDIR}).`)
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
        status(`Running: ${command.length > 80 ? command.slice(0, 77) + "\u2026" : command}`);
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
    description: `Create or overwrite a file inside the computer.

Use this to write code, configs, scripts, data files, etc. Parent directories are created automatically.
Working directory: ${CONTAINER_WORKDIR}`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe(`File path inside the container. Relative paths are relative to ${CONTAINER_WORKDIR}.`),
      content: import_zod.z.string().max(MAX_FILE_WRITE_BYTES).describe("File content to write."),
      makeExecutable: import_zod.z.boolean().optional().describe("Set the executable bit (chmod +x) after writing. Useful for scripts.")
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
    description: `Read the contents of a file from the computer.

Returns the file content as text. Binary files may not display correctly \u2014 use Execute with tools like xxd or file for binary inspection.`,
    parameters: {
      path: import_zod.z.string().min(1).max(500).describe("File path inside the container."),
      maxLines: import_zod.z.number().int().min(1).max(2e3).optional().describe("Max lines to return (default: all, up to size limit). Use for large files."),
      startLine: import_zod.z.number().int().min(1).optional().describe("Start reading from this line number (1-based). Combine with maxLines to read a range.")
    },
    implementation: async ({ path: filePath, maxLines, startLine }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };
      try {
        await ensureContainer(cfg, status);
        status(`Reading: ${filePath}`);
        let cmd;
        if (startLine && maxLines) {
          cmd = `sed -n '${startLine},${startLine + maxLines - 1}p' '${filePath.replace(/'/g, "'\\''")}'`;
        } else if (maxLines) {
          cmd = `head -n ${maxLines} '${filePath.replace(/'/g, "'\\''")}'`;
        } else {
          cmd = `cat '${filePath.replace(/'/g, "'\\''")}'`;
        }
        const result = await exec(cmd, 10, MAX_FILE_READ_BYTES);
        if (result.exitCode !== 0) {
          return {
            error: result.stderr || "File not found or unreadable",
            path: filePath,
            budget: budgetStatus()
          };
        }
        const sizeResult = await exec(
          `stat -c '%s' '${filePath.replace(/'/g, "'\\''")}'  2>/dev/null || stat -f '%z' '${filePath.replace(/'/g, "'\\''")}' 2>/dev/null`,
          3
        );
        const sizeBytes = parseInt(sizeResult.stdout.trim(), 10) || 0;
        return {
          path: filePath,
          content: result.stdout,
          sizeBytes,
          truncated: result.truncated,
          lineRange: startLine ? { from: startLine, count: maxLines ?? "all" } : void 0,
          budget: budgetStatus()
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        warn(`Read failed: ${msg}`);
        return { error: msg, budget: budgetStatus() };
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
      containerPath: import_zod.z.string().optional().describe(`Destination path inside the container (default: ${CONTAINER_WORKDIR}/<filename>).`)
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
      hostPath: import_zod.z.string().optional().describe("Destination path on the host. Default: user's home directory + filename.")
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
      killPid: import_zod.z.number().int().optional().describe("Kill a process by PID. Combine with showProcesses to verify.")
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
        const envInfo = await getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB);
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
      confirm: import_zod.z.boolean().describe("Must be true to confirm you want to destroy and rebuild the container.")
    },
    implementation: async ({ confirm }, { status, warn }) => {
      if (!confirm) {
        return { error: "Set confirm=true to proceed with rebuild.", budget: budgetStatus() };
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
        const envInfo = await getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB);
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
  return [
    executeTool,
    writeFileTool,
    readFileTool,
    listDirTool,
    uploadFileTool,
    downloadFileTool,
    statusTool,
    rebuildTool
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
      parts.push(`Workspace (${CONTAINER_WORKDIR}): ${files.join(", ")}${files.length >= 10 ? "\u2026" : ""}`);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvY29udGFpbmVyL3J1bnRpbWUudHMiLCAiLi4vc3JjL2NvbnN0YW50cy50cyIsICIuLi9zcmMvY29udGFpbmVyL2VuZ2luZS50cyIsICIuLi9zcmMvc2FmZXR5L2d1YXJkLnRzIiwgIi4uL3NyYy90b29sc1Byb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIEBmaWxlIGNvbmZpZy50c1xuICogUGx1Z2luIGNvbmZpZ3VyYXRpb24gc2NoZW1hIFx1MjAxNCBnZW5lcmF0ZXMgdGhlIExNIFN0dWRpbyBzZXR0aW5ncyBVSS5cbiAqXG4gKiBHaXZlcyB0aGUgdXNlciBoaWdoLWNvbnRyb2wgb3ZlciBldmVyeSBhc3BlY3Qgb2YgdGhlIGNvbXB1dGVyOlxuICogICBcdTIwMjIgTmV0d29yaywgcGVyc2lzdGVuY2UsIGJhc2UgaW1hZ2VcbiAqICAgXHUyMDIyIFJlc291cmNlIGxpbWl0cyAoQ1BVLCBSQU0sIGRpc2spXG4gKiAgIFx1MjAyMiBFeGVjdXRpb24gY29uc3RyYWludHMgKHRpbWVvdXQsIG91dHB1dCBjYXAsIHRvb2wgY2FsbCBidWRnZXQpXG4gKiAgIFx1MjAyMiBQYWNrYWdlIHByZXNldHMsIHBvcnQgZm9yd2FyZGluZywgaG9zdCBtb3VudHNcbiAqICAgXHUyMDIyIFNhZmV0eSBhbmQgY29udGV4dCBpbmplY3Rpb24gdG9nZ2xlc1xuICovXG5cbmltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb3JlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC5maWVsZChcImludGVybmV0QWNjZXNzXCIsIFwic2VsZWN0XCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJJbnRlcm5ldCBBY2Nlc3NcIixcbiAgICBzdWJ0aXRsZTogXCJBbGxvdyB0aGUgY29tcHV0ZXIgdG8gcmVhY2ggdGhlIGludGVybmV0ICh0b2dnbGUgY29udGFpbmVyIG5ldHdvcmsgbW9kZSlcIixcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IHZhbHVlOiBcIm9uXCIsIGRpc3BsYXlOYW1lOiBcIk9uIFx1MjAxNCBjb250YWluZXIgaGFzIGZ1bGwgaW50ZXJuZXQgYWNjZXNzXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwib2ZmXCIsIGRpc3BsYXlOYW1lOiBcIk9mZiBcdTIwMTQgY29tcGxldGVseSBhaXJnYXBwZWQsIG5vIG5ldHdvcmtcIiB9LFxuICAgIF0sXG4gIH0sIFwib2ZmXCIpXG5cbiAgLmZpZWxkKFwicGVyc2lzdGVuY2VNb2RlXCIsIFwic2VsZWN0XCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJQZXJzaXN0ZW5jZSBNb2RlXCIsXG4gICAgc3VidGl0bGU6IFwiV2hldGhlciB0aGUgY29tcHV0ZXIga2VlcHMgaXRzIHN0YXRlIHdoZW4gTE0gU3R1ZGlvIGNsb3Nlc1wiLFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgdmFsdWU6IFwicGVyc2lzdGVudFwiLCBkaXNwbGF5TmFtZTogXCJQZXJzaXN0ZW50IFx1MjAxNCBrZWVwIGZpbGVzLCBwYWNrYWdlcywgYW5kIHN0YXRlIGFjcm9zcyBzZXNzaW9uc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImVwaGVtZXJhbFwiLCBkaXNwbGF5TmFtZTogXCJFcGhlbWVyYWwgXHUyMDE0IGZyZXNoIGNsZWFuIGVudmlyb25tZW50IGV2ZXJ5IHRpbWVcIiB9LFxuICAgIF0sXG4gIH0sIFwicGVyc2lzdGVudFwiKVxuXG4gIC5maWVsZChcImJhc2VJbWFnZVwiLCBcInNlbGVjdFwiLCB7XG4gICAgZGlzcGxheU5hbWU6IFwiQmFzZSBJbWFnZVwiLFxuICAgIHN1YnRpdGxlOiBcIlRoZSBMaW51eCBkaXN0cmlidXRpb24gcnVubmluZyBpbnNpZGUgdGhlIGNvbnRhaW5lclwiLFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgdmFsdWU6IFwidWJ1bnR1OjI0LjA0XCIsIGRpc3BsYXlOYW1lOiBcIlVidW50dSAyNC4wNCAocmVjb21tZW5kZWQgXHUyMDE0IHdpZGVzdCBjb21wYXRpYmlsaXR5KVwiIH0sXG4gICAgICB7IHZhbHVlOiBcInVidW50dToyMi4wNFwiLCBkaXNwbGF5TmFtZTogXCJVYnVudHUgMjIuMDQgKExUUyBzdGFibGUpXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiZGViaWFuOmJvb2t3b3JtLXNsaW1cIiwgZGlzcGxheU5hbWU6IFwiRGViaWFuIEJvb2t3b3JtIFNsaW0gKGxpZ2h0d2VpZ2h0KVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImFscGluZTozLjIwXCIsIGRpc3BsYXlOYW1lOiBcIkFscGluZSAzLjIwICh1bHRyYS1saWdodHdlaWdodCB+NU1CLCBtdXNsIGxpYmMpXCIgfSxcbiAgICBdLFxuICB9LCBcInVidW50dToyNC4wNFwiKVxuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBSZXNvdXJjZSBMaW1pdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLmZpZWxkKFwiY3B1TGltaXRcIiwgXCJudW1lcmljXCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJDUFUgQ29yZSBMaW1pdFwiLFxuICAgIHN1YnRpdGxlOiBcIk1heGltdW0gQ1BVIGNvcmVzIGFsbG9jYXRlZCB0byB0aGUgY29tcHV0ZXIgKDAgPSBubyBsaW1pdClcIixcbiAgICBtaW46IDAsIG1heDogOCwgaW50OiB0cnVlLFxuICAgIHNsaWRlcjogeyBzdGVwOiAxLCBtaW46IDAsIG1heDogOCB9LFxuICB9LCAyKVxuXG4gIC5maWVsZChcIm1lbW9yeUxpbWl0TUJcIiwgXCJudW1lcmljXCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJNZW1vcnkgTGltaXQgKE1CKVwiLFxuICAgIHN1YnRpdGxlOiBcIk1heGltdW0gUkFNIGluIG1lZ2FieXRlcyAoMjU2XHUyMDEzODE5MilcIixcbiAgICBtaW46IDI1NiwgbWF4OiA4MTkyLCBpbnQ6IHRydWUsXG4gICAgc2xpZGVyOiB7IHN0ZXA6IDI1NiwgbWluOiAyNTYsIG1heDogODE5MiB9LFxuICB9LCAxMDI0KVxuXG4gIC5maWVsZChcImRpc2tMaW1pdE1CXCIsIFwibnVtZXJpY1wiLCB7XG4gICAgZGlzcGxheU5hbWU6IFwiRGlzayBMaW1pdCAoTUIpXCIsXG4gICAgc3VidGl0bGU6IFwiTWF4aW11bSBkaXNrIHNwYWNlIGluIG1lZ2FieXRlcyAoNTEyXHUyMDEzMzI3NjgpLiBPbmx5IGVuZm9yY2VkIG9uIG5ldyBjb250YWluZXJzLlwiLFxuICAgIG1pbjogNTEyLCBtYXg6IDMyNzY4LCBpbnQ6IHRydWUsXG4gICAgc2xpZGVyOiB7IHN0ZXA6IDUxMiwgbWluOiA1MTIsIG1heDogMzI3NjggfSxcbiAgfSwgNDA5NilcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgRXhlY3V0aW9uIENvbnN0cmFpbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC5maWVsZChcImNvbW1hbmRUaW1lb3V0XCIsIFwibnVtZXJpY1wiLCB7XG4gICAgZGlzcGxheU5hbWU6IFwiQ29tbWFuZCBUaW1lb3V0IChzZWNvbmRzKVwiLFxuICAgIHN1YnRpdGxlOiBcIk1heGltdW0gdGltZSBhIHNpbmdsZSBjb21tYW5kIGNhbiBydW4gYmVmb3JlIGJlaW5nIGtpbGxlZCAoNVx1MjAxMzMwMClcIixcbiAgICBtaW46IDUsIG1heDogMzAwLCBpbnQ6IHRydWUsXG4gICAgc2xpZGVyOiB7IHN0ZXA6IDUsIG1pbjogNSwgbWF4OiAzMDAgfSxcbiAgfSwgMzApXG5cbiAgLmZpZWxkKFwibWF4T3V0cHV0U2l6ZVwiLCBcIm51bWVyaWNcIiwge1xuICAgIGRpc3BsYXlOYW1lOiBcIk1heCBPdXRwdXQgU2l6ZSAoS0IpXCIsXG4gICAgc3VidGl0bGU6IFwiTWF4aW11bSBzdGRvdXQvc3RkZXJyIHJldHVybmVkIHRvIHRoZSBtb2RlbCBwZXIgY29tbWFuZCAoMVx1MjAxMzEyOCBLQikuIExhcmdlciBvdXRwdXQgaXMgdHJ1bmNhdGVkLlwiLFxuICAgIG1pbjogMSwgbWF4OiAxMjgsIGludDogdHJ1ZSxcbiAgICBzbGlkZXI6IHsgc3RlcDogMSwgbWluOiAxLCBtYXg6IDEyOCB9LFxuICB9LCAzMilcblxuICAuZmllbGQoXCJtYXhUb29sQ2FsbHNQZXJUdXJuXCIsIFwibnVtZXJpY1wiLCB7XG4gICAgZGlzcGxheU5hbWU6IFwiTWF4IFRvb2wgQ2FsbHMgUGVyIFR1cm5cIixcbiAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiB0aW1lcyB0aGUgbW9kZWwgY2FuIHVzZSB0aGUgY29tcHV0ZXIgcGVyIGNvbnZlcnNhdGlvbmFsIHR1cm4gKDFcdTIwMTMxMDApLiBSZXNldHMgZWFjaCB0aW1lIHlvdSBzZW5kIGEgbWVzc2FnZS4gUHJldmVudHMgaW5maW5pdGUgbG9vcHMuXCIsXG4gICAgbWluOiAxLCBtYXg6IDEwMCwgaW50OiB0cnVlLFxuICAgIHNsaWRlcjogeyBzdGVwOiAxLCBtaW46IDEsIG1heDogMTAwIH0sXG4gIH0sIDI1KVxuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQYWNrYWdlcyAmIEVudmlyb25tZW50IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC5maWVsZChcImF1dG9JbnN0YWxsUHJlc2V0XCIsIFwic2VsZWN0XCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJBdXRvLUluc3RhbGwgUGFja2FnZXNcIixcbiAgICBzdWJ0aXRsZTogXCJQcmUtaW5zdGFsbCBjb21tb24gdG9vbHMgd2hlbiB0aGUgY29udGFpbmVyIGlzIGZpcnN0IGNyZWF0ZWRcIixcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgZGlzcGxheU5hbWU6IFwiTm9uZSBcdTIwMTQgYmFyZSBPUywgaW5zdGFsbCBtYW51YWxseVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIm1pbmltYWxcIiwgZGlzcGxheU5hbWU6IFwiTWluaW1hbCBcdTIwMTQgY3VybCwgd2dldCwgZ2l0LCB2aW0sIGpxXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwicHl0aG9uXCIsIGRpc3BsYXlOYW1lOiBcIlB5dGhvbiBcdTIwMTQgcHl0aG9uMywgcGlwLCB2ZW52XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibm9kZVwiLCBkaXNwbGF5TmFtZTogXCJOb2RlLmpzIFx1MjAxNCBub2RlanMsIG5wbVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImJ1aWxkXCIsIGRpc3BsYXlOYW1lOiBcIkJ1aWxkIFRvb2xzIFx1MjAxNCBnY2MsIGNtYWtlLCBtYWtlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiZnVsbFwiLCBkaXNwbGF5TmFtZTogXCJGdWxsIFx1MjAxNCBhbGwgb2YgdGhlIGFib3ZlICsgbmV0d29ya2luZyB0b29sc1wiIH0sXG4gICAgXSxcbiAgfSwgXCJtaW5pbWFsXCIpXG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIE5ldHdvcmtpbmcgJiBNb3VudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLmZpZWxkKFwicG9ydEZvcndhcmRzXCIsIFwic3RyaW5nXCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJQb3J0IEZvcndhcmRzXCIsXG4gICAgc3VidGl0bGU6IFwiQ29tbWEtc2VwYXJhdGVkIGhvc3Q6Y29udGFpbmVyIHBvcnQgcGFpcnMgKGUuZy4sICc4MDgwOjgwLDMwMDA6MzAwMCcpLiBBbGxvd3MgYWNjZXNzaW5nIHNlcnZpY2VzIHJ1bm5pbmcgaW5zaWRlIHRoZSBjb250YWluZXIuXCIsXG4gIH0sIFwiXCIpXG5cbiAgLmZpZWxkKFwiaG9zdE1vdW50UGF0aFwiLCBcInN0cmluZ1wiLCB7XG4gICAgZGlzcGxheU5hbWU6IFwiU2hhcmVkIEZvbGRlciAoSG9zdCBNb3VudClcIixcbiAgICBzdWJ0aXRsZTogXCJBYnNvbHV0ZSBwYXRoIHRvIGEgZm9sZGVyIG9uIHlvdXIgY29tcHV0ZXIgdGhhdCB3aWxsIGJlIGFjY2Vzc2libGUgaW5zaWRlIHRoZSBjb250YWluZXIgYXQgL21udC9zaGFyZWQuIExlYXZlIGVtcHR5IHRvIGRpc2FibGUuXCIsXG4gIH0sIFwiXCIpXG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNhZmV0eSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAuZmllbGQoXCJzdHJpY3RTYWZldHlcIiwgXCJzZWxlY3RcIiwge1xuICAgIGRpc3BsYXlOYW1lOiBcIlN0cmljdCBTYWZldHkgTW9kZVwiLFxuICAgIHN1YnRpdGxlOiBcIkJsb2NrIGtub3duIGRlc3RydWN0aXZlIGNvbW1hbmRzIChmb3JrIGJvbWJzLCBkaXNrIHdpcGVycykuIERpc2FibGUgb25seSBpZiB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cIixcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IHZhbHVlOiBcIm9uXCIsIGRpc3BsYXlOYW1lOiBcIk9uIFx1MjAxNCBibG9jayBvYnZpb3VzbHkgZGVzdHJ1Y3RpdmUgY29tbWFuZHMgKHJlY29tbWVuZGVkKVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIm9mZlwiLCBkaXNwbGF5TmFtZTogXCJPZmYgXHUyMDE0IGFsbG93IGV2ZXJ5dGhpbmcsIEkgYWNjZXB0IHRoZSByaXNrXCIgfSxcbiAgICBdLFxuICB9LCBcIm9uXCIpXG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbnRleHQgSW5qZWN0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC5maWVsZChcImF1dG9JbmplY3RDb250ZXh0XCIsIFwic2VsZWN0XCIsIHtcbiAgICBkaXNwbGF5TmFtZTogXCJBdXRvLUluamVjdCBDb21wdXRlciBDb250ZXh0XCIsXG4gICAgc3VidGl0bGU6IFwiQXV0b21hdGljYWxseSB0ZWxsIHRoZSBtb2RlbCBhYm91dCBpdHMgY29tcHV0ZXIgKE9TLCBpbnN0YWxsZWQgdG9vbHMsIHJ1bm5pbmcgcHJvY2Vzc2VzKSBhdCB0aGUgc3RhcnQgb2YgZWFjaCB0dXJuXCIsXG4gICAgb3B0aW9uczogW1xuICAgICAgeyB2YWx1ZTogXCJvblwiLCBkaXNwbGF5TmFtZTogXCJPbiBcdTIwMTQgbW9kZWwgYWx3YXlzIGtub3dzIGl0cyBjb21wdXRlciBzdGF0ZSAocmVjb21tZW5kZWQpXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwib2ZmXCIsIGRpc3BsYXlOYW1lOiBcIk9mZiBcdTIwMTQgbW9kZWwgZGlzY292ZXJzIHN0YXRlIHZpYSB0b29scyBvbmx5XCIgfSxcbiAgICBdLFxuICB9LCBcIm9uXCIpXG5cbiAgLmJ1aWxkKCk7XG4iLCAiLyoqXG4gKiBAZmlsZSBjb250YWluZXIvcnVudGltZS50c1xuICogQXV0by1kZXRlY3RzIERvY2tlciBvciBQb2RtYW4gb24gdGhlIGhvc3Qgc3lzdGVtLlxuICpcbiAqIFByaW9yaXR5OiBEb2NrZXIgZmlyc3QgKG1vc3QgY29tbW9uKSwgdGhlbiBQb2RtYW4gZmFsbGJhY2suXG4gKiBDYWNoZXMgdGhlIHJlc3VsdCBhZnRlciBmaXJzdCBzdWNjZXNzZnVsIGRldGVjdGlvbi5cbiAqL1xuXG5pbXBvcnQgeyBleGVjRmlsZSB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBSdW50aW1lSW5mbywgUnVudGltZUtpbmQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuY29uc3QgZXhlY0FzeW5jID0gcHJvbWlzaWZ5KGV4ZWNGaWxlKTtcblxuLyoqIENhY2hlZCBydW50aW1lIGluZm8gYWZ0ZXIgZmlyc3QgZGV0ZWN0aW9uLiAqL1xubGV0IGNhY2hlZFJ1bnRpbWU6IFJ1bnRpbWVJbmZvIHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogQXR0ZW1wdCB0byBkZXRlY3QgYSBzcGVjaWZpYyBydW50aW1lIGJ5IHJ1bm5pbmcgYDxjbWQ+IC0tdmVyc2lvbmAuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByb2JlKGNtZDogc3RyaW5nLCBraW5kOiBSdW50aW1lS2luZCk6IFByb21pc2U8UnVudGltZUluZm8gfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGV4ZWNBc3luYyhjbWQsIFtcIi0tdmVyc2lvblwiXSwgeyB0aW1lb3V0OiA1XzAwMCB9KTtcbiAgICBjb25zdCB2ZXJzaW9uID0gc3Rkb3V0LnRyaW0oKS5zcGxpdChcIlxcblwiKVswXSA/PyBcInVua25vd25cIjtcbiAgICByZXR1cm4geyBraW5kLCBwYXRoOiBjbWQsIHZlcnNpb24gfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHJ1bnRpbWUgY2FuZGlkYXRlcyBvcmRlcmVkIGJ5IHByaW9yaXR5LlxuICogT24gV2luZG93cywgYWxzbyBwcm9iZXMga25vd24gRG9ja2VyIERlc2t0b3AgaW5zdGFsbCBwYXRocyBzaW5jZVxuICogTE0gU3R1ZGlvIG1heSBsYXVuY2ggd2l0aCBhIHJlc3RyaWN0ZWQgUEFUSCB0aGF0IG9taXRzIFByb2dyYW0gRmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGdldFJ1bnRpbWVDYW5kaWRhdGVzKCk6IEFycmF5PHsgY21kOiBzdHJpbmc7IGtpbmQ6IFJ1bnRpbWVLaW5kIH0+IHtcbiAgY29uc3QgY2FuZGlkYXRlczogQXJyYXk8eyBjbWQ6IHN0cmluZzsga2luZDogUnVudGltZUtpbmQgfT4gPSBbXG4gICAgeyBjbWQ6IFwiZG9ja2VyXCIsIGtpbmQ6IFwiZG9ja2VyXCIgfSxcbiAgICB7IGNtZDogXCJwb2RtYW5cIiwga2luZDogXCJwb2RtYW5cIiB9LFxuICBdO1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgY2FuZGlkYXRlcy5wdXNoKFxuICAgICAgeyBjbWQ6IFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1xcXFxiaW5cXFxcZG9ja2VyLmV4ZVwiLCBraW5kOiBcImRvY2tlclwiIH0sXG4gICAgICB7IGNtZDogXCJDOlxcXFxQcm9ncmFtIEZpbGVzXFxcXERvY2tlclxcXFxEb2NrZXJcXFxccmVzb3VyY2VzXFxcXGRvY2tlci5leGVcIiwga2luZDogXCJkb2NrZXJcIiB9LFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGNhbmRpZGF0ZXM7XG59XG5cbi8qKlxuICogRGV0ZWN0IHRoZSBhdmFpbGFibGUgY29udGFpbmVyIHJ1bnRpbWUuXG4gKiBUcmllcyBEb2NrZXIgZmlyc3QsIHRoZW4gUG9kbWFuLiBDYWNoZXMgdGhlIHJlc3VsdC5cbiAqXG4gKiBAdGhyb3dzIEVycm9yIGlmIG5laXRoZXIgRG9ja2VyIG5vciBQb2RtYW4gaXMgZm91bmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXRlY3RSdW50aW1lKCk6IFByb21pc2U8UnVudGltZUluZm8+IHtcbiAgaWYgKGNhY2hlZFJ1bnRpbWUpIHJldHVybiBjYWNoZWRSdW50aW1lO1xuXG4gIGZvciAoY29uc3QgeyBjbWQsIGtpbmQgfSBvZiBnZXRSdW50aW1lQ2FuZGlkYXRlcygpKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvYmUoY21kLCBraW5kKTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBjYWNoZWRSdW50aW1lID0gcmVzdWx0O1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpc1dpbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiTm8gY29udGFpbmVyIHJ1bnRpbWUgZm91bmQuIFBsZWFzZSBpbnN0YWxsIERvY2tlciBEZXNrdG9wXCIgK1xuICAgIChpc1dpblxuICAgICAgPyBcIiBmcm9tIGh0dHBzOi8vZG9jcy5kb2NrZXIuY29tL2Rlc2t0b3Avc2V0dXAvaW5zdGFsbC93aW5kb3dzLWluc3RhbGwvXCJcbiAgICAgIDogXCIgKGh0dHBzOi8vZG9jcy5kb2NrZXIuY29tL2dldC1kb2NrZXIvKVwiKSArXG4gICAgXCIgb3IgUG9kbWFuIChodHRwczovL3BvZG1hbi5pby9nZXR0aW5nLXN0YXJ0ZWQvaW5zdGFsbGF0aW9uKSB0byB1c2UgdGhpcyBwbHVnaW4uXCJcbiAgKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGNvbnRhaW5lciBydW50aW1lIGlzIGF2YWlsYWJsZSB3aXRob3V0IHRocm93aW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNSdW50aW1lQXZhaWxhYmxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGF3YWl0IGRldGVjdFJ1bnRpbWUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBjYWNoZWQgcnVudGltZSwgb3IgbnVsbCBpZiBub3QgeWV0IGRldGVjdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGVkUnVudGltZSgpOiBSdW50aW1lSW5mbyB8IG51bGwge1xuICByZXR1cm4gY2FjaGVkUnVudGltZTtcbn1cblxuLyoqXG4gKiBDbGVhciB0aGUgY2FjaGVkIHJ1bnRpbWUgKHVzZWZ1bCBmb3IgdGVzdGluZyBvciByZS1kZXRlY3Rpb24pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJSdW50aW1lQ2FjaGUoKTogdm9pZCB7XG4gIGNhY2hlZFJ1bnRpbWUgPSBudWxsO1xufSIsICIvKipcbiAqIEBmaWxlIGNvbnN0YW50cy50c1xuICogU2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgZXZlcnkgdHVuYWJsZSBwYXJhbWV0ZXIuXG4gKiBHcm91cGVkIGJ5IHN1YnN5c3RlbSBmb3IgZWFzeSBkaXNjb3ZlcnkuXG4gKi9cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbnRhaW5lciBEZWZhdWx0cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8qKiBOYW1lIHByZWZpeCBmb3IgbWFuYWdlZCBjb250YWluZXJzLiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9OQU1FX1BSRUZJWCA9IFwibG1zLWNvbXB1dGVyXCI7XG4vKiogRGVmYXVsdCBjb250YWluZXIgaW1hZ2UuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9JTUFHRSA9IFwidWJ1bnR1OjI0LjA0XCI7XG4vKiogTGlnaHR3ZWlnaHQgYWx0ZXJuYXRpdmUgaW1hZ2UuICovXG5leHBvcnQgY29uc3QgQUxQSU5FX0lNQUdFID0gXCJhbHBpbmU6My4yMFwiO1xuLyoqIERlZmF1bHQgd29ya2luZyBkaXJlY3RvcnkgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX1dPUktESVIgPSBcIi9ob21lL3VzZXJcIjtcbi8qKiBEZWZhdWx0IHNoZWxsIHRvIGV4ZWMgaW50by4gKi9cbmV4cG9ydCBjb25zdCBDT05UQUlORVJfU0hFTEwgPSBcIi9iaW4vYmFzaFwiO1xuLyoqIEFscGluZSBzaGVsbCBmYWxsYmFjay4gKi9cbmV4cG9ydCBjb25zdCBDT05UQUlORVJfU0hFTExfQUxQSU5FID0gXCIvYmluL3NoXCI7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBSZXNvdXJjZSBMaW1pdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vKiogRGVmYXVsdCBDUFUgY29yZSBsaW1pdCAoMCA9IHVubGltaXRlZCkuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9DUFVfTElNSVQgPSAyO1xuLyoqIE1heGltdW0gYWxsb3dlZCBDUFUgY29yZXMuICovXG5leHBvcnQgY29uc3QgTUFYX0NQVV9MSU1JVCA9IDg7XG4vKiogRGVmYXVsdCBtZW1vcnkgbGltaXQgaW4gTUIuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9NRU1PUllfTElNSVRfTUIgPSAxMDI0O1xuLyoqIE1heGltdW0gbWVtb3J5IGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9NRU1PUllfTElNSVRfTUIgPSA4MTkyO1xuLyoqIERlZmF1bHQgZGlzayBzaXplIGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRElTS19MSU1JVF9NQiA9IDQwOTY7XG4vKiogTWF4aW11bSBkaXNrIGxpbWl0IGluIE1CLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9ESVNLX0xJTUlUX01CID0gMzI3Njg7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFeGVjdXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vKiogRGVmYXVsdCBjb21tYW5kIHRpbWVvdXQgaW4gc2Vjb25kcy4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RJTUVPVVRfU0VDT05EUyA9IDMwO1xuLyoqIE1pbmltdW0gdGltZW91dC4gKi9cbmV4cG9ydCBjb25zdCBNSU5fVElNRU9VVF9TRUNPTkRTID0gNTtcbi8qKiBNYXhpbXVtIHRpbWVvdXQuICovXG5leHBvcnQgY29uc3QgTUFYX1RJTUVPVVRfU0VDT05EUyA9IDMwMDtcbi8qKiBEZWZhdWx0IG1heCBvdXRwdXQgc2l6ZSBpbiBieXRlcyByZXR1cm5lZCB0byB0aGUgbW9kZWwuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTID0gMzJfNzY4O1xuLyoqIEFic29sdXRlIG1heCBvdXRwdXQgYnl0ZXMuICovXG5leHBvcnQgY29uc3QgTUFYX09VVFBVVF9CWVRFUyA9IDEzMV8wNzI7XG4vKiogRGVmYXVsdCBtYXggdG9vbCBjYWxscyBwZXIgdHVybi4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX01BWF9UT09MX0NBTExTX1BFUl9UVVJOID0gMjU7XG4vKiogTWluaW11bSBhbGxvd2VkIHRvb2wgY2FsbHMgcGVyIHR1cm4uICovXG5leHBvcnQgY29uc3QgTUlOX1RPT0xfQ0FMTFNfUEVSX1RVUk4gPSAxO1xuLyoqIE1heGltdW0gYWxsb3dlZCB0b29sIGNhbGxzIHBlciB0dXJuLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9UT09MX0NBTExTX1BFUl9UVVJOID0gMTAwO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgRmlsZSBUcmFuc2ZlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8qKiBNYXggZmlsZSBzaXplIGZvciByZWFkIG9wZXJhdGlvbnMgKGJ5dGVzKS4gKi9cbmV4cG9ydCBjb25zdCBNQVhfRklMRV9SRUFEX0JZVEVTID0gNTEyXzAwMDtcbi8qKiBNYXggZmlsZSBzaXplIGZvciB3cml0ZSBvcGVyYXRpb25zIChieXRlcykuICovXG5leHBvcnQgY29uc3QgTUFYX0ZJTEVfV1JJVEVfQllURVMgPSA1XzI0Ml84ODA7XG4vKiogTWF4IGZpbGUgc2l6ZSBmb3IgdXBsb2FkL2Rvd25sb2FkIChieXRlcykuICovXG5leHBvcnQgY29uc3QgTUFYX1RSQU5TRkVSX0JZVEVTID0gNTJfNDI4XzgwMDtcbi8qKiBEZWZhdWx0IGhvc3QgdHJhbnNmZXIgZGlyZWN0b3J5LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfVFJBTlNGRVJfRElSID0gXCJsbXMtY29tcHV0ZXItZmlsZXNcIjtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNhZmV0eSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8qKiBDb21tYW5kcyBibG9ja2VkIGluIHN0cmljdCBtb2RlIChwYXR0ZXJuLW1hdGNoZWQpLiAqL1xuZXhwb3J0IGNvbnN0IEJMT0NLRURfQ09NTUFORFNfU1RSSUNUOiByZWFkb25seSBzdHJpbmdbXSA9IFtcbiAgXCI6KCl7IDp8OiYgfTs6XCIsICAgICAgLy8gZm9yayBib21iXG4gIFwicm0gLXJmIC9cIiwgICAgICAgICAgICAvLyByb290IHdpcGVcbiAgXCJybSAtcmYgLypcIiwgICAgICAgICAgIC8vIHJvb3Qgd2lwZSB2YXJpYW50XG4gIFwibWtmc1wiLCAgICAgICAgICAgICAgIC8vIGZvcm1hdCBmaWxlc3lzdGVtXG4gIFwiZGQgaWY9L2Rldi96ZXJvXCIsICAgIC8vIGRpc2sgZGVzdHJveWVyXG4gIFwiZGQgaWY9L2Rldi9yYW5kb21cIiwgIC8vIGRpc2sgZGVzdHJveWVyXG4gIFwiPiAvZGV2L3NkYVwiLCAgICAgICAgIC8vIHJhdyBkaXNrIHdyaXRlXG4gIFwiY2htb2QgLVIgNzc3IC9cIiwgICAgIC8vIHBlcm1pc3Npb24gbnVrZVxuICBcImNob3duIC1SXCIsICAgICAgICAgICAvLyBvd25lcnNoaXAgbnVrZSBvbiByb290XG5dO1xuXG4vKipcbiAqIEVudmlyb25tZW50IHZhcmlhYmxlcyBpbmplY3RlZCBpbnRvIGV2ZXJ5IGNvbnRhaW5lci5cbiAqIFRoZXNlIHRlbGwgdGhlIG1vZGVsIGFib3V0IGl0cyBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9FTlZfVkFSUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgVEVSTTogXCJ4dGVybS0yNTZjb2xvclwiLFxuICBMQU5HOiBcImVuX1VTLlVURi04XCIsXG4gIEhPTUU6IENPTlRBSU5FUl9XT1JLRElSLFxuICBMTVNfQ09NUFVURVI6IFwiMVwiLFxufTtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEF1dG8tSW5zdGFsbCBQYWNrYWdlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8qKiBQYWNrYWdlIHNldHMgYXZhaWxhYmxlIGZvciBwcmUtaW5zdGFsbGF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IFBBQ0tBR0VfUFJFU0VUUzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBtaW5pbWFsOiBbXCJjdXJsXCIsIFwid2dldFwiLCBcImdpdFwiLCBcInZpbS10aW55XCIsIFwianFcIl0sXG4gIHB5dGhvbjogW1wicHl0aG9uM1wiLCBcInB5dGhvbjMtcGlwXCIsIFwicHl0aG9uMy12ZW52XCJdLFxuICBub2RlOiBbXCJub2RlanNcIiwgXCJucG1cIl0sXG4gIGJ1aWxkOiBbXCJidWlsZC1lc3NlbnRpYWxcIiwgXCJjbWFrZVwiLCBcInBrZy1jb25maWdcIl0sXG4gIG5ldHdvcms6IFtcIm5ldC10b29sc1wiLCBcImlwdXRpbHMtcGluZ1wiLCBcImRuc3V0aWxzXCIsIFwidHJhY2Vyb3V0ZVwiLCBcIm5tYXBcIl0sXG4gIGZ1bGw6IFtcImN1cmxcIiwgXCJ3Z2V0XCIsIFwiZ2l0XCIsIFwidmltLXRpbnlcIiwgXCJqcVwiLCBcInB5dGhvbjNcIiwgXCJweXRob24zLXBpcFwiLFxuICAgIFwicHl0aG9uMy12ZW52XCIsIFwibm9kZWpzXCIsIFwibnBtXCIsIFwiYnVpbGQtZXNzZW50aWFsXCIsIFwiY21ha2VcIixcbiAgICBcIm5ldC10b29sc1wiLCBcImlwdXRpbHMtcGluZ1wiLCBcImh0b3BcIiwgXCJ0cmVlXCIsIFwidW56aXBcIiwgXCJ6aXBcIl0sXG59O1xuXG4vKiogQWxwaW5lIGVxdWl2YWxlbnRzIGZvciBwYWNrYWdlIHByZXNldHMuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9QUkVTRVRTX0FMUElORTogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBtaW5pbWFsOiBbXCJjdXJsXCIsIFwid2dldFwiLCBcImdpdFwiLCBcInZpbVwiLCBcImpxXCJdLFxuICBweXRob246IFtcInB5dGhvbjNcIiwgXCJweTMtcGlwXCJdLFxuICBub2RlOiBbXCJub2RlanNcIiwgXCJucG1cIl0sXG4gIGJ1aWxkOiBbXCJidWlsZC1iYXNlXCIsIFwiY21ha2VcIiwgXCJwa2djb25mXCJdLFxuICBuZXR3b3JrOiBbXCJuZXQtdG9vbHNcIiwgXCJpcHV0aWxzXCIsIFwiYmluZC10b29sc1wiLCBcInRyYWNlcm91dGVcIiwgXCJubWFwXCJdLFxuICBmdWxsOiBbXCJjdXJsXCIsIFwid2dldFwiLCBcImdpdFwiLCBcInZpbVwiLCBcImpxXCIsIFwicHl0aG9uM1wiLCBcInB5My1waXBcIixcbiAgICBcIm5vZGVqc1wiLCBcIm5wbVwiLCBcImJ1aWxkLWJhc2VcIiwgXCJjbWFrZVwiLFxuICAgIFwibmV0LXRvb2xzXCIsIFwiaXB1dGlsc1wiLCBcImh0b3BcIiwgXCJ0cmVlXCIsIFwidW56aXBcIiwgXCJ6aXBcIl0sXG59O1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUHJlcHJvY2Vzc29yIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLyoqIE1heCBjaGFycyBvZiBpbmplY3RlZCBjb21wdXRlciBjb250ZXh0LiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTID0gMl8wMDA7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb250YWluZXIgSW1hZ2VzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLyoqIFZhbGlkIGJhc2UgaW1hZ2VzIHRoZSB1c2VyIGNhbiBzZWxlY3QuICovXG5leHBvcnQgY29uc3QgVkFMSURfSU1BR0VTID0gW1xuICBcInVidW50dToyNC4wNFwiLFxuICBcInVidW50dToyMi4wNFwiLFxuICBcImFscGluZTozLjIwXCIsXG4gIFwiZGViaWFuOmJvb2t3b3JtLXNsaW1cIixcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBDb250YWluZXJJbWFnZSA9IHR5cGVvZiBWQUxJRF9JTUFHRVNbbnVtYmVyXTtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIE5ldHdvcmsgTW9kZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgY29uc3QgTkVUV09SS19NT0RFUyA9IFtcIm5vbmVcIiwgXCJicmlkZ2VcIiwgXCJzbGlycDRuZXRuc1wiLCBcInBhc3RhXCIsIFwicG9kbWFuLWRlZmF1bHRcIl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBOZXR3b3JrTW9kZSA9IHR5cGVvZiBORVRXT1JLX01PREVTW251bWJlcl07XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQZXJzaXN0ZW5jZSBNb2RlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmV4cG9ydCBjb25zdCBQRVJTSVNURU5DRV9NT0RFUyA9IFtcInBlcnNpc3RlbnRcIiwgXCJlcGhlbWVyYWxcIl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBQZXJzaXN0ZW5jZU1vZGUgPSB0eXBlb2YgUEVSU0lTVEVOQ0VfTU9ERVNbbnVtYmVyXTtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbnRhaW5lciBTdGF0ZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX1NUQVRFUyA9IFtcInJ1bm5pbmdcIiwgXCJzdG9wcGVkXCIsIFwibm90X2ZvdW5kXCIsIFwiZXJyb3JcIl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBDb250YWluZXJTdGF0ZSA9IHR5cGVvZiBDT05UQUlORVJfU1RBVEVTW251bWJlcl07XG4iLCAiLyoqXG4gKiBAZmlsZSBjb250YWluZXIvZW5naW5lLnRzXG4gKiBDb250YWluZXIgbGlmZWN5Y2xlIGVuZ2luZSBcdTIwMTQgY3JlYXRlcywgc3RhcnRzLCBzdG9wcywgYW5kIGV4ZWN1dGVzXG4gKiBjb21tYW5kcyBpbnNpZGUgdGhlIG1vZGVsJ3MgZGVkaWNhdGVkIExpbnV4IGNvbXB1dGVyLlxuICpcbiAqIEFsbCBjb250YWluZXIgb3BlcmF0aW9ucyBnbyB0aHJvdWdoIHRoaXMgbW9kdWxlLiBUaGUgZW5naW5lIGlzXG4gKiBsYXp5LWluaXRpYWxpemVkOiB0aGUgY29udGFpbmVyIGlzIG9ubHkgY3JlYXRlZC9zdGFydGVkIHdoZW4gdGhlXG4gKiBmaXJzdCB0b29sIGNhbGwgaGFwcGVucy5cbiAqXG4gKiBTdXBwb3J0cyBEb2NrZXIgYW5kIFBvZG1hbiBpbnRlcmNoYW5nZWFibHkgdmlhIHRoZSBkZXRlY3RlZCBydW50aW1lLlxuICovXG5cbmltcG9ydCB7IGV4ZWNGaWxlLCBzcGF3biB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuaW1wb3J0IHsgbWtkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGhvbWVkaXIgfSBmcm9tIFwib3NcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGV0ZWN0UnVudGltZSB9IGZyb20gXCIuL3J1bnRpbWVcIjtcbmltcG9ydCB7XG4gIENPTlRBSU5FUl9OQU1FX1BSRUZJWCxcbiAgQ09OVEFJTkVSX1dPUktESVIsXG4gIENPTlRBSU5FUl9TSEVMTCxcbiAgQ09OVEFJTkVSX1NIRUxMX0FMUElORSxcbiAgQ09OVEFJTkVSX0VOVl9WQVJTLFxuICBERUZBVUxUX01BWF9PVVRQVVRfQllURVMsXG4gIE1BWF9PVVRQVVRfQllURVMsXG4gIFBBQ0tBR0VfUFJFU0VUUyxcbiAgUEFDS0FHRV9QUkVTRVRTX0FMUElORSxcbn0gZnJvbSBcIi4uL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBSdW50aW1lSW5mbyxcbiAgQ29udGFpbmVyQ3JlYXRlT3B0aW9ucyxcbiAgQ29udGFpbmVySW5mbyxcbiAgRXhlY1Jlc3VsdCxcbiAgRW52aXJvbm1lbnRJbmZvLFxuICBQcm9jZXNzSW5mbyxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IENvbnRhaW5lckltYWdlLCBDb250YWluZXJTdGF0ZSwgTmV0d29ya01vZGUgfSBmcm9tIFwiLi4vY29uc3RhbnRzXCI7XG5cbmNvbnN0IGV4ZWNBc3luYyA9IHByb21pc2lmeShleGVjRmlsZSk7XG5cbi8qKlxuICogQ29udmVydCBhIFdpbmRvd3MgaG9zdCBwYXRoIChDOlxcVXNlcnNcXGZvbykgdG8gdGhlIGZvcm1hdCBEb2NrZXJcbiAqIG9uIFdpbmRvd3MgZXhwZWN0cyBmb3Igdm9sdW1lIG1vdW50cyAoLy9jL1VzZXJzL2ZvbykuXG4gKiBOby1vcCBvbiBMaW51eC9NYWMuXG4gKi9cbmZ1bmN0aW9uIHRvRG9ja2VyUGF0aChob3N0UGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09IFwid2luMzJcIikgcmV0dXJuIGhvc3RQYXRoO1xuICAvLyBSZXBsYWNlIGRyaXZlIGxldHRlciBDOlxcIFx1MjE5MiAvL2MvXG4gIHJldHVybiBob3N0UGF0aFxuICAgIC5yZXBsYWNlKC9eKFtBLVphLXpdKTpcXFxcLywgKF8sIGQpID0+IGAvLyR7ZC50b0xvd2VyQ2FzZSgpfS9gKVxuICAgIC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcbn1cblxuLyoqXG4gKiBBdWdtZW50IFBBVEggd2l0aCBwbGF0Zm9ybS1zcGVjaWZpYyBsb2NhdGlvbnMgd2hlcmUgRG9ja2VyL1BvZG1hblxuICogaGVscGVyIGJpbmFyaWVzIGxpdmUsIHNvIHRoZXkncmUgZmluZGFibGUgcmVnYXJkbGVzcyBvZiB3aGF0IFBBVEhcbiAqIExNIFN0dWRpbyBpbmhlcml0ZWQgZnJvbSB0aGUgT1MgbGF1bmNoZXIuXG4gKi9cbmZ1bmN0aW9uIGdldFJ1bnRpbWVFbnYoKTogTm9kZUpTLlByb2Nlc3NFbnYge1xuICBjb25zdCBiYXNlID0gcHJvY2Vzcy5lbnYuUEFUSCA/PyBcIlwiO1xuICBjb25zdCBleHRyYSA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIlxuICAgID8gW1xuICAgICAgICBcIkM6XFxcXFByb2dyYW0gRmlsZXNcXFxcRG9ja2VyXFxcXERvY2tlclxcXFxyZXNvdXJjZXNcXFxcYmluXCIsXG4gICAgICAgIFwiQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxEb2NrZXJcXFxcRG9ja2VyXFxcXHJlc291cmNlc1wiLFxuICAgICAgXVxuICAgIDogW1wiL3Vzci9iaW5cIiwgXCIvdXNyL2xvY2FsL2JpblwiLCBcIi91c3IvbGliL3BvZG1hblwiLCBcIi91c3IvbGliZXhlYy9wb2RtYW5cIiwgXCIvYmluXCJdO1xuXG4gIGNvbnN0IHNlcCA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIiA/IFwiO1wiIDogXCI6XCI7XG4gIHJldHVybiB7XG4gICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgUEFUSDogW2Jhc2UsIC4uLmV4dHJhXS5maWx0ZXIoQm9vbGVhbikuam9pbihzZXApLFxuICB9O1xufVxuXG4vKipcbiAqIEVuc3VyZSBQb2RtYW4ncyBjb250YWluZXJzLmNvbmYgaGFzIGV4cGxpY2l0IEROUyBzZXJ2ZXJzIHNldC5cbiAqIFRoaXMgZml4ZXMgRE5TIHJlc29sdXRpb24gZmFpbHVyZXMgaW4gcm9vdGxlc3MgY29udGFpbmVycyBvbiBVYnVudHUvc3lzdGVtZC1yZXNvbHZlZCBob3N0cy5cbiAqIFNhZmUgdG8gY2FsbCBtdWx0aXBsZSB0aW1lcyBcdTIwMTQgb25seSB3cml0ZXMgaWYgdGhlIGNvbmZpZyBpcyBtaXNzaW5nIG9yIGluY29tcGxldGUuXG4gKi9cbmZ1bmN0aW9uIGVuc3VyZVBvZG1hbkNvbmZpZygpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWdEaXIgPSBqb2luKGhvbWVkaXIoKSwgXCIuY29uZmlnXCIsIFwiY29udGFpbmVyc1wiKTtcbiAgICBjb25zdCBjb25maWdQYXRoID0gam9pbihjb25maWdEaXIsIFwiY29udGFpbmVycy5jb25mXCIpO1xuXG4gICAgbGV0IGV4aXN0aW5nID0gXCJcIjtcbiAgICBpZiAoZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgZXhpc3RpbmcgPSByZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZWVkc0ROUyA9ICFleGlzdGluZy5pbmNsdWRlcyhcImRuc19zZXJ2ZXJzXCIpO1xuICAgIGNvbnN0IG5lZWRzSGVscGVyRGlyID0gIWV4aXN0aW5nLmluY2x1ZGVzKFwiaGVscGVyX2JpbmFyaWVzX2RpclwiKTtcblxuICAgIGlmICghbmVlZHNETlMgJiYgIW5lZWRzSGVscGVyRGlyKSByZXR1cm47XG5cbiAgICBta2RpclN5bmMoY29uZmlnRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIGxldCB1cGRhdGVkID0gZXhpc3Rpbmc7XG5cbiAgICAvLyBoZWxwZXJfYmluYXJpZXNfZGlyIHRlbGxzIFBvZG1hbiB3aGVyZSB0byBmaW5kIHNsaXJwNG5ldG5zL3Bhc3RhXG4gICAgLy8gZXZlbiB3aGVuIExNIFN0dWRpbydzIHByb2Nlc3MgaGFzIGEgcmVzdHJpY3RlZCBQQVRILlxuICAgIGlmIChuZWVkc0hlbHBlckRpcikge1xuICAgICAgY29uc3QgaGVscGVyTGluZSA9ICdoZWxwZXJfYmluYXJpZXNfZGlyID0gW1wiL3Vzci9iaW5cIiwgXCIvdXNyL2xvY2FsL2JpblwiLCBcIi91c3IvbGliL3BvZG1hblwiXSc7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5pbmNsdWRlcyhcIltuZXR3b3JrXVwiKVxuICAgICAgICA/IHVwZGF0ZWQucmVwbGFjZShcIltuZXR3b3JrXVwiLCBgW25ldHdvcmtdXFxuJHtoZWxwZXJMaW5lfWApXG4gICAgICAgIDogdXBkYXRlZCArIGBcXG5bbmV0d29ya11cXG4ke2hlbHBlckxpbmV9XFxuYDtcbiAgICB9XG5cbiAgICAvLyBkbnNfc2VydmVycyBieXBhc3NlcyBzeXN0ZW1kLXJlc29sdmVkJ3MgMTI3LjAuMC41MyBzdHViIHdoaWNoXG4gICAgLy8gaXMgdW5yZWFjaGFibGUgZnJvbSBpbnNpZGUgcm9vdGxlc3MgY29udGFpbmVycy5cbiAgICBpZiAobmVlZHNETlMpIHtcbiAgICAgIGNvbnN0IGRuc0xpbmUgPSAnZG5zX3NlcnZlcnMgPSBbXCI4LjguOC44XCIsIFwiOC44LjQuNFwiXSc7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5pbmNsdWRlcyhcIltjb250YWluZXJzXVwiKVxuICAgICAgICA/IHVwZGF0ZWQucmVwbGFjZShcIltjb250YWluZXJzXVwiLCBgW2NvbnRhaW5lcnNdXFxuJHtkbnNMaW5lfWApXG4gICAgICAgIDogdXBkYXRlZCArIGBcXG5bY29udGFpbmVyc11cXG4ke2Ruc0xpbmV9XFxuYDtcbiAgICB9XG5cbiAgICB3cml0ZUZpbGVTeW5jKGNvbmZpZ1BhdGgsIHVwZGF0ZWQsIFwidXRmLThcIik7XG4gICAgY29uc29sZS5sb2coXCJbbG1zLWNvbXB1dGVyXSBBdXRvLWNvbmZpZ3VyZWQgUG9kbWFuIGNvbnRhaW5lcnMuY29uZiAoaGVscGVyX2JpbmFyaWVzX2RpciArIGRuc19zZXJ2ZXJzKS5cIik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihcIltsbXMtY29tcHV0ZXJdIENvdWxkIG5vdCB3cml0ZSBQb2RtYW4gY29uZmlnOlwiLCBlcnIpO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBTaW5nbGV0b24gU3RhdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmxldCBydW50aW1lOiBSdW50aW1lSW5mbyB8IG51bGwgPSBudWxsO1xubGV0IGNvbnRhaW5lck5hbWU6IHN0cmluZyA9IFwiXCI7XG5sZXQgY29udGFpbmVyUmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbmxldCBjdXJyZW50TmV0d29yazogTmV0d29ya01vZGUgPSBcIm5vbmVcIjtcbmxldCBpbml0UHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIEdldCB0aGUgc2hlbGwgcGF0aCBmb3IgdGhlIGdpdmVuIGltYWdlLlxuICovXG5mdW5jdGlvbiBzaGVsbEZvcihpbWFnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltYWdlLnN0YXJ0c1dpdGgoXCJhbHBpbmVcIikgPyBDT05UQUlORVJfU0hFTExfQUxQSU5FIDogQ09OVEFJTkVSX1NIRUxMO1xufVxuXG4vKipcbiAqIFJ1biBhIGNvbnRhaW5lciBydW50aW1lIGNvbW1hbmQgYW5kIHJldHVybiBzdGRvdXQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bihcbiAgYXJnczogc3RyaW5nW10sXG4gIHRpbWVvdXRNczogbnVtYmVyID0gMzBfMDAwLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKCFydW50aW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJSdW50aW1lIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgY29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGV4ZWNBc3luYyhydW50aW1lLnBhdGgsIGFyZ3MsIHtcbiAgICB0aW1lb3V0OiB0aW1lb3V0TXMsXG4gICAgbWF4QnVmZmVyOiBNQVhfT1VUUFVUX0JZVEVTLFxuICAgIGVudjogZ2V0UnVudGltZUVudigpLFxuICB9KTtcbiAgcmV0dXJuIHN0ZG91dC50cmltKCk7XG59XG5cbi8qKlxuICogQ2hlY2sgY3VycmVudCBzdGF0ZSBvZiB0aGUgbWFuYWdlZCBjb250YWluZXIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdldENvbnRhaW5lclN0YXRlKCk6IFByb21pc2U8Q29udGFpbmVyU3RhdGU+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvdXQgPSBhd2FpdCBydW4oW1xuICAgICAgXCJpbnNwZWN0XCIsIGNvbnRhaW5lck5hbWUsXG4gICAgICBcIi0tZm9ybWF0XCIsIFwie3suU3RhdGUuU3RhdHVzfX1cIixcbiAgICBdKTtcbiAgICBjb25zdCBzdGF0dXMgPSBvdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKHN0YXR1cyA9PT0gXCJydW5uaW5nXCIpIHJldHVybiBcInJ1bm5pbmdcIjtcbiAgICBpZiAoW1wiZXhpdGVkXCIsIFwic3RvcHBlZFwiLCBcImNyZWF0ZWRcIiwgXCJwYXVzZWRcIiwgXCJkZWFkXCJdLmluY2x1ZGVzKHN0YXR1cykpIHJldHVybiBcInN0b3BwZWRcIjtcbiAgICByZXR1cm4gXCJlcnJvclwiO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gXCJub3RfZm91bmRcIjtcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIGBkb2NrZXIgcnVuYCAvIGBwb2RtYW4gcnVuYCBhcmd1bWVudHMgZnJvbSBvcHRpb25zLlxuICovXG5mdW5jdGlvbiBidWlsZFJ1bkFyZ3Mob3B0czogQ29udGFpbmVyQ3JlYXRlT3B0aW9ucyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXG4gICAgXCJydW5cIiwgXCItZFwiLFxuICAgIFwiLS1uYW1lXCIsIG9wdHMubmFtZSxcbiAgICBcIi0taG9zdG5hbWVcIiwgXCJsbXMtY29tcHV0ZXJcIixcbiAgICAvLyBGb3IgUG9kbWFuIHJvb3RsZXNzIHdpdGggaW50ZXJuZXQgZW5hYmxlZCwgb21pdCAtLW5ldHdvcmsgZW50aXJlbHkgc28gUG9kbWFuXG4gICAgLy8gdXNlcyBpdHMgb3duIGNvbmZpZ3VyZWQgZGVmYXVsdCAocmVzcGVjdHMgfi8uY29uZmlnL2NvbnRhaW5lcnMvY29udGFpbmVycy5jb25mXG4gICAgLy8gZG5zX3NlcnZlcnMpLiBQYXNzaW5nIC0tbmV0d29yayBicmlkZ2UgZmFpbHMgd2l0aG91dCBrZXJuZWwgcHJpdmlsZWdlcy5cbiAgICAvLyBGb3IgRG9ja2VyIG9yIG5ldHdvcms9bm9uZSwgcGFzcyB0aGUgZmxhZyBleHBsaWNpdGx5LlxuICAgIC4uLihvcHRzLm5ldHdvcmsgIT09IFwicG9kbWFuLWRlZmF1bHRcIiA/IFtcIi0tbmV0d29ya1wiLCBvcHRzLm5ldHdvcmtdIDogW10pLFxuICAgIC8vIEluamVjdCBleHBsaWNpdCBETlMgc2VydmVycyB0byBieXBhc3Mgc3lzdGVtZC1yZXNvbHZlZCdzIDEyNy4wLjAuNTMgc3R1YlxuICAgIC8vIHdoaWNoIGlzIHVucmVhY2hhYmxlIGZyb20gaW5zaWRlIHJvb3RsZXNzIGNvbnRhaW5lcnMuXG4gICAgLi4uKG9wdHMubmV0d29yayAhPT0gXCJub25lXCIgPyBbXCItLWRuc1wiLCBcIjguOC44LjhcIiwgXCItLWRuc1wiLCBcIjguOC40LjRcIl0gOiBbXSksXG4gICAgLy8gVXNlIC9yb290IGFzIHRoZSBpbml0aWFsIHdvcmtkaXIgXHUyMDE0IGl0IGFsd2F5cyBleGlzdHMgaW4gYW55IGJhc2UgaW1hZ2UuXG4gICAgLy8gVGhlIHJlYWwgd29ya2RpciAoL2hvbWUvdXNlcikgaXMgY3JlYXRlZCBsYXRlciBieSBzZXR1cENvbnRhaW5lci5cbiAgICAvLyBQb2RtYW4gKHVubGlrZSBEb2NrZXIpIHZhbGlkYXRlcyB0aGUgd29ya2RpciBhdCBzdGFydCB0aW1lLCBzbyB3ZSBtdXN0XG4gICAgLy8gc3RhcnQgd2l0aCBhIGRpcmVjdG9yeSB0aGF0IGlzIGd1YXJhbnRlZWQgdG8gZXhpc3QuXG4gICAgXCItd1wiLCBcIi9yb290XCIsXG4gIF07XG5cbiAgLy8gUmVzb3VyY2UgbGltaXRzXG4gIGlmIChvcHRzLmNwdUxpbWl0ID4gMCkge1xuICAgIGFyZ3MucHVzaChcIi0tY3B1c1wiLCBTdHJpbmcob3B0cy5jcHVMaW1pdCkpO1xuICB9XG4gIGlmIChvcHRzLm1lbW9yeUxpbWl0TUIgPiAwKSB7XG4gICAgYXJncy5wdXNoKFwiLS1tZW1vcnlcIiwgYCR7b3B0cy5tZW1vcnlMaW1pdE1CfW1gKTtcbiAgICAvLyBTZXQgc3dhcCBlcXVhbCB0byBtZW1vcnkgKHByZXZlbnRzIE9PTS1raWxsZXIgd2VpcmRuZXNzKVxuICAgIGFyZ3MucHVzaChcIi0tbWVtb3J5LXN3YXBcIiwgYCR7b3B0cy5tZW1vcnlMaW1pdE1CfW1gKTtcbiAgfVxuXG5cblxuICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMob3B0cy5lbnZWYXJzKSkge1xuICAgIGFyZ3MucHVzaChcIi1lXCIsIGAke2t9PSR7dn1gKTtcbiAgfVxuXG4gIC8vIFBvcnQgZm9yd2FyZHNcbiAgZm9yIChjb25zdCBwZiBvZiBvcHRzLnBvcnRGb3J3YXJkcykge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBwZi50cmltKCk7XG4gICAgaWYgKHRyaW1tZWQpIGFyZ3MucHVzaChcIi1wXCIsIHRyaW1tZWQpO1xuICB9XG5cbiAgLy8gSG9zdCBtb3VudFxuICBpZiAob3B0cy5ob3N0TW91bnRQYXRoKSB7XG4gICAgYXJncy5wdXNoKFwiLXZcIiwgYCR7dG9Eb2NrZXJQYXRoKG9wdHMuaG9zdE1vdW50UGF0aCl9Oi9tbnQvc2hhcmVkYCk7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBjb250YWluZXIgYWxpdmUgd2l0aCBhIHNsZWVwIGxvb3BcbiAgYXJncy5wdXNoKG9wdHMuaW1hZ2UsIFwidGFpbFwiLCBcIi1mXCIsIFwiL2Rldi9udWxsXCIpO1xuXG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0aGUgdXNlciB3b3Jrc3BhY2UgYW5kIGluc3RhbGwgcGFja2FnZXMgaW5zaWRlIHRoZSBjb250YWluZXIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNldHVwQ29udGFpbmVyKFxuICBpbWFnZTogQ29udGFpbmVySW1hZ2UsXG4gIHByZXNldDogc3RyaW5nLFxuICBoYXNOZXR3b3JrOiBib29sZWFuID0gZmFsc2UsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc2hlbGwgPSBzaGVsbEZvcihpbWFnZSk7XG5cbiAgLy8gQ3JlYXRlIHRoZSB3b3JraW5nIGRpcmVjdG9yeSBhbmQgYSBub24tcm9vdCB1c2VyXG4gIGF3YWl0IHJ1bihbXCJleGVjXCIsIGNvbnRhaW5lck5hbWUsIHNoZWxsLCBcIi1jXCIsXG4gICAgYG1rZGlyIC1wICR7Q09OVEFJTkVSX1dPUktESVJ9ICYmIGAgK1xuICAgIGAoaWQgdXNlciA+L2Rldi9udWxsIDI+JjEgfHwgYWRkdXNlciAtLWRpc2FibGVkLXBhc3N3b3JkIC0tZ2Vjb3MgXCJcIiAtLWhvbWUgJHtDT05UQUlORVJfV09SS0RJUn0gdXNlciAyPi9kZXYvbnVsbCB8fCBgICtcbiAgICBgYWRkdXNlciAtRCAtaCAke0NPTlRBSU5FUl9XT1JLRElSfSB1c2VyIDI+L2Rldi9udWxsIHx8IHRydWUpYCxcbiAgXSwgMTVfMDAwKTtcblxuICAvLyBJbnN0YWxsIHBhY2thZ2VzIGlmIGEgcHJlc2V0IGlzIHNlbGVjdGVkIGFuZCB0aGUgY29udGFpbmVyIGhhcyBuZXR3b3JrIGFjY2Vzcy5cbiAgLy8gU2tpcCBzaWxlbnRseSBpZiBuZXR3b3JrIGlzIG5vbmUgXHUyMDE0IHVzZXIgY2FuIGVuYWJsZSBJbnRlcm5ldCBBY2Nlc3MgaW4gc2V0dGluZ3MuXG4gIGlmIChwcmVzZXQgJiYgcHJlc2V0ICE9PSBcIm5vbmVcIiAmJiBoYXNOZXR3b3JrKSB7XG4gICAgY29uc3QgaXNBbHBpbmUgPSBpbWFnZS5zdGFydHNXaXRoKFwiYWxwaW5lXCIpO1xuICAgIGNvbnN0IHByZXNldHMgPSBpc0FscGluZSA/IFBBQ0tBR0VfUFJFU0VUU19BTFBJTkUgOiBQQUNLQUdFX1BSRVNFVFM7XG4gICAgY29uc3QgcGFja2FnZXMgPSBwcmVzZXRzW3ByZXNldF07XG4gICAgaWYgKHBhY2thZ2VzICYmIHBhY2thZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGluc3RhbGxDbWQgPSBpc0FscGluZVxuICAgICAgICA/IGBhcGsgdXBkYXRlICYmIGFwayBhZGQgLS1uby1jYWNoZSAke3BhY2thZ2VzLmpvaW4oXCIgXCIpfWBcbiAgICAgICAgOiBgYXB0LWdldCB1cGRhdGUgLXFxICYmIERFQklBTl9GUk9OVEVORD1ub25pbnRlcmFjdGl2ZSBhcHQtZ2V0IGluc3RhbGwgLXkgLXFxICR7cGFja2FnZXMuam9pbihcIiBcIil9ICYmIGFwdC1nZXQgY2xlYW4gJiYgcm0gLXJmIC92YXIvbGliL2FwdC9saXN0cy8qYDtcblxuICAgICAgLy8gVGhpcyBjYW4gdGFrZSBhIHdoaWxlLCBlc3BlY2lhbGx5IGZvciB0aGUgJ2Z1bGwnIHByZXNldFxuICAgICAgLy8gTm9uLWZhdGFsOiBpZiB0aGUgaW5zdGFsbCBmYWlscyAoZS5nLiB0cmFuc2llbnQgbmV0d29yayBpc3N1ZSksIGxvZyBhbmQgY29udGludWUuXG4gICAgICAvLyBUaGUgbW9kZWwgY2FuIGluc3RhbGwgcGFja2FnZXMgbWFudWFsbHkgb25jZSB0aGUgY29udGFpbmVyIGlzIHJ1bm5pbmcuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW4oXG4gICAgICAgICAgW1wiZXhlY1wiLCBjb250YWluZXJOYW1lLCBzaGVsbCwgXCItY1wiLCBpbnN0YWxsQ21kXSxcbiAgICAgICAgICAxODBfMDAwLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoaW5zdGFsbEVycjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltsbXMtY29tcHV0ZXJdIFBhY2thZ2UgaW5zdGFsbCBmYWlsZWQgKG5vbi1mYXRhbCk6XCIsIGluc3RhbGxFcnI/Lm1lc3NhZ2UgPz8gaW5zdGFsbEVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQdWJsaWMgQVBJIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIGNvbnRhaW5lciBlbmdpbmU6IGRldGVjdCBydW50aW1lLCBjcmVhdGUgb3Igc3RhcnRcbiAqIHRoZSBjb250YWluZXIgaWYgbmVlZGVkLiBTYWZlIHRvIGNhbGwgbXVsdGlwbGUgdGltZXMgKGlkZW1wb3RlbnQpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlUmVhZHkob3B0czoge1xuICBpbWFnZTogQ29udGFpbmVySW1hZ2U7XG4gIG5ldHdvcms6IE5ldHdvcmtNb2RlO1xuICBjcHVMaW1pdDogbnVtYmVyO1xuICBtZW1vcnlMaW1pdE1COiBudW1iZXI7XG4gIGRpc2tMaW1pdE1COiBudW1iZXI7XG4gIGF1dG9JbnN0YWxsUHJlc2V0OiBzdHJpbmc7XG4gIHBvcnRGb3J3YXJkczogc3RyaW5nO1xuICBob3N0TW91bnRQYXRoOiBzdHJpbmc7XG4gIHBlcnNpc3RlbmNlTW9kZTogc3RyaW5nO1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoY29udGFpbmVyUmVhZHkpIHtcbiAgICAvLyBDb250YWluZXIgaXMgcnVubmluZyBcdTIwMTQgY3VycmVudE5ldHdvcmsgd2FzIHNldCB3aGVuIGl0IHdhcyBjcmVhdGVkIG9yIGxhc3QgaW5zcGVjdGVkLlxuICAgIC8vIElmIHRoZSBkZXNpcmVkIG5ldHdvcmsgbWF0Y2hlcywgbm90aGluZyB0byBkby5cbiAgICBjb25zdCB3YW50c05ldHdvcmsgPSBvcHRzLm5ldHdvcmsgIT09IFwibm9uZVwiO1xuICAgIGNvbnN0IGhhc05ldHdvcmsgPSBjdXJyZW50TmV0d29yayAhPT0gXCJub25lXCI7XG4gICAgaWYgKHdhbnRzTmV0d29yayA9PT0gaGFzTmV0d29yaykgcmV0dXJuO1xuXG4gICAgLy8gTmV0d29yayBtaXNtYXRjaCBvbiBhIGhvdCBjb250YWluZXIgXHUyMDE0IHRlYXIgaXQgZG93biBhbmQgbGV0IGluaXRQcm9taXNlIHJlY3JlYXRlIGl0LlxuICAgIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG4gICAgY3VycmVudE5ldHdvcmsgPSBcIm5vbmVcIjtcbiAgICB0cnkgeyBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTsgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XG4gICAgdHJ5IHsgYXdhaXQgcnVuKFtcInJtXCIsIFwiLWZcIiwgY29udGFpbmVyTmFtZV0sIDEwXzAwMCk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuICAgIC8vIEZhbGwgdGhyb3VnaCB0byBub3JtYWwgaW5pdCBiZWxvd1xuICB9XG4gIGlmIChpbml0UHJvbWlzZSkgcmV0dXJuIGluaXRQcm9taXNlO1xuXG4gIGluaXRQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAvLyBEZXRlY3QgcnVudGltZVxuICAgIHJ1bnRpbWUgPSBhd2FpdCBkZXRlY3RSdW50aW1lKCk7XG4gICAgY29udGFpbmVyTmFtZSA9IGAke0NPTlRBSU5FUl9OQU1FX1BSRUZJWH0tbWFpbmA7XG5cbiAgICAvLyBBdXRvLWNvbmZpZ3VyZSBETlMgZm9yIFBvZG1hbiByb290bGVzcyAoZml4ZXMgc3lzdGVtZC1yZXNvbHZlZCBzdHViIGlzc3VlKVxuICAgIGlmIChydW50aW1lLmtpbmQgPT09IFwicG9kbWFuXCIpIHtcbiAgICAgIGVuc3VyZVBvZG1hbkNvbmZpZygpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgZ2V0Q29udGFpbmVyU3RhdGUoKTtcblxuICAgIGlmIChzdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcbiAgICAgIC8vIFJlYWQgdGhlIGFjdHVhbCBuZXR3b3JrIG1vZGUgZnJvbSB0aGUgcnVubmluZyBjb250YWluZXIuXG4gICAgICAvLyBQb2RtYW4gcmV0dXJucyBcInNsaXJwNG5ldG5zXCIsIFwicGFzdGFcIiwgb3IgXCJwb2RtYW5cIiBmb3IgZW5hYmxlZCBuZXR3b3JrcztcbiAgICAgIC8vIERvY2tlciByZXR1cm5zIFwiYnJpZGdlXCIuIFdlIG5vcm1hbGlzZSB0byBcIm5vbmVcIiB2cyBcImVuYWJsZWRcIi5cbiAgICAgIGxldCBhY3R1YWxseUhhc05ldHdvcmsgPSBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5ldE91dCA9IGF3YWl0IHJ1bihbXCJpbnNwZWN0XCIsIGNvbnRhaW5lck5hbWUsIFwiLS1mb3JtYXRcIiwgXCJ7ey5Ib3N0Q29uZmlnLk5ldHdvcmtNb2RlfX1cIl0pO1xuICAgICAgICBjb25zdCBhY3R1YWxOZXQgPSBuZXRPdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFjdHVhbGx5SGFzTmV0d29yayA9IGFjdHVhbE5ldCAhPT0gXCJub25lXCIgJiYgYWN0dWFsTmV0ICE9PSBcIlwiO1xuICAgICAgfSBjYXRjaCB7IC8qIGFzc3VtZSBubyBuZXR3b3JrICovIH1cblxuICAgICAgY29uc3Qgd2FudHNOZXR3b3JrID0gb3B0cy5uZXR3b3JrICE9PSBcIm5vbmVcIjtcblxuICAgICAgaWYgKGFjdHVhbGx5SGFzTmV0d29yayA9PT0gd2FudHNOZXR3b3JrKSB7XG4gICAgICAgIC8vIE5ldHdvcmsgbWF0Y2hlcyBcdTIwMTQgbm90aGluZyB0byBkby5cbiAgICAgICAgY3VycmVudE5ldHdvcmsgPSB3YW50c05ldHdvcmsgPyBvcHRzLm5ldHdvcmsgOiBcIm5vbmVcIjtcbiAgICAgICAgY29udGFpbmVyUmVhZHkgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE5ldHdvcmsgbWlzbWF0Y2ggXHUyMDE0IG11c3QgcmVjcmVhdGUgdGhlIGNvbnRhaW5lci5cbiAgICAgIC8vIChQb2RtYW4gcm9vdGxlc3MgY2FuJ3QgY2hhbmdlIG5ldHdvcmsgb24gYSBydW5uaW5nIGNvbnRhaW5lcjtcbiAgICAgIC8vICBEb2NrZXIgY291bGQgdXNlIG5ldHdvcmsgY29ubmVjdC9kaXNjb25uZWN0IGJ1dCByZWNyZWF0aW5nIGlzIHNpbXBsZXIgYW5kIHJlbGlhYmxlLilcbiAgICAgIGNvbnNvbGUubG9nKGBbbG1zLWNvbXB1dGVyXSBOZXR3b3JrIG1pc21hdGNoIChjb250YWluZXIgaGFzICR7YWN0dWFsbHlIYXNOZXR3b3JrID8gXCJpbnRlcm5ldFwiIDogXCJubyBpbnRlcm5ldFwifSwgc2V0dGluZ3Mgd2FudCAke3dhbnRzTmV0d29yayA/IFwiaW50ZXJuZXRcIiA6IFwibm8gaW50ZXJuZXRcIn0pIFx1MjAxNCByZWNyZWF0aW5nIGNvbnRhaW5lci5gKTtcbiAgICAgIHRyeSB7IGF3YWl0IHJ1bihbXCJzdG9wXCIsIGNvbnRhaW5lck5hbWVdLCAxNV8wMDApOyB9IGNhdGNoIHsgLyogYWxyZWFkeSBzdG9wcGVkICovIH1cbiAgICAgIHRyeSB7IGF3YWl0IHJ1bihbXCJybVwiLCBcIi1mXCIsIGNvbnRhaW5lck5hbWVdLCAxMF8wMDApOyB9IGNhdGNoIHsgLyogYWxyZWFkeSBnb25lICovIH1cbiAgICAgIC8vIEZhbGwgdGhyb3VnaCB0byBjb250YWluZXIgY3JlYXRpb24gYmVsb3dcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUgPT09IFwic3RvcHBlZFwiKSB7XG4gICAgICAvLyBTdGFydCBleGlzdGluZyBzdG9wcGVkIGNvbnRhaW5lci5cbiAgICAgIC8vIElmIGl0IGZhaWxzIChlLmcuIGEgcHJldmlvdXMgY3JlYXRpb24gYXR0ZW1wdCBsZWZ0IGEgYnJva2VuIGNvbnRhaW5lclxuICAgICAgLy8gd2hvc2Ugd29ya2RpciB3YXMgbmV2ZXIgY3JlYXRlZCksIHJlbW92ZSBpdCBhbmQgZmFsbCB0aHJvdWdoIHRvIHJlY3JlYXRlLlxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuKFtcInN0YXJ0XCIsIGNvbnRhaW5lck5hbWVdKTtcbiAgICAgICAgY29udGFpbmVyUmVhZHkgPSB0cnVlO1xuICAgICAgICAvLyBXZSBkb24ndCBrbm93IHdoYXQgbmV0d29yayBpdCB3YXMgc3RhcnRlZCB3aXRoIFx1MjAxNCBsZWF2ZSBjdXJyZW50TmV0d29yayBhcy1pc1xuICAgICAgICAvLyBhbmQgbGV0IHRoZSBuZXR3b3JrLXN5bmMgbG9naWMgYmVsb3cgaGFuZGxlIGFueSBtaXNtYXRjaC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgY29uc3QgbXNnOiBzdHJpbmcgPSBlcnI/Lm1lc3NhZ2UgPz8gXCJcIjtcbiAgICAgICAgaWYgKG1zZy5pbmNsdWRlcyhcIndvcmtkaXJcIikgfHwgbXNnLmluY2x1ZGVzKFwiZG9lcyBub3QgZXhpc3RcIikgfHwgbXNnLmluY2x1ZGVzKFwibmV0bnNcIikgfHwgbXNnLmluY2x1ZGVzKFwibW91bnQgcnVudGltZVwiKSkge1xuICAgICAgICAgIC8vIEJyb2tlbiBjb250YWluZXIgXHUyMDE0IHJlbW92ZSBpdCBhbmQgcmVjcmVhdGUgY2xlYW5seSBiZWxvd1xuICAgICAgICAgIHRyeSB7IGF3YWl0IHJ1bihbXCJybVwiLCBcIi1mXCIsIGNvbnRhaW5lck5hbWVdLCAxMF8wMDApOyB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb250YWluZXIgbm90IGZvdW5kIFx1MjAxNCBwdWxsIGltYWdlIGFuZCBjcmVhdGVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnVuKFtcInB1bGxcIiwgb3B0cy5pbWFnZV0sIDMwMF8wMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSW1hZ2UgbWlnaHQgYWxyZWFkeSBleGlzdCBsb2NhbGx5LCBjb250aW51ZVxuICAgIH1cblxuICAgIGNvbnN0IHBvcnRGb3J3YXJkcyA9IG9wdHMucG9ydEZvcndhcmRzXG4gICAgICA/IG9wdHMucG9ydEZvcndhcmRzLnNwbGl0KFwiLFwiKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pXG4gICAgICA6IFtdO1xuXG4gICAgLy8gUGljayBzZXR1cCBuZXR3b3JrIGJhc2VkIG9uIHJ1bnRpbWUgYW5kIHVzZXIgcHJlZmVyZW5jZTpcbiAgICAvLyAtIERvY2tlcjogXCJicmlkZ2VcIiBhbHdheXMgd29ya3MgZmluZVxuICAgIC8vIC0gUG9kbWFuICsgaW50ZXJuZXQgZW5hYmxlZDogb21pdCAtLW5ldHdvcmsgZmxhZyAoXCJwb2RtYW4tZGVmYXVsdFwiKSBzb1xuICAgIC8vICAgUG9kbWFuIHVzZXMgaXRzIG93biBkZWZhdWx0IHdpdGggcHJvcGVyIEROUyAocmVzcGVjdHMgY29udGFpbmVycy5jb25mKVxuICAgIC8vIC0gUG9kbWFuICsgaW50ZXJuZXQgZGlzYWJsZWQ6IFwibm9uZVwiIFx1MjAxNCBubyBuZXR3b3JrIG5lZWRlZCwgc2tpcCBwYWNrYWdlc1xuICAgIGxldCBzZXR1cE5ldHdvcms6IE5ldHdvcmtNb2RlIHwgXCJwb2RtYW4tZGVmYXVsdFwiID0gXCJub25lXCI7XG4gICAgaWYgKHJ1bnRpbWU/LmtpbmQgPT09IFwiZG9ja2VyXCIpIHtcbiAgICAgIHNldHVwTmV0d29yayA9IG9wdHMubmV0d29yayA9PT0gXCJub25lXCIgPyBcIm5vbmVcIiA6IFwiYnJpZGdlXCI7XG4gICAgfSBlbHNlIGlmIChydW50aW1lPy5raW5kID09PSBcInBvZG1hblwiICYmIG9wdHMubmV0d29yayAhPT0gXCJub25lXCIpIHtcbiAgICAgIHNldHVwTmV0d29yayA9IFwicG9kbWFuLWRlZmF1bHRcIjtcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlQXJncyA9IGJ1aWxkUnVuQXJncyh7XG4gICAgICBpbWFnZTogb3B0cy5pbWFnZSxcbiAgICAgIG5hbWU6IGNvbnRhaW5lck5hbWUsXG4gICAgICBuZXR3b3JrOiBzZXR1cE5ldHdvcmssXG4gICAgICBjcHVMaW1pdDogb3B0cy5jcHVMaW1pdCxcbiAgICAgIG1lbW9yeUxpbWl0TUI6IG9wdHMubWVtb3J5TGltaXRNQixcbiAgICAgIGRpc2tMaW1pdE1COiBvcHRzLmRpc2tMaW1pdE1CLFxuICAgICAgd29ya2RpcjogQ09OVEFJTkVSX1dPUktESVIsXG4gICAgICBlbnZWYXJzOiBDT05UQUlORVJfRU5WX1ZBUlMsXG4gICAgICBwb3J0Rm9yd2FyZHMsXG4gICAgICBob3N0TW91bnRQYXRoOiBvcHRzLmhvc3RNb3VudFBhdGggfHwgbnVsbCxcbiAgICB9KTtcblxuICAgIC8vIFRyeSB3aXRoIGRpc2sgcXVvdGEgZmlyc3Q7IGZhbGwgYmFjayB3aXRob3V0IGl0IGlmIHRoZSBzdG9yYWdlIGRyaXZlclxuICAgIC8vIGRvZXNuJ3Qgc3VwcG9ydCBpdCAoZS5nLiBleHQ0IG9ubHkgc3VwcG9ydHMgc2l6ZT0gb24gWEZTKS5cbiAgICBjb25zdCBkaXNrT3B0QXJncyA9IFsuLi5jcmVhdGVBcmdzXTtcbiAgICBpZiAob3B0cy5kaXNrTGltaXRNQiA+IDApIHtcbiAgICAgIGRpc2tPcHRBcmdzLnNwbGljZShkaXNrT3B0QXJncy5pbmRleE9mKG9wdHMuaW1hZ2UpLCAwLCBcIi0tc3RvcmFnZS1vcHRcIiwgYHNpemU9JHtvcHRzLmRpc2tMaW1pdE1CfW1gKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJ1bihkaXNrT3B0QXJncywgNjBfMDAwKTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgY29uc3QgbXNnOiBzdHJpbmcgPSBlcnI/Lm1lc3NhZ2UgPz8gXCJcIjtcbiAgICAgIGlmIChtc2cuaW5jbHVkZXMoXCJzdG9yYWdlLW9wdFwiKSB8fCBtc2cuaW5jbHVkZXMoXCJiYWNraW5nRlNcIikgfHwgbXNnLmluY2x1ZGVzKFwib3ZlcmxheS5zaXplXCIpKSB7XG4gICAgICAgIC8vIFN0b3JhZ2UgZHJpdmVyIGRvZXNuJ3Qgc3VwcG9ydCBxdW90YXMgXHUyMDE0IHJldHJ5IHdpdGhvdXQgdGhlIGZsYWdcbiAgICAgICAgY29uc29sZS53YXJuKFwiW2xtcy1jb21wdXRlcl0gRGlzayBxdW90YSBub3Qgc3VwcG9ydGVkIGJ5IHN0b3JhZ2UgZHJpdmVyLCBzdGFydGluZyB3aXRob3V0IHNpemUgbGltaXQuXCIpO1xuICAgICAgICBhd2FpdCBydW4oY3JlYXRlQXJncywgNjBfMDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXR1cDogY3JlYXRlIHVzZXIsIGluc3RhbGwgcGFja2FnZXMgKHNraXBwZWQgaWYgbm8gbmV0d29yaylcbiAgICBjb25zdCBoYXNOZXR3b3JrRm9yU2V0dXAgPSBzZXR1cE5ldHdvcmsgIT09IFwibm9uZVwiO1xuICAgIGF3YWl0IHNldHVwQ29udGFpbmVyKG9wdHMuaW1hZ2UsIG9wdHMuYXV0b0luc3RhbGxQcmVzZXQsIGhhc05ldHdvcmtGb3JTZXR1cCk7XG5cbiAgICAvLyBJZiB0aGUgdXNlciB3YW50cyBubyBuZXR3b3JrIGFjY2VzcywgZGlzY29ubmVjdCBub3cgdGhhdCBzZXR1cCBpcyBkb25lLlxuICAgIC8vIE9ubHkgZGlzY29ubmVjdCBpZiB3ZSBhY3R1YWxseSBjb25uZWN0ZWQgc29tZXRoaW5nIGR1cmluZyBzZXR1cC5cbiAgICBpZiAob3B0cy5uZXR3b3JrID09PSBcIm5vbmVcIiAmJiBzZXR1cE5ldHdvcmsgIT09IFwibm9uZVwiKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW4oW1wibmV0d29ya1wiLCBcImRpc2Nvbm5lY3RcIiwgc2V0dXBOZXR3b3JrLCBjb250YWluZXJOYW1lXSwgMTBfMDAwKTtcbiAgICAgIH0gY2F0Y2ggeyAvKiBiZXN0IGVmZm9ydCBcdTIwMTQgY29udGFpbmVyIHN0aWxsIHdvcmtzLCBqdXN0IGhhcyBuZXR3b3JrICovIH1cbiAgICB9XG5cbiAgICBjdXJyZW50TmV0d29yayA9IHNldHVwTmV0d29yayAhPT0gXCJub25lXCIgPyBvcHRzLm5ldHdvcmsgOiBcIm5vbmVcIjtcbiAgICBjb250YWluZXJSZWFkeSA9IHRydWU7XG4gIH0pKCk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBpbml0UHJvbWlzZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpbml0UHJvbWlzZSA9IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgY29tbWFuZCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWMoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgdGltZW91dFNlY29uZHM6IG51bWJlcixcbiAgbWF4T3V0cHV0Qnl0ZXM6IG51bWJlciA9IERFRkFVTFRfTUFYX09VVFBVVF9CWVRFUyxcbiAgd29ya2Rpcj86IHN0cmluZyxcbik6IFByb21pc2U8RXhlY1Jlc3VsdD4ge1xuICBpZiAoIXJ1bnRpbWUgfHwgIWNvbnRhaW5lclJlYWR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIG5vdCByZWFkeS4gQ2FsbCBlbnN1cmVSZWFkeSgpIGZpcnN0LlwiKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgY3dkID0gd29ya2RpciA/PyBDT05UQUlORVJfV09SS0RJUjtcbiAgY29uc3Qgc2hlbGwgPSBjb250YWluZXJOYW1lLmluY2x1ZGVzKFwiYWxwaW5lXCIpID8gQ09OVEFJTkVSX1NIRUxMX0FMUElORSA6IENPTlRBSU5FUl9TSEVMTDtcblxuICByZXR1cm4gbmV3IFByb21pc2U8RXhlY1Jlc3VsdD4oKHJlc29sdmUpID0+IHtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgXCJleGVjXCIsIFwiLXdcIiwgY3dkLFxuICAgICAgY29udGFpbmVyTmFtZSxcbiAgICAgIHNoZWxsLCBcIi1jXCIsIGNvbW1hbmQsXG4gICAgXTtcblxuICAgIGxldCBzdGRvdXQgPSBcIlwiO1xuICAgIGxldCBzdGRlcnIgPSBcIlwiO1xuICAgIGxldCB0aW1lZE91dCA9IGZhbHNlO1xuICAgIGxldCBraWxsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihydW50aW1lIS5wYXRoLCBhcmdzLCB7XG4gICAgICB0aW1lb3V0OiB0aW1lb3V0U2Vjb25kcyAqIDEwMDAsXG4gICAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gICAgICBlbnY6IGdldFJ1bnRpbWVFbnYoKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGVmZmVjdGl2ZU1heCA9IE1hdGgubWluKG1heE91dHB1dEJ5dGVzLCBNQVhfT1VUUFVUX0JZVEVTKTtcblxuICAgIHByb2Muc3Rkb3V0Py5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIGlmIChzdGRvdXQubGVuZ3RoIDwgZWZmZWN0aXZlTWF4KSB7XG4gICAgICAgIHN0ZG91dCArPSBjaHVuay50b1N0cmluZyhcInV0Zi04XCIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHJvYy5zdGRlcnI/Lm9uKFwiZGF0YVwiLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgaWYgKHN0ZGVyci5sZW5ndGggPCBlZmZlY3RpdmVNYXgpIHtcbiAgICAgICAgc3RkZXJyICs9IGNodW5rLnRvU3RyaW5nKFwidXRmLThcIik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgdGltZW91dFxuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgICBraWxsZWQgPSB0cnVlO1xuICAgICAgcHJvYy5raWxsKFwiU0lHS0lMTFwiKTtcbiAgICB9LCB0aW1lb3V0U2Vjb25kcyAqIDEwMDAgKyA1MDApO1xuXG4gICAgcHJvYy5vbihcImNsb3NlXCIsIChjb2RlKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgY29uc3QgZHVyYXRpb25NcyA9IERhdGUubm93KCkgLSBzdGFydDtcblxuICAgICAgY29uc3Qgc3Rkb3V0VHJ1bmNhdGVkID0gc3Rkb3V0Lmxlbmd0aCA+PSBlZmZlY3RpdmVNYXg7XG4gICAgICBjb25zdCBzdGRlcnJUcnVuY2F0ZWQgPSBzdGRlcnIubGVuZ3RoID49IGVmZmVjdGl2ZU1heDtcblxuICAgICAgcmVzb2x2ZSh7XG4gICAgICAgIGV4aXRDb2RlOiBjb2RlID8/IChraWxsZWQgPyAxMzcgOiAxKSxcbiAgICAgICAgc3Rkb3V0OiBzdGRvdXQuc2xpY2UoMCwgZWZmZWN0aXZlTWF4KSxcbiAgICAgICAgc3RkZXJyOiBzdGRlcnIuc2xpY2UoMCwgZWZmZWN0aXZlTWF4KSxcbiAgICAgICAgdGltZWRPdXQsXG4gICAgICAgIGR1cmF0aW9uTXMsXG4gICAgICAgIHRydW5jYXRlZDogc3Rkb3V0VHJ1bmNhdGVkIHx8IHN0ZGVyclRydW5jYXRlZCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcHJvYy5vbihcImVycm9yXCIsIChlcnIpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgZXhpdENvZGU6IDEsXG4gICAgICAgIHN0ZG91dDogXCJcIixcbiAgICAgICAgc3RkZXJyOiBlcnIubWVzc2FnZSxcbiAgICAgICAgdGltZWRPdXQ6IGZhbHNlLFxuICAgICAgICBkdXJhdGlvbk1zOiBEYXRlLm5vdygpIC0gc3RhcnQsXG4gICAgICAgIHRydW5jYXRlZDogZmFsc2UsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogV3JpdGUgYSBmaWxlIGluc2lkZSB0aGUgY29udGFpbmVyIHVzaW5nIHN0ZGluIHBpcGluZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlRmlsZShcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgY29udGVudDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSB8fCAhY29udGFpbmVyUmVhZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXIgbm90IHJlYWR5LlwiKTtcbiAgfVxuXG4gIC8vIFVzZSBkb2NrZXIgZXhlYyB3aXRoIHN0ZGluIHRvIHdyaXRlIGZpbGUgY29udGVudFxuICAvLyBUaGlzIGF2b2lkcyBzaGVsbCBlc2NhcGluZyBpc3N1ZXNcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBzaGVsbCA9IGNvbnRhaW5lck5hbWUuaW5jbHVkZXMoXCJhbHBpbmVcIikgPyBDT05UQUlORVJfU0hFTExfQUxQSU5FIDogQ09OVEFJTkVSX1NIRUxMO1xuICAgIGNvbnN0IHByb2MgPSBzcGF3bihydW50aW1lIS5wYXRoLCBbXG4gICAgICBcImV4ZWNcIiwgXCItaVwiLFxuICAgICAgY29udGFpbmVyTmFtZSxcbiAgICAgIHNoZWxsLCBcIi1jXCIsIGBjYXQgPiAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYCxcbiAgICBdLCB7XG4gICAgICB0aW1lb3V0OiAxNV8wMDAsXG4gICAgICBzdGRpbzogW1wicGlwZVwiLCBcImlnbm9yZVwiLCBcInBpcGVcIl0sXG4gICAgICBlbnY6IGdldFJ1bnRpbWVFbnYoKSxcbiAgICB9KTtcblxuICAgIGxldCBzdGRlcnIgPSBcIlwiO1xuICAgIHByb2Muc3RkZXJyPy5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHsgc3RkZXJyICs9IGNodW5rLnRvU3RyaW5nKCk7IH0pO1xuXG4gICAgcHJvYy5vbihcImNsb3NlXCIsIChjb2RlKSA9PiB7XG4gICAgICBpZiAoY29kZSA9PT0gMCkgcmVzb2x2ZSgpO1xuICAgICAgZWxzZSByZWplY3QobmV3IEVycm9yKGBXcml0ZSBmYWlsZWQgKGV4aXQgJHtjb2RlfSk6ICR7c3RkZXJyfWApKTtcbiAgICB9KTtcblxuICAgIHByb2Mub24oXCJlcnJvclwiLCByZWplY3QpO1xuXG4gICAgcHJvYy5zdGRpbj8ud3JpdGUoY29udGVudCk7XG4gICAgcHJvYy5zdGRpbj8uZW5kKCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFJlYWQgYSBmaWxlIGZyb20gdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRGaWxlKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBtYXhCeXRlczogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKCFydW50aW1lIHx8ICFjb250YWluZXJSZWFkeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRhaW5lciBub3QgcmVhZHkuXCIpO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhgY2F0ICcke2ZpbGVQYXRoLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgLCAxMCwgbWF4Qnl0ZXMpO1xuICBpZiAocmVzdWx0LmV4aXRDb2RlICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBSZWFkIGZhaWxlZDogJHtyZXN1bHQuc3RkZXJyIHx8IFwiZmlsZSBub3QgZm91bmRcIn1gKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0LnN0ZG91dDtcbn1cblxuLyoqXG4gKiBDb3B5IGEgZmlsZSBmcm9tIHRoZSBob3N0IGludG8gdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvcHlUb0NvbnRhaW5lcihcbiAgaG9zdFBhdGg6IHN0cmluZyxcbiAgY29udGFpbmVyUGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWQuXCIpO1xuICBhd2FpdCBydW4oW1wiY3BcIiwgaG9zdFBhdGgsIGAke2NvbnRhaW5lck5hbWV9OiR7Y29udGFpbmVyUGF0aH1gXSwgNjBfMDAwKTtcbn1cblxuLyoqXG4gKiBDb3B5IGEgZmlsZSBmcm9tIHRoZSBjb250YWluZXIgdG8gdGhlIGhvc3QuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5RnJvbUNvbnRhaW5lcihcbiAgY29udGFpbmVyUGF0aDogc3RyaW5nLFxuICBob3N0UGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghcnVudGltZSkgdGhyb3cgbmV3IEVycm9yKFwiUnVudGltZSBub3QgaW5pdGlhbGl6ZWQuXCIpO1xuICBhd2FpdCBydW4oW1wiY3BcIiwgYCR7Y29udGFpbmVyTmFtZX06JHtjb250YWluZXJQYXRofWAsIGhvc3RQYXRoXSwgNjBfMDAwKTtcbn1cblxuLyoqXG4gKiBHZXQgZW52aXJvbm1lbnQgaW5mbyBmcm9tIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RW52aXJvbm1lbnRJbmZvKG5ldHdvcms6IGJvb2xlYW4sIGRpc2tMaW1pdE1COiBudW1iZXIgPSAwKTogUHJvbWlzZTxFbnZpcm9ubWVudEluZm8+IHtcbiAgY29uc3QgaW5mb1NjcmlwdCA9IGBcbmVjaG8gXCJPUz0kKGNhdCAvZXRjL29zLXJlbGVhc2UgMj4vZGV2L251bGwgfCBncmVwIFBSRVRUWV9OQU1FIHwgY3V0IC1kPSAtZjIgfCB0ciAtZCAnXCInKVwiXG5lY2hvIFwiS0VSTkVMPSQodW5hbWUgLXIpXCJcbmVjaG8gXCJBUkNIPSQodW5hbWUgLW0pXCJcbmVjaG8gXCJIT1NUTkFNRT0kKGhvc3RuYW1lKVwiXG5lY2hvIFwiVVBUSU1FPSQodXB0aW1lIC1wIDI+L2Rldi9udWxsIHx8IHVwdGltZSlcIlxuRElTS19VU0VEX0tCPSQoZHUgLXNrICR7Q09OVEFJTkVSX1dPUktESVJ9IDI+L2Rldi9udWxsIHwgYXdrICd7cHJpbnQgJDF9JyB8fCBlY2hvIDApXG5lY2hvIFwiRElTS19VU0VEX0tCPVxcJERJU0tfVVNFRF9LQlwiXG5lY2hvIFwiRElTS19GUkVFX1JBVz0kKGRmIC1rICR7Q09OVEFJTkVSX1dPUktESVJ9IDI+L2Rldi9udWxsIHwgdGFpbCAtMSB8IGF3ayAne3ByaW50ICQ0fScpXCJcbk1FTV9MSU1JVF9CWVRFUz1cXCQoY2F0IC9zeXMvZnMvY2dyb3VwL21lbW9yeS5tYXggMj4vZGV2L251bGwgfHwgY2F0IC9zeXMvZnMvY2dyb3VwL21lbW9yeS9tZW1vcnkubGltaXRfaW5fYnl0ZXMgMj4vZGV2L251bGwgfHwgZWNobyAnJylcbk1FTV9VU0FHRV9CWVRFUz1cXCQoY2F0IC9zeXMvZnMvY2dyb3VwL21lbW9yeS5jdXJyZW50IDI+L2Rldi9udWxsIHx8IGNhdCAvc3lzL2ZzL2Nncm91cC9tZW1vcnkvbWVtb3J5LnVzYWdlX2luX2J5dGVzIDI+L2Rldi9udWxsIHx8IGVjaG8gJycpXG5pZiBbIC1uIFwiXFwkTUVNX0xJTUlUX0JZVEVTXCIgXSAmJiBbIFwiXFwkTUVNX0xJTUlUX0JZVEVTXCIgIT0gXCJtYXhcIiBdICYmIFsgXCJcXCRNRU1fTElNSVRfQllURVNcIiAtbHQgOTAwMDAwMDAwMDAwMCBdIDI+L2Rldi9udWxsOyB0aGVuXG4gIE1FTV9UT1RBTF9IPVxcJChhd2sgXCJCRUdJTntwcmludGYgXFxcIiUuMGZNaUJcXFwiLCBcXCRNRU1fTElNSVRfQllURVMvMTA0ODU3Nn1cIilcbiAgTUVNX1VTRURfSD1cXCQoYXdrIFwiQkVHSU57cHJpbnRmIFxcXCIlLjBmTWlCXFxcIiwgXFwke01FTV9VU0FHRV9CWVRFUzotMH0vMTA0ODU3Nn1cIilcbiAgTUVNX0ZSRUVfSD1cXCQoYXdrIFwiQkVHSU57cHJpbnRmIFxcXCIlLjBmTWlCXFxcIiwgKFxcJE1FTV9MSU1JVF9CWVRFUy1cXCR7TUVNX1VTQUdFX0JZVEVTOi0wfSkvMTA0ODU3Nn1cIilcbmVsc2VcbiAgTUVNX1RPVEFMX0g9XFwkKGZyZWUgLWggMj4vZGV2L251bGwgfCBncmVwIE1lbSB8IGF3ayAne3ByaW50IFxcJDJ9JyB8fCBlY2hvICdOL0EnKVxuICBNRU1fVVNFRF9IPVxcJChmcmVlIC1oIDI+L2Rldi9udWxsIHwgZ3JlcCBNZW0gfCBhd2sgJ3twcmludCBcXCQzfScgfHwgZWNobyAnTi9BJylcbiAgTUVNX0ZSRUVfSD1cXCQoZnJlZSAtaCAyPi9kZXYvbnVsbCB8IGdyZXAgTWVtIHwgYXdrICd7cHJpbnQgXFwkNH0nIHx8IGVjaG8gJ04vQScpXG5maVxuZWNobyBcIk1FTV9GUkVFPVxcJE1FTV9GUkVFX0hcIlxuZWNobyBcIk1FTV9UT1RBTD1cXCRNRU1fVE9UQUxfSFwiXG5lY2hvIFwiUFlUSE9OPSQocHl0aG9uMyAtLXZlcnNpb24gMj4vZGV2L251bGwgfHwgZWNobyAnJylcIlxuZWNobyBcIk5PREU9JChub2RlIC0tdmVyc2lvbiAyPi9kZXYvbnVsbCB8fCBlY2hvICcnKVwiXG5lY2hvIFwiR0NDPSQoZ2NjIC0tdmVyc2lvbiAyPi9kZXYvbnVsbCB8IGhlYWQgLTEgfHwgZWNobyAnJylcIlxuZWNobyBcIlRPT0xTPSQod2hpY2ggZ2l0IGN1cmwgd2dldCB2aW0gbmFubyBweXRob24zIG5vZGUgbnBtIGdjYyBtYWtlIGNtYWtlIHBpcDMgMj4vZGV2L251bGwgfCB4YXJncyAtSXt9IGJhc2VuYW1lIHt9IHwgdHIgJ1xcXFxuJyAnLCcpXCJcbiAgYC50cmltKCk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhpbmZvU2NyaXB0LCAxMCk7XG4gIGNvbnN0IGxpbmVzID0gcmVzdWx0LnN0ZG91dC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgZ2V0ID0gKHByZWZpeDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBsaW5lID0gbGluZXMuZmluZChsID0+IGwuc3RhcnRzV2l0aChwcmVmaXggKyBcIj1cIikpO1xuICAgIHJldHVybiBsaW5lPy5zbGljZShwcmVmaXgubGVuZ3RoICsgMSk/LnRyaW0oKSA/PyBcIk4vQVwiO1xuICB9O1xuXG4gIC8vIENvbXB1dGUgZGlzayB2YWx1ZXM6IGlmIGEgbGltaXQgaXMgY29uZmlndXJlZCwgcmVwb3J0IGFnYWluc3QgaXQuXG4gIC8vIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gcmF3IGZpbGVzeXN0ZW0gdmFsdWVzLlxuICBjb25zdCBkaXNrVXNlZEtCID0gcGFyc2VJbnQoZ2V0KFwiRElTS19VU0VEX0tCXCIpIHx8IFwiMFwiLCAxMCk7XG4gIGNvbnN0IGRpc2tGcmVlUmF3S0IgPSBwYXJzZUludChnZXQoXCJESVNLX0ZSRUVfUkFXXCIpIHx8IFwiMFwiLCAxMCk7XG4gIGxldCBkaXNrVG90YWw6IHN0cmluZztcbiAgbGV0IGRpc2tGcmVlOiBzdHJpbmc7XG4gIGlmIChkaXNrTGltaXRNQiA+IDApIHtcbiAgICBjb25zdCBkaXNrTGltaXRLQiA9IGRpc2tMaW1pdE1CICogMTAyNDtcbiAgICBjb25zdCBkaXNrRnJlZUtCID0gTWF0aC5tYXgoMCwgZGlza0xpbWl0S0IgLSBkaXNrVXNlZEtCKTtcbiAgICBjb25zdCB0b01pQiA9IChrYjogbnVtYmVyKSA9PiBrYiA+PSAxMDI0ICogMTAyNFxuICAgICAgPyBgJHsoa2IgLyAxMDI0IC8gMTAyNCkudG9GaXhlZCgxKX1HaUJgXG4gICAgICA6IGAke01hdGgucm91bmQoa2IgLyAxMDI0KX1NaUJgO1xuICAgIGRpc2tUb3RhbCA9IHRvTWlCKGRpc2tMaW1pdEtCKTtcbiAgICBkaXNrRnJlZSA9IHRvTWlCKGRpc2tGcmVlS0IpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRvTWlCID0gKGtiOiBudW1iZXIpID0+IGtiID49IDEwMjQgKiAxMDI0XG4gICAgICA/IGAkeyhrYiAvIDEwMjQgLyAxMDI0KS50b0ZpeGVkKDEpfUdpQmBcbiAgICAgIDogYCR7TWF0aC5yb3VuZChrYiAvIDEwMjQpfU1pQmA7XG4gICAgZGlza0ZyZWUgPSB0b01pQihkaXNrRnJlZVJhd0tCKTtcbiAgICBkaXNrVG90YWwgPSBcIk4vQVwiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvczogZ2V0KFwiT1NcIiksXG4gICAga2VybmVsOiBnZXQoXCJLRVJORUxcIiksXG4gICAgYXJjaDogZ2V0KFwiQVJDSFwiKSxcbiAgICBob3N0bmFtZTogZ2V0KFwiSE9TVE5BTUVcIiksXG4gICAgdXB0aW1lOiBnZXQoXCJVUFRJTUVcIiksXG4gICAgZGlza0ZyZWUsXG4gICAgZGlza1RvdGFsLFxuICAgIG1lbW9yeUZyZWU6IGdldChcIk1FTV9GUkVFXCIpLFxuICAgIG1lbW9yeVRvdGFsOiBnZXQoXCJNRU1fVE9UQUxcIiksXG4gICAgcHl0aG9uVmVyc2lvbjogZ2V0KFwiUFlUSE9OXCIpIHx8IG51bGwsXG4gICAgbm9kZVZlcnNpb246IGdldChcIk5PREVcIikgfHwgbnVsbCxcbiAgICBnY2NWZXJzaW9uOiBnZXQoXCJHQ0NcIikgfHwgbnVsbCxcbiAgICBpbnN0YWxsZWRUb29sczogZ2V0KFwiVE9PTFNcIikuc3BsaXQoXCIsXCIpLmZpbHRlcihCb29sZWFuKSxcbiAgICB3b3JrZGlyOiBDT05UQUlORVJfV09SS0RJUixcbiAgICBuZXR3b3JrRW5hYmxlZDogbmV0d29yayxcbiAgfTtcbn1cblxuLyoqXG4gKiBMaXN0IHByb2Nlc3NlcyBydW5uaW5nIGluc2lkZSB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdFByb2Nlc3NlcygpOiBQcm9taXNlPFByb2Nlc3NJbmZvW10+IHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhlYyhcbiAgICBcInBzIGF1eCAtLW5vLWhlYWRlcnMgMj4vZGV2L251bGwgfHwgcHMgYXV4IDI+L2Rldi9udWxsXCIsXG4gICAgNSxcbiAgKTtcblxuICBpZiAocmVzdWx0LmV4aXRDb2RlICE9PSAwKSByZXR1cm4gW107XG5cbiAgcmV0dXJuIHJlc3VsdC5zdGRvdXRcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAuZmlsdGVyKGxpbmUgPT4gbGluZS50cmltKCkgJiYgIWxpbmUuaW5jbHVkZXMoXCJwcyBhdXhcIikpXG4gICAgLm1hcChsaW5lID0+IHtcbiAgICAgIGNvbnN0IHBhcnRzID0gbGluZS50cmltKCkuc3BsaXQoL1xccysvKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpZDogcGFyc2VJbnQocGFydHNbMV0gPz8gXCIwXCIsIDEwKSxcbiAgICAgICAgdXNlcjogcGFydHNbMF0gPz8gXCI/XCIsXG4gICAgICAgIGNwdTogcGFydHNbMl0gPz8gXCIwXCIsXG4gICAgICAgIG1lbW9yeTogcGFydHNbM10gPz8gXCIwXCIsXG4gICAgICAgIHN0YXJ0ZWQ6IHBhcnRzWzhdID8/IFwiP1wiLFxuICAgICAgICBjb21tYW5kOiBwYXJ0cy5zbGljZSgxMCkuam9pbihcIiBcIikgfHwgcGFydHMuc2xpY2UoMykuam9pbihcIiBcIiksXG4gICAgICB9O1xuICAgIH0pXG4gICAgLmZpbHRlcihwID0+IHAucGlkID4gMCk7XG59XG5cbi8qKlxuICogS2lsbCBhIHByb2Nlc3MgaW5zaWRlIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBraWxsUHJvY2VzcyhwaWQ6IG51bWJlciwgc2lnbmFsOiBzdHJpbmcgPSBcIlNJR1RFUk1cIik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjKGBraWxsIC0ke3NpZ25hbH0gJHtwaWR9YCwgNSk7XG4gIHJldHVybiByZXN1bHQuZXhpdENvZGUgPT09IDA7XG59XG5cbi8qKlxuICogU3RvcCBhbmQgb3B0aW9uYWxseSByZW1vdmUgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3BDb250YWluZXIocmVtb3ZlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFydW50aW1lKSByZXR1cm47XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBydW4oW1wic3RvcFwiLCBjb250YWluZXJOYW1lXSwgMTVfMDAwKTtcbiAgfSBjYXRjaCB7IC8qIGFscmVhZHkgc3RvcHBlZCAqLyB9XG5cbiAgaWYgKHJlbW92ZSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBydW4oW1wicm1cIiwgXCItZlwiLCBjb250YWluZXJOYW1lXSwgMTBfMDAwKTtcbiAgICB9IGNhdGNoIHsgLyogYWxyZWFkeSByZW1vdmVkICovIH1cbiAgfVxuXG4gIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG59XG5cbi8qKlxuICogRGVzdHJveSB0aGUgY29udGFpbmVyIGFuZCBhbGwgaXRzIGRhdGEuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXN0cm95Q29udGFpbmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBzdG9wQ29udGFpbmVyKHRydWUpO1xuICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xuICBjdXJyZW50TmV0d29yayA9IFwibm9uZVwiO1xuICBpbml0UHJvbWlzZSA9IG51bGw7XG59XG5cbi8qKlxuICogR2V0IGRldGFpbGVkIGNvbnRhaW5lciBpbmZvLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29udGFpbmVySW5mbygpOiBQcm9taXNlPENvbnRhaW5lckluZm8+IHtcbiAgaWYgKCFydW50aW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJSdW50aW1lIG5vdCBpbml0aWFsaXplZC5cIik7XG5cbiAgY29uc3Qgc3RhdGUgPSBhd2FpdCBnZXRDb250YWluZXJTdGF0ZSgpO1xuXG4gIGlmIChzdGF0ZSA9PT0gXCJub3RfZm91bmRcIikge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogXCJcIixcbiAgICAgIG5hbWU6IGNvbnRhaW5lck5hbWUsXG4gICAgICBzdGF0ZTogXCJub3RfZm91bmRcIixcbiAgICAgIGltYWdlOiBcIlwiLFxuICAgICAgY3JlYXRlZDogXCJcIixcbiAgICAgIHVwdGltZTogbnVsbCxcbiAgICAgIGNwdVVzYWdlOiBudWxsLFxuICAgICAgbWVtb3J5VXNhZ2U6IG51bGwsXG4gICAgICBkaXNrVXNhZ2U6IG51bGwsXG4gICAgICBuZXR3b3JrTW9kZTogXCJcIixcbiAgICAgIHBvcnRzOiBbXSxcbiAgICB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBmb3JtYXQgPSAne3suSWR9fVxcdHt7LkNvbmZpZy5JbWFnZX19XFx0e3suQ3JlYXRlZH19XFx0e3suU3RhdGUuU3RhdHVzfX1cXHR7ey5Ib3N0Q29uZmlnLk5ldHdvcmtNb2RlfX0nO1xuICAgIGNvbnN0IG91dCA9IGF3YWl0IHJ1bihbXCJpbnNwZWN0XCIsIGNvbnRhaW5lck5hbWUsIFwiLS1mb3JtYXRcIiwgZm9ybWF0XSk7XG4gICAgY29uc3QgW2lkLCBpbWFnZSwgY3JlYXRlZCwgLCBuZXR3b3JrTW9kZV0gPSBvdXQuc3BsaXQoXCJcXHRcIik7XG5cbiAgICAvLyBHZXQgc3RhdHMgaWYgcnVubmluZ1xuICAgIGxldCBjcHVVc2FnZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG1lbW9yeVVzYWdlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgIGlmIChzdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgcnVuKFtcbiAgICAgICAgICBcInN0YXRzXCIsIGNvbnRhaW5lck5hbWUsIFwiLS1uby1zdHJlYW1cIixcbiAgICAgICAgICBcIi0tZm9ybWF0XCIsIFwie3suQ1BVUGVyY319XFx0e3suTWVtVXNhZ2V9fVwiLFxuICAgICAgICBdLCAxMF8wMDApO1xuICAgICAgICBjb25zdCBbY3B1LCBtZW1dID0gc3RhdHMuc3BsaXQoXCJcXHRcIik7XG4gICAgICAgIGNwdVVzYWdlID0gY3B1Py50cmltKCkgPz8gbnVsbDtcbiAgICAgICAgbWVtb3J5VXNhZ2UgPSBtZW0/LnRyaW0oKSA/PyBudWxsO1xuICAgICAgfSBjYXRjaCB7IC8qIHN0YXRzIG5vdCBhdmFpbGFibGUgKi8gfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpZDogaWQ/LnNsaWNlKDAsIDEyKSA/PyBcIlwiLFxuICAgICAgbmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgIHN0YXRlLFxuICAgICAgaW1hZ2U6IGltYWdlID8/IFwiXCIsXG4gICAgICBjcmVhdGVkOiBjcmVhdGVkID8/IFwiXCIsXG4gICAgICB1cHRpbWU6IHN0YXRlID09PSBcInJ1bm5pbmdcIiA/IFwicnVubmluZ1wiIDogbnVsbCxcbiAgICAgIGNwdVVzYWdlLFxuICAgICAgbWVtb3J5VXNhZ2UsXG4gICAgICBkaXNrVXNhZ2U6IG51bGwsXG4gICAgICBuZXR3b3JrTW9kZTogbmV0d29ya01vZGUgPz8gXCJcIixcbiAgICAgIHBvcnRzOiBbXSxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IFwiXCIsXG4gICAgICBuYW1lOiBjb250YWluZXJOYW1lLFxuICAgICAgc3RhdGUsXG4gICAgICBpbWFnZTogXCJcIixcbiAgICAgIGNyZWF0ZWQ6IFwiXCIsXG4gICAgICB1cHRpbWU6IG51bGwsXG4gICAgICBjcHVVc2FnZTogbnVsbCxcbiAgICAgIG1lbW9yeVVzYWdlOiBudWxsLFxuICAgICAgZGlza1VzYWdlOiBudWxsLFxuICAgICAgbmV0d29ya01vZGU6IFwiXCIsXG4gICAgICBwb3J0czogW10sXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgY29udGFpbmVyJ3MgbmV0d29yayBtb2RlIChyZXF1aXJlcyByZXN0YXJ0KS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZU5ldHdvcmsoXG4gIG1vZGU6IE5ldHdvcmtNb2RlLFxuICBvcHRzOiBQYXJhbWV0ZXJzPHR5cGVvZiBlbnN1cmVSZWFkeT5bMF0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8gRG9ja2VyIGRvZXNuJ3QgYWxsb3cgY2hhbmdpbmcgbmV0d29yayBvbiBhIHJ1bm5pbmcgY29udGFpbmVyLFxuICAvLyBzbyB3ZSBuZWVkIHRvIHJlY3JlYXRlIGl0LlxuICBjb25zdCBoYWRDb250YWluZXIgPSAoYXdhaXQgZ2V0Q29udGFpbmVyU3RhdGUoKSkgIT09IFwibm90X2ZvdW5kXCI7XG5cbiAgaWYgKGhhZENvbnRhaW5lcikge1xuICAgIC8vIENvbW1pdCBjdXJyZW50IHN0YXRlIHRvIGEgdGVtcG9yYXJ5IGltYWdlIGlmIHBlcnNpc3RlbnRcbiAgICBjb25zdCB0ZW1wSW1hZ2UgPSBgJHtjb250YWluZXJOYW1lfS1zdGF0ZTpsYXRlc3RgO1xuICAgIGlmIChvcHRzLnBlcnNpc3RlbmNlTW9kZSA9PT0gXCJwZXJzaXN0ZW50XCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bihbXCJjb21taXRcIiwgY29udGFpbmVyTmFtZSwgdGVtcEltYWdlXSwgNjBfMDAwKTtcbiAgICAgIH0gY2F0Y2ggeyAvKiBiZXN0IGVmZm9ydCAqLyB9XG4gICAgfVxuXG4gICAgYXdhaXQgZGVzdHJveUNvbnRhaW5lcigpO1xuXG4gICAgLy8gUmVjcmVhdGUgd2l0aCBuZXcgbmV0d29yayBzZXR0aW5ncywgdXNpbmcgY29tbWl0dGVkIGltYWdlIGlmIGF2YWlsYWJsZVxuICAgIGNvbnN0IHVzZUltYWdlID0gb3B0cy5wZXJzaXN0ZW5jZU1vZGUgPT09IFwicGVyc2lzdGVudFwiID8gdGVtcEltYWdlIDogb3B0cy5pbWFnZTtcbiAgICBjb25zdCBhY3R1YWxPcHRzID0geyAuLi5vcHRzLCBuZXR3b3JrOiBtb2RlIH07XG5cbiAgICAvLyBPdmVycmlkZSBpbWFnZSBmb3IgcmVjcmVhdGlvblxuICAgIGNvbnRhaW5lclJlYWR5ID0gZmFsc2U7XG4gICAgYXdhaXQgZW5zdXJlUmVhZHkoeyAuLi5hY3R1YWxPcHRzLCBpbWFnZTogdXNlSW1hZ2UgYXMgYW55IH0pO1xuXG4gICAgLy8gQ2xlYW4gdXAgdGVtcCBpbWFnZVxuICAgIGlmIChvcHRzLnBlcnNpc3RlbmNlTW9kZSA9PT0gXCJwZXJzaXN0ZW50XCIpIHtcbiAgICAgIHRyeSB7IGF3YWl0IHJ1bihbXCJybWlcIiwgdGVtcEltYWdlXSwgMTBfMDAwKTsgfSBjYXRjaCB7IC8qIGJlc3QgZWZmb3J0ICovIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgY29udGFpbmVyIGVuZ2luZSBpcyByZWFkeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVhZHkoKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb250YWluZXJSZWFkeTtcbn1cblxuLyoqXG4gKiBWZXJpZnkgdGhlIGNvbnRhaW5lciBpcyBhY3R1YWxseSBydW5uaW5nLiBJZiBpdCBoYXMgYmVlbiBkZWxldGVkIG9yIHN0b3BwZWRcbiAqIGV4dGVybmFsbHksIHJlc2V0cyBjb250YWluZXJSZWFkeSBzbyBlbnN1cmVSZWFkeSgpIHdpbGwgcmVjcmVhdGUgaXQuXG4gKiBDYWxsIHRoaXMgYXQgdGhlIHN0YXJ0IG9mIGV2ZXJ5IHRvb2wgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlIZWFsdGgoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghY29udGFpbmVyUmVhZHkpIHJldHVybjtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IGdldENvbnRhaW5lclN0YXRlKCk7XG4gICAgaWYgKHN0YXRlICE9PSBcInJ1bm5pbmdcIikge1xuICAgICAgY29udGFpbmVyUmVhZHkgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnROZXR3b3JrID0gXCJub25lXCI7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBjb250YWluZXJSZWFkeSA9IGZhbHNlO1xuICAgIGN1cnJlbnROZXR3b3JrID0gXCJub25lXCI7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGNvbnRhaW5lciBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGFpbmVyTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGFpbmVyTmFtZTtcbn0iLCAiLyoqXG4gKiBAZmlsZSBzYWZldHkvZ3VhcmQudHNcbiAqIENvbW1hbmQgc2FmZXR5IGxheWVyIFx1MjAxNCBzY3JlZW5zIGNvbW1hbmRzIGJlZm9yZSBleGVjdXRpb24uXG4gKlxuICogV2hlbiBzdHJpY3QgbW9kZSBpcyBlbmFibGVkLCBibG9ja3MgcGF0dGVybnMga25vd24gdG8gYmUgZGVzdHJ1Y3RpdmUuXG4gKiBUaGlzIGlzIGEgYmVzdC1lZmZvcnQgc2FmZXR5IG5ldCwgbm90IGEgc2VjdXJpdHkgYm91bmRhcnkgXHUyMDE0IHRoZVxuICogY29udGFpbmVyIGl0c2VsZiBpcyB0aGUgcmVhbCBpc29sYXRpb24gbGF5ZXIuXG4gKi9cblxuaW1wb3J0IHsgQkxPQ0tFRF9DT01NQU5EU19TVFJJQ1QgfSBmcm9tIFwiLi4vY29uc3RhbnRzXCI7XG5cbi8qKiBSZXN1bHQgb2YgYSBzYWZldHkgY2hlY2suICovXG5leHBvcnQgaW50ZXJmYWNlIFNhZmV0eUNoZWNrUmVzdWx0IHtcbiAgYWxsb3dlZDogYm9vbGVhbjtcbiAgcmVhc29uPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGNvbW1hbmQgZm9yIHBhdHRlcm4gbWF0Y2hpbmc6XG4gKiAtIGNvbGxhcHNlIHdoaXRlc3BhY2VcbiAqIC0gbG93ZXJjYXNlXG4gKiAtIHN0cmlwIGxlYWRpbmcgc3Vkby9kb2FzXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZShjbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjbWRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAudHJpbSgpXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvXihzdWRvfGRvYXMpXFxzKy8sIFwiXCIpO1xufVxuXG4vKipcbiAqIENoZWNrIGEgY29tbWFuZCBhZ2FpbnN0IHRoZSBzdHJpY3QgYmxvY2tsaXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb21tYW5kKGNvbW1hbmQ6IHN0cmluZywgc3RyaWN0TW9kZTogYm9vbGVhbik6IFNhZmV0eUNoZWNrUmVzdWx0IHtcbiAgaWYgKCFzdHJpY3RNb2RlKSB7XG4gICAgcmV0dXJuIHsgYWxsb3dlZDogdHJ1ZSB9O1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZShjb21tYW5kKTtcblxuICAvLyBDaGVjayBlYWNoIGJsb2NrZWQgcGF0dGVyblxuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgQkxPQ0tFRF9DT01NQU5EU19TVFJJQ1QpIHtcbiAgICBjb25zdCBub3JtYWxpemVkUGF0dGVybiA9IG5vcm1hbGl6ZShwYXR0ZXJuKTtcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhub3JtYWxpemVkUGF0dGVybikpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFsbG93ZWQ6IGZhbHNlLFxuICAgICAgICByZWFzb246IGBCbG9ja2VkIGJ5IHN0cmljdCBzYWZldHkgbW9kZTogY29tbWFuZCBtYXRjaGVzIGRlc3RydWN0aXZlIHBhdHRlcm4gXCIke3BhdHRlcm59XCIuIGAgK1xuICAgICAgICAgIGBEaXNhYmxlIFwiU3RyaWN0IFNhZmV0eSBNb2RlXCIgaW4gcGx1Z2luIHNldHRpbmdzIGlmIHlvdSBuZWVkIHRvIHJ1biB0aGlzLmAsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIGZvciBvYnZpb3VzIGZvcmsgYm9tYiBwYXR0ZXJucyAodmFyaW91cyBmb3JtcylcbiAgaWYgKC86XFwoXFwpXFxzKlxcey4qXFx9Ly50ZXN0KG5vcm1hbGl6ZWQpIHx8IC9cXC5cXChcXClcXHMqXFx7LipcXH0vLnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWxsb3dlZDogZmFsc2UsXG4gICAgICByZWFzb246IFwiQmxvY2tlZCBieSBzdHJpY3Qgc2FmZXR5IG1vZGU6IGRldGVjdGVkIGZvcmsgYm9tYiBwYXR0ZXJuLlwiLFxuICAgIH07XG4gIH1cblxuICAvLyBCbG9jayB3cml0aW5nIGRpcmVjdGx5IHRvIGJsb2NrIGRldmljZXNcbiAgaWYgKC8+XFxzKlxcL2RldlxcL1tzaF1kW2Etel0vLnRlc3Qobm9ybWFsaXplZCkgfHwgL29mPVxcL2RldlxcL1tzaF1kW2Etel0vLnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWxsb3dlZDogZmFsc2UsXG4gICAgICByZWFzb246IFwiQmxvY2tlZCBieSBzdHJpY3Qgc2FmZXR5IG1vZGU6IGRpcmVjdCB3cml0ZSB0byBibG9jayBkZXZpY2UuXCIsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7IGFsbG93ZWQ6IHRydWUgfTtcbn1cbiIsICIvKipcbiAqIEBmaWxlIHRvb2xzUHJvdmlkZXIudHNcbiAqIFJlZ2lzdGVycyBhbGwgY29tcHV0ZXIgdG9vbHMgd2l0aCBMTSBTdHVkaW8uXG4gKlxuICogVG9vbHM6XG4gKiAgIDEuIEV4ZWN1dGUgICAgICAgICBcdTIwMTQgcnVuIGFueSBzaGVsbCBjb21tYW5kXG4gKiAgIDIuIFdyaXRlIEZpbGUgICAgICBcdTIwMTQgY3JlYXRlL292ZXJ3cml0ZSBmaWxlcyBpbnNpZGUgdGhlIGNvbnRhaW5lclxuICogICAzLiBSZWFkIEZpbGUgICAgICAgXHUyMDE0IHJlYWQgZmlsZSBjb250ZW50cyBmcm9tIHRoZSBjb250YWluZXJcbiAqICAgNC4gTGlzdCBEaXJlY3RvcnkgIFx1MjAxNCBsaXN0IGRpcmVjdG9yeSBjb250ZW50cyB3aXRoIG1ldGFkYXRhXG4gKiAgIDUuIFVwbG9hZCBGaWxlICAgICBcdTIwMTQgdHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIGhvc3QgaW50byB0aGUgY29udGFpbmVyXG4gKiAgIDYuIERvd25sb2FkIEZpbGUgICBcdTIwMTQgcHVsbCBhIGZpbGUgZnJvbSB0aGUgY29udGFpbmVyIHRvIHRoZSBob3N0XG4gKiAgIDcuIENvbXB1dGVyIFN0YXR1cyBcdTIwMTQgZW52aXJvbm1lbnQgaW5mbywgcHJvY2Vzc2VzLCByZXNvdXJjZSB1c2FnZVxuICpcbiAqIEV2ZXJ5IHRvb2wgZW5mb3JjZXMgdGhlIHBlci10dXJuIGNhbGwgYnVkZ2V0IGJlZm9yZSBleGVjdXRpbmcuXG4gKi9cblxuaW1wb3J0IHsgdG9vbCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBob21lZGlyLCBwbGF0Zm9ybSB9IGZyb20gXCJvc1wiO1xuaW1wb3J0IHsgam9pbiBhcyBwYXRoSm9pbiB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0ICogYXMgZW5naW5lIGZyb20gXCIuL2NvbnRhaW5lci9lbmdpbmVcIjtcbmltcG9ydCB7IGNoZWNrQ29tbWFuZCB9IGZyb20gXCIuL3NhZmV0eS9ndWFyZFwiO1xuaW1wb3J0IHtcbiAgQ09OVEFJTkVSX1dPUktESVIsXG4gIE1BWF9GSUxFX1JFQURfQllURVMsXG4gIE1BWF9GSUxFX1dSSVRFX0JZVEVTLFxuICBNQVhfVElNRU9VVF9TRUNPTkRTLFxufSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB0eXBlIHsgUGx1Z2luQ29udHJvbGxlciB9IGZyb20gXCIuL3BsdWdpblR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IENvbXB1dGVyUGx1Z2luQ29uZmlnLCBUdXJuQnVkZ2V0IH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgTmV0d29ya01vZGUsIENvbnRhaW5lckltYWdlIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb25maWcgUmVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiByZWFkQ29uZmlnKGN0bDogUGx1Z2luQ29udHJvbGxlcik6IENvbXB1dGVyUGx1Z2luQ29uZmlnIHtcbiAgY29uc3QgYyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG4gIHJldHVybiB7XG4gICAgaW50ZXJuZXRBY2Nlc3M6IGMuZ2V0KFwiaW50ZXJuZXRBY2Nlc3NcIikgPT09IFwib25cIixcbiAgICBwZXJzaXN0ZW5jZU1vZGU6IGMuZ2V0KFwicGVyc2lzdGVuY2VNb2RlXCIpIHx8IFwicGVyc2lzdGVudFwiLFxuICAgIGJhc2VJbWFnZTogYy5nZXQoXCJiYXNlSW1hZ2VcIikgfHwgXCJ1YnVudHU6MjQuMDRcIixcbiAgICBjcHVMaW1pdDogYy5nZXQoXCJjcHVMaW1pdFwiKSA/PyAyLFxuICAgIG1lbW9yeUxpbWl0TUI6IGMuZ2V0KFwibWVtb3J5TGltaXRNQlwiKSA/PyAxMDI0LFxuICAgIGRpc2tMaW1pdE1COiBjLmdldChcImRpc2tMaW1pdE1CXCIpID8/IDQwOTYsXG4gICAgY29tbWFuZFRpbWVvdXQ6IGMuZ2V0KFwiY29tbWFuZFRpbWVvdXRcIikgPz8gMzAsXG4gICAgbWF4T3V0cHV0U2l6ZTogKGMuZ2V0KFwibWF4T3V0cHV0U2l6ZVwiKSA/PyAzMikgKiAxMDI0LCAvLyBLQiBcdTIxOTIgYnl0ZXNcbiAgICBtYXhUb29sQ2FsbHNQZXJUdXJuOiBjLmdldChcIm1heFRvb2xDYWxsc1BlclR1cm5cIikgPz8gMjUsXG4gICAgYXV0b0luc3RhbGxQcmVzZXQ6IGMuZ2V0KFwiYXV0b0luc3RhbGxQcmVzZXRcIikgfHwgXCJtaW5pbWFsXCIsXG4gICAgcG9ydEZvcndhcmRzOiBjLmdldChcInBvcnRGb3J3YXJkc1wiKSB8fCBcIlwiLFxuICAgIGhvc3RNb3VudFBhdGg6IGMuZ2V0KFwiaG9zdE1vdW50UGF0aFwiKSB8fCBcIlwiLFxuICAgIHN0cmljdFNhZmV0eTogYy5nZXQoXCJzdHJpY3RTYWZldHlcIikgPT09IFwib25cIixcbiAgICBhdXRvSW5qZWN0Q29udGV4dDogYy5nZXQoXCJhdXRvSW5qZWN0Q29udGV4dFwiKSA9PT0gXCJvblwiLFxuICB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUGVyLVR1cm4gQnVkZ2V0IFRyYWNraW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIFNoYXJlZCB0dXJuIGJ1ZGdldC4gVGhlIHByZXByb2Nlc3NvciBpbmNyZW1lbnRzIGB0dXJuSWRgIGVhY2ggdGltZVxuICogYSBuZXcgdXNlciBtZXNzYWdlIGFycml2ZXMsIHdoaWNoIHJlc2V0cyB0aGUgY2FsbCBjb3VudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHR1cm5CdWRnZXQ6IFR1cm5CdWRnZXQgPSB7XG4gIHR1cm5JZDogMCxcbiAgY2FsbHNVc2VkOiAwLFxuICBtYXhDYWxsczogMjUsXG59O1xuXG4vKiogQ2FsbGVkIGJ5IHRoZSBwcmVwcm9jZXNzb3IgdG8gc2lnbmFsIGEgbmV3IHR1cm4uICovXG5leHBvcnQgZnVuY3Rpb24gYWR2YW5jZVR1cm4obWF4Q2FsbHM6IG51bWJlcik6IHZvaWQge1xuICB0dXJuQnVkZ2V0LnR1cm5JZCsrO1xuICB0dXJuQnVkZ2V0LmNhbGxzVXNlZCA9IDA7XG4gIHR1cm5CdWRnZXQubWF4Q2FsbHMgPSBtYXhDYWxscztcbn1cblxuLyoqXG4gKiBDaGVjayBhbmQgY29uc3VtZSBvbmUgdG9vbCBjYWxsIGZyb20gdGhlIGJ1ZGdldC5cbiAqIFJldHVybnMgYW4gZXJyb3Igc3RyaW5nIGlmIHRoZSBidWRnZXQgaXMgZXhoYXVzdGVkLCBvciBudWxsIGlmIE9LLlxuICovXG5mdW5jdGlvbiBjb25zdW1lQnVkZ2V0KCk6IHN0cmluZyB8IG51bGwge1xuICB0dXJuQnVkZ2V0LmNhbGxzVXNlZCsrO1xuICBpZiAodHVybkJ1ZGdldC5jYWxsc1VzZWQgPiB0dXJuQnVkZ2V0Lm1heENhbGxzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIGBUb29sIGNhbGwgYnVkZ2V0IGV4aGF1c3RlZDogeW91J3ZlIHVzZWQgJHt0dXJuQnVkZ2V0Lm1heENhbGxzfS8ke3R1cm5CdWRnZXQubWF4Q2FsbHN9IGAgK1xuICAgICAgYGNhbGxzIHRoaXMgdHVybi4gV2FpdCBmb3IgdGhlIHVzZXIncyBuZXh0IG1lc3NhZ2UgdG8gY29udGludWUuIGAgK1xuICAgICAgYChDb25maWd1cmFibGUgaW4gcGx1Z2luIHNldHRpbmdzIFx1MjE5MiBcIk1heCBUb29sIENhbGxzIFBlciBUdXJuXCIpYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXR1cm4gYSBidWRnZXQgc3RhdHVzIHN0cmluZyBmb3IgdG9vbCByZXNwb25zZXMuICovXG5mdW5jdGlvbiBidWRnZXRTdGF0dXMoKTogeyBjYWxsc1VzZWQ6IG51bWJlcjsgY2FsbHNSZW1haW5pbmc6IG51bWJlcjsgbWF4UGVyVHVybjogbnVtYmVyIH0ge1xuICByZXR1cm4ge1xuICAgIGNhbGxzVXNlZDogdHVybkJ1ZGdldC5jYWxsc1VzZWQsXG4gICAgY2FsbHNSZW1haW5pbmc6IE1hdGgubWF4KDAsIHR1cm5CdWRnZXQubWF4Q2FsbHMgLSB0dXJuQnVkZ2V0LmNhbGxzVXNlZCksXG4gICAgbWF4UGVyVHVybjogdHVybkJ1ZGdldC5tYXhDYWxscyxcbiAgfTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIExhenkgQ29udGFpbmVyIEluaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNvbnRhaW5lcihcbiAgY2ZnOiBDb21wdXRlclBsdWdpbkNvbmZpZyxcbiAgc3RhdHVzOiAobXNnOiBzdHJpbmcpID0+IHZvaWQsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8gSGVhbHRoLWNoZWNrIGZpcnN0OiBpZiB0aGUgY29udGFpbmVyIHdhcyBkZWxldGVkIG9yIHN0b3BwZWQgZXh0ZXJuYWxseSxcbiAgLy8gdGhpcyByZXNldHMgdGhlIHJlYWR5IGZsYWcgc28gZW5zdXJlUmVhZHkoKSByZWNyZWF0ZXMgaXQgYmVsb3cuXG4gIGF3YWl0IGVuZ2luZS52ZXJpZnlIZWFsdGgoKTtcblxuICBpZiAoZW5naW5lLmlzUmVhZHkoKSkgcmV0dXJuO1xuXG4gIHN0YXR1cyhcIlN0YXJ0aW5nIGNvbXB1dGVyXHUyMDI2IChmaXJzdCB1c2UgbWF5IHRha2UgYSBtb21lbnQgdG8gcHVsbCB0aGUgaW1hZ2UpXCIpO1xuXG4gIGF3YWl0IGVuZ2luZS5lbnN1cmVSZWFkeSh7XG4gICAgaW1hZ2U6IGNmZy5iYXNlSW1hZ2UgYXMgQ29udGFpbmVySW1hZ2UsXG4gICAgbmV0d29yazogKGNmZy5pbnRlcm5ldEFjY2VzcyA/IFwiYnJpZGdlXCIgOiBcIm5vbmVcIikgYXMgTmV0d29ya01vZGUsXG4gICAgY3B1TGltaXQ6IGNmZy5jcHVMaW1pdCxcbiAgICBtZW1vcnlMaW1pdE1COiBjZmcubWVtb3J5TGltaXRNQixcbiAgICBkaXNrTGltaXRNQjogY2ZnLmRpc2tMaW1pdE1CLFxuICAgIGF1dG9JbnN0YWxsUHJlc2V0OiBjZmcuYXV0b0luc3RhbGxQcmVzZXQsXG4gICAgcG9ydEZvcndhcmRzOiBjZmcucG9ydEZvcndhcmRzLFxuICAgIGhvc3RNb3VudFBhdGg6IGNmZy5ob3N0TW91bnRQYXRoLFxuICAgIHBlcnNpc3RlbmNlTW9kZTogY2ZnLnBlcnNpc3RlbmNlTW9kZSxcbiAgfSk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBUb29sIERlZmluaXRpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9vbHNQcm92aWRlcihjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgY2ZnID0gcmVhZENvbmZpZyhjdGwpO1xuXG4gIC8vIFVwZGF0ZSBidWRnZXQgbWF4IGZyb20gY29uZmlnXG4gIHR1cm5CdWRnZXQubWF4Q2FsbHMgPSBjZmcubWF4VG9vbENhbGxzUGVyVHVybjtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgLy8gVG9vbCAxOiBFeGVjdXRlXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBleGVjdXRlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiRXhlY3V0ZVwiLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgYFJ1biBhIHNoZWxsIGNvbW1hbmQgb24geW91ciBkZWRpY2F0ZWQgTGludXggY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgVGhpcyBpcyBhIHJlYWwsIGlzb2xhdGVkIExpbnV4IGNvbnRhaW5lciBcdTIwMTQgeW91IGNhbiBpbnN0YWxsIHBhY2thZ2VzLCBgICtcbiAgICAgIGBjb21waWxlIGNvZGUsIHJ1biBzY3JpcHRzLCBtYW5hZ2UgZmlsZXMsIHN0YXJ0IHNlcnZpY2VzLCBldGMuXFxuXFxuYCArXG4gICAgICBgVGhlIHdvcmtpbmcgZGlyZWN0b3J5IGlzICR7Q09OVEFJTkVSX1dPUktESVJ9LiBgICtcbiAgICAgIGBZb3UgaGF2ZSBmdWxsIHNoZWxsIGFjY2VzcyAoYmFzaCBvbiBVYnVudHUvRGViaWFuLCBzaCBvbiBBbHBpbmUpLlxcblxcbmAgK1xuICAgICAgYFRJUFM6XFxuYCArXG4gICAgICBgXHUyMDIyIENoYWluIGNvbW1hbmRzIHdpdGggJiYgb3IgO1xcbmAgK1xuICAgICAgYFx1MjAyMiBVc2UgMj4mMSB0byBtZXJnZSBzdGRlcnIgaW50byBzdGRvdXRcXG5gICtcbiAgICAgIGBcdTIwMjIgRm9yIGxvbmctcnVubmluZyB0YXNrcywgY29uc2lkZXIgYmFja2dyb3VuZGluZyB3aXRoICYgYW5kIGNoZWNraW5nIGxhdGVyXFxuYCArXG4gICAgICBgXHUyMDIyIEluc3RhbGwgcGFja2FnZXMgd2l0aCBhcHQtZ2V0IChVYnVudHUvRGViaWFuKSBvciBhcGsgKEFscGluZSlcXG5gICtcbiAgICAgIGBcdTIwMjIgVGhlIGNvbXB1dGVyIHBlcnNpc3RzIGJldHdlZW4gbWVzc2FnZXMgKHVubGVzcyBlcGhlbWVyYWwgbW9kZSBpcyBvbilgLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGNvbW1hbmQ6IHouc3RyaW5nKCkubWluKDEpLm1heCg4XzAwMClcbiAgICAgICAgLmRlc2NyaWJlKFwiU2hlbGwgY29tbWFuZCB0byBleGVjdXRlLiBTdXBwb3J0cyBwaXBlcywgcmVkaXJlY3RzLCBjaGFpbmluZy5cIiksXG4gICAgICB0aW1lb3V0OiB6Lm51bWJlcigpLmludCgpLm1pbigxKS5tYXgoTUFYX1RJTUVPVVRfU0VDT05EUykub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoYFRpbWVvdXQgaW4gc2Vjb25kcyAoZGVmYXVsdDogJHtjZmcuY29tbWFuZFRpbWVvdXR9LCBtYXg6ICR7TUFYX1RJTUVPVVRfU0VDT05EU30pLiBJbmNyZWFzZSBmb3IgbG9uZyBvcGVyYXRpb25zIGxpa2UgcGFja2FnZSBpbnN0YWxscy5gKSxcbiAgICAgIHdvcmtkaXI6IHouc3RyaW5nKCkub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoYFdvcmtpbmcgZGlyZWN0b3J5IGZvciB0aGUgY29tbWFuZCAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0pLmApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGNvbW1hbmQsIHRpbWVvdXQsIHdvcmtkaXIgfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgLy8gQnVkZ2V0IGNoZWNrXG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIC8vIFNhZmV0eSBjaGVja1xuICAgICAgaWYgKGNmZy5zdHJpY3RTYWZldHkpIHtcbiAgICAgICAgY29uc3QgY2hlY2sgPSBjaGVja0NvbW1hbmQoY29tbWFuZCwgdHJ1ZSk7XG4gICAgICAgIGlmICghY2hlY2suYWxsb3dlZCkge1xuICAgICAgICAgIHdhcm4oY2hlY2sucmVhc29uISk7XG4gICAgICAgICAgcmV0dXJuIHsgZXJyb3I6IGNoZWNrLnJlYXNvbiwgZXhpdENvZGU6IC0xIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBzdGF0dXMoYFJ1bm5pbmc6ICR7Y29tbWFuZC5sZW5ndGggPiA4MCA/IGNvbW1hbmQuc2xpY2UoMCwgNzcpICsgXCJcdTIwMjZcIiA6IGNvbW1hbmR9YCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoXG4gICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICB0aW1lb3V0ID8/IGNmZy5jb21tYW5kVGltZW91dCxcbiAgICAgICAgICBjZmcubWF4T3V0cHV0U2l6ZSxcbiAgICAgICAgICB3b3JrZGlyLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChyZXN1bHQudGltZWRPdXQpIHtcbiAgICAgICAgICB3YXJuKGBDb21tYW5kIHRpbWVkIG91dCBhZnRlciAke3RpbWVvdXQgPz8gY2ZnLmNvbW1hbmRUaW1lb3V0fXNgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQudHJ1bmNhdGVkKSB7XG4gICAgICAgICAgc3RhdHVzKFwiT3V0cHV0IHdhcyB0cnVuY2F0ZWQgKGV4Y2VlZGVkIG1heCBzaXplKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXhpdENvZGU6IHJlc3VsdC5leGl0Q29kZSxcbiAgICAgICAgICBzdGRvdXQ6IHJlc3VsdC5zdGRvdXQgfHwgXCIobm8gb3V0cHV0KVwiLFxuICAgICAgICAgIHN0ZGVycjogcmVzdWx0LnN0ZGVyciB8fCBcIlwiLFxuICAgICAgICAgIHRpbWVkT3V0OiByZXN1bHQudGltZWRPdXQsXG4gICAgICAgICAgZHVyYXRpb25NczogcmVzdWx0LmR1cmF0aW9uTXMsXG4gICAgICAgICAgdHJ1bmNhdGVkOiByZXN1bHQudHJ1bmNhdGVkLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBFeGVjdXRpb24gZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgZXhpdENvZGU6IC0xLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIC8vIFRvb2wgMjogV3JpdGUgRmlsZVxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgd3JpdGVGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiV3JpdGVGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgQ3JlYXRlIG9yIG92ZXJ3cml0ZSBhIGZpbGUgaW5zaWRlIHRoZSBjb21wdXRlci5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB0byB3cml0ZSBjb2RlLCBjb25maWdzLCBzY3JpcHRzLCBkYXRhIGZpbGVzLCBldGMuIGAgK1xuICAgICAgYFBhcmVudCBkaXJlY3RvcmllcyBhcmUgY3JlYXRlZCBhdXRvbWF0aWNhbGx5LlxcbmAgK1xuICAgICAgYFdvcmtpbmcgZGlyZWN0b3J5OiAke0NPTlRBSU5FUl9XT1JLRElSfWAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgcGF0aDogei5zdHJpbmcoKS5taW4oMSkubWF4KDUwMClcbiAgICAgICAgLmRlc2NyaWJlKGBGaWxlIHBhdGggaW5zaWRlIHRoZSBjb250YWluZXIuIFJlbGF0aXZlIHBhdGhzIGFyZSByZWxhdGl2ZSB0byAke0NPTlRBSU5FUl9XT1JLRElSfS5gKSxcbiAgICAgIGNvbnRlbnQ6IHouc3RyaW5nKCkubWF4KE1BWF9GSUxFX1dSSVRFX0JZVEVTKVxuICAgICAgICAuZGVzY3JpYmUoXCJGaWxlIGNvbnRlbnQgdG8gd3JpdGUuXCIpLFxuICAgICAgbWFrZUV4ZWN1dGFibGU6IHouYm9vbGVhbigpLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiU2V0IHRoZSBleGVjdXRhYmxlIGJpdCAoY2htb2QgK3gpIGFmdGVyIHdyaXRpbmcuIFVzZWZ1bCBmb3Igc2NyaXB0cy5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgcGF0aDogZmlsZVBhdGgsIGNvbnRlbnQsIG1ha2VFeGVjdXRhYmxlIH0sIHsgc3RhdHVzLCB3YXJuIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICAvLyBFbnN1cmUgcGFyZW50IGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgY29uc3QgZGlyID0gZmlsZVBhdGguaW5jbHVkZXMoXCIvXCIpXG4gICAgICAgICAgPyBmaWxlUGF0aC5zbGljZSgwLCBmaWxlUGF0aC5sYXN0SW5kZXhPZihcIi9cIikpXG4gICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICBhd2FpdCBlbmdpbmUuZXhlYyhgbWtkaXIgLXAgJyR7ZGlyLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgLCA1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyhgV3JpdGluZzogJHtmaWxlUGF0aH1gKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLndyaXRlRmlsZShmaWxlUGF0aCwgY29udGVudCk7XG5cbiAgICAgICAgaWYgKG1ha2VFeGVjdXRhYmxlKSB7XG4gICAgICAgICAgYXdhaXQgZW5naW5lLmV4ZWMoYGNobW9kICt4ICcke2ZpbGVQYXRoLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgLCA1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgd3JpdHRlbjogdHJ1ZSxcbiAgICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgICBieXRlc1dyaXR0ZW46IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQsIFwidXRmLThcIiksXG4gICAgICAgICAgZXhlY3V0YWJsZTogbWFrZUV4ZWN1dGFibGUgPz8gZmFsc2UsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIHdhcm4oYFdyaXRlIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBtc2csIHdyaXR0ZW46IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIC8vIFRvb2wgMzogUmVhZCBGaWxlXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCByZWFkRmlsZVRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIlJlYWRGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgUmVhZCB0aGUgY29udGVudHMgb2YgYSBmaWxlIGZyb20gdGhlIGNvbXB1dGVyLlxcblxcbmAgK1xuICAgICAgYFJldHVybnMgdGhlIGZpbGUgY29udGVudCBhcyB0ZXh0LiBCaW5hcnkgZmlsZXMgbWF5IG5vdCBkaXNwbGF5IGNvcnJlY3RseSBcdTIwMTQgYCArXG4gICAgICBgdXNlIEV4ZWN1dGUgd2l0aCB0b29scyBsaWtlIHh4ZCBvciBmaWxlIGZvciBiaW5hcnkgaW5zcGVjdGlvbi5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIHBhdGg6IHouc3RyaW5nKCkubWluKDEpLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIkZpbGUgcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lci5cIiksXG4gICAgICBtYXhMaW5lczogei5udW1iZXIoKS5pbnQoKS5taW4oMSkubWF4KDIwMDApLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiTWF4IGxpbmVzIHRvIHJldHVybiAoZGVmYXVsdDogYWxsLCB1cCB0byBzaXplIGxpbWl0KS4gVXNlIGZvciBsYXJnZSBmaWxlcy5cIiksXG4gICAgICBzdGFydExpbmU6IHoubnVtYmVyKCkuaW50KCkubWluKDEpLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiU3RhcnQgcmVhZGluZyBmcm9tIHRoaXMgbGluZSBudW1iZXIgKDEtYmFzZWQpLiBDb21iaW5lIHdpdGggbWF4TGluZXMgdG8gcmVhZCBhIHJhbmdlLlwiKSxcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBwYXRoOiBmaWxlUGF0aCwgbWF4TGluZXMsIHN0YXJ0TGluZSB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCBidWRnZXRFcnJvciA9IGNvbnN1bWVCdWRnZXQoKTtcbiAgICAgIGlmIChidWRnZXRFcnJvcikgcmV0dXJuIHsgZXJyb3I6IGJ1ZGdldEVycm9yLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVuc3VyZUNvbnRhaW5lcihjZmcsIHN0YXR1cyk7XG5cbiAgICAgICAgc3RhdHVzKGBSZWFkaW5nOiAke2ZpbGVQYXRofWApO1xuXG4gICAgICAgIC8vIEJ1aWxkIGNvbW1hbmQgYmFzZWQgb24gb3B0aW9uc1xuICAgICAgICBsZXQgY21kOiBzdHJpbmc7XG4gICAgICAgIGlmIChzdGFydExpbmUgJiYgbWF4TGluZXMpIHtcbiAgICAgICAgICBjbWQgPSBgc2VkIC1uICcke3N0YXJ0TGluZX0sJHtzdGFydExpbmUgKyBtYXhMaW5lcyAtIDF9cCcgJyR7ZmlsZVBhdGgucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9J2A7XG4gICAgICAgIH0gZWxzZSBpZiAobWF4TGluZXMpIHtcbiAgICAgICAgICBjbWQgPSBgaGVhZCAtbiAke21heExpbmVzfSAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbWQgPSBgY2F0ICcke2ZpbGVQYXRoLnJlcGxhY2UoLycvZywgXCInXFxcXCcnXCIpfSdgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoY21kLCAxMCwgTUFYX0ZJTEVfUkVBRF9CWVRFUyk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlcnJvcjogcmVzdWx0LnN0ZGVyciB8fCBcIkZpbGUgbm90IGZvdW5kIG9yIHVucmVhZGFibGVcIixcbiAgICAgICAgICAgIHBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGZpbGUgc2l6ZVxuICAgICAgICBjb25zdCBzaXplUmVzdWx0ID0gYXdhaXQgZW5naW5lLmV4ZWMoXG4gICAgICAgICAgYHN0YXQgLWMgJyVzJyAnJHtmaWxlUGF0aC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nICAyPi9kZXYvbnVsbCB8fCBzdGF0IC1mICcleicgJyR7ZmlsZVBhdGgucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9JyAyPi9kZXYvbnVsbGAsXG4gICAgICAgICAgMyxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qgc2l6ZUJ5dGVzID0gcGFyc2VJbnQoc2l6ZVJlc3VsdC5zdGRvdXQudHJpbSgpLCAxMCkgfHwgMDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgIGNvbnRlbnQ6IHJlc3VsdC5zdGRvdXQsXG4gICAgICAgICAgc2l6ZUJ5dGVzLFxuICAgICAgICAgIHRydW5jYXRlZDogcmVzdWx0LnRydW5jYXRlZCxcbiAgICAgICAgICBsaW5lUmFuZ2U6IHN0YXJ0TGluZSA/IHsgZnJvbTogc3RhcnRMaW5lLCBjb3VudDogbWF4TGluZXMgPz8gXCJhbGxcIiB9IDogdW5kZWZpbmVkLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBSZWFkIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBtc2csIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgLy8gVG9vbCA0OiBMaXN0IERpcmVjdG9yeVxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbGlzdERpclRvb2wgPSB0b29sKHtcbiAgICBuYW1lOiBcIkxpc3REaXJlY3RvcnlcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBMaXN0IGZpbGVzIGFuZCBkaXJlY3RvcmllcyBpbnNpZGUgdGhlIGNvbXB1dGVyLlxcblxcbmAgK1xuICAgICAgYFJldHVybnMgc3RydWN0dXJlZCBkaXJlY3RvcnkgbGlzdGluZyB3aXRoIGZpbGUgdHlwZXMsIHNpemVzLCBhbmQgcGVybWlzc2lvbnMuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBwYXRoOiB6LnN0cmluZygpLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKGBEaXJlY3RvcnkgcGF0aCAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0pLmApLFxuICAgICAgc2hvd0hpZGRlbjogei5ib29sZWFuKCkub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXCJJbmNsdWRlIGhpZGRlbiBmaWxlcyAoZG90ZmlsZXMpLiBEZWZhdWx0OiBmYWxzZS5cIiksXG4gICAgICByZWN1cnNpdmU6IHouYm9vbGVhbigpLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiTGlzdCByZWN1cnNpdmVseSB1cCB0byAzIGxldmVscyBkZWVwLiBEZWZhdWx0OiBmYWxzZS5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgcGF0aDogZGlyUGF0aCwgc2hvd0hpZGRlbiwgcmVjdXJzaXZlIH0sIHsgc3RhdHVzIH0pID0+IHtcbiAgICAgIGNvbnN0IGJ1ZGdldEVycm9yID0gY29uc3VtZUJ1ZGdldCgpO1xuICAgICAgaWYgKGJ1ZGdldEVycm9yKSByZXR1cm4geyBlcnJvcjogYnVkZ2V0RXJyb3IsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZW5zdXJlQ29udGFpbmVyKGNmZywgc3RhdHVzKTtcblxuICAgICAgICBjb25zdCB0YXJnZXQgPSBkaXJQYXRoID8/IENPTlRBSU5FUl9XT1JLRElSO1xuICAgICAgICBjb25zdCBoaWRkZW4gPSBzaG93SGlkZGVuID8gXCItYVwiIDogXCJcIjtcblxuICAgICAgICBsZXQgY21kOiBzdHJpbmc7XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICBjbWQgPSBgZmluZCAnJHt0YXJnZXQucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9JyAgLW1heGRlcHRoIDMgJHtzaG93SGlkZGVuID8gXCJcIiA6IFwiLW5vdCAtcGF0aCAnKi8uKidcIn0gLXByaW50ZiAnJXkgJXMgJVRAICVwXFxcXG4nIDI+L2Rldi9udWxsIHwgaGVhZCAtMjAwYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbWQgPSBgbHMgLWwgJHtoaWRkZW59IC0tdGltZS1zdHlsZT1sb25nLWlzbyAnJHt0YXJnZXQucmVwbGFjZSgvJy9nLCBcIidcXFxcJydcIil9JyAgMj4vZGV2L251bGwgfHwgbHMgLWwgJHtoaWRkZW59ICcke3RhcmdldC5yZXBsYWNlKC8nL2csIFwiJ1xcXFwnJ1wiKX0nYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyhgTGlzdGluZzogJHt0YXJnZXR9YCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGVuZ2luZS5leGVjKGNtZCwgMTApO1xuXG4gICAgICAgIGlmIChyZXN1bHQuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3I6IHJlc3VsdC5zdGRlcnIgfHwgXCJEaXJlY3Rvcnkgbm90IGZvdW5kXCIsXG4gICAgICAgICAgICBwYXRoOiB0YXJnZXQsXG4gICAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IHRhcmdldCxcbiAgICAgICAgICBsaXN0aW5nOiByZXN1bHQuc3Rkb3V0LFxuICAgICAgICAgIHJlY3Vyc2l2ZTogcmVjdXJzaXZlID8/IGZhbHNlLFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIC8vIFRvb2wgNTogVXBsb2FkIEZpbGVcbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IHVwbG9hZEZpbGVUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJVcGxvYWRGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgVHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIHVzZXIncyBob3N0IGNvbXB1dGVyIGludG8gdGhlIGNvbnRhaW5lci5cXG5cXG5gICtcbiAgICAgIGBVc2UgdGhpcyB3aGVuIHRoZSB1c2VyIHNoYXJlcyBhIGZpbGUgdGhleSB3YW50IHlvdSB0byB3b3JrIHdpdGguIGAgK1xuICAgICAgYFRoZSBmaWxlIHdpbGwgYmUgY29waWVkIGludG8gdGhlIGNvbnRhaW5lciBhdCB0aGUgc3BlY2lmaWVkIHBhdGguYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBob3N0UGF0aDogei5zdHJpbmcoKS5taW4oMSkubWF4KDEwMDApXG4gICAgICAgIC5kZXNjcmliZShcIkFic29sdXRlIHBhdGggdG8gdGhlIGZpbGUgb24gdGhlIHVzZXIncyBob3N0IG1hY2hpbmUuXCIpLFxuICAgICAgY29udGFpbmVyUGF0aDogei5zdHJpbmcoKS5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShgRGVzdGluYXRpb24gcGF0aCBpbnNpZGUgdGhlIGNvbnRhaW5lciAoZGVmYXVsdDogJHtDT05UQUlORVJfV09SS0RJUn0vPGZpbGVuYW1lPikuYCksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgaG9zdFBhdGgsIGNvbnRhaW5lclBhdGggfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gaG9zdFBhdGguc3BsaXQoXCIvXCIpLnBvcCgpID8/IGhvc3RQYXRoLnNwbGl0KFwiXFxcXFwiKS5wb3AoKSA/PyBcImZpbGVcIjtcbiAgICAgICAgY29uc3QgZGVzdCA9IGNvbnRhaW5lclBhdGggPz8gYCR7Q09OVEFJTkVSX1dPUktESVJ9LyR7ZmlsZW5hbWV9YDtcblxuICAgICAgICBzdGF0dXMoYFVwbG9hZGluZzogJHtmaWxlbmFtZX0gXHUyMTkyICR7ZGVzdH1gKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLmNvcHlUb0NvbnRhaW5lcihob3N0UGF0aCwgZGVzdCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGxvYWRlZDogdHJ1ZSxcbiAgICAgICAgICBob3N0UGF0aCxcbiAgICAgICAgICBjb250YWluZXJQYXRoOiBkZXN0LFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBVcGxvYWQgZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgdXBsb2FkZWQ6IGZhbHNlLCBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpIH07XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIC8vIFRvb2wgNjogRG93bmxvYWQgRmlsZVxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgZG93bmxvYWRGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiRG93bmxvYWRGaWxlXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgVHJhbnNmZXIgYSBmaWxlIGZyb20gdGhlIGNvbnRhaW5lciB0byB0aGUgdXNlcidzIGhvc3QgY29tcHV0ZXIuXFxuXFxuYCArXG4gICAgICBgVXNlIHRoaXMgdG8gZ2l2ZSB0aGUgdXNlciBhIGZpbGUgeW91IGNyZWF0ZWQgb3IgbW9kaWZpZWQgaW5zaWRlIHRoZSBjb21wdXRlci5gLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIGNvbnRhaW5lclBhdGg6IHouc3RyaW5nKCkubWluKDEpLm1heCg1MDApXG4gICAgICAgIC5kZXNjcmliZShcIlBhdGggdG8gdGhlIGZpbGUgaW5zaWRlIHRoZSBjb250YWluZXIuXCIpLFxuICAgICAgaG9zdFBhdGg6IHouc3RyaW5nKCkub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXCJEZXN0aW5hdGlvbiBwYXRoIG9uIHRoZSBob3N0LiBEZWZhdWx0OiB1c2VyJ3MgaG9tZSBkaXJlY3RvcnkgKyBmaWxlbmFtZS5cIiksXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgY29udGFpbmVyUGF0aCwgaG9zdFBhdGggfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gY29udGFpbmVyUGF0aC5zcGxpdChcIi9cIikucG9wKCkgPz8gXCJmaWxlXCI7XG4gICAgICAgIC8vIERlZmF1bHQgdG8gdXNlcidzIGhvbWUgZGlyZWN0b3J5IHNvIGRvd25sb2FkZWQgZmlsZXMgYXJlIGVhc3kgdG8gZmluZC5cbiAgICAgICAgY29uc3QgZGVzdCA9IGhvc3RQYXRoID8/IHBhdGhKb2luKGhvbWVkaXIoKSwgZmlsZW5hbWUpO1xuXG4gICAgICAgIHN0YXR1cyhgRG93bmxvYWRpbmc6ICR7Y29udGFpbmVyUGF0aH0gXHUyMTkyICR7ZGVzdH1gKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLmNvcHlGcm9tQ29udGFpbmVyKGNvbnRhaW5lclBhdGgsIGRlc3QpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZG93bmxvYWRlZDogdHJ1ZSxcbiAgICAgICAgICBjb250YWluZXJQYXRoLFxuICAgICAgICAgIGhvc3RQYXRoOiBkZXN0LFxuICAgICAgICAgIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICB3YXJuKGBEb3dubG9hZCBmYWlsZWQ6ICR7bXNnfWApO1xuICAgICAgICByZXR1cm4geyBlcnJvcjogbXNnLCBkb3dubG9hZGVkOiBmYWxzZSwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAvLyBUb29sIDc6IENvbXB1dGVyIFN0YXR1c1xuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgc3RhdHVzVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiQ29tcHV0ZXJTdGF0dXNcIixcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIGBHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXB1dGVyOiBPUywgaW5zdGFsbGVkIHRvb2xzLCBkaXNrL21lbW9yeSB1c2FnZSwgYCArXG4gICAgICBgcnVubmluZyBwcm9jZXNzZXMsIG5ldHdvcmsgc3RhdHVzLCBhbmQgcmVzb3VyY2UgbGltaXRzLlxcblxcbmAgK1xuICAgICAgYEFsc28gc2hvd3MgdGhlIHBlci10dXJuIHRvb2wgY2FsbCBidWRnZXQuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBzaG93UHJvY2Vzc2VzOiB6LmJvb2xlYW4oKS5vcHRpb25hbCgpXG4gICAgICAgIC5kZXNjcmliZShcIkluY2x1ZGUgYSBsaXN0IG9mIHJ1bm5pbmcgcHJvY2Vzc2VzLiBEZWZhdWx0OiBmYWxzZS5cIiksXG4gICAgICBraWxsUGlkOiB6Lm51bWJlcigpLmludCgpLm9wdGlvbmFsKClcbiAgICAgICAgLmRlc2NyaWJlKFwiS2lsbCBhIHByb2Nlc3MgYnkgUElELiBDb21iaW5lIHdpdGggc2hvd1Byb2Nlc3NlcyB0byB2ZXJpZnkuXCIpLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IHNob3dQcm9jZXNzZXMsIGtpbGxQaWQgfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgY29uc3QgYnVkZ2V0RXJyb3IgPSBjb25zdW1lQnVkZ2V0KCk7XG4gICAgICBpZiAoYnVkZ2V0RXJyb3IpIHJldHVybiB7IGVycm9yOiBidWRnZXRFcnJvciwgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBlbnN1cmVDb250YWluZXIoY2ZnLCBzdGF0dXMpO1xuXG4gICAgICAgIC8vIEtpbGwgYSBwcm9jZXNzIGlmIHJlcXVlc3RlZFxuICAgICAgICBpZiAoa2lsbFBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3Qga2lsbGVkID0gYXdhaXQgZW5naW5lLmtpbGxQcm9jZXNzKGtpbGxQaWQpO1xuICAgICAgICAgIGlmICgha2lsbGVkKSB3YXJuKGBGYWlsZWQgdG8ga2lsbCBQSUQgJHtraWxsUGlkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzKFwiR2F0aGVyaW5nIHN5c3RlbSBpbmZvXHUyMDI2XCIpO1xuICAgICAgICBjb25zdCBlbnZJbmZvID0gYXdhaXQgZW5naW5lLmdldEVudmlyb25tZW50SW5mbyhjZmcuaW50ZXJuZXRBY2Nlc3MsIGNmZy5kaXNrTGltaXRNQik7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lckluZm8gPSBhd2FpdCBlbmdpbmUuZ2V0Q29udGFpbmVySW5mbygpO1xuXG4gICAgICAgIGxldCBwcm9jZXNzZXM6IGFueVtdIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoc2hvd1Byb2Nlc3Nlcykge1xuICAgICAgICAgIGNvbnN0IHByb2NzID0gYXdhaXQgZW5naW5lLmxpc3RQcm9jZXNzZXMoKTtcbiAgICAgICAgICBwcm9jZXNzZXMgPSBwcm9jcy5tYXAocCA9PiAoe1xuICAgICAgICAgICAgcGlkOiBwLnBpZCxcbiAgICAgICAgICAgIHVzZXI6IHAudXNlcixcbiAgICAgICAgICAgIGNwdTogcC5jcHUgKyBcIiVcIixcbiAgICAgICAgICAgIG1lbW9yeTogcC5tZW1vcnkgKyBcIiVcIixcbiAgICAgICAgICAgIGNvbW1hbmQ6IHAuY29tbWFuZCxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRhaW5lcjoge1xuICAgICAgICAgICAgaWQ6IGNvbnRhaW5lckluZm8uaWQsXG4gICAgICAgICAgICBzdGF0ZTogY29udGFpbmVySW5mby5zdGF0ZSxcbiAgICAgICAgICAgIGltYWdlOiBjb250YWluZXJJbmZvLmltYWdlLFxuICAgICAgICAgICAgY3B1VXNhZ2U6IGNvbnRhaW5lckluZm8uY3B1VXNhZ2UsXG4gICAgICAgICAgICBtZW1vcnlVc2FnZTogY29udGFpbmVySW5mby5tZW1vcnlVc2FnZSxcbiAgICAgICAgICAgIG5ldHdvcmtNb2RlOiBjb250YWluZXJJbmZvLm5ldHdvcmtNb2RlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IGVudkluZm8sXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBpbnRlcm5ldEFjY2VzczogY2ZnLmludGVybmV0QWNjZXNzLFxuICAgICAgICAgICAgcGVyc2lzdGVuY2VNb2RlOiBjZmcucGVyc2lzdGVuY2VNb2RlLFxuICAgICAgICAgICAgY3B1TGltaXQ6IGNmZy5jcHVMaW1pdCA+IDAgPyBgJHtjZmcuY3B1TGltaXR9IGNvcmVzYCA6IFwidW5saW1pdGVkXCIsXG4gICAgICAgICAgICBtZW1vcnlMaW1pdDogYCR7Y2ZnLm1lbW9yeUxpbWl0TUJ9IE1CYCxcbiAgICAgICAgICAgIGNvbW1hbmRUaW1lb3V0OiBgJHtjZmcuY29tbWFuZFRpbWVvdXR9c2AsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi4ocHJvY2Vzc2VzID8geyBwcm9jZXNzZXMgfSA6IHt9KSxcbiAgICAgICAgICAuLi4oa2lsbFBpZCAhPT0gdW5kZWZpbmVkID8geyBraWxsZWRQaWQ6IGtpbGxQaWQgfSA6IHt9KSxcbiAgICAgICAgICBidWRnZXQ6IGJ1ZGdldFN0YXR1cygpLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgd2FybihgU3RhdHVzIGZhaWxlZDogJHttc2d9YCk7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBtc2csIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICAvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgLy8gVG9vbCA4OiBSZWJ1aWxkIENvbXB1dGVyXG4gIC8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCByZWJ1aWxkVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiUmVidWlsZENvbXB1dGVyXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBgRGVzdHJveSB0aGUgY3VycmVudCBjb250YWluZXIgYW5kIHJlYnVpbGQgaXQgZnJvbSBzY3JhdGNoIHVzaW5nIHRoZSBjdXJyZW50IHNldHRpbmdzLlxuXG5gICtcbiAgICAgIGBVc2UgdGhpcyB3aGVuOlxuYCArXG4gICAgICBgLSBJbnRlcm5ldCBhY2Nlc3MgaXMgbm90IHdvcmtpbmcgYWZ0ZXIgdG9nZ2xpbmcgdGhlIHNldHRpbmdcbmAgK1xuICAgICAgYC0gVGhlIGNvbnRhaW5lciBpcyBicm9rZW4gb3IgaW4gYSBiYWQgc3RhdGVcbmAgK1xuICAgICAgYC0gU2V0dGluZ3MgbGlrZSBiYXNlIGltYWdlIG9yIG5ldHdvcmsgd2VyZSBjaGFuZ2VkIGFuZCBuZWVkIHRvIHRha2UgZWZmZWN0XG5cbmAgK1xuICAgICAgYFdBUk5JTkc6IEFsbCBkYXRhIGluc2lkZSB0aGUgY29udGFpbmVyIHdpbGwgYmUgbG9zdC4gRmlsZXMgaW4gdGhlIHNoYXJlZCBmb2xkZXIgYXJlIHNhZmUuYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBjb25maXJtOiB6LmJvb2xlYW4oKVxuICAgICAgICAuZGVzY3JpYmUoXCJNdXN0IGJlIHRydWUgdG8gY29uZmlybSB5b3Ugd2FudCB0byBkZXN0cm95IGFuZCByZWJ1aWxkIHRoZSBjb250YWluZXIuXCIpLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGNvbmZpcm0gfSwgeyBzdGF0dXMsIHdhcm4gfSkgPT4ge1xuICAgICAgaWYgKCFjb25maXJtKSB7XG4gICAgICAgIHJldHVybiB7IGVycm9yOiBcIlNldCBjb25maXJtPXRydWUgdG8gcHJvY2VlZCB3aXRoIHJlYnVpbGQuXCIsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgc3RhdHVzKFwiU3RvcHBpbmcgYW5kIHJlbW92aW5nIGV4aXN0aW5nIGNvbnRhaW5lclx1MjAyNlwiKTtcbiAgICAgICAgYXdhaXQgZW5naW5lLmRlc3Ryb3lDb250YWluZXIoKTtcblxuICAgICAgICBzdGF0dXMoXCJSZWJ1aWxkaW5nIGNvbnRhaW5lciB3aXRoIGN1cnJlbnQgc2V0dGluZ3NcdTIwMjZcIik7XG4gICAgICAgIGF3YWl0IGVuZ2luZS5lbnN1cmVSZWFkeSh7XG4gICAgICAgICAgaW1hZ2U6IGNmZy5iYXNlSW1hZ2UgYXMgQ29udGFpbmVySW1hZ2UsXG4gICAgICAgICAgbmV0d29yazogKGNmZy5pbnRlcm5ldEFjY2VzcyA/IFwiYnJpZGdlXCIgOiBcIm5vbmVcIikgYXMgTmV0d29ya01vZGUsXG4gICAgICAgICAgY3B1TGltaXQ6IGNmZy5jcHVMaW1pdCxcbiAgICAgICAgICBtZW1vcnlMaW1pdE1COiBjZmcubWVtb3J5TGltaXRNQixcbiAgICAgICAgICBkaXNrTGltaXRNQjogY2ZnLmRpc2tMaW1pdE1CLFxuICAgICAgICAgIGF1dG9JbnN0YWxsUHJlc2V0OiBjZmcuYXV0b0luc3RhbGxQcmVzZXQsXG4gICAgICAgICAgcG9ydEZvcndhcmRzOiBjZmcucG9ydEZvcndhcmRzLFxuICAgICAgICAgIGhvc3RNb3VudFBhdGg6IGNmZy5ob3N0TW91bnRQYXRoLFxuICAgICAgICAgIHBlcnNpc3RlbmNlTW9kZTogY2ZnLnBlcnNpc3RlbmNlTW9kZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZW52SW5mbyA9IGF3YWl0IGVuZ2luZS5nZXRFbnZpcm9ubWVudEluZm8oY2ZnLmludGVybmV0QWNjZXNzLCBjZmcuZGlza0xpbWl0TUIpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVidWlsdDogdHJ1ZSxcbiAgICAgICAgICBvczogZW52SW5mby5vcyxcbiAgICAgICAgICBpbnRlcm5ldEFjY2VzczogY2ZnLmludGVybmV0QWNjZXNzLFxuICAgICAgICAgIG5ldHdvcmtNb2RlOiBjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWRcIixcbiAgICAgICAgICBtZXNzYWdlOiBcIkNvbnRhaW5lciByZWJ1aWx0IHN1Y2Nlc3NmdWxseSB3aXRoIGN1cnJlbnQgc2V0dGluZ3MuXCIsXG4gICAgICAgICAgYnVkZ2V0OiBidWRnZXRTdGF0dXMoKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIHdhcm4oYFJlYnVpbGQgZmFpbGVkOiAke21zZ31gKTtcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6IG1zZywgcmVidWlsdDogZmFsc2UsIGJ1ZGdldDogYnVkZ2V0U3RhdHVzKCkgfTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gW1xuICAgIGV4ZWN1dGVUb29sLFxuICAgIHdyaXRlRmlsZVRvb2wsXG4gICAgcmVhZEZpbGVUb29sLFxuICAgIGxpc3REaXJUb29sLFxuICAgIHVwbG9hZEZpbGVUb29sLFxuICAgIGRvd25sb2FkRmlsZVRvb2wsXG4gICAgc3RhdHVzVG9vbCxcbiAgICByZWJ1aWxkVG9vbCxcbiAgXTtcbn0iLCAiLyoqXG4gKiBAZmlsZSBwcmVwcm9jZXNzb3IudHNcbiAqIFByb21wdCBwcmVwcm9jZXNzb3IgXHUyMDE0IHNlcnZlcyB0d28gcHVycG9zZXM6XG4gKlxuICogICAxLiBSZXNldHMgdGhlIHBlci10dXJuIHRvb2wgY2FsbCBidWRnZXQgZXZlcnkgdGltZSB0aGUgdXNlciBzZW5kcyBhIG5ldyBtZXNzYWdlLlxuICogICAyLiBPcHRpb25hbGx5IGluamVjdHMgY29tcHV0ZXIgc3RhdGUgKE9TLCB0b29scywgbmV0d29yaykgaW50byB0aGUgbW9kZWwnc1xuICogICAgICBjb250ZXh0IHNvIGl0IGtub3dzIHdoYXQgaXQncyB3b3JraW5nIHdpdGggd2l0aG91dCBuZWVkaW5nIHRvIGFzay5cbiAqXG4gKiBGbG93OlxuICogICAxLiBVc2VyIHR5cGVzIGEgbWVzc2FnZVxuICogICAyLiBQcmVwcm9jZXNzb3IgZmlyZXMgXHUyMTkyIHJlc2V0cyB0b29sIGNhbGwgYnVkZ2V0IFx1MjE5MiBnYXRoZXJzIGNvbXB1dGVyIHN0YXRlXG4gKiAgIDMuIFByZXBlbmRzIGNvbXB1dGVyIGNvbnRleHQgdG8gdGhlIHVzZXIncyBtZXNzYWdlXG4gKiAgIDQuIE1vZGVsIHNlZXMgdGhlIGNvbnRleHQgYW5kIGNhbiBzdGFydCB1c2luZyB0b29scyBpbW1lZGlhdGVseVxuICovXG5cbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IGFkdmFuY2VUdXJuIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xuaW1wb3J0ICogYXMgZW5naW5lIGZyb20gXCIuL2NvbnRhaW5lci9lbmdpbmVcIjtcbmltcG9ydCB7IE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTLCBDT05UQUlORVJfV09SS0RJUiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5Db250cm9sbGVyIH0gZnJvbSBcIi4vcGx1Z2luVHlwZXNcIjtcblxuZnVuY3Rpb24gcmVhZENvbmZpZyhjdGw6IFBsdWdpbkNvbnRyb2xsZXIpIHtcbiAgY29uc3QgYyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG4gIHJldHVybiB7XG4gICAgYXV0b0luamVjdDogYy5nZXQoXCJhdXRvSW5qZWN0Q29udGV4dFwiKSA9PT0gXCJvblwiLFxuICAgIG1heFRvb2xDYWxsczogYy5nZXQoXCJtYXhUb29sQ2FsbHNQZXJUdXJuXCIpID8/IDI1LFxuICAgIGludGVybmV0QWNjZXNzOiBjLmdldChcImludGVybmV0QWNjZXNzXCIpID09PSBcIm9uXCIsXG4gICAgcGVyc2lzdGVuY2VNb2RlOiBjLmdldChcInBlcnNpc3RlbmNlTW9kZVwiKSB8fCBcInBlcnNpc3RlbnRcIixcbiAgICBiYXNlSW1hZ2U6IGMuZ2V0KFwiYmFzZUltYWdlXCIpIHx8IFwidWJ1bnR1OjI0LjA0XCIsXG4gIH07XG59XG5cbi8qKlxuICogQnVpbGQgYSBjb25jaXNlIGNvbnRleHQgYmxvY2sgYWJvdXQgdGhlIGNvbXB1dGVyJ3MgY3VycmVudCBzdGF0ZS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gYnVpbGRDb250ZXh0QmxvY2soY2ZnOiBSZXR1cm5UeXBlPHR5cGVvZiByZWFkQ29uZmlnPik6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIElmIGNvbnRhaW5lciBpc24ndCBydW5uaW5nIHlldCwganVzdCBkZXNjcmliZSB3aGF0J3MgYXZhaWxhYmxlXG4gIGlmICghZW5naW5lLmlzUmVhZHkoKSkge1xuICAgIHJldHVybiBbXG4gICAgICBgW0NvbXB1dGVyIFx1MjAxNCBBdmFpbGFibGVdYCxcbiAgICAgIGBZb3UgaGF2ZSBhIGRlZGljYXRlZCBMaW51eCBjb21wdXRlciAoJHtjZmcuYmFzZUltYWdlfSkgYXZhaWxhYmxlIHZpYSB0b29scy5gLFxuICAgICAgYEludGVybmV0OiAke2NmZy5pbnRlcm5ldEFjY2VzcyA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZFwifS5gLFxuICAgICAgYE1vZGU6ICR7Y2ZnLnBlcnNpc3RlbmNlTW9kZX0uYCxcbiAgICAgIGBUaGUgY29tcHV0ZXIgd2lsbCBzdGFydCBhdXRvbWF0aWNhbGx5IHdoZW4geW91IGZpcnN0IHVzZSBhIHRvb2wgKEV4ZWN1dGUsIFdyaXRlRmlsZSwgZXRjLikuYCxcbiAgICAgIGBXb3JraW5nIGRpcmVjdG9yeTogJHtDT05UQUlORVJfV09SS0RJUn1gLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIC8vIENvbnRhaW5lciBpcyBydW5uaW5nIFx1MjAxNCBnZXQgbGl2ZSBpbmZvXG4gIHRyeSB7XG4gICAgY29uc3QgcXVpY2tJbmZvID0gYXdhaXQgZW5naW5lLmV4ZWMoXG4gICAgICBgZWNobyBcIk9TPSQoY2F0IC9ldGMvb3MtcmVsZWFzZSAyPi9kZXYvbnVsbCB8IGdyZXAgUFJFVFRZX05BTUUgfCBjdXQgLWQ9IC1mMiB8IHRyIC1kICdcXFwiJylcIiAmJiBgICtcbiAgICAgIGBlY2hvIFwiVE9PTFM9JCh3aGljaCBnaXQgY3VybCB3Z2V0IHB5dGhvbjMgbm9kZSBnY2MgcGlwMyAyPi9kZXYvbnVsbCB8IHhhcmdzIC1Je30gYmFzZW5hbWUge30gfCB0ciAnXFxcXG4nICcsJylcIiAmJiBgICtcbiAgICAgIGBlY2hvIFwiRklMRVM9JChscyAke0NPTlRBSU5FUl9XT1JLRElSfSAyPi9kZXYvbnVsbCB8IGhlYWQgLTEwIHwgdHIgJ1xcXFxuJyAnLCcpXCIgJiYgYCArXG4gICAgICBgZWNobyBcIkRJU0s9JChkZiAtaCAke0NPTlRBSU5FUl9XT1JLRElSfSAyPi9kZXYvbnVsbCB8IHRhaWwgLTEgfCBhd2sgJ3twcmludCAkNCBcXFwiIGZyZWUgLyBcXFwiICQyIFxcXCIgdG90YWxcXFwifScpXCJgLFxuICAgICAgNSxcbiAgICAgIE1BWF9JTkpFQ1RFRF9DT05URVhUX0NIQVJTLFxuICAgICk7XG5cbiAgICBpZiAocXVpY2tJbmZvLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICByZXR1cm4gYFtDb21wdXRlciBcdTIwMTQgUnVubmluZyAoJHtjZmcuYmFzZUltYWdlfSksIEludGVybmV0OiAke2NmZy5pbnRlcm5ldEFjY2VzcyA/IFwib25cIiA6IFwib2ZmXCJ9XWA7XG4gICAgfVxuXG4gICAgY29uc3QgbGluZXMgPSBxdWlja0luZm8uc3Rkb3V0LnNwbGl0KFwiXFxuXCIpO1xuICAgIGNvbnN0IGdldCA9IChwcmVmaXg6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXMuZmluZChsID0+IGwuc3RhcnRzV2l0aChwcmVmaXggKyBcIj1cIikpO1xuICAgICAgcmV0dXJuIGxpbmU/LnNsaWNlKHByZWZpeC5sZW5ndGggKyAxKT8udHJpbSgpID8/IFwiXCI7XG4gICAgfTtcblxuICAgIGNvbnN0IG9zID0gZ2V0KFwiT1NcIik7XG4gICAgY29uc3QgdG9vbHMgPSBnZXQoXCJUT09MU1wiKS5zcGxpdChcIixcIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IGZpbGVzID0gZ2V0KFwiRklMRVNcIikuc3BsaXQoXCIsXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBkaXNrID0gZ2V0KFwiRElTS1wiKTtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtcbiAgICAgIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmddYCxcbiAgICAgIGBPUzogJHtvc31gLFxuICAgICAgYEludGVybmV0OiAke2NmZy5pbnRlcm5ldEFjY2VzcyA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZFwifWAsXG4gICAgICBgTW9kZTogJHtjZmcucGVyc2lzdGVuY2VNb2RlfWAsXG4gICAgICBgRGlzazogJHtkaXNrfWAsXG4gICAgXTtcblxuICAgIGlmICh0b29scy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKGBJbnN0YWxsZWQ6ICR7dG9vbHMuam9pbihcIiwgXCIpfWApO1xuICAgIH1cblxuICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKGBXb3Jrc3BhY2UgKCR7Q09OVEFJTkVSX1dPUktESVJ9KTogJHtmaWxlcy5qb2luKFwiLCBcIil9JHtmaWxlcy5sZW5ndGggPj0gMTAgPyBcIlx1MjAyNlwiIDogXCJcIn1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFydHMucHVzaChgV29ya3NwYWNlICgke0NPTlRBSU5FUl9XT1JLRElSfSk6IGVtcHR5YCk7XG4gICAgfVxuXG4gICAgcGFydHMucHVzaChcbiAgICAgIGBgLFxuICAgICAgYFVzZSB0aGUgRXhlY3V0ZSwgV3JpdGVGaWxlLCBSZWFkRmlsZSwgTGlzdERpcmVjdG9yeSwgVXBsb2FkRmlsZSwgRG93bmxvYWRGaWxlLCBvciBDb21wdXRlclN0YXR1cyB0b29scyB0byBpbnRlcmFjdCB3aXRoIHRoZSBjb21wdXRlci5gLFxuICAgICk7XG5cbiAgICByZXR1cm4gcGFydHMuam9pbihcIlxcblwiKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGBbQ29tcHV0ZXIgXHUyMDE0IFJ1bm5pbmcgKCR7Y2ZnLmJhc2VJbWFnZX0pLCBJbnRlcm5ldDogJHtjZmcuaW50ZXJuZXRBY2Nlc3MgPyBcIm9uXCIgOiBcIm9mZlwifV1gO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9tcHRQcmVwcm9jZXNzb3IoXG4gIGN0bDogUGx1Z2luQ29udHJvbGxlcixcbiAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGNmZyA9IHJlYWRDb25maWcoY3RsKTtcblxuICAvLyBBTFdBWVMgcmVzZXQgdGhlIHRvb2wgY2FsbCBidWRnZXQgb24gZXZlcnkgbmV3IHVzZXIgbWVzc2FnZS5cbiAgLy8gVGhpcyBpcyB0aGUgY29yZSBtZWNoYW5pc20gdGhhdCBsaW1pdHMgcGVyLXR1cm4gdG9vbCB1c2FnZS5cbiAgYWR2YW5jZVR1cm4oY2ZnLm1heFRvb2xDYWxscyk7XG5cbiAgLy8gU2tpcCBjb250ZXh0IGluamVjdGlvbiBpZiBkaXNhYmxlZFxuICBpZiAoIWNmZy5hdXRvSW5qZWN0KSByZXR1cm4gdXNlck1lc3NhZ2U7XG5cbiAgLy8gU2tpcCBmb3IgdmVyeSBzaG9ydCBtZXNzYWdlcyAoZ3JlZXRpbmdzLCBldGMuKVxuICBpZiAodXNlck1lc3NhZ2UubGVuZ3RoIDwgNSkgcmV0dXJuIHVzZXJNZXNzYWdlO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgY29udGV4dCA9IGF3YWl0IGJ1aWxkQ29udGV4dEJsb2NrKGNmZyk7XG4gICAgaWYgKCFjb250ZXh0KSByZXR1cm4gdXNlck1lc3NhZ2U7XG5cbiAgICByZXR1cm4gYCR7Y29udGV4dH1cXG5cXG4tLS1cXG5cXG4ke3VzZXJNZXNzYWdlfWA7XG4gIH0gY2F0Y2gge1xuICAgIC8vIE5ldmVyIGJsb2NrIHRoZSBjb252ZXJzYXRpb24gaWYgY29udGV4dCBpbmplY3Rpb24gZmFpbHNcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cbn1cbiIsICIvKipcbiAqIEBmaWxlIGluZGV4LnRzXG4gKiBMTSBTdHVkaW8gcGx1Z2luIGVudHJ5IHBvaW50LlxuICpcbiAqIFJlZ2lzdGVycyB0aHJlZSBob29rczpcbiAqICAgMS4gY29uZmlnU2NoZW1hdGljcyAgIFx1MjAxNCBzZXR0aW5ncyBVSSAobmV0d29yaywgcmVzb3VyY2VzLCBzYWZldHksIGV0Yy4pXG4gKiAgIDIuIHRvb2xzUHJvdmlkZXIgICAgICAgXHUyMDE0IDcgY29tcHV0ZXIgdG9vbHMgKGV4ZWN1dGUsIHJlYWQsIHdyaXRlLCBldGMuKVxuICogICAzLiBwcm9tcHRQcmVwcm9jZXNzb3IgIFx1MjAxNCBwZXItdHVybiBidWRnZXQgcmVzZXQgKyBhdXRvLWluamVjdCBjb21wdXRlciBjb250ZXh0XG4gKlxuICogVGhlIGNvbnRhaW5lciBpcyBsYXp5LWluaXRpYWxpemVkOiBub3RoaW5nIGhlYXZ5IGhhcHBlbnMgYXQgcGx1Z2luIGxvYWQgdGltZS5cbiAqIFRoZSBmaXJzdCB0b29sIGNhbGwgdHJpZ2dlcnMgaW1hZ2UgcHVsbCArIGNvbnRhaW5lciBjcmVhdGlvbi5cbiAqL1xuXG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyB0b29sc1Byb3ZpZGVyIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xuaW1wb3J0IHsgcHJvbXB0UHJlcHJvY2Vzc29yIH0gZnJvbSBcIi4vcHJlcHJvY2Vzc29yXCI7XG5pbXBvcnQgdHlwZSB7IFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiLi9wbHVnaW5UeXBlc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihjb250ZXh0OiBQbHVnaW5Db250ZXh0KSB7XG4gIGNvbnRleHQud2l0aENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gIGNvbnRleHQud2l0aFRvb2xzUHJvdmlkZXIodG9vbHNQcm92aWRlcik7XG4gIGNvbnRleHQud2l0aFByb21wdFByZXByb2Nlc3Nvcihwcm9tcHRQcmVwcm9jZXNzb3IpO1xufVxuIiwgImltcG9ydCB7IExNU3R1ZGlvQ2xpZW50LCB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5kZWNsYXJlIHZhciBwcm9jZXNzOiBhbnk7XG5cbi8vIFdlIHJlY2VpdmUgcnVudGltZSBpbmZvcm1hdGlvbiBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuY29uc3QgY2xpZW50SWRlbnRpZmllciA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX0lERU5USUZJRVI7XG5jb25zdCBjbGllbnRQYXNza2V5ID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfUEFTU0tFWTtcbmNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0JBU0VfVVJMO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxuICBiYXNlVXJsLFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7OztBQUFBLElBWUEsWUFFYTtBQWRiO0FBQUE7QUFBQTtBQVlBLGlCQUF1QztBQUVoQyxJQUFNLHVCQUFtQixtQ0FBdUIsRUFJcEQsTUFBTSxrQkFBa0IsVUFBVTtBQUFBLE1BQ2pDLGFBQWE7QUFBQSxNQUNiLFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxRQUNQLEVBQUUsT0FBTyxNQUFNLGFBQWEsK0NBQTBDO0FBQUEsUUFDdEUsRUFBRSxPQUFPLE9BQU8sYUFBYSw4Q0FBeUM7QUFBQSxNQUN4RTtBQUFBLElBQ0YsR0FBRyxLQUFLLEVBRVAsTUFBTSxtQkFBbUIsVUFBVTtBQUFBLE1BQ2xDLGFBQWE7QUFBQSxNQUNiLFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxRQUNQLEVBQUUsT0FBTyxjQUFjLGFBQWEsb0VBQStEO0FBQUEsUUFDbkcsRUFBRSxPQUFPLGFBQWEsYUFBYSxzREFBaUQ7QUFBQSxNQUN0RjtBQUFBLElBQ0YsR0FBRyxZQUFZLEVBRWQsTUFBTSxhQUFhLFVBQVU7QUFBQSxNQUM1QixhQUFhO0FBQUEsTUFDYixVQUFVO0FBQUEsTUFDVixTQUFTO0FBQUEsUUFDUCxFQUFFLE9BQU8sZ0JBQWdCLGFB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Q25ELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxlQUFlLENBQUMsY0FBYztBQUM1QixRQUFJLGNBQWM7QUFDaEIsWUFBTSxJQUFJLE1BQU0sOEJBQThCO0FBQUEsSUFDaEQ7QUFFQSxtQkFBZTtBQUNmLHlCQUFxQixhQUFhLFNBQVM7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLHdEQUE0QixLQUFLLE9BQU1DLFlBQVU7QUFDL0MsU0FBTyxNQUFNQSxRQUFPLEtBQUssYUFBYTtBQUN4QyxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ1osdUJBQXFCLGNBQWM7QUFDckMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ2xCLFVBQVEsTUFBTSxvREFBb0Q7QUFDbEUsVUFBUSxNQUFNLEtBQUs7QUFDckIsQ0FBQzsiLAogICJuYW1lcyI6IFsiZXhlY0FzeW5jIiwgImltcG9ydF9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF91dGlsIiwgInBhdGhKb2luIiwgImltcG9ydF9zZGsiLCAiaW1wb3J0X29zIiwgImltcG9ydF9wYXRoIiwgInJlYWRDb25maWciLCAiaW1wb3J0X3NkayIsICJjb25maWdTY2hlbWF0aWNzIiwgInRvb2xzUHJvdmlkZXIiLCAibW9kdWxlIl0KfQo=
