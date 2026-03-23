/**
 * @file pluginTypes.ts
 * Type definitions for the LM Studio plugin controller.
 * Inferred from SDK patterns.
 */
import type { configSchematics } from "./config";
export interface PluginController {
    getPluginConfig(schematics: typeof configSchematics): {
        get(key: string): any;
    };
}
export interface PluginContext {
    withConfigSchematics(schematics: typeof configSchematics): void;
    withToolsProvider(provider: (ctl: PluginController) => Promise<any[]>): void;
    withPromptPreprocessor(preprocessor: (ctl: PluginController, message: string) => Promise<string>): void;
}
//# sourceMappingURL=pluginTypes.d.ts.map