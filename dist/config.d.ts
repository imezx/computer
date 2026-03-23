/**
 * @file config.ts
 * Plugin configuration schema — generates the LM Studio settings UI.
 *
 * Gives the user high-control over every aspect of the computer:
 *   • Network, persistence, base image
 *   • Resource limits (CPU, RAM, disk)
 *   • Execution constraints (timeout, output cap, tool call budget)
 *   • Package presets, port forwarding, host mounts
 *   • Safety and context injection toggles
 */
export declare const configSchematics: import("@lmstudio/sdk").ConfigSchematics<{
    internetAccess: {
        key: "internetAccess";
        type: string;
        valueTypeKey: "select";
    };
} & {
    persistenceMode: {
        key: "persistenceMode";
        type: string;
        valueTypeKey: "select";
    };
} & {
    baseImage: {
        key: "baseImage";
        type: string;
        valueTypeKey: "select";
    };
} & {
    cpuLimit: {
        key: "cpuLimit";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    memoryLimitMB: {
        key: "memoryLimitMB";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    diskLimitMB: {
        key: "diskLimitMB";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    commandTimeout: {
        key: "commandTimeout";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    maxOutputSize: {
        key: "maxOutputSize";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    maxToolCallsPerTurn: {
        key: "maxToolCallsPerTurn";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    autoInstallPreset: {
        key: "autoInstallPreset";
        type: string;
        valueTypeKey: "select";
    };
} & {
    portForwards: {
        key: "portForwards";
        type: string;
        valueTypeKey: "string";
    };
} & {
    hostMountPath: {
        key: "hostMountPath";
        type: string;
        valueTypeKey: "string";
    };
} & {
    strictSafety: {
        key: "strictSafety";
        type: string;
        valueTypeKey: "select";
    };
} & {
    autoInjectContext: {
        key: "autoInjectContext";
        type: string;
        valueTypeKey: "select";
    };
}>;
//# sourceMappingURL=config.d.ts.map