"use strict";
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
exports.promptPreprocessor = promptPreprocessor;
const config_1 = require("./config");
const toolsProvider_1 = require("./toolsProvider");
const engine = __importStar(require("./container/engine"));
const constants_1 = require("./constants");
function readConfig(ctl) {
    const c = ctl.getPluginConfig(config_1.configSchematics);
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
async function buildContextBlock(cfg) {
    // If container isn't running yet, just describe what's available
    if (!engine.isReady()) {
        return [
            `[Computer — Available]`,
            `You have a dedicated Linux computer (${cfg.baseImage}) available via tools.`,
            `Internet: ${cfg.internetAccess ? "enabled" : "disabled"}.`,
            `Mode: ${cfg.persistenceMode}.`,
            `The computer will start automatically when you first use a tool (Execute, WriteFile, etc.).`,
            `Working directory: ${constants_1.CONTAINER_WORKDIR}`,
        ].join("\n");
    }
    // Container is running — get live info
    try {
        const quickInfo = await engine.exec(`echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')" && ` +
            `echo "TOOLS=$(which git curl wget python3 node gcc pip3 2>/dev/null | xargs -I{} basename {} | tr '\\n' ',')" && ` +
            `echo "FILES=$(ls ${constants_1.CONTAINER_WORKDIR} 2>/dev/null | head -10 | tr '\\n' ',')" && ` +
            `echo "DISK=$(df -h ${constants_1.CONTAINER_WORKDIR} 2>/dev/null | tail -1 | awk '{print $4 \" free / \" $2 \" total\"}')"`, 5, constants_1.MAX_INJECTED_CONTEXT_CHARS);
        if (quickInfo.exitCode !== 0) {
            return `[Computer — Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
        }
        const lines = quickInfo.stdout.split("\n");
        const get = (prefix) => {
            const line = lines.find(l => l.startsWith(prefix + "="));
            return line?.slice(prefix.length + 1)?.trim() ?? "";
        };
        const os = get("OS");
        const tools = get("TOOLS").split(",").filter(Boolean);
        const files = get("FILES").split(",").filter(Boolean);
        const disk = get("DISK");
        const parts = [
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
            parts.push(`Workspace (${constants_1.CONTAINER_WORKDIR}): ${files.join(", ")}${files.length >= 10 ? "…" : ""}`);
        }
        else {
            parts.push(`Workspace (${constants_1.CONTAINER_WORKDIR}): empty`);
        }
        parts.push(``, `Use the Execute, WriteFile, ReadFile, ListDirectory, UploadFile, DownloadFile, or ComputerStatus tools to interact with the computer.`);
        return parts.join("\n");
    }
    catch {
        return `[Computer — Running (${cfg.baseImage}), Internet: ${cfg.internetAccess ? "on" : "off"}]`;
    }
}
async function promptPreprocessor(ctl, userMessage) {
    const cfg = readConfig(ctl);
    // ALWAYS reset the tool call budget on every new user message.
    // This is the core mechanism that limits per-turn tool usage.
    (0, toolsProvider_1.advanceTurn)(cfg.maxToolCalls);
    // Skip context injection if disabled
    if (!cfg.autoInject)
        return userMessage;
    // Skip for very short messages (greetings, etc.)
    if (userMessage.length < 5)
        return userMessage;
    try {
        const context = await buildContextBlock(cfg);
        if (!context)
            return userMessage;
        return `${context}\n\n---\n\n${userMessage}`;
    }
    catch {
        // Never block the conversation if context injection fails
        return userMessage;
    }
}
//# sourceMappingURL=preprocessor.js.map