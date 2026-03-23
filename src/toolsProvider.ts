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

import { tool } from "@lmstudio/sdk";
import { homedir, platform } from "os";
import { join as pathJoin } from "path";
import { z } from "zod";
import { configSchematics } from "./config";
import * as engine from "./container/engine";
import { checkCommand } from "./safety/guard";
import {
  CONTAINER_WORKDIR,
  MAX_FILE_READ_BYTES,
  MAX_FILE_WRITE_BYTES,
  MAX_TIMEOUT_SECONDS,
} from "./constants";
import type { PluginController } from "./pluginTypes";
import type { ComputerPluginConfig, TurnBudget } from "./types";
import type { NetworkMode, ContainerImage } from "./constants";

function readConfig(ctl: PluginController): ComputerPluginConfig {
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
    autoInjectContext: c.get("autoInjectContext") === "on",
  };
}

/**
 * Shared turn budget. The preprocessor increments `turnId` each time
 * a new user message arrives, which resets the call count.
 */
export const turnBudget: TurnBudget = {
  turnId: 0,
  callsUsed: 0,
  maxCalls: 10,
};

/** Called by the preprocessor to signal a new turn. */
export function advanceTurn(maxCalls: number): void {
  turnBudget.turnId++;
  turnBudget.callsUsed = 0;
  turnBudget.maxCalls = maxCalls;
}

/**
 * Check and consume one tool call from the budget.
 * Returns an error string if the budget is exhausted, or null if OK.
 */
function consumeBudget(): string | null {
  turnBudget.callsUsed++;
  if (turnBudget.callsUsed > turnBudget.maxCalls) {
    return (
      `Tool call budget exhausted (${turnBudget.maxCalls}/${turnBudget.maxCalls}). ` +
      `Wait for the user's next message to continue.`
    );
  }
  return null;
}

/** Return a budget status object for tool responses. */
function budgetStatus(): {
  callsUsed: number;
  callsRemaining: number;
  maxPerTurn: number;
} {
  return {
    callsUsed: turnBudget.callsUsed,
    callsRemaining: Math.max(0, turnBudget.maxCalls - turnBudget.callsUsed),
    maxPerTurn: turnBudget.maxCalls,
  };
}

/**
 * Classify a raw error message into a short error + actionable hint.
 * Keeps tool responses compact — the model acts on the hint directly
 * instead of spending tool calls investigating the failure.
 */
function classifyError(
  raw: string,
  context?: {
    filePath?: string;
    command?: string;
    isNetwork?: boolean;
  },
): { error: string; hint: string } {
  const m = raw.toLowerCase();
  const fp = context?.filePath ?? "";

  if (m.includes("no such file") || (m.includes("not found") && fp)) {
    const dir = fp.includes("/")
      ? fp.slice(0, fp.lastIndexOf("/")) || "/"
      : CONTAINER_WORKDIR;
    return {
      error: `File not found: ${fp}`,
      hint: `Use ListDirectory on "${dir}" to check what exists there.`,
    };
  }

  if (m.includes("permission denied") || m.includes("eacces")) {
    return {
      error: `Permission denied: ${fp || raw.slice(0, 80)}`,
      hint: `Try running with sudo, or fix permissions with: chmod +rw '${fp || "<path>"}'.`,
    };
  }

  if (m.includes("is a directory")) {
    return {
      error: `Path is a directory, not a file: ${fp}`,
      hint: `Use ListDirectory to browse its contents, or specify a file path.`,
    };
  }

  if (m.includes("no space left") || m.includes("disk quota")) {
    return {
      error: "Disk full or quota exceeded.",
      hint: `Run: df -h && du -sh /home/user/* to find what's using space.`,
    };
  }

  if (
    m.includes("cannot allocate memory") ||
    m.includes("out of memory") ||
    m.includes("oom")
  ) {
    return {
      error: "Out of memory.",
      hint: `Use ComputerStatus to check memory usage. Consider increasing Memory Limit in plugin settings.`,
    };
  }

  if (
    m.includes("command not found") ||
    m.includes("executable file not found") ||
    m.includes("not found in $path")
  ) {
    const cmd = context?.command?.split(" ")[0] ?? "the command";
    return {
      error: `Command not found: ${cmd}`,
      hint: `Install it first — e.g. apt-get install ${cmd} (Ubuntu) or apk add ${cmd} (Alpine). Make sure Internet Access is enabled in settings.`,
    };
  }

  if (
    m.includes("temporary failure resolving") ||
    m.includes("could not resolve") ||
    m.includes("network unreachable") ||
    (m.includes("connection refused") && context?.isNetwork)
  ) {
    return {
      error: "Network/DNS failure inside container.",
      hint: `Internet Access may be disabled or the container was built without it. Tell the user to enable Internet Access in settings and call RebuildComputer.`,
    };
  }

  if (m.includes("timed out") || m.includes("timeout")) {
    return {
      error: "Command timed out.",
      hint: `For long-running tasks use ExecuteBackground instead, or increase Command Timeout in plugin settings.`,
    };
  }

  if (
    m.includes("container") &&
    (m.includes("not running") ||
      m.includes("not found") ||
      m.includes("no such container"))
  ) {
    return {
      error: "Container is not running.",
      hint: `Call ComputerStatus to wake it up, or call RebuildComputer if it keeps failing.`,
    };
  }

  if (m.includes("string not found")) {
    return {
      error: raw.slice(0, 120),
      hint: `Use ReadFile to view the current file content before retrying StrReplace.`,
    };
  }

  if (m.includes("appears") && m.includes("times")) {
    return {
      error: raw.slice(0, 120),
      hint: `Include more surrounding lines in oldStr to make the match unique.`,
    };
  }

  return {
    error: raw.length > 200 ? raw.slice(0, 200) + "…" : raw,
    hint: `If this persists, try ResetShell or RestartComputer.`,
  };
}

async function ensureContainer(
  cfg: ComputerPluginConfig,
  status: (msg: string) => void,
): Promise<void> {
  await engine.verifyHealth();

  if (engine.isReady()) return;

  status("Starting computer… (first use may take a moment to pull the image)");

  await engine.ensureReady({
    image: cfg.baseImage as ContainerImage,
    network: (cfg.internetAccess ? "bridge" : "none") as NetworkMode,
    cpuLimit: cfg.cpuLimit,
    memoryLimitMB: cfg.memoryLimitMB,
    diskLimitMB: cfg.diskLimitMB,
    autoInstallPreset: cfg.autoInstallPreset,
    portForwards: cfg.portForwards,
    hostMountPath: cfg.hostMountPath,
    persistenceMode: cfg.persistenceMode,
  });
}

export async function toolsProvider(ctl: PluginController) {
  const cfg = readConfig(ctl);

  turnBudget.maxCalls = cfg.maxToolCallsPerTurn;

  const executeTool = tool({
    name: "Execute",
    description:
      `Run a shell command on your dedicated Linux computer.\n\n` +
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
      command: z
        .string()
        .min(1)
        .max(8_000)
        .describe(
          "Shell command to execute. Supports pipes, redirects, chaining.",
        ),
      timeout: z
        .number()
        .int()
        .min(1)
        .max(MAX_TIMEOUT_SECONDS)
        .optional()
        .describe(
          `Timeout in seconds (default: ${cfg.commandTimeout}, max: ${MAX_TIMEOUT_SECONDS}). Increase for long operations like package installs.`,
        ),
      workdir: z
        .string()
        .optional()
        .describe(
          `Working directory for the command (default: ${CONTAINER_WORKDIR}).`,
        ),
    },
    implementation: async ({ command, timeout, workdir }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      if (cfg.strictSafety) {
        const check = checkCommand(command, true);
        if (!check.allowed) {
          warn(check.reason!);
          return { error: check.reason, exitCode: -1 };
        }
      }

      try {
        await ensureContainer(cfg, status);

        status(
          `Running: ${command.length > 80 ? command.slice(0, 77) + "…" : command}`,
        );

        const result = await engine.exec(
          command,
          timeout ?? cfg.commandTimeout,
          cfg.maxOutputSize,
          workdir,
        );

        if (result.timedOut) {
          warn(`Command timed out after ${timeout ?? cfg.commandTimeout}s`);
        }

        if (result.truncated) {
          status("Output was truncated (exceeded max size)");
        }

        const hint = result.timedOut
          ? classifyError("timed out", { command }).hint
          : result.exitCode !== 0 && result.stderr
            ? classifyError(result.stderr, { command }).hint
            : undefined;

        return {
          exitCode: result.exitCode,
          stdout: result.stdout || "(no output)",
          stderr: result.stderr || "",
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          truncated: result.truncated,
          ...(hint ? { hint } : {}),
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { error, hint, exitCode: -1, budget: budgetStatus() };
      }
    },
  });

  const writeFileTool = tool({
    name: "WriteFile",
    description:
      `Create or overwrite a complete file inside the computer.\n\n` +
      `Use for new files or when replacing the entire content. ` +
      `For editing existing files, prefer StrReplace or InsertLines — ` +
      `they are faster and use far less context. ` +
      `Parent directories are created automatically.`,
    parameters: {
      path: z
        .string()
        .min(1)
        .max(500)
        .describe(
          `File path inside the container. Relative paths are relative to ${CONTAINER_WORKDIR}.`,
        ),
      content: z
        .string()
        .max(MAX_FILE_WRITE_BYTES)
        .describe("File content to write."),
      makeExecutable: z
        .boolean()
        .optional()
        .describe(
          "Set the executable bit (chmod +x) after writing. Useful for scripts.",
        ),
    },
    implementation: async (
      { path: filePath, content, makeExecutable },
      { status, warn },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, written: false, budget: budgetStatus() };
      }
    },
  });

  const readFileTool = tool({
    name: "ReadFile",
    description:
      `Read a file from the computer, optionally limited to a line range.\n\n` +
      `Always read a file before editing it with StrReplace. ` +
      `For large files use startLine/endLine to read only the section you need — ` +
      `this keeps context short. Binary files may not display correctly.`,
    parameters: {
      path: z
        .string()
        .min(1)
        .max(500)
        .describe("File path inside the container."),
      startLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("First line to return (1-based, inclusive)."),
      endLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          "Last line to return (1-based, inclusive). Requires startLine.",
        ),
    },
    implementation: async (
      { path: filePath, startLine, endLine },
      { status, warn },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);
        status(`Reading: ${filePath}`);

        const { content, totalLines } = await engine.readFile(
          filePath,
          MAX_FILE_READ_BYTES,
          startLine,
          endLine,
        );

        return {
          path: filePath,
          content,
          totalLines,
          lineRange: startLine
            ? { from: startLine, to: endLine ?? totalLines }
            : undefined,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, path: filePath, budget: budgetStatus() };
      }
    },
  });

  const strReplaceTool = tool({
    name: "StrReplace",
    description:
      `Replace an exact unique string in a file with new content.\n\n` +
      `This is the preferred way to edit existing files — use it instead of ` +
      `rewriting the whole file with WriteFile.\n\n` +
      `Rules:\n` +
      `• oldStr must match the file exactly (whitespace, indentation included)\n` +
      `• oldStr must appear exactly once — make it unique by including surrounding lines\n` +
      `• Always ReadFile first to see the current content\n` +
      `• To delete a section, set newStr to an empty string`,
    parameters: {
      path: z
        .string()
        .min(1)
        .max(500)
        .describe("File path inside the container."),
      oldStr: z
        .string()
        .min(1)
        .describe(
          "The exact string to find and replace. Must be unique in the file.",
        ),
      newStr: z
        .string()
        .describe("The replacement string. Use empty string to delete."),
    },
    implementation: async (
      { path: filePath, oldStr, newStr },
      { status, warn },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);
        status(`Editing: ${filePath}`);
        const { replacements } = await engine.strReplaceInFile(
          filePath,
          oldStr,
          newStr,
        );
        return {
          edited: true,
          path: filePath,
          replacements,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, edited: false, budget: budgetStatus() };
      }
    },
  });

  const insertLinesTool = tool({
    name: "InsertLines",
    description:
      `Insert lines into a file at a specific position.\n\n` +
      `Use this to add new content without replacing existing content. ` +
      `afterLine=0 prepends to the file. afterLine equal to the total line count appends.`,
    parameters: {
      path: z
        .string()
        .min(1)
        .max(500)
        .describe("File path inside the container."),
      afterLine: z
        .number()
        .int()
        .min(0)
        .describe(
          "Insert after this line number (1-based). Use 0 to insert at the top.",
        ),
      content: z.string().describe("The lines to insert."),
    },
    implementation: async (
      { path: filePath, afterLine, content },
      { status, warn },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { error, hint, inserted: false, budget: budgetStatus() };
      }
    },
  });

  const listDirTool = tool({
    name: "ListDirectory",
    description:
      `List files and directories inside the computer.\n\n` +
      `Returns structured directory listing with file types, sizes, and permissions.`,
    parameters: {
      path: z
        .string()
        .optional()
        .describe(`Directory path (default: ${CONTAINER_WORKDIR}).`),
      showHidden: z
        .boolean()
        .optional()
        .describe("Include hidden files (dotfiles). Default: false."),
      recursive: z
        .boolean()
        .optional()
        .describe("List recursively up to 3 levels deep. Default: false."),
    },
    implementation: async (
      { path: dirPath, showHidden, recursive },
      { status },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);

        const target = dirPath ?? CONTAINER_WORKDIR;
        const hidden = showHidden ? "-a" : "";

        let cmd: string;
        if (recursive) {
          cmd = `find '${target.replace(/'/g, "'\\''")}'  -maxdepth 3 ${showHidden ? "" : "-not -path '*/.*'"} -printf '%y %s %T@ %p\\n' 2>/dev/null | head -200`;
        } else {
          cmd = `ls -l ${hidden} --time-style=long-iso '${target.replace(/'/g, "'\\''")}'  2>/dev/null || ls -l ${hidden} '${target.replace(/'/g, "'\\''")}'`;
        }

        status(`Listing: ${target}`);
        const result = await engine.exec(cmd, 10);

        if (result.exitCode !== 0) {
          return {
            ...classifyError(result.stderr || "Directory not found", {
              filePath: target,
            }),
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        return { error, hint, budget: budgetStatus() };
      }
    },
  });

  const uploadFileTool = tool({
    name: "UploadFile",
    description:
      `Transfer a file from the user's host computer into the container.\n\n` +
      `Use this when the user shares a file they want you to work with. ` +
      `The file will be copied into the container at the specified path.`,
    parameters: {
      hostPath: z
        .string()
        .min(1)
        .max(1000)
        .describe("Absolute path to the file on the user's host machine."),
      containerPath: z
        .string()
        .optional()
        .describe(
          `Destination path inside the container (default: ${CONTAINER_WORKDIR}/<filename>).`,
        ),
    },
    implementation: async ({ hostPath, containerPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);

        const filename =
          hostPath.split("/").pop() ?? hostPath.split("\\").pop() ?? "file";
        const dest = containerPath ?? `${CONTAINER_WORKDIR}/${filename}`;

        status(`Uploading: ${filename} → ${dest}`);
        await engine.copyToContainer(hostPath, dest);

        return {
          uploaded: true,
          hostPath,
          containerPath: dest,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: hostPath });
        warn(error);
        return { error, hint, uploaded: false, budget: budgetStatus() };
      }
    },
  });

  const downloadFileTool = tool({
    name: "DownloadFile",
    description:
      `Transfer a file from the container to the user's host computer.\n\n` +
      `Use this to give the user a file you created or modified inside the computer.`,
    parameters: {
      containerPath: z
        .string()
        .min(1)
        .max(500)
        .describe("Path to the file inside the container."),
      hostPath: z
        .string()
        .optional()
        .describe(
          "Destination path on the host. Default: user's home directory + filename.",
        ),
    },
    implementation: async ({ containerPath, hostPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);

        const filename = containerPath.split("/").pop() ?? "file";
        const dest = hostPath ?? pathJoin(homedir(), filename);

        status(`Downloading: ${containerPath} → ${dest}`);
        await engine.copyFromContainer(containerPath, dest);

        return {
          downloaded: true,
          containerPath,
          hostPath: dest,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: containerPath });
        warn(error);
        return { error, hint, downloaded: false, budget: budgetStatus() };
      }
    },
  });

  const statusTool = tool({
    name: "ComputerStatus",
    description:
      `Get information about the computer: OS, installed tools, disk/memory usage, ` +
      `running processes, network status, and resource limits.\n\n` +
      `Also shows the per-turn tool call budget.`,
    parameters: {
      showProcesses: z
        .boolean()
        .optional()
        .describe("Include a list of running processes. Default: false."),
      killPid: z
        .number()
        .int()
        .optional()
        .describe(
          "Kill a process by PID. Combine with showProcesses to verify.",
        ),
    },
    implementation: async ({ showProcesses, killPid }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);

        if (killPid !== undefined) {
          const killed = await engine.killProcess(killPid);
          if (!killed) warn(`Failed to kill PID ${killPid}`);
        }

        status("Gathering system info…");
        const envInfo = await engine.getEnvironmentInfo(
          cfg.internetAccess,
          cfg.diskLimitMB,
        );
        const containerInfo = await engine.getContainerInfo();

        let processes: any[] | undefined;
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, budget: budgetStatus() };
      }
    },
  });

  const rebuildTool = tool({
    name: "RebuildComputer",
    description:
      `Destroy the current container and rebuild it from scratch using the current settings.

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
      confirm: z
        .boolean()
        .describe(
          "Must be true to confirm you want to destroy and rebuild the container.",
        ),
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
          image: cfg.baseImage as ContainerImage,
          network: (cfg.internetAccess ? "bridge" : "none") as NetworkMode,
          cpuLimit: cfg.cpuLimit,
          memoryLimitMB: cfg.memoryLimitMB,
          diskLimitMB: cfg.diskLimitMB,
          autoInstallPreset: cfg.autoInstallPreset,
          portForwards: cfg.portForwards,
          hostMountPath: cfg.hostMountPath,
          persistenceMode: cfg.persistenceMode,
        });

        const envInfo = await engine.getEnvironmentInfo(
          cfg.internetAccess,
          cfg.diskLimitMB,
        );

        return {
          rebuilt: true,
          os: envInfo.os,
          internetAccess: cfg.internetAccess,
          networkMode: cfg.internetAccess ? "enabled" : "disabled",
          message: "Container rebuilt successfully with current settings.",
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, rebuilt: false, budget: budgetStatus() };
      }
    },
  });

  const resetShellTool = tool({
    name: "ResetShell",
    description:
      `Reset the persistent shell session back to a clean state.\n\n` +
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
        message:
          "Shell session reset. Working directory is back to /home/user with a clean environment.",
        budget: budgetStatus(),
      };
    },
  });

  const executeBackgroundTool = tool({
    name: "ExecuteBackground",
    description:
      `Run a command in the background and get a handle to check its output later.\n\n` +
      `Use this for long-running tasks that shouldn't block: servers, watchers, ` +
      `build processes, test suites, etc.\n\n` +
      `Returns a handleId. Use ReadProcessLogs with that handleId to stream output. ` +
      `Background processes survive across multiple turns.`,
    parameters: {
      command: z
        .string()
        .min(1)
        .describe("Shell command to run in the background."),
      timeout: z
        .number()
        .int()
        .min(5)
        .max(3600)
        .optional()
        .describe("Max seconds before the process is killed. Default: 300."),
    },
    implementation: async ({ command, timeout }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);
        status(
          `Starting background: ${command.slice(0, 60)}${command.length > 60 ? "…" : ""}`,
        );
        const { handleId, pid } = await engine.execBackground(
          command,
          timeout ?? 300,
        );
        return {
          started: true,
          handleId,
          pid,
          message: `Process started. Use ReadProcessLogs with handleId ${handleId} to check output.`,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { error, hint, started: false, budget: budgetStatus() };
      }
    },
  });

  const readProcessLogsTool = tool({
    name: "ReadProcessLogs",
    description:
      `Read buffered output from a background process started with ExecuteBackground.\n\n` +
      `Call this repeatedly to check on a running process. ` +
      `Returns stdout, stderr, whether the process is still running, and its exit code if done.`,
    parameters: {
      handleId: z
        .number()
        .int()
        .describe("The handleId returned by ExecuteBackground."),
    },
    implementation: async ({ handleId }, { warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      const logs = engine.readBgLogs(handleId, MAX_FILE_READ_BYTES);
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

  const restartComputerTool = tool({
    name: "RestartComputer",
    description:
      `Stop and restart the container without wiping any data.\n\n` +
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { error, hint, restarted: false, budget: budgetStatus() };
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
