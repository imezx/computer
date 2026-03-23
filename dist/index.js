"use strict";
/**
 * @file index.ts
 * LM Studio plugin entry point.
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