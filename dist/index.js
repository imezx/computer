"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const config_1 = require("./config");
const toolsProvider_1 = require("./toolsProvider");
const preprocessor_1 = require("./preprocessor");
async function main(context) {
    context.withConfigSchematics(config_1.configSchematics);
    context.withToolsProvider(toolsProvider_1.toolsProvider);
    context.withPromptPreprocessor(preprocessor_1.promptPreprocessor);
}
//# sourceMappingURL=index.js.map