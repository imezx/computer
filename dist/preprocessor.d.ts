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
import type { PluginController } from "./pluginTypes";
export declare function promptPreprocessor(ctl: PluginController, userMessage: string): Promise<string>;
//# sourceMappingURL=preprocessor.d.ts.map