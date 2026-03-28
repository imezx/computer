/**
 * @file toolsProvider.ts
 * Registers all computer tools with LM Studio.
 *
 * Tools:
 *   Execute            — run any shell command (persistent session)
 *   WriteFile          — create or overwrite a file
 *   AppendFile         — append content to an existing file
 *   ReadFile           — read file contents (with line range support)
 *   StrReplace         — surgically edit files (supports multiple replacements per call)
 *   InsertLines        — insert lines at a specific position
 *   ListDirectory      — list directory contents
 *   MoveFile           — move or rename a file/directory
 *   CopyFile           — copy a file or directory
 *   SearchInFiles      — grep across files (like IDE "find in project")
 *   SetEnvVar          — set a persistent environment variable
 *   UploadFile         — transfer a file from the host into the container
 *   DownloadFile       — pull a file from the container to the host
 *   ExecuteBackground  — run a long command without blocking
 *   ReadProcessLogs    — read output from a background process
 *   KillBackground     — stop a background process by handle ID
 *   KillProcess        — kill any process by PID
 *   ComputerStatus     — environment info and resource usage
 *   RestartComputer    — restart the container (keeps files)
 *   RebuildComputer    — destroy and recreate the container
 *   ResetShell         — reset just the shell session
 */

import { tool } from "@lmstudio/sdk";
import { homedir } from "os";
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
    baseImage: (c.get("baseImage") || "ubuntu:24.04") as ContainerImage,
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

const turnBudget: TurnBudget = { turnId: 0, callsUsed: 0, maxCalls: 10 };

export function advanceTurn(maxCalls: number): void {
  turnBudget.turnId++;
  turnBudget.callsUsed = 0;
  turnBudget.maxCalls = maxCalls;
}

function consumeBudget(): string | null {
  turnBudget.callsUsed++;
  if (turnBudget.callsUsed > turnBudget.maxCalls) {
    return (
      `Tool call budget exhausted (${turnBudget.maxCalls} calls per turn). ` +
      `Stop using tools and summarise what you have done so far. ` +
      `The budget resets when the user sends the next message.`
    );
  }
  return null;
}

/** Budget placed FIRST in every tool response so the model sees it immediately. */
function budgetStatus() {
  return {
    callsUsed: turnBudget.callsUsed,
    callsRemaining: Math.max(0, turnBudget.maxCalls - turnBudget.callsUsed),
    maxPerTurn: turnBudget.maxCalls,
  };
}

function classifyError(
  raw: string,
  context?: { filePath?: string; command?: string; isNetwork?: boolean },
): { error: string; hint: string } {
  const m = raw.toLowerCase();
  const fp = context?.filePath ?? "";

  if (
    m.includes("no container runtime found") ||
    m.includes("please install docker") ||
    m.includes("dockerdesktoplinuxengine") ||
    (m.includes("docker") && m.includes("daemon is not running")) ||
    (m.includes("cannot connect") && m.includes("docker")) ||
    (m.includes("open //./pipe/") && m.includes("system cannot find"))
  ) {
    return {
      error: "No container runtime found. Docker Desktop (or Podman) is not installed or not running on this machine.",
      hint:
        "ACTION REQUIRED — tell the user: Docker Desktop must be installed and running to use this plugin. " +
        "Install from https://docs.docker.com/desktop/ (Windows/Mac) or https://podman.io/ (Linux). " +
        "On Windows, also ensure Docker Desktop is set to Linux containers mode (right-click the tray icon).",
    };
  }

  if (m.includes("no such file") || (m.includes("not found") && fp)) {
    const dir = fp.includes("/") ? fp.slice(0, fp.lastIndexOf("/")) || "/" : CONTAINER_WORKDIR;
    return {
      error: `File not found: ${fp}`,
      hint: `Use ListDirectory on "${dir}" to check what exists there.`,
    };
  }

  if (m.includes("permission denied") || m.includes("eacces")) {
    return {
      error: `Permission denied: ${fp || raw.slice(0, 80)}`,
      hint: `Try running with sudo, or fix permissions: chmod +rw '${fp || "<path>"}'.`,
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
      hint: `Run: df -h && du -sh ${CONTAINER_WORKDIR}/* to find what's using space.`,
    };
  }

  if (m.includes("cannot allocate memory") || m.includes("out of memory") || m.includes("oom")) {
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
      hint: `Internet Access may be disabled. Enable it in plugin settings and call RebuildComputer.`,
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
    (m.includes("not running") || m.includes("not found") || m.includes("no such container"))
  ) {
    return {
      error: "Container is not running.",
      hint: `Call ComputerStatus to wake it up, or call RebuildComputer if it keeps failing.`,
    };
  }

  if (m.includes("string not found")) {
    return {
      error: raw.slice(0, 200),
      hint: `Use ReadFile to view the current file contents before retrying StrReplace.`,
    };
  }

  if (m.includes("appears") && m.includes("times")) {
    return {
      error: raw.slice(0, 200),
      hint: `Include more surrounding lines in oldStr to make the match unique.`,
    };
  }

  return {
    error: raw.length > 300 ? raw.slice(0, 300) + "…" : raw,
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
      `• Background long tasks with ExecuteBackground instead of &\n` +
      `• Install packages with apt-get (Ubuntu/Debian) or apk (Alpine)`,
    parameters: {
      command: z.string().min(1).max(8_000).describe("Shell command to execute. Supports pipes, redirects, chaining."),
      timeout: z.number().int().min(1).max(MAX_TIMEOUT_SECONDS).optional()
        .describe(`Timeout in seconds (default: ${cfg.commandTimeout}, max: ${MAX_TIMEOUT_SECONDS}). Increase for long operations like package installs.`),
      workdir: z.string().optional().describe(`Working directory (default: ${CONTAINER_WORKDIR}).`),
    },
    implementation: async ({ command, timeout, workdir }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      if (cfg.strictSafety) {
        const check = checkCommand(command, true);
        if (!check.allowed) {
          warn(check.reason!);
          return { budget: budgetStatus(), error: check.reason, exitCode: -1 };
        }
      }

      try {
        await ensureContainer(cfg, status);
        status(`Running: ${command.length > 80 ? command.slice(0, 77) + "…" : command}`);

        const result = await engine.exec(command, timeout ?? cfg.commandTimeout, cfg.maxOutputSize, workdir);

        if (result.timedOut) warn(`Command timed out after ${timeout ?? cfg.commandTimeout}s`);
        if (result.truncated) status("Output was large — showing head and tail (use ReadFile to see full content)");

        const hint = result.timedOut
          ? classifyError("timed out", { command }).hint
          : result.exitCode !== 0 && result.stderr
            ? classifyError(result.stderr, { command }).hint
            : undefined;

        return {
          budget: budgetStatus(),
          exitCode: result.exitCode,
          stdout: result.stdout || "(no output)",
          stderr: result.stderr || "",
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          truncated: result.truncated,
          ...(hint ? { hint } : {}),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { budget: budgetStatus(), error, hint, exitCode: -1 };
      }
    },
  });

  const writeFileTool = tool({
    name: "WriteFile",
    description:
      `Create or overwrite a complete file inside the computer.\n\n` +
      `Use for new files or when replacing the entire content. ` +
      `For editing existing files, prefer StrReplace — ` +
      `it is faster and uses far less context. ` +
      `Parent directories are created automatically.`,
    parameters: {
      path: z.string().min(1).max(500).describe(`File path inside the container. Relative paths resolve to ${CONTAINER_WORKDIR}.`),
      content: z.string().max(MAX_FILE_WRITE_BYTES).describe("File content to write."),
      makeExecutable: z.boolean().optional().describe("Set the executable bit (chmod +x) after writing."),
    },
    implementation: async ({ path: filePath, content, makeExecutable }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const dir = filePath.includes("/") ? filePath.slice(0, filePath.lastIndexOf("/")) : null;
        if (dir) await engine.exec(`mkdir -p '${dir.replace(/'/g, "'\\''")}'`, 5);

        status(`Writing: ${filePath}`);
        await engine.writeFile(filePath, content);
        if (makeExecutable) await engine.exec(`chmod +x '${filePath.replace(/'/g, "'\\''")}'`, 5);

        return {
          budget: budgetStatus(),
          written: true,
          path: filePath,
          bytesWritten: Buffer.byteLength(content, "utf-8"),
          executable: makeExecutable ?? false,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { budget: budgetStatus(), error, hint, written: false };
      }
    },
  });

  const appendFileTool = tool({
    name: "AppendFile",
    description:
      `Append content to an existing file inside the computer.\n\n` +
      `Use this when you want to add lines to a log, config, or script ` +
      `without reading and rewriting the whole file. ` +
      `Creates the file if it does not exist.`,
    parameters: {
      path: z.string().min(1).max(500).describe("File path inside the container."),
      content: z.string().max(MAX_FILE_WRITE_BYTES).describe("Content to append (added verbatim at the end of the file)."),
    },
    implementation: async ({ path: filePath, content }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Appending to: ${filePath}`);
        await engine.appendFile(filePath, content);
        return {
          budget: budgetStatus(),
          appended: true,
          path: filePath,
          bytesAppended: Buffer.byteLength(content, "utf-8"),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { budget: budgetStatus(), error, hint, appended: false };
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
      path: z.string().min(1).max(500).describe("File path inside the container."),
      startLine: z.number().int().min(1).optional().describe("First line to return (1-based, inclusive)."),
      endLine: z.number().int().min(1).optional().describe("Last line to return (1-based, inclusive). Requires startLine."),
    },
    implementation: async ({ path: filePath, startLine, endLine }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Reading: ${filePath}`);
        const { content, totalLines } = await engine.readFile(filePath, MAX_FILE_READ_BYTES, startLine, endLine);
        return {
          budget: budgetStatus(),
          path: filePath,
          content,
          totalLines,
          lineRange: startLine ? { from: startLine, to: endLine ?? totalLines } : undefined,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { budget: budgetStatus(), error, hint, path: filePath };
      }
    },
  });

  const strReplaceTool = tool({
    name: "StrReplace",
    description:
      `Replace exact strings in a file — the preferred way to edit existing files.\n\n` +
      `Accepts a single replacement or an array of replacements applied in order.\n` +
      `The file is read and written exactly once regardless of how many replacements you provide.\n\n` +
      `Rules:\n` +
      `• Each oldStr must match the file exactly (whitespace, indentation included)\n` +
      `• Each oldStr must appear exactly once — include surrounding lines to make it unique\n` +
      `• Always ReadFile first to see the current content\n` +
      `• To delete a section, set newStr to an empty string`,
    parameters: {
      path: z.string().min(1).max(500).describe("File path inside the container."),
      replacements: z
        .array(z.object({
          oldStr: z.string().min(1).describe("The exact string to find. Must be unique in the file."),
          newStr: z.string().describe("The replacement string. Use empty string to delete."),
        }))
        .min(1)
        .describe("One or more find-and-replace pairs, applied in order."),
    },
    implementation: async ({ path: filePath, replacements }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Editing: ${filePath} (${replacements.length} replacement${replacements.length > 1 ? "s" : ""})`);
        const { replacements: count } = await engine.strReplaceInFile(filePath, replacements);
        return {
          budget: budgetStatus(),
          edited: true,
          path: filePath,
          replacements: count,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { budget: budgetStatus(), error, hint, edited: false };
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
      path: z.string().min(1).max(500).describe("File path inside the container."),
      afterLine: z.number().int().min(0).describe("Insert after this line number (1-based). Use 0 to insert at the top."),
      content: z.string().describe("The lines to insert."),
    },
    implementation: async ({ path: filePath, afterLine, content }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Inserting into: ${filePath}`);
        await engine.insertLinesInFile(filePath, afterLine, content);
        return { budget: budgetStatus(), inserted: true, path: filePath, afterLine };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath });
        warn(error);
        return { budget: budgetStatus(), error, hint, inserted: false };
      }
    },
  });

  const listDirTool = tool({
    name: "ListDirectory",
    description:
      `List files and directories inside the computer.\n\n` +
      `Returns a structured directory listing with file types, sizes, and permissions.`,
    parameters: {
      path: z.string().optional().describe(`Directory path (default: ${CONTAINER_WORKDIR}).`),
      showHidden: z.boolean().optional().describe("Include hidden files (dotfiles). Default: false."),
      recursive: z.boolean().optional().describe("List recursively up to 3 levels deep. Default: false."),
    },
    implementation: async ({ path: dirPath, showHidden, recursive }, { status }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const target = dirPath ?? CONTAINER_WORKDIR;
        const hidden = showHidden ? "-a" : "";
        let cmd: string;
        if (recursive) {
          cmd = `find '${target.replace(/'/g, "'\\''")}' -maxdepth 3 ${showHidden ? "" : "-not -path '*/.*'"} -printf '%y %s %T@ %p\\n' 2>/dev/null | head -200`;
        } else {
          cmd = `ls -l ${hidden} --time-style=long-iso '${target.replace(/'/g, "'\\''")}' 2>/dev/null || ls -l ${hidden} '${target.replace(/'/g, "\\'")}'`;
        }

        status(`Listing: ${target}`);
        const result = await engine.exec(cmd, 10);
        if (result.exitCode !== 0) {
          return {
            ...classifyError(result.stderr || "Directory not found", { filePath: target }),
            budget: budgetStatus(),
            path: target,
          };
        }
        return { budget: budgetStatus(), path: target, listing: result.stdout, recursive: recursive ?? false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        return { budget: budgetStatus(), error, hint };
      }
    },
  });

  const moveFileTool = tool({
    name: "MoveFile",
    description:
      `Move or rename a file or directory inside the computer.\n\n` +
      `Parent directories of the destination are created automatically. ` +
      `Use this instead of Execute + mv for cleaner error handling.`,
    parameters: {
      source: z.string().min(1).max(500).describe("Source path inside the container."),
      destination: z.string().min(1).max(500).describe("Destination path inside the container."),
    },
    implementation: async ({ source, destination }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Moving: ${source} → ${destination}`);
        await engine.moveFile(source, destination);
        return { budget: budgetStatus(), moved: true, source, destination };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: source });
        warn(error);
        return { budget: budgetStatus(), error, hint, moved: false };
      }
    },
  });

  const copyFileTool = tool({
    name: "CopyFile",
    description:
      `Copy a file or directory inside the computer.\n\n` +
      `Directories are copied recursively. ` +
      `Parent directories of the destination are created automatically.`,
    parameters: {
      source: z.string().min(1).max(500).describe("Source path inside the container."),
      destination: z.string().min(1).max(500).describe("Destination path inside the container."),
    },
    implementation: async ({ source, destination }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Copying: ${source} → ${destination}`);
        await engine.copyFile(source, destination);
        return { budget: budgetStatus(), copied: true, source, destination };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: source });
        warn(error);
        return { budget: budgetStatus(), error, hint, copied: false };
      }
    },
  });

  const searchInFilesTool = tool({
    name: "SearchInFiles",
    description:
      `Search for a text pattern across files inside the computer — like IDE "Find in Project".\n\n` +
      `Returns matching lines in file:line:content format. ` +
      `Automatically excludes .git, node_modules, and .cache directories.\n\n` +
      `Use this instead of Execute + grep when you want clean error handling and ` +
      `consistent output limits. Supports regex patterns.`,
    parameters: {
      pattern: z.string().min(1).describe("Search pattern (supports regular expressions)."),
      directory: z.string().optional().describe(`Directory to search in (default: ${CONTAINER_WORKDIR}).`),
      ignoreCase: z.boolean().optional().describe("Case-insensitive search. Default: false."),
      glob: z.string().optional().describe("Limit search to files matching a glob pattern, e.g. '*.ts' or '*.py'."),
      maxResults: z.number().int().min(1).max(500).optional().describe("Maximum number of matches to return (default: 200)."),
    },
    implementation: async ({ pattern, directory, ignoreCase, glob, maxResults }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const dir = directory ?? CONTAINER_WORKDIR;
        status(`Searching for "${pattern}" in ${dir}…`);
        const result = await engine.searchInFiles(pattern, dir, { ignoreCase, glob, maxResults });
        return {
          budget: budgetStatus(),
          pattern,
          directory: dir,
          matches: result.matches,
          matchCount: result.count,
          truncated: result.truncated,
          ...(result.truncated
            ? { hint: `Results truncated at ${result.count}. Refine your pattern or use a glob filter to narrow results.` }
            : {}),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint };
      }
    },
  });

  const setEnvVarTool = tool({
    name: "SetEnvVar",
    description:
      `Set a persistent environment variable inside the computer.\n\n` +
      `The variable is written to ~/.bashrc so it survives shell resets (ResetShell) ` +
      `and persists across sessions in persistent mode. ` +
      `It is also exported immediately in the current shell session.\n\n` +
      `Use this for API keys, configuration values, PATH additions, etc. ` +
      `Overwrites any previous value for the same key.`,
    parameters: {
      key: z.string().min(1).max(100).describe("Variable name (must match [A-Za-z_][A-Za-z0-9_]*)."),
      value: z.string().max(4_000).describe("Variable value."),
    },
    implementation: async ({ key, value }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Setting env var: ${key}`);
        await engine.setEnvVar(key, value);
        return {
          budget: budgetStatus(),
          set: true,
          key,
          message: `${key} is now set and will persist across shell resets.`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint, set: false };
      }
    },
  });

  const uploadFileTool = tool({
    name: "UploadFile",
    description:
      `Transfer a file from the user's host computer into the container.\n\n` +
      `Use this when the user shares a file they want you to work with.`,
    parameters: {
      hostPath: z.string().min(1).max(1000).describe("Absolute path to the file on the user's host machine."),
      containerPath: z.string().optional().describe(`Destination path inside the container (default: ${CONTAINER_WORKDIR}/<filename>).`),
    },
    implementation: async ({ hostPath, containerPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const filename = hostPath.split("/").pop() ?? hostPath.split("\\").pop() ?? "file";
        const dest = containerPath ?? `${CONTAINER_WORKDIR}/${filename}`;
        status(`Uploading: ${filename} → ${dest}`);
        await engine.copyToContainer(hostPath, dest);
        return { budget: budgetStatus(), uploaded: true, hostPath, containerPath: dest };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: hostPath });
        warn(error);
        return { budget: budgetStatus(), error, hint, uploaded: false };
      }
    },
  });

  const downloadFileTool = tool({
    name: "DownloadFile",
    description:
      `Transfer a file from the container to the user's host computer.\n\n` +
      `Use this to give the user a file you created or modified inside the computer.`,
    parameters: {
      containerPath: z.string().min(1).max(500).describe("Path to the file inside the container."),
      hostPath: z.string().optional().describe("Destination path on the host. Default: user's home directory + filename."),
    },
    implementation: async ({ containerPath, hostPath }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const filename = containerPath.split("/").pop() ?? "file";
        const dest = hostPath ?? pathJoin(homedir(), filename);
        status(`Downloading: ${containerPath} → ${dest}`);
        await engine.copyFromContainer(containerPath, dest);
        return { budget: budgetStatus(), downloaded: true, containerPath, hostPath: dest };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { filePath: containerPath });
        warn(error);
        return { budget: budgetStatus(), error, hint, downloaded: false };
      }
    },
  });

  const executeBackgroundTool = tool({
    name: "ExecuteBackground",
    description:
      `Run a command in the background and get a handle to check its output later.\n\n` +
      `Use this for long-running tasks that shouldn't block: servers, watchers, ` +
      `build processes, test suites, etc.\n\n` +
      `Returns a handleId. Use ReadProcessLogs with that handleId to stream output. ` +
      `Use KillBackground to stop it. Background processes survive across turns.`,
    parameters: {
      command: z.string().min(1).describe("Shell command to run in the background."),
      timeout: z.number().int().min(5).max(3600).optional().describe("Max seconds before the process is killed. Default: 300."),
    },
    implementation: async ({ command, timeout }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status(`Starting background: ${command.slice(0, 60)}${command.length > 60 ? "…" : ""}`);
        const { handleId, pid } = await engine.execBackground(command, timeout ?? 300);
        return {
          budget: budgetStatus(),
          started: true,
          handleId,
          pid,
          message: `Process started. Use ReadProcessLogs(handleId: ${handleId}) to check output. Use KillBackground(handleId: ${handleId}) to stop it.`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg, { command });
        warn(error);
        return { budget: budgetStatus(), error, hint, started: false };
      }
    },
  });

  const readProcessLogsTool = tool({
    name: "ReadProcessLogs",
    description:
      `Read buffered output from a background process started with ExecuteBackground.\n\n` +
      `Pass the nextOffset from the previous call as fromOffset to receive only ` +
      `new output since the last read — avoids seeing duplicate lines when polling.\n\n` +
      `Returns stdout, stderr, whether the process is still running, and its exit code if done.`,
    parameters: {
      handleId: z.number().int().describe("The handleId returned by ExecuteBackground."),
      fromOffset: z.number().int().min(0).optional().describe("Byte offset for incremental reads. Use the nextOffset from the previous call. Omit on first read."),
    },
    implementation: async ({ handleId, fromOffset }, { warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      const logs = engine.readBgLogs(handleId, MAX_FILE_READ_BYTES, fromOffset ?? 0);
      if (!logs.found) {
        return {
          budget: budgetStatus(),
          error: `No process found with handleId ${handleId}.`,
          hint: "handleIds are only valid within the current LM Studio session.",
        };
      }

      return {
        budget: budgetStatus(),
        handleId,
        stdout: logs.stdout,
        stderr: logs.stderr,
        running: !logs.done,
        exitCode: logs.exitCode,
        nextOffset: logs.nextOffset,
      };
    },
  });

  const killBackgroundTool = tool({
    name: "KillBackground",
    description:
      `Stop a background process started with ExecuteBackground.\n\n` +
      `Sends SIGTERM first; if the process doesn't exit within 2 seconds, sends SIGKILL. ` +
      `You can still read its final output with ReadProcessLogs after killing it.`,
    parameters: {
      handleId: z.number().int().describe("The handleId returned by ExecuteBackground."),
    },
    implementation: async ({ handleId }, { warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      const result = engine.killBgProcess(handleId);

      if (!result.found) {
        return {
          budget: budgetStatus(),
          error: `No process found with handleId ${handleId}.`,
          hint: "handleIds are only valid within the current LM Studio session.",
        };
      }

      if (result.alreadyDone) {
        return {
          budget: budgetStatus(),
          killed: false,
          handleId,
          message: "Process had already finished.",
        };
      }

      return {
        budget: budgetStatus(),
        killed: true,
        handleId,
        message: "SIGTERM sent. Process will be SIGKILL'd in 2 seconds if still running.",
      };
    },
  });

  const killProcessTool = tool({
    name: "KillProcess",
    description:
      `Kill a process inside the container by PID.\n\n` +
      `Use ComputerStatus with showProcesses: true to find PIDs. ` +
      `Sends SIGTERM by default; use signal: "SIGKILL" to force-kill immediately.`,
    parameters: {
      pid: z.number().int().min(1).describe("Process ID to kill."),
      signal: z.enum(["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP"]).optional()
        .describe("Signal to send (default: SIGTERM)."),
    },
    implementation: async ({ pid, signal }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        const ok = await engine.killProcess(pid, signal ?? "SIGTERM");
        if (!ok) {
          warn(`Failed to send ${signal ?? "SIGTERM"} to PID ${pid}`);
          return {
            budget: budgetStatus(),
            killed: false,
            pid,
            hint: "Process may not exist or you may not have permission. Use ComputerStatus with showProcesses: true to verify.",
          };
        }
        return {
          budget: budgetStatus(),
          killed: true,
          pid,
          signal: signal ?? "SIGTERM",
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint, killed: false };
      }
    },
  });

  const statusTool = tool({
    name: "ComputerStatus",
    description:
      `Get information about the computer: OS, installed tools, disk/memory usage, ` +
      `running processes, network status, and resource limits.\n\n` +
      `Also shows the per-turn tool call budget and any active background processes.`,
    parameters: {
      showProcesses: z.boolean().optional().describe("Include a list of running processes. Default: false."),
    },
    implementation: async ({ showProcesses }, { status, warn }) => {
      const budgetError = consumeBudget();
      if (budgetError) return { budget: budgetStatus(), error: budgetError };

      try {
        await ensureContainer(cfg, status);
        status("Gathering system info…");

        const [envInfo, containerInfo] = await Promise.all([
          engine.getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB),
          engine.getContainerInfo(),
        ]);

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

        const bgProcesses = engine.listBgProcesses();
        const activeBg = bgProcesses.filter((p) => p.running);

        return {
          budget: budgetStatus(),
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
          ...(activeBg.length > 0
            ? {
              backgroundProcesses: activeBg.map((p) => ({
                handleId: p.handleId,
                command: p.command,
                runtimeSecs: p.runtimeSecs,
              })),
            }
            : {}),
          ...(processes ? { processes } : {}),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint };
      }
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
          budget: budgetStatus(),
          restarted: true,
          message: "Container restarted. Files and packages are intact.",
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint, restarted: false };
      }
    },
  });

  const rebuildTool = tool({
    name: "RebuildComputer",
    description:
      `Destroy the current container and rebuild it from scratch using the current settings.\n\n` +
      `Use this when:\n` +
      `- Internet access is not working after toggling the setting\n` +
      `- The container is broken or in a bad state\n` +
      `- Settings like base image or network were changed and need to take effect\n\n` +
      `WARNING: All data inside the container will be lost. Files in the shared folder are safe.`,
    parameters: {
      confirm: z.boolean().describe("Must be true to confirm you want to destroy and rebuild the container."),
    },
    implementation: async ({ confirm }, { status, warn }) => {
      if (!confirm) {
        return { budget: budgetStatus(), error: "Set confirm=true to proceed with rebuild." };
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

        const envInfo = await engine.getEnvironmentInfo(cfg.internetAccess, cfg.diskLimitMB);
        return {
          budget: budgetStatus(),
          rebuilt: true,
          os: envInfo.os,
          internetAccess: cfg.internetAccess,
          message: "Container rebuilt successfully with current settings.",
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { error, hint } = classifyError(msg);
        warn(error);
        return { budget: budgetStatus(), error, hint, rebuilt: false };
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
      `Persistent env vars set with SetEnvVar will be automatically re-applied from ~/.bashrc.`,
    parameters: {},
    implementation: async (_, { status }) => {
      engine.resetShellSession();
      status("Shell session reset.");
      return {
        budget: budgetStatus(),
        reset: true,
        message: `Shell session reset. Working directory is back to ${CONTAINER_WORKDIR} with a clean environment. Persistent env vars from SetEnvVar will be re-applied automatically.`,
      };
    },
  });

  return [
    executeTool,
    writeFileTool,
    appendFileTool,
    readFileTool,
    strReplaceTool,
    insertLinesTool,
    listDirTool,
    moveFileTool,
    copyFileTool,
    searchInFilesTool,
    setEnvVarTool,
    uploadFileTool,
    downloadFileTool,
    executeBackgroundTool,
    readProcessLogsTool,
    killBackgroundTool,
    killProcessTool,
    statusTool,
    restartComputerTool,
    rebuildTool,
    resetShellTool,
  ];
}