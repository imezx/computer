/**
 * @file preprocessor.ts
 * Prompt preprocessor — serves two purposes:
 *
 *   1. Resets the per-turn tool call budget every time the user sends a new message.
 *   2. Optionally injects computer state (OS, tools, network) into the model's
 *      context so it knows what it's working with without needing to ask.
 *
 * Flow:
 *   1. User types a message
 *   2. Preprocessor fires → resets tool call budget → gathers computer state
 *   3. Prepends computer context to the user's message
 *   4. Model sees the context and can start using tools immediately
 */

import { configSchematics } from "./config";
import { advanceTurn } from "./toolsProvider";
import * as engine from "./container/engine";
import { MAX_INJECTED_CONTEXT_CHARS, CONTAINER_WORKDIR } from "./constants";
import type { PluginController } from "./pluginTypes";

function readConfig(ctl: PluginController) {
  const c = ctl.getPluginConfig(configSchematics);
  return {
    autoInject: c.get("autoInjectContext") === "on",
    maxToolCalls: c.get("maxToolCallsPerTurn") ?? 25,
    internetAccess: c.get("internetAccess") === "on",
    persistenceMode: c.get("persistenceMode") || "persistent",
    baseImage: c.get("baseImage") || "ubuntu:24.04",
  };
}

/**
 * Build a concise context block about the computer's current state.
 */
async function buildContextBlock(
  cfg: ReturnType<typeof readConfig>,
): Promise<string> {
  if (!engine.isReady()) {
    return [
      `[Computer — Available]`,
      `You have a dedicated Linux computer (${cfg.baseImage}) available via tools.`,
      `Internet: ${cfg.internetAccess ? "enabled" : "disabled"}.`,
      `Mode: ${cfg.persistenceMode}.`,
      `The computer will start automatically when you first use a tool (Execute, WriteFile, etc.).`,
      `Working directory: ${CONTAINER_WORKDIR}`,
    ].join("\n");
  }

  try {
    const quickInfo = await engine.exec(
      `echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')" && ` +
        `echo "TOOLS=$(which git curl wget python3 node gcc pip3 2>/dev/null | xargs -I{} basename {} | tr '\\n' ',')" && ` +
        `echo "FILES=$(ls ${CONTAINER_WORKDIR} 2>/dev/null | head -10 | tr '\\n' ',')" && ` +
        `echo "DISK=$(df -h ${CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4 \" free / \" $2 \" total\"}')"`,
      5,
      MAX_INJECTED_CONTEXT_CHARS,
    );

    if (quickInfo.exitCode !== 0) {
      return `[Computer — Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
    }

    const lines = quickInfo.stdout.split("\n");
    const get = (prefix: string): string => {
      const line = lines.find((l) => l.startsWith(prefix + "="));
      return line?.slice(prefix.length + 1)?.trim() ?? "";
    };

    const os = get("OS");
    const tools = get("TOOLS").split(",").filter(Boolean);
    const files = get("FILES").split(",").filter(Boolean);
    const disk = get("DISK");

    const parts: string[] = [
      `[Computer — Running]`,
      `OS: ${os}`,
      `Internet: ${cfg.internetAccess ? "enabled" : "disabled"}`,
      `Mode: ${cfg.persistenceMode}`,
      `Disk: ${disk}`,
    ];

    if (tools.length > 0) {
      parts.push(`Installed: ${tools.join(", ")}`);
    }

    if (files.length > 0) {
      parts.push(
        `Workspace (${CONTAINER_WORKDIR}): ${files.join(", ")}${files.length >= 10 ? "…" : ""}`,
      );
    } else {
      parts.push(`Workspace (${CONTAINER_WORKDIR}): empty`);
    }

    parts.push(
      ``,
      `Use the Execute, WriteFile, ReadFile, ListDirectory, UploadFile, DownloadFile, or ComputerStatus tools to interact with the computer.`,
    );

    return parts.join("\n");
  } catch {
    return `[Computer — Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
  }
}

export async function promptPreprocessor(
  ctl: PluginController,
  userMessage: string,
): Promise<string> {
  const cfg = readConfig(ctl);

  advanceTurn(cfg.maxToolCalls);

  if (!cfg.autoInject) return userMessage;

  if (userMessage.length < 5) return userMessage;

  try {
    const context = await buildContextBlock(cfg);
    if (!context) return userMessage;

    return `${context}\n\n---\n\n${userMessage}`;
  } catch {
    return userMessage;
  }
}
