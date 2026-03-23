/**
 * @file index.ts
 * LM Studio plugin entry point.
 *
 * Registers three hooks:
 *   1. configSchematics   — settings UI (network, resources, safety, etc.)
 *   2. toolsProvider       — 7 computer tools (execute, read, write, etc.)
 *   3. promptPreprocessor  — per-turn budget reset + auto-inject computer context
 *
 * The container is lazy-initialized: nothing heavy happens at plugin load time.
 * The first tool call triggers image pull + container creation.
 */
import type { PluginContext } from "./pluginTypes";
export declare function main(context: PluginContext): Promise<void>;
//# sourceMappingURL=index.d.ts.map