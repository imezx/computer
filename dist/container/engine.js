"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureReady = ensureReady;
exports.exec = exec;
exports.writeFile = writeFile;
exports.readFile = readFile;
exports.copyToContainer = copyToContainer;
exports.copyFromContainer = copyFromContainer;
exports.getEnvironmentInfo = getEnvironmentInfo;
exports.listProcesses = listProcesses;
exports.killProcess = killProcess;
exports.stopContainer = stopContainer;
exports.destroyContainer = destroyContainer;
exports.getContainerInfo = getContainerInfo;
exports.updateNetwork = updateNetwork;
exports.isReady = isReady;
exports.verifyHealth = verifyHealth;
exports.getContainerName = getContainerName;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const runtime_1 = require("./runtime");
const constants_1 = require("../constants");
const execAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Convert a Windows host path (C:\Users\foo) to the format Docker
 * on Windows expects for volume mounts (//c/Users/foo).
 * No-op on Linux/Mac.
 */
function toDockerPath(hostPath) {
    if (process.platform !== "win32")
        return hostPath;
    // Replace drive letter C:\ → //c/
    return hostPath
        .replace(/^([A-Za-z]):\\/, (_, d) => `//${d.toLowerCase()}/`)
        .replace(/\\/g, "/");
}
/**
 * Augment PATH with platform-specific locations where Docker/Podman
 * helper binaries live, so they're findable regardless of what PATH
 * LM Studio inherited from the OS launcher.
 */
function getRuntimeEnv() {
    const base = process.env.PATH ?? "";
    const extra = process.platform === "win32"
        ? [
            "C:\\Program Files\\Docker\\Docker\\resources\\bin",
            "C:\\Program Files\\Docker\\Docker\\resources",
        ]
        : ["/usr/bin", "/usr/local/bin", "/usr/lib/podman", "/usr/libexec/podman", "/bin"];
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
function ensurePodmanConfig() {
    try {
        const configDir = (0, path_1.join)((0, os_1.homedir)(), ".config", "containers");
        const configPath = (0, path_1.join)(configDir, "containers.conf");
        let existing = "";
        if ((0, fs_1.existsSync)(configPath)) {
            existing = (0, fs_1.readFileSync)(configPath, "utf-8");
        }
        const needsDNS = !existing.includes("dns_servers");
        const needsHelperDir = !existing.includes("helper_binaries_dir");
        if (!needsDNS && !needsHelperDir)
            return;
        (0, fs_1.mkdirSync)(configDir, { recursive: true });
        let updated = existing;
        // helper_binaries_dir tells Podman where to find slirp4netns/pasta
        // even when LM Studio's process has a restricted PATH.
        if (needsHelperDir) {
            const helperLine = 'helper_binaries_dir = ["/usr/bin", "/usr/local/bin", "/usr/lib/podman"]';
            updated = updated.includes("[network]")
                ? updated.replace("[network]", `[network]\n${helperLine}`)
                : updated + `\n[network]\n${helperLine}\n`;
        }
        // dns_servers bypasses systemd-resolved's 127.0.0.53 stub which
        // is unreachable from inside rootless containers.
        if (needsDNS) {
            const dnsLine = 'dns_servers = ["8.8.8.8", "8.8.4.4"]';
            updated = updated.includes("[containers]")
                ? updated.replace("[containers]", `[containers]\n${dnsLine}`)
                : updated + `\n[containers]\n${dnsLine}\n`;
        }
        (0, fs_1.writeFileSync)(configPath, updated, "utf-8");
        console.log("[lms-computer] Auto-configured Podman containers.conf (helper_binaries_dir + dns_servers).");
    }
    catch (err) {
        console.warn("[lms-computer] Could not write Podman config:", err);
    }
}
// ─── Singleton State ────────────────────────────────────────────
let runtime = null;
let containerName = "";
let containerReady = false;
let currentNetwork = "none";
let initPromise = null;
/**
 * Get the shell path for the given image.
 */
function shellFor(image) {
    return image.startsWith("alpine") ? constants_1.CONTAINER_SHELL_ALPINE : constants_1.CONTAINER_SHELL;
}
/**
 * Run a container runtime command and return stdout.
 */
async function run(args, timeoutMs = 30_000) {
    if (!runtime)
        throw new Error("Runtime not initialized");
    const { stdout } = await execAsync(runtime.path, args, {
        timeout: timeoutMs,
        maxBuffer: constants_1.MAX_OUTPUT_BYTES,
        env: getRuntimeEnv(),
    });
    return stdout.trim();
}
/**
 * Check current state of the managed container.
 */
async function getContainerState() {
    try {
        const out = await run([
            "inspect", containerName,
            "--format", "{{.State.Status}}",
        ]);
        const status = out.trim().toLowerCase();
        if (status === "running")
            return "running";
        if (["exited", "stopped", "created", "paused", "dead"].includes(status))
            return "stopped";
        return "error";
    }
    catch {
        return "not_found";
    }
}
/**
 * Build `docker run` / `podman run` arguments from options.
 */
function buildRunArgs(opts) {
    const args = [
        "run", "-d",
        "--name", opts.name,
        "--hostname", "lms-computer",
        // For Podman rootless with internet enabled, omit --network entirely so Podman
        // uses its own configured default (respects ~/.config/containers/containers.conf
        // dns_servers). Passing --network bridge fails without kernel privileges.
        // For Docker or network=none, pass the flag explicitly.
        ...(opts.network !== "podman-default" ? ["--network", opts.network] : []),
        // Inject explicit DNS servers to bypass systemd-resolved's 127.0.0.53 stub
        // which is unreachable from inside rootless containers.
        ...(opts.network !== "none" ? ["--dns", "8.8.8.8", "--dns", "8.8.4.4"] : []),
        // Use /root as the initial workdir — it always exists in any base image.
        // The real workdir (/home/user) is created later by setupContainer.
        // Podman (unlike Docker) validates the workdir at start time, so we must
        // start with a directory that is guaranteed to exist.
        "-w", "/root",
    ];
    // Resource limits
    if (opts.cpuLimit > 0) {
        args.push("--cpus", String(opts.cpuLimit));
    }
    if (opts.memoryLimitMB > 0) {
        args.push("--memory", `${opts.memoryLimitMB}m`);
        // Set swap equal to memory (prevents OOM-killer weirdness)
        args.push("--memory-swap", `${opts.memoryLimitMB}m`);
    }
    // Environment variables
    for (const [k, v] of Object.entries(opts.envVars)) {
        args.push("-e", `${k}=${v}`);
    }
    // Port forwards
    for (const pf of opts.portForwards) {
        const trimmed = pf.trim();
        if (trimmed)
            args.push("-p", trimmed);
    }
    // Host mount
    if (opts.hostMountPath) {
        args.push("-v", `${toDockerPath(opts.hostMountPath)}:/mnt/shared`);
    }
    // Keep the container alive with a sleep loop
    args.push(opts.image, "tail", "-f", "/dev/null");
    return args;
}
/**
 * Create the user workspace and install packages inside the container.
 */
async function setupContainer(image, preset, hasNetwork = false) {
    const shell = shellFor(image);
    // Create the working directory and a non-root user
    await run(["exec", containerName, shell, "-c",
        `mkdir -p ${constants_1.CONTAINER_WORKDIR} && ` +
            `(id user >/dev/null 2>&1 || adduser --disabled-password --gecos "" --home ${constants_1.CONTAINER_WORKDIR} user 2>/dev/null || ` +
            `adduser -D -h ${constants_1.CONTAINER_WORKDIR} user 2>/dev/null || true)`,
    ], 15_000);
    // Install packages if a preset is selected and the container has network access.
    // Skip silently if network is none — user can enable Internet Access in settings.
    if (preset && preset !== "none" && hasNetwork) {
        const isAlpine = image.startsWith("alpine");
        const presets = isAlpine ? constants_1.PACKAGE_PRESETS_ALPINE : constants_1.PACKAGE_PRESETS;
        const packages = presets[preset];
        if (packages && packages.length > 0) {
            const installCmd = isAlpine
                ? `apk update && apk add --no-cache ${packages.join(" ")}`
                : `apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${packages.join(" ")} && apt-get clean && rm -rf /var/lib/apt/lists/*`;
            // This can take a while, especially for the 'full' preset
            // Non-fatal: if the install fails (e.g. transient network issue), log and continue.
            // The model can install packages manually once the container is running.
            try {
                await run(["exec", containerName, shell, "-c", installCmd], 180_000);
            }
            catch (installErr) {
                console.warn("[lms-computer] Package install failed (non-fatal):", installErr?.message ?? installErr);
            }
        }
    }
}
// ─── Public API ─────────────────────────────────────────────────
/**
 * Initialize the container engine: detect runtime, create or start
 * the container if needed. Safe to call multiple times (idempotent).
 */
async function ensureReady(opts) {
    if (containerReady) {
        // Container is running — currentNetwork was set when it was created or last inspected.
        // If the desired network matches, nothing to do.
        const wantsNetwork = opts.network !== "none";
        const hasNetwork = currentNetwork !== "none";
        if (wantsNetwork === hasNetwork)
            return;
        // Network mismatch on a hot container — tear it down and let initPromise recreate it.
        containerReady = false;
        currentNetwork = "none";
        try {
            await run(["stop", containerName], 15_000);
        }
        catch { /* ignore */ }
        try {
            await run(["rm", "-f", containerName], 10_000);
        }
        catch { /* ignore */ }
        // Fall through to normal init below
    }
    if (initPromise)
        return initPromise;
    initPromise = (async () => {
        // Detect runtime
        runtime = await (0, runtime_1.detectRuntime)();
        containerName = `${constants_1.CONTAINER_NAME_PREFIX}-main`;
        // Auto-configure DNS for Podman rootless (fixes systemd-resolved stub issue)
        if (runtime.kind === "podman") {
            ensurePodmanConfig();
        }
        const state = await getContainerState();
        if (state === "running") {
            // Read the actual network mode from the running container.
            // Podman returns "slirp4netns", "pasta", or "podman" for enabled networks;
            // Docker returns "bridge". We normalise to "none" vs "enabled".
            let actuallyHasNetwork = false;
            try {
                const netOut = await run(["inspect", containerName, "--format", "{{.HostConfig.NetworkMode}}"]);
                const actualNet = netOut.trim().toLowerCase();
                actuallyHasNetwork = actualNet !== "none" && actualNet !== "";
            }
            catch { /* assume no network */ }
            const wantsNetwork = opts.network !== "none";
            if (actuallyHasNetwork === wantsNetwork) {
                // Network matches — nothing to do.
                currentNetwork = wantsNetwork ? opts.network : "none";
                containerReady = true;
                return;
            }
            // Network mismatch — must recreate the container.
            // (Podman rootless can't change network on a running container;
            //  Docker could use network connect/disconnect but recreating is simpler and reliable.)
            console.log(`[lms-computer] Network mismatch (container has ${actuallyHasNetwork ? "internet" : "no internet"}, settings want ${wantsNetwork ? "internet" : "no internet"}) — recreating container.`);
            try {
                await run(["stop", containerName], 15_000);
            }
            catch { /* already stopped */ }
            try {
                await run(["rm", "-f", containerName], 10_000);
            }
            catch { /* already gone */ }
            // Fall through to container creation below
        }
        if (state === "stopped") {
            // Start existing stopped container.
            // If it fails (e.g. a previous creation attempt left a broken container
            // whose workdir was never created), remove it and fall through to recreate.
            try {
                await run(["start", containerName]);
                containerReady = true;
                // We don't know what network it was started with — leave currentNetwork as-is
                // and let the network-sync logic below handle any mismatch.
                return;
            }
            catch (err) {
                const msg = err?.message ?? "";
                if (msg.includes("workdir") || msg.includes("does not exist") || msg.includes("netns") || msg.includes("mount runtime")) {
                    // Broken container — remove it and recreate cleanly below
                    try {
                        await run(["rm", "-f", containerName], 10_000);
                    }
                    catch { /* ignore */ }
                }
                else {
                    throw err;
                }
            }
        }
        // Container not found — pull image and create
        try {
            await run(["pull", opts.image], 300_000);
        }
        catch {
            // Image might already exist locally, continue
        }
        const portForwards = opts.portForwards
            ? opts.portForwards.split(",").map(s => s.trim()).filter(Boolean)
            : [];
        // Pick setup network based on runtime and user preference:
        // - Docker: "bridge" always works fine
        // - Podman + internet enabled: omit --network flag ("podman-default") so
        //   Podman uses its own default with proper DNS (respects containers.conf)
        // - Podman + internet disabled: "none" — no network needed, skip packages
        let setupNetwork = "none";
        if (runtime?.kind === "docker") {
            setupNetwork = opts.network === "none" ? "none" : "bridge";
        }
        else if (runtime?.kind === "podman" && opts.network !== "none") {
            setupNetwork = "podman-default";
        }
        const createArgs = buildRunArgs({
            image: opts.image,
            name: containerName,
            network: setupNetwork,
            cpuLimit: opts.cpuLimit,
            memoryLimitMB: opts.memoryLimitMB,
            diskLimitMB: opts.diskLimitMB,
            workdir: constants_1.CONTAINER_WORKDIR,
            envVars: constants_1.CONTAINER_ENV_VARS,
            portForwards,
            hostMountPath: opts.hostMountPath || null,
        });
        // Try with disk quota first; fall back without it if the storage driver
        // doesn't support it (e.g. ext4 only supports size= on XFS).
        const diskOptArgs = [...createArgs];
        if (opts.diskLimitMB > 0) {
            diskOptArgs.splice(diskOptArgs.indexOf(opts.image), 0, "--storage-opt", `size=${opts.diskLimitMB}m`);
        }
        try {
            await run(diskOptArgs, 60_000);
        }
        catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("storage-opt") || msg.includes("backingFS") || msg.includes("overlay.size")) {
                // Storage driver doesn't support quotas — retry without the flag
                console.warn("[lms-computer] Disk quota not supported by storage driver, starting without size limit.");
                await run(createArgs, 60_000);
            }
            else {
                throw err;
            }
        }
        // Setup: create user, install packages (skipped if no network)
        const hasNetworkForSetup = setupNetwork !== "none";
        await setupContainer(opts.image, opts.autoInstallPreset, hasNetworkForSetup);
        // If the user wants no network access, disconnect now that setup is done.
        // Only disconnect if we actually connected something during setup.
        if (opts.network === "none" && setupNetwork !== "none") {
            try {
                await run(["network", "disconnect", setupNetwork, containerName], 10_000);
            }
            catch { /* best effort — container still works, just has network */ }
        }
        currentNetwork = setupNetwork !== "none" ? opts.network : "none";
        containerReady = true;
    })();
    try {
        await initPromise;
    }
    finally {
        initPromise = null;
    }
}
/**
 * Execute a command inside the container.
 */
async function exec(command, timeoutSeconds, maxOutputBytes = constants_1.DEFAULT_MAX_OUTPUT_BYTES, workdir) {
    if (!runtime || !containerReady) {
        throw new Error("Container not ready. Call ensureReady() first.");
    }
    const start = Date.now();
    const cwd = workdir ?? constants_1.CONTAINER_WORKDIR;
    const shell = containerName.includes("alpine") ? constants_1.CONTAINER_SHELL_ALPINE : constants_1.CONTAINER_SHELL;
    return new Promise((resolve) => {
        const args = [
            "exec", "-w", cwd,
            containerName,
            shell, "-c", command,
        ];
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let killed = false;
        const proc = (0, child_process_1.spawn)(runtime.path, args, {
            timeout: timeoutSeconds * 1000,
            stdio: ["ignore", "pipe", "pipe"],
            env: getRuntimeEnv(),
        });
        const effectiveMax = Math.min(maxOutputBytes, constants_1.MAX_OUTPUT_BYTES);
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
        // Handle timeout
        const timer = setTimeout(() => {
            timedOut = true;
            killed = true;
            proc.kill("SIGKILL");
        }, timeoutSeconds * 1000 + 500);
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
                truncated: stdoutTruncated || stderrTruncated,
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
                truncated: false,
            });
        });
    });
}
/**
 * Write a file inside the container using stdin piping.
 */
async function writeFile(filePath, content) {
    if (!runtime || !containerReady) {
        throw new Error("Container not ready.");
    }
    // Use docker exec with stdin to write file content
    // This avoids shell escaping issues
    return new Promise((resolve, reject) => {
        const shell = containerName.includes("alpine") ? constants_1.CONTAINER_SHELL_ALPINE : constants_1.CONTAINER_SHELL;
        const proc = (0, child_process_1.spawn)(runtime.path, [
            "exec", "-i",
            containerName,
            shell, "-c", `cat > '${filePath.replace(/'/g, "'\\''")}'`,
        ], {
            timeout: 15_000,
            stdio: ["pipe", "ignore", "pipe"],
            env: getRuntimeEnv(),
        });
        let stderr = "";
        proc.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
        proc.on("close", (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`Write failed (exit ${code}): ${stderr}`));
        });
        proc.on("error", reject);
        proc.stdin?.write(content);
        proc.stdin?.end();
    });
}
/**
 * Read a file from the container.
 */
async function readFile(filePath, maxBytes) {
    if (!runtime || !containerReady) {
        throw new Error("Container not ready.");
    }
    const result = await exec(`cat '${filePath.replace(/'/g, "'\\''")}'`, 10, maxBytes);
    if (result.exitCode !== 0) {
        throw new Error(`Read failed: ${result.stderr || "file not found"}`);
    }
    return result.stdout;
}
/**
 * Copy a file from the host into the container.
 */
async function copyToContainer(hostPath, containerPath) {
    if (!runtime)
        throw new Error("Runtime not initialized.");
    await run(["cp", hostPath, `${containerName}:${containerPath}`], 60_000);
}
/**
 * Copy a file from the container to the host.
 */
async function copyFromContainer(containerPath, hostPath) {
    if (!runtime)
        throw new Error("Runtime not initialized.");
    await run(["cp", `${containerName}:${containerPath}`, hostPath], 60_000);
}
/**
 * Get environment info from inside the container.
 */
async function getEnvironmentInfo(network, diskLimitMB = 0) {
    const infoScript = `
echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
echo "KERNEL=$(uname -r)"
echo "ARCH=$(uname -m)"
echo "HOSTNAME=$(hostname)"
echo "UPTIME=$(uptime -p 2>/dev/null || uptime)"
DISK_USED_KB=$(du -sk ${constants_1.CONTAINER_WORKDIR} 2>/dev/null | awk '{print $1}' || echo 0)
echo "DISK_USED_KB=\$DISK_USED_KB"
echo "DISK_FREE_RAW=$(df -k ${constants_1.CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4}')"
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
    const get = (prefix) => {
        const line = lines.find(l => l.startsWith(prefix + "="));
        return line?.slice(prefix.length + 1)?.trim() ?? "N/A";
    };
    // Compute disk values: if a limit is configured, report against it.
    // Otherwise fall back to raw filesystem values.
    const diskUsedKB = parseInt(get("DISK_USED_KB") || "0", 10);
    const diskFreeRawKB = parseInt(get("DISK_FREE_RAW") || "0", 10);
    let diskTotal;
    let diskFree;
    if (diskLimitMB > 0) {
        const diskLimitKB = diskLimitMB * 1024;
        const diskFreeKB = Math.max(0, diskLimitKB - diskUsedKB);
        const toMiB = (kb) => kb >= 1024 * 1024
            ? `${(kb / 1024 / 1024).toFixed(1)}GiB`
            : `${Math.round(kb / 1024)}MiB`;
        diskTotal = toMiB(diskLimitKB);
        diskFree = toMiB(diskFreeKB);
    }
    else {
        const toMiB = (kb) => kb >= 1024 * 1024
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
        workdir: constants_1.CONTAINER_WORKDIR,
        networkEnabled: network,
    };
}
/**
 * List processes running inside the container.
 */
async function listProcesses() {
    const result = await exec("ps aux --no-headers 2>/dev/null || ps aux 2>/dev/null", 5);
    if (result.exitCode !== 0)
        return [];
    return result.stdout
        .split("\n")
        .filter(line => line.trim() && !line.includes("ps aux"))
        .map(line => {
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
        .filter(p => p.pid > 0);
}
/**
 * Kill a process inside the container.
 */
async function killProcess(pid, signal = "SIGTERM") {
    const result = await exec(`kill -${signal} ${pid}`, 5);
    return result.exitCode === 0;
}
/**
 * Stop and optionally remove the container.
 */
async function stopContainer(remove = false) {
    if (!runtime)
        return;
    try {
        await run(["stop", containerName], 15_000);
    }
    catch { /* already stopped */ }
    if (remove) {
        try {
            await run(["rm", "-f", containerName], 10_000);
        }
        catch { /* already removed */ }
    }
    containerReady = false;
}
/**
 * Destroy the container and all its data.
 */
async function destroyContainer() {
    await stopContainer(true);
    containerReady = false;
    currentNetwork = "none";
    initPromise = null;
}
/**
 * Get detailed container info.
 */
async function getContainerInfo() {
    if (!runtime)
        throw new Error("Runtime not initialized.");
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
        const format = '{{.Id}}\t{{.Config.Image}}\t{{.Created}}\t{{.State.Status}}\t{{.HostConfig.NetworkMode}}';
        const out = await run(["inspect", containerName, "--format", format]);
        const [id, image, created, , networkMode] = out.split("\t");
        // Get stats if running
        let cpuUsage = null;
        let memoryUsage = null;
        if (state === "running") {
            try {
                const stats = await run([
                    "stats", containerName, "--no-stream",
                    "--format", "{{.CPUPerc}}\t{{.MemUsage}}",
                ], 10_000);
                const [cpu, mem] = stats.split("\t");
                cpuUsage = cpu?.trim() ?? null;
                memoryUsage = mem?.trim() ?? null;
            }
            catch { /* stats not available */ }
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
    }
    catch {
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
async function updateNetwork(mode, opts) {
    // Docker doesn't allow changing network on a running container,
    // so we need to recreate it.
    const hadContainer = (await getContainerState()) !== "not_found";
    if (hadContainer) {
        // Commit current state to a temporary image if persistent
        const tempImage = `${containerName}-state:latest`;
        if (opts.persistenceMode === "persistent") {
            try {
                await run(["commit", containerName, tempImage], 60_000);
            }
            catch { /* best effort */ }
        }
        await destroyContainer();
        // Recreate with new network settings, using committed image if available
        const useImage = opts.persistenceMode === "persistent" ? tempImage : opts.image;
        const actualOpts = { ...opts, network: mode };
        // Override image for recreation
        containerReady = false;
        await ensureReady({ ...actualOpts, image: useImage });
        // Clean up temp image
        if (opts.persistenceMode === "persistent") {
            try {
                await run(["rmi", tempImage], 10_000);
            }
            catch { /* best effort */ }
        }
    }
}
/**
 * Check if the container engine is ready.
 */
function isReady() {
    return containerReady;
}
/**
 * Verify the container is actually running. If it has been deleted or stopped
 * externally, resets containerReady so ensureReady() will recreate it.
 * Call this at the start of every tool implementation.
 */
async function verifyHealth() {
    if (!containerReady)
        return;
    try {
        const state = await getContainerState();
        if (state !== "running") {
            containerReady = false;
            currentNetwork = "none";
        }
    }
    catch {
        containerReady = false;
        currentNetwork = "none";
    }
}
/**
 * Get the container name.
 */
function getContainerName() {
    return containerName;
}
//# sourceMappingURL=engine.js.map