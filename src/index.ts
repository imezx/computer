/**
 * @file index.ts
 * LM Studio plugin entry point.
 *
 * The container is lazy-initialized: nothing heavy happens at plugin load time.
 * The first tool call triggers image pull + container creation.
 */

import { configSchematics } from "./config";
import { toolsProvider } from "./toolsProvider";
import { promptPreprocessor } from "./preprocessor";
import type { PluginContext } from "./pluginTypes";

export async function main(context: PluginContext) {
  context.withConfigSchematics(configSchematics);
  context.withToolsProvider(toolsProvider);
  context.withPromptPreprocessor(promptPreprocessor);
}
