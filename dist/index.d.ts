/**
 * @file index.ts
 * LM Studio plugin entry point.
 *
 * The container is lazy-initialized: nothing heavy happens at plugin load time.
 * The first tool call triggers image pull + container creation.
 */
import type { PluginContext } from "./pluginTypes";
export declare function main(context: PluginContext): Promise<void>;
//# sourceMappingURL=index.d.ts.map