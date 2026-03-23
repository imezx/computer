/**
 * @file types.ts
 * Shared type definitions for the computer plugin.
 */

import type {
  ContainerImage,
  NetworkMode,
  PersistenceMode,
  ContainerState,
} from "./constants";

/** Supported container runtimes. */
export type RuntimeKind = "docker" | "podman";

/** Result of runtime auto-detection. */
export interface RuntimeInfo {
  kind: RuntimeKind;
  path: string;
  version: string;
}

/** Options for creating a new container. */
export interface ContainerCreateOptions {
  image: ContainerImage;
  name: string;
  network: NetworkMode;
  cpuLimit: number;
  memoryLimitMB: number;
  diskLimitMB: number;
  workdir: string;
  envVars: Record<string, string>;
  portForwards: string[];
  hostMountPath: string | null;
}

/** Live container info. */
export interface ContainerInfo {
  id: string;
  name: string;
  state: ContainerState;
  image: string;
  created: string;
  uptime: string | null;
  cpuUsage: string | null;
  memoryUsage: string | null;
  diskUsage: string | null;
  networkMode: string;
  ports: string[];
}

/** Result of a command execution. */
export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
  truncated: boolean;
  originalSize?: number;
}

/** Result of a file read operation. */
export interface FileReadResult {
  path: string;
  content: string;
  sizeBytes: number;
  truncated: boolean;
  encoding: string;
}

/** Result of a file write operation. */
export interface FileWriteResult {
  path: string;
  bytesWritten: number;
  created: boolean;
}

/** Directory listing entry. */
export interface DirEntry {
  name: string;
  type: "file" | "directory" | "symlink" | "other";
  sizeBytes: number;
  modified: string;
  permissions: string;
}

/** System info from inside the container. */
export interface EnvironmentInfo {
  os: string;
  kernel: string;
  arch: string;
  hostname: string;
  uptime: string;
  diskFree: string;
  diskTotal: string;
  memoryFree: string;
  memoryTotal: string;
  installedTools: string[];
  workdir: string;
  networkEnabled: boolean;
  pythonVersion: string | null;
  nodeVersion: string | null;
  gccVersion: string | null;
}

/** A running process inside the container. */
export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: string;
  memory: string;
  command: string;
  started: string;
}

/** Resolved plugin configuration from LM Studio settings UI. */
export interface ComputerPluginConfig {
  internetAccess: boolean;
  persistenceMode: PersistenceMode;
  baseImage: ContainerImage;
  cpuLimit: number;
  memoryLimitMB: number;
  diskLimitMB: number;
  commandTimeout: number;
  maxOutputSize: number;
  maxToolCallsPerTurn: number;
  autoInstallPreset: string;
  portForwards: string;
  hostMountPath: string;
  strictSafety: boolean;
  autoInjectContext: boolean;
}

/** Tracks tool calls within a single conversational turn. */
export interface TurnBudget {
  turnId: number;
  callsUsed: number;
  maxCalls: number;
}
