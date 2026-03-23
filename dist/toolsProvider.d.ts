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
import type { PluginController } from "./pluginTypes";
import type { TurnBudget } from "./types";
/**
 * Shared turn budget. The preprocessor increments `turnId` each time
 * a new user message arrives, which resets the call count.
 */
export declare const turnBudget: TurnBudget;
/** Called by the preprocessor to signal a new turn. */
export declare function advanceTurn(maxCalls: number): void;
export declare function toolsProvider(ctl: PluginController): Promise<import("@lmstudio/sdk").Tool[]>;
//# sourceMappingURL=toolsProvider.d.ts.map