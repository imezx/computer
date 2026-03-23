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
export const turnBudget: TurnBudget = {
  turnId: 0,
  callsUsed: 0,
  maxCalls: 25,
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
      `Tool call budget exhausted: you've used ${turnBudget.maxCalls}/${turnBudget.maxCalls} ` +
      `calls this turn. Wait for the user's next message to continue. ` +
      `(Configurable in plugin settings → "Max Tool Calls Per Turn")`
    );
  }
  return null;
}

/** Return a budget status string for tool responses. */
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
      `This is a real, isolated Linux container — you can install packages, ` +
      `compile code, run scripts, manage files, start services, etc.\n\n` +
      `The working directory is ${CONTAINER_WORKDIR}. ` +
      `You have full shell access (bash on Ubuntu/Debian, sh on Alpine).\n\n` +
      `TIPS:\n` +
      `• Chain commands with && or ;\n` +
      `• Use 2>&1 to merge stderr into stdout\n` +
      `• For long-running tasks, consider backgrounding with & and checking later\n` +
      `• Install packages with apt-get (Ubuntu/Debian) or apk (Alpine)\n` +
      `• The computer persists between messages (unless ephemeral mode is on)`,
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

        return {
          exitCode: result.exitCode,
          stdout: result.stdout || "(no output)",
          stderr: result.stderr || "",
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          truncated: result.truncated,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        warn(`Execution failed: ${msg}`);
        return { error: msg, exitCode: -1, budget: budgetStatus() };
      }
    },
  });

  const writeFileTool = tool({
    name: "WriteFile",
    description:
      `Create or overwrite a file inside the computer.\n\n` +
      `Use this to write code, configs, scripts, data files, etc. ` +
      `Parent directories are created automatically.\n` +
      `Working directory: ${CONTAINER_WORKDIR}`,
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
        warn(`Write failed: ${msg}`);
        return { error: msg, written: false, budget: budgetStatus() };
      }
    },
  });

  const readFileTool = tool({
    name: "ReadFile",
    description:
      `Read the contents of a file from the computer.\n\n` +
      `Returns the file content as text. Binary files may not display correctly — ` +
      `use Execute with tools like xxd or file for binary inspection.`,
    parameters: {
      path: z
        .string()
        .min(1)
        .max(500)
        .describe("File path inside the container."),
      maxLines: z
        .number()
        .int()
        .min(1)
        .max(2000)
        .optional()
        .describe(
          "Max lines to return (default: all, up to size limit). Use for large files.",
        ),
      startLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          "Start reading from this line number (1-based). Combine with maxLines to read a range.",
        ),
    },
    implementation: async (
      { path: filePath, maxLines, startLine },
      { status, warn },
    ) => {
      const budgetError = consumeBudget();
      if (budgetError) return { error: budgetError, budget: budgetStatus() };

      try {
        await ensureContainer(cfg, status);

        status(`Reading: ${filePath}`);

        let cmd: string;
        if (startLine && maxLines) {
          cmd = `sed -n '${startLine},${startLine + maxLines - 1}p' '${filePath.replace(/'/g, "'\\''")}'`;
        } else if (maxLines) {
          cmd = `head -n ${maxLines} '${filePath.replace(/'/g, "'\\''")}'`;
        } else {
          cmd = `cat '${filePath.replace(/'/g, "'\\''")}'`;
        }

        const result = await engine.exec(cmd, 10, MAX_FILE_READ_BYTES);

        if (result.exitCode !== 0) {
          return {
            error: result.stderr || "File not found or unreadable",
            path: filePath,
            budget: budgetStatus(),
          };
        }

        const sizeResult = await engine.exec(
          `stat -c '%s' '${filePath.replace(/'/g, "'\\''")}'  2>/dev/null || stat -f '%z' '${filePath.replace(/'/g, "'\\''")}' 2>/dev/null`,
          3,
        );
        const sizeBytes = parseInt(sizeResult.stdout.trim(), 10) || 0;

        return {
          path: filePath,
          content: result.stdout,
          sizeBytes,
          truncated: result.truncated,
          lineRange: startLine
            ? { from: startLine, count: maxLines ?? "all" }
            : undefined,
          budget: budgetStatus(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        warn(`Read failed: ${msg}`);
        return { error: msg, budget: budgetStatus() };
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { error: msg, budget: budgetStatus() };
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
        warn(`Upload failed: ${msg}`);
        return { error: msg, uploaded: false, budget: budgetStatus() };
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
        warn(`Download failed: ${msg}`);
        return { error: msg, downloaded: false, budget: budgetStatus() };
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
        warn(`Status failed: ${msg}`);
        return { error: msg, budget: budgetStatus() };
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
        warn(`Rebuild failed: ${msg}`);
        return { error: msg, rebuilt: false, budget: budgetStatus() };
      }
    },
  });

  return [
    executeTool,
    writeFileTool,
    readFileTool,
    listDirTool,
    uploadFileTool,
    downloadFileTool,
    statusTool,
    rebuildTool,
  ];
}
