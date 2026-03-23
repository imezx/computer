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
 * Read a file from the container.
 */
export declare function readFile(filePath: string, maxBytes: number): Promise<string>;
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