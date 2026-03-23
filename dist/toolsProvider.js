"use strict";
/**
 * @file toolsProvider.ts
 * Registers all computer tools with LM Studio.
 *
 * Tools:
 *   1. Execute         — run any shell command
 *   2. Write File      — create/overwrite files inside the container
 *   3. Read File       — read file contents from the container
 *   4. List Directory  — list directory contents with metadata
 *   5. Upload File     — transfer a file from the host into the container
 *   6. Download File   — pull a file from the container to the host
 *   7. Computer Status — environment info, processes, resource usage
 *
 * Every tool enforces the per-turn call budget before executing.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnBudget = void 0;
exports.advanceTurn = advanceTurn;
exports.toolsProvider = toolsProvider;
const sdk_1 = require("@lmstudio/sdk");
const os_1 = require("os");
const path_1 = require("path");
const zod_1 = require("zod");
const config_1 = require("./config");
const engine = __importStar(require("./container/engine"));
const guard_1 = require("./safety/guard");
const constants_1 = require("./constants");
function readConfig(ctl) {
    const c = ctl.getPluginConfig(config_1.configSchematics);
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
        autoInjectContext: c.get("autoInjectContext") === "on",
    };
}
/**
 * Shared turn budget. The preprocessor increments `turnId` each time
 * a new user message arrives, which resets the call count.
 */
exports.turnBudget = {
    turnId: 0,
    callsUsed: 0,
    maxCalls: 25,
};
/** Called by the preprocessor to signal a new turn. */
function advanceTurn(maxCalls) {
    exports.turnBudget.turnId++;
    exports.turnBudget.callsUsed = 0;
    exports.turnBudget.maxCalls = maxCalls;
}
/**
 * Check and consume one tool call from the budget.
 * Returns an error string if the budget is exhausted, or null if OK.
 */
function consumeBudget() {
    exports.turnBudget.callsUsed++;
    if (exports.turnBudget.callsUsed > exports.turnBudget.maxCalls) {
        return (`Tool call budget exhausted: you've used ${exports.turnBudget.maxCalls}/${exports.turnBudget.maxCalls} ` +
            `calls this turn. Wait for the user's next message to continue. ` +
            `(Configurable in plugin settings → "Max Tool Calls Per Turn")`);
    }
    return null;
}
/** Return a budget status string for tool responses. */
function budgetStatus() {
    return {
        callsUsed: exports.turnBudget.callsUsed,
        callsRemaining: Math.max(0, exports.turnBudget.maxCalls - exports.turnBudget.callsUsed),
        maxPerTurn: exports.turnBudget.maxCalls,
    };
}
async function ensureContainer(cfg, status) {
    await engine.verifyHealth();
    if (engine.isReady())
        return;
    status("Starting computer… (first use may take a moment to pull the image)");
    await engine.ensureReady({
        image: cfg.baseImage,
        network: (cfg.internetAccess ? "bridge" : "none"),
        cpuLimit: cfg.cpuLimit,
        memoryLimitMB: cfg.memoryLimitMB,
        diskLimitMB: cfg.diskLimitMB,
        autoInstallPreset: cfg.autoInstallPreset,
        portForwards: cfg.portForwards,
        hostMountPath: cfg.hostMountPath,
        persistenceMode: cfg.persistenceMode,
    });
}
async function toolsProvider(ctl) {
    const cfg = readConfig(ctl);
    exports.turnBudget.maxCalls = cfg.maxToolCallsPerTurn;
    const executeTool = (0, sdk_1.tool)({
        name: "Execute",
        description: `Run a shell command on your dedicated Linux computer.\n\n` +
            `IMPORTANT: This runs in a persistent shell session — state is preserved between calls.\n` +
            `• cd, export, source, nvm use, conda activate — all persist across commands\n` +
            `• You are always in the same shell; no need to repeat setup\n` +
            `• Use pwd to check where you are, env to see variables\n\n` +
            `This is a real isolated Linux container. You can install packages, ` +
            `compile code, run scripts, manage files, start services, etc.\n\n` +
            `TIPS:\n` +
            `• Chain with && or ; as usual\n` +
            `• Use 2>&1 to capture stderr\n` +
            `• Background long tasks with & (e.g. starting a server)\n` +
            `• Install packages with apt-get (Ubuntu/Debian) or apk (Alpine)`,
        parameters: {
            command: zod_1.z
                .string()
                .min(1)
                .max(8_000)
                .describe("Shell command to execute. Supports pipes, redirects, chaining."),
            timeout: zod_1.z
                .number()
                .int()
                .min(1)
                .max(constants_1.MAX_TIMEOUT_SECONDS)
                .optional()
                .describe(`Timeout in seconds (default: ${cfg.commandTimeout}, max: ${constants_1.MAX_TIMEOUT_SECONDS}). Increase for long operations like package installs.`),
            workdir: zod_1.z
                .string()
                .optional()
                .describe(`Working directory for the command (default: ${constants_1.CONTAINER_WORKDIR}).`),
        },
        implementation: async ({ command, timeout, workdir }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            if (cfg.strictSafety) {
                const check = (0, guard_1.checkCommand)(command, true);
                if (!check.allowed) {
                    warn(check.reason);
                    return { error: check.reason, exitCode: -1 };
                }
            }
            try {
                await ensureContainer(cfg, status);
                status(`Running: ${command.length > 80 ? command.slice(0, 77) + "…" : command}`);
                const result = await engine.exec(command, timeout ?? cfg.commandTimeout, cfg.maxOutputSize, workdir);
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
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Execution failed: ${msg}`);
                return { error: msg, exitCode: -1, budget: budgetStatus() };
            }
        },
    });
    const writeFileTool = (0, sdk_1.tool)({
        name: "WriteFile",
        description: `Create or overwrite a complete file inside the computer.\n\n` +
            `Use for new files or when replacing the entire content. ` +
            `For editing existing files, prefer StrReplace or InsertLines — ` +
            `they are faster and use far less context. ` +
            `Parent directories are created automatically.`,
        parameters: {
            path: zod_1.z
                .string()
                .min(1)
                .max(500)
                .describe(`File path inside the container. Relative paths are relative to ${constants_1.CONTAINER_WORKDIR}.`),
            content: zod_1.z
                .string()
                .max(constants_1.MAX_FILE_WRITE_BYTES)
                .describe("File content to write."),
            makeExecutable: zod_1.z
                .boolean()
                .optional()
                .describe("Set the executable bit (chmod +x) after writing. Useful for scripts."),
        },
        implementation: async ({ path: filePath, content, makeExecutable }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                const dir = filePath.includes("/")
                    ? filePath.slice(0, filePath.lastIndexOf("/"))
                    : null;
                if (dir) {
                    await engine.exec(`mkdir -p '${dir.replace(/'/g, "'\\''")}'`, 5);
                }
                status(`Writing: ${filePath}`);
                await engine.writeFile(filePath, content);
                if (makeExecutable) {
                    await engine.exec(`chmod +x '${filePath.replace(/'/g, "'\\''")}'`, 5);
                }
                return {
                    written: true,
                    path: filePath,
                    bytesWritten: Buffer.byteLength(content, "utf-8"),
                    executable: makeExecutable ?? false,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Write failed: ${msg}`);
                return { error: msg, written: false, budget: budgetStatus() };
            }
        },
    });
    const readFileTool = (0, sdk_1.tool)({
        name: "ReadFile",
        description: `Read a file from the computer, optionally limited to a line range.\n\n` +
            `Always read a file before editing it with StrReplace. ` +
            `For large files use startLine/endLine to read only the section you need — ` +
            `this keeps context short. Binary files may not display correctly.`,
        parameters: {
            path: zod_1.z
                .string()
                .min(1)
                .max(500)
                .describe("File path inside the container."),
            startLine: zod_1.z
                .number()
                .int()
                .min(1)
                .optional()
                .describe("First line to return (1-based, inclusive)."),
            endLine: zod_1.z
                .number()
                .int()
                .min(1)
                .optional()
                .describe("Last line to return (1-based, inclusive). Requires startLine."),
        },
        implementation: async ({ path: filePath, startLine, endLine }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                status(`Reading: ${filePath}`);
                const { content, totalLines } = await engine.readFile(filePath, constants_1.MAX_FILE_READ_BYTES, startLine, endLine);
                return {
                    path: filePath,
                    content,
                    totalLines,
                    lineRange: startLine
                        ? { from: startLine, to: endLine ?? totalLines }
                        : undefined,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Read failed: ${msg}`);
                return {
                    error: msg,
                    path: filePath,
                    hint: "Check the path is correct with ListDirectory.",
                    budget: budgetStatus(),
                };
            }
        },
    });
    const strReplaceTool = (0, sdk_1.tool)({
        name: "StrReplace",
        description: `Replace an exact unique string in a file with new content.\n\n` +
            `This is the preferred way to edit existing files — use it instead of ` +
            `rewriting the whole file with WriteFile.\n\n` +
            `Rules:\n` +
            `• oldStr must match the file exactly (whitespace, indentation included)\n` +
            `• oldStr must appear exactly once — make it unique by including surrounding lines\n` +
            `• Always ReadFile first to see the current content\n` +
            `• To delete a section, set newStr to an empty string`,
        parameters: {
            path: zod_1.z
                .string()
                .min(1)
                .max(500)
                .describe("File path inside the container."),
            oldStr: zod_1.z
                .string()
                .min(1)
                .describe("The exact string to find and replace. Must be unique in the file."),
            newStr: zod_1.z
                .string()
                .describe("The replacement string. Use empty string to delete."),
        },
        implementation: async ({ path: filePath, oldStr, newStr }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                status(`Editing: ${filePath}`);
                const { replacements } = await engine.strReplaceInFile(filePath, oldStr, newStr);
                return {
                    edited: true,
                    path: filePath,
                    replacements,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`StrReplace failed: ${msg}`);
                return { error: msg, edited: false, budget: budgetStatus() };
            }
        },
    });
    const insertLinesTool = (0, sdk_1.tool)({
        name: "InsertLines",
        description: `Insert lines into a file at a specific position.\n\n` +
            `Use this to add new content without replacing existing content. ` +
            `afterLine=0 prepends to the file. afterLine equal to the total line count appends.`,
        parameters: {
            path: zod_1.z
                .string()
                .min(1)
                .max(500)
                .describe("File path inside the container."),
            afterLine: zod_1.z
                .number()
                .int()
                .min(0)
                .describe("Insert after this line number (1-based). Use 0 to insert at the top."),
            content: zod_1.z.string().describe("The lines to insert."),
        },
        implementation: async ({ path: filePath, afterLine, content }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                status(`Inserting into: ${filePath}`);
                await engine.insertLinesInFile(filePath, afterLine, content);
                return {
                    inserted: true,
                    path: filePath,
                    afterLine,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`InsertLines failed: ${msg}`);
                return { error: msg, inserted: false, budget: budgetStatus() };
            }
        },
    });
    const listDirTool = (0, sdk_1.tool)({
        name: "ListDirectory",
        description: `List files and directories inside the computer.\n\n` +
            `Returns structured directory listing with file types, sizes, and permissions.`,
        parameters: {
            path: zod_1.z
                .string()
                .optional()
                .describe(`Directory path (default: ${constants_1.CONTAINER_WORKDIR}).`),
            showHidden: zod_1.z
                .boolean()
                .optional()
                .describe("Include hidden files (dotfiles). Default: false."),
            recursive: zod_1.z
                .boolean()
                .optional()
                .describe("List recursively up to 3 levels deep. Default: false."),
        },
        implementation: async ({ path: dirPath, showHidden, recursive }, { status }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                const target = dirPath ?? constants_1.CONTAINER_WORKDIR;
                const hidden = showHidden ? "-a" : "";
                let cmd;
                if (recursive) {
                    cmd = `find '${target.replace(/'/g, "'\\''")}'  -maxdepth 3 ${showHidden ? "" : "-not -path '*/.*'"} -printf '%y %s %T@ %p\\n' 2>/dev/null | head -200`;
                }
                else {
                    cmd = `ls -l ${hidden} --time-style=long-iso '${target.replace(/'/g, "'\\''")}'  2>/dev/null || ls -l ${hidden} '${target.replace(/'/g, "'\\''")}'`;
                }
                status(`Listing: ${target}`);
                const result = await engine.exec(cmd, 10);
                if (result.exitCode !== 0) {
                    return {
                        error: result.stderr || "Directory not found",
                        path: target,
                        budget: budgetStatus(),
                    };
                }
                return {
                    path: target,
                    listing: result.stdout,
                    recursive: recursive ?? false,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { error: msg, budget: budgetStatus() };
            }
        },
    });
    const uploadFileTool = (0, sdk_1.tool)({
        name: "UploadFile",
        description: `Transfer a file from the user's host computer into the container.\n\n` +
            `Use this when the user shares a file they want you to work with. ` +
            `The file will be copied into the container at the specified path.`,
        parameters: {
            hostPath: zod_1.z
                .string()
                .min(1)
                .max(1000)
                .describe("Absolute path to the file on the user's host machine."),
            containerPath: zod_1.z
                .string()
                .optional()
                .describe(`Destination path inside the container (default: ${constants_1.CONTAINER_WORKDIR}/<filename>).`),
        },
        implementation: async ({ hostPath, containerPath }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                const filename = hostPath.split("/").pop() ?? hostPath.split("\\").pop() ?? "file";
                const dest = containerPath ?? `${constants_1.CONTAINER_WORKDIR}/${filename}`;
                status(`Uploading: ${filename} → ${dest}`);
                await engine.copyToContainer(hostPath, dest);
                return {
                    uploaded: true,
                    hostPath,
                    containerPath: dest,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Upload failed: ${msg}`);
                return { error: msg, uploaded: false, budget: budgetStatus() };
            }
        },
    });
    const downloadFileTool = (0, sdk_1.tool)({
        name: "DownloadFile",
        description: `Transfer a file from the container to the user's host computer.\n\n` +
            `Use this to give the user a file you created or modified inside the computer.`,
        parameters: {
            containerPath: zod_1.z
                .string()
                .min(1)
                .max(500)
                .describe("Path to the file inside the container."),
            hostPath: zod_1.z
                .string()
                .optional()
                .describe("Destination path on the host. Default: user's home directory + filename."),
        },
        implementation: async ({ containerPath, hostPath }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                const filename = containerPath.split("/").pop() ?? "file";
                const dest = hostPath ?? (0, path_1.join)((0, os_1.homedir)(), filename);
                status(`Downloading: ${containerPath} → ${dest}`);
                await engine.copyFromContainer(containerPath, dest);
                return {
                    downloaded: true,
                    containerPath,
                    hostPath: dest,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Download failed: ${msg}`);
                return { error: msg, downloaded: false, budget: budgetStatus() };
            }
        },
    });
    const statusTool = (0, sdk_1.tool)({
        name: "ComputerStatus",
        description: `Get information about the computer: OS, installed tools, disk/memory usage, ` +
            `running processes, network status, and resource limits.\n\n` +
            `Also shows the per-turn tool call budget.`,
        parameters: {
            showProcesses: zod_1.z
                .boolean()
                .optional()
                .describe("Include a list of running processes. Default: false."),
            killPid: zod_1.z
                .number()
                .int()
                .optional()
                .describe("Kill a process by PID. Combine with showProcesses to verify."),
        },
        implementation: async ({ showProcesses, killPid }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                if (killPid !== undefined) {
                    const killed = await engine.killProcess(killPid);
                    if (!killed)
                        warn(`Failed to kill PID ${killPid}`);
                }
                status("Gathering system info…");
                const envInfo = await engine.getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB);
                const containerInfo = await engine.getContainerInfo();
                let processes;
                if (showProcesses) {
                    const procs = await engine.listProcesses();
                    processes = procs.map((p) => ({
                        pid: p.pid,
                        user: p.user,
                        cpu: p.cpu + "%",
                        memory: p.memory + "%",
                        command: p.command,
                    }));
                }
                return {
                    container: {
                        id: containerInfo.id,
                        state: containerInfo.state,
                        image: containerInfo.image,
                        cpuUsage: containerInfo.cpuUsage,
                        memoryUsage: containerInfo.memoryUsage,
                        networkMode: containerInfo.networkMode,
                    },
                    environment: envInfo,
                    config: {
                        internetAccess: cfg.internetAccess,
                        persistenceMode: cfg.persistenceMode,
                        cpuLimit: cfg.cpuLimit > 0 ? `${cfg.cpuLimit} cores` : "unlimited",
                        memoryLimit: `${cfg.memoryLimitMB} MB`,
                        commandTimeout: `${cfg.commandTimeout}s`,
                    },
                    ...(processes ? { processes } : {}),
                    ...(killPid !== undefined ? { killedPid: killPid } : {}),
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Status failed: ${msg}`);
                return { error: msg, budget: budgetStatus() };
            }
        },
    });
    const rebuildTool = (0, sdk_1.tool)({
        name: "RebuildComputer",
        description: `Destroy the current container and rebuild it from scratch using the current settings.

` +
            `Use this when:
` +
            `- Internet access is not working after toggling the setting
` +
            `- The container is broken or in a bad state
` +
            `- Settings like base image or network were changed and need to take effect

` +
            `WARNING: All data inside the container will be lost. Files in the shared folder are safe.`,
        parameters: {
            confirm: zod_1.z
                .boolean()
                .describe("Must be true to confirm you want to destroy and rebuild the container."),
        },
        implementation: async ({ confirm }, { status, warn }) => {
            if (!confirm) {
                return {
                    error: "Set confirm=true to proceed with rebuild.",
                    budget: budgetStatus(),
                };
            }
            try {
                status("Stopping and removing existing container…");
                await engine.destroyContainer();
                status("Rebuilding container with current settings…");
                await engine.ensureReady({
                    image: cfg.baseImage,
                    network: (cfg.internetAccess ? "bridge" : "none"),
                    cpuLimit: cfg.cpuLimit,
                    memoryLimitMB: cfg.memoryLimitMB,
                    diskLimitMB: cfg.diskLimitMB,
                    autoInstallPreset: cfg.autoInstallPreset,
                    portForwards: cfg.portForwards,
                    hostMountPath: cfg.hostMountPath,
                    persistenceMode: cfg.persistenceMode,
                });
                const envInfo = await engine.getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB);
                return {
                    rebuilt: true,
                    os: envInfo.os,
                    internetAccess: cfg.internetAccess,
                    networkMode: cfg.internetAccess ? "enabled" : "disabled",
                    message: "Container rebuilt successfully with current settings.",
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Rebuild failed: ${msg}`);
                return { error: msg, rebuilt: false, budget: budgetStatus() };
            }
        },
    });
    const resetShellTool = (0, sdk_1.tool)({
        name: "ResetShell",
        description: `Reset the persistent shell session back to a clean state.\n\n` +
            `Use this when:\n` +
            `• The shell is in a broken state (stuck command, corrupted env)\n` +
            `• You want to start fresh without rebuilding the whole container\n` +
            `• Environment variables or working directory are in an unexpected state\n\n` +
            `This does NOT wipe the container filesystem — files, installed packages, ` +
            `and running background processes are all preserved. ` +
            `It only resets the shell session (cwd back to home, env vars cleared).`,
        parameters: {},
        implementation: async (_, { status }) => {
            engine.resetShellSession();
            status("Shell session reset.");
            return {
                reset: true,
                message: "Shell session reset. Working directory is back to /home/user with a clean environment.",
                budget: budgetStatus(),
            };
        },
    });
    const executeBackgroundTool = (0, sdk_1.tool)({
        name: "ExecuteBackground",
        description: `Run a command in the background and get a handle to check its output later.\n\n` +
            `Use this for long-running tasks that shouldn't block: servers, watchers, ` +
            `build processes, test suites, etc.\n\n` +
            `Returns a handleId. Use ReadProcessLogs with that handleId to stream output. ` +
            `Background processes survive across multiple turns.`,
        parameters: {
            command: zod_1.z
                .string()
                .min(1)
                .describe("Shell command to run in the background."),
            timeout: zod_1.z
                .number()
                .int()
                .min(5)
                .max(3600)
                .optional()
                .describe("Max seconds before the process is killed. Default: 300."),
        },
        implementation: async ({ command, timeout }, { status, warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            try {
                await ensureContainer(cfg, status);
                status(`Starting background: ${command.slice(0, 60)}${command.length > 60 ? "…" : ""}`);
                const { handleId, pid } = await engine.execBackground(command, timeout ?? 300);
                return {
                    started: true,
                    handleId,
                    pid,
                    message: `Process started. Use ReadProcessLogs with handleId ${handleId} to check output.`,
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Background exec failed: ${msg}`);
                return { error: msg, started: false, budget: budgetStatus() };
            }
        },
    });
    const readProcessLogsTool = (0, sdk_1.tool)({
        name: "ReadProcessLogs",
        description: `Read buffered output from a background process started with ExecuteBackground.\n\n` +
            `Call this repeatedly to check on a running process. ` +
            `Returns stdout, stderr, whether the process is still running, and its exit code if done.`,
        parameters: {
            handleId: zod_1.z
                .number()
                .int()
                .describe("The handleId returned by ExecuteBackground."),
        },
        implementation: async ({ handleId }, { warn }) => {
            const budgetError = consumeBudget();
            if (budgetError)
                return { error: budgetError, budget: budgetStatus() };
            const logs = engine.readBgLogs(handleId, constants_1.MAX_FILE_READ_BYTES);
            if (!logs.found) {
                return {
                    error: `No process found with handleId ${handleId}.`,
                    hint: "handleIds are only valid within the current LM Studio session.",
                    budget: budgetStatus(),
                };
            }
            return {
                handleId,
                stdout: logs.stdout || "(no output yet)",
                stderr: logs.stderr || "",
                running: !logs.done,
                exitCode: logs.exitCode,
                budget: budgetStatus(),
            };
        },
    });
    const restartComputerTool = (0, sdk_1.tool)({
        name: "RestartComputer",
        description: `Stop and restart the container without wiping any data.\n\n` +
            `Use this when:\n` +
            `- A runaway process is consuming too many resources\n` +
            `- The container feels sluggish or unresponsive\n` +
            `- You want a clean shell session but keep installed packages and files\n\n` +
            `Faster than RebuildComputer. All files and installed packages are preserved. ` +
            `Background processes will be stopped.`,
        parameters: {},
        implementation: async (_, { status, warn }) => {
            try {
                status("Restarting computer…");
                await engine.restartContainer();
                return {
                    restarted: true,
                    message: "Container restarted. Files and packages are intact.",
                    budget: budgetStatus(),
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                warn(`Restart failed: ${msg}`);
                return { error: msg, restarted: false, budget: budgetStatus() };
            }
        },
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
        readProcessLogsTool,
    ];
}
//# sourceMappingURL=toolsProvider.js.map