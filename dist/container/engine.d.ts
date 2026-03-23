/**
 * @file container/engine.ts
 * Container lifecycle engine — creates, starts, stops, and executes
 * commands inside the model's dedicated Linux computer.
 *
 * All container operations go through this module. The engine is
 * lazy-initialized: the container is only created/started when the
 * first tool call happens.
 *
 * Supports Docker and Podman interchangeably via the detected runtime.
 */
import type { ContainerInfo, ExecResult, EnvironmentInfo, ProcessInfo } from "../types";
import type { ContainerImage, NetworkMode } from "../constants";
/**
 * Initialize the container engine: detect runtime, create or start
 * the container if needed. Safe to call multiple times (idempotent).
 */
export declare function ensureReady(opts: {
    image: ContainerImage;
    network: NetworkMode;
    cpuLimit: number;
    memoryLimitMB: number;
    diskLimitMB: number;
    autoInstallPreset: string;
    portForwards: string;
    hostMountPath: string;
    persistenceMode: string;
}): Promise<void>;
/**
 * Execute a command inside the container.
 */
export declare function exec(command: string, timeoutSeconds: number, maxOutputBytes?: number, workdir?: string): Promise<ExecResult>;
/**
 * Write a file inside the container using stdin piping.
 */
export declare function writeFile(filePath: string, content: string): Promise<void>;
/**
 * Read a file from the container, optionally limited to a line range.
 */
export declare function readFile(filePath: string, maxBytes: number, startLine?: number, endLine?: number): Promise<{
    content: string;
    totalLines: number;
}>;
/**
 * Replace an exact string in a file. Fails if the string is not found
 * or appears more than once, matching the behaviour of surgical editors.
 */
export declare function strReplaceInFile(filePath: string, oldStr: string, newStr: string): Promise<{
    replacements: number;
}>;
/**
 * Insert lines into a file at a given line number.
 * Line numbers are 1-based. Pass 0 to prepend, or a number past EOF to append.
 */
export declare function insertLinesInFile(filePath: string, afterLine: number, content: string): Promise<void>;
/**
 * Run a command in the background inside the container.
 * Returns a handle ID that can be used with readBgLogs.
 */
export declare function execBackground(command: string, timeoutSeconds: number): Promise<{
    handleId: number;
    pid: number;
}>;
/**
 * Read buffered output from a background process by handle ID.
 */
export declare function readBgLogs(handleId: number, maxBytes?: number): {
    stdout: string;
    stderr: string;
    done: boolean;
    exitCode: number | null;
    found: boolean;
};
/**
 * Copy a file from the host into the container.
 */
export declare function copyToContainer(hostPath: string, containerPath: string): Promise<void>;
/**
 * Copy a file from the container to the host.
 */
export declare function copyFromContainer(containerPath: string, hostPath: string): Promise<void>;
/**
 * Get environment info from inside the container.
 */
export declare function getEnvironmentInfo(network: boolean, diskLimitMB?: number): Promise<EnvironmentInfo>;
/**
 * List processes running inside the container.
 */
export declare function listProcesses(): Promise<ProcessInfo[]>;
/**
 * Kill a process inside the container.
 */
export declare function killProcess(pid: number, signal?: string): Promise<boolean>;
/**
 * Stop and optionally remove the container.
 */
export declare function stopContainer(remove?: boolean): Promise<void>;
/**
 * Destroy the container and all its data.
 */
export declare function destroyContainer(): Promise<void>;
/**
 * Restart the container without wiping its data.
 * Stops the running container, kills the shell session, then starts it again.
 * Faster than a full rebuild — filesystem and installed packages are preserved.
 */
export declare function restartContainer(): Promise<void>;
/**
 * Get detailed container info.
 */
export declare function getContainerInfo(): Promise<ContainerInfo>;
/**
 * Update the container's network mode (requires restart).
 */
export declare function updateNetwork(mode: NetworkMode, opts: Parameters<typeof ensureReady>[0]): Promise<void>;
/**
 * Check if the container engine is ready.
 */
export declare function isReady(): boolean;
/**
 * Reset the persistent shell session without touching the container.
 * Useful when the model wants a clean shell (fresh env vars, back to home dir)
 * without a full container rebuild.
 */
export declare function resetShellSession(): void;
/**
 * Verify the container is actually running. If it has been deleted or stopped
 * externally, resets containerReady so ensureReady() will recreate it.
 * Call this at the start of every tool implementation.
 */
export declare function verifyHealth(): Promise<void>;
/**
 * Get the container name.
 */
export declare function getContainerName(): string;
//# sourceMappingURL=engine.d.ts.map