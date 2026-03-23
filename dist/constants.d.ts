/**
 * @file constants.ts
 * Single source of truth for every tunable parameter.
 * Grouped by subsystem for easy discovery.
 */
/** Name prefix for managed containers. */
export declare const CONTAINER_NAME_PREFIX = "lms-computer";
/** Default container image. */
export declare const DEFAULT_IMAGE = "ubuntu:24.04";
/** Lightweight alternative image. */
export declare const ALPINE_IMAGE = "alpine:3.20";
/** Default working directory inside the container. */
export declare const CONTAINER_WORKDIR = "/home/user";
/** Default shell to exec into. */
export declare const CONTAINER_SHELL = "/bin/bash";
/** Alpine shell fallback. */
export declare const CONTAINER_SHELL_ALPINE = "/bin/sh";
/** Default CPU core limit (0 = unlimited). */
export declare const DEFAULT_CPU_LIMIT = 2;
/** Maximum allowed CPU cores. */
export declare const MAX_CPU_LIMIT = 8;
/** Default memory limit in MB. */
export declare const DEFAULT_MEMORY_LIMIT_MB = 1024;
/** Maximum memory limit in MB. */
export declare const MAX_MEMORY_LIMIT_MB = 8192;
/** Default disk size limit in MB. */
export declare const DEFAULT_DISK_LIMIT_MB = 4096;
/** Maximum disk limit in MB. */
export declare const MAX_DISK_LIMIT_MB = 32768;
/** Default command timeout in seconds. */
export declare const DEFAULT_TIMEOUT_SECONDS = 30;
/** Minimum timeout. */
export declare const MIN_TIMEOUT_SECONDS = 5;
/** Maximum timeout. */
export declare const MAX_TIMEOUT_SECONDS = 300;
/** Default max output size in bytes returned to the model. */
export declare const DEFAULT_MAX_OUTPUT_BYTES = 32768;
/** Absolute max output bytes. */
export declare const MAX_OUTPUT_BYTES = 131072;
/** Default max tool calls per turn. */
export declare const DEFAULT_MAX_TOOL_CALLS_PER_TURN = 10;
/** Minimum allowed tool calls per turn. */
export declare const MIN_TOOL_CALLS_PER_TURN = 1;
/** Maximum allowed tool calls per turn. */
export declare const MAX_TOOL_CALLS_PER_TURN = 100;
/** Max file size for read operations (bytes). */
export declare const MAX_FILE_READ_BYTES = 512000;
/** Max file size for write operations (bytes). */
export declare const MAX_FILE_WRITE_BYTES = 5242880;
/** Max file size for upload/download (bytes). */
export declare const MAX_TRANSFER_BYTES = 52428800;
/** Default host transfer directory. */
export declare const DEFAULT_TRANSFER_DIR = "lms-computer-files";
/** Commands blocked in strict mode (pattern-matched). */
export declare const BLOCKED_COMMANDS_STRICT: readonly string[];
/**
 * Environment variables injected into every container.
 * These tell the model about its environment.
 */
export declare const CONTAINER_ENV_VARS: Record<string, string>;
/** Package sets available for pre-installation. */
export declare const PACKAGE_PRESETS: Record<string, string[]>;
/** Alpine equivalents for package presets. */
export declare const PACKAGE_PRESETS_ALPINE: Record<string, string[]>;
/** Max chars of injected computer context. */
export declare const MAX_INJECTED_CONTEXT_CHARS = 2000;
/** Valid base images the user can select. */
export declare const VALID_IMAGES: readonly ["ubuntu:24.04", "ubuntu:22.04", "alpine:3.20", "debian:bookworm-slim"];
export type ContainerImage = (typeof VALID_IMAGES)[number];
export declare const NETWORK_MODES: readonly ["none", "bridge", "slirp4netns", "pasta", "podman-default"];
export type NetworkMode = (typeof NETWORK_MODES)[number];
export declare const PERSISTENCE_MODES: readonly ["persistent", "ephemeral"];
export type PersistenceMode = (typeof PERSISTENCE_MODES)[number];
export declare const CONTAINER_STATES: readonly ["running", "stopped", "not_found", "error"];
export type ContainerState = (typeof CONTAINER_STATES)[number];
//# sourceMappingURL=constants.d.ts.map