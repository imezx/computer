/**
 * @file constants.ts
 * Single source of truth for every tunable parameter.
 * Grouped by subsystem for easy discovery.
 */

/** Name prefix for managed containers. */
export const CONTAINER_NAME_PREFIX = "lms-computer";
/** Default container image. */
export const DEFAULT_IMAGE = "ubuntu:24.04";
/** Lightweight alternative image. */
export const ALPINE_IMAGE = "alpine:3.20";
/** Default working directory inside the container. */
export const CONTAINER_WORKDIR = "/home/user";
/** Default shell to exec into. */
export const CONTAINER_SHELL = "/bin/bash";
/** Alpine shell fallback. */
export const CONTAINER_SHELL_ALPINE = "/bin/sh";

/** Default CPU core limit (0 = unlimited). */
export const DEFAULT_CPU_LIMIT = 2;
/** Maximum allowed CPU cores. */
export const MAX_CPU_LIMIT = 8;
/** Default memory limit in MB. */
export const DEFAULT_MEMORY_LIMIT_MB = 1024;
/** Maximum memory limit in MB. */
export const MAX_MEMORY_LIMIT_MB = 8192;
/** Default disk size limit in MB. */
export const DEFAULT_DISK_LIMIT_MB = 4096;
/** Maximum disk limit in MB. */
export const MAX_DISK_LIMIT_MB = 32768;

/** Default command timeout in seconds. */
export const DEFAULT_TIMEOUT_SECONDS = 30;
/** Minimum timeout. */
export const MIN_TIMEOUT_SECONDS = 5;
/** Maximum timeout. */
export const MAX_TIMEOUT_SECONDS = 300;
/** Default max output size in bytes returned to the model. */
export const DEFAULT_MAX_OUTPUT_BYTES = 32_768;
/** Absolute max output bytes. */
export const MAX_OUTPUT_BYTES = 131_072;
/** Default max tool calls per turn. */
export const DEFAULT_MAX_TOOL_CALLS_PER_TURN = 10;
/** Minimum allowed tool calls per turn. */
export const MIN_TOOL_CALLS_PER_TURN = 1;
/** Maximum allowed tool calls per turn. */
export const MAX_TOOL_CALLS_PER_TURN = 100;

/** Max file size for read operations (bytes). */
export const MAX_FILE_READ_BYTES = 512_000;
/** Max file size for write operations (bytes). */
export const MAX_FILE_WRITE_BYTES = 5_242_880;
/** Max file size for upload/download (bytes). */
export const MAX_TRANSFER_BYTES = 52_428_800;
/** Default host transfer directory. */
export const DEFAULT_TRANSFER_DIR = "lms-computer-files";

/** Commands blocked in strict mode (pattern-matched). */
export const BLOCKED_COMMANDS_STRICT: readonly string[] = [
  ":(){ :|:& };:", // fork bomb
  "rm -rf /", // root wipe
  "rm -rf /*", // root wipe variant
  "mkfs", // format filesystem
  "dd if=/dev/zero", // disk destroyer
  "dd if=/dev/random", // disk destroyer
  "> /dev/sda", // raw disk write
  "chmod -R 777 /", // permission nuke
  "chown -R", // ownership nuke on root
];

/**
 * Environment variables injected into every container.
 * These tell the model about its environment.
 */
export const CONTAINER_ENV_VARS: Record<string, string> = {
  TERM: "xterm-256color",
  LANG: "en_US.UTF-8",
  HOME: CONTAINER_WORKDIR,
  LMS_COMPUTER: "1",
};

/** Package sets available for pre-installation. */
export const PACKAGE_PRESETS: Record<string, string[]> = {
  minimal: ["curl", "wget", "git", "vim-tiny", "jq"],
  python: ["python3", "python3-pip", "python3-venv"],
  node: ["nodejs", "npm"],
  build: ["build-essential", "cmake", "pkg-config"],
  network: ["net-tools", "iputils-ping", "dnsutils", "traceroute", "nmap"],
  full: [
    "curl",
    "wget",
    "git",
    "vim-tiny",
    "jq",
    "python3",
    "python3-pip",
    "python3-venv",
    "nodejs",
    "npm",
    "build-essential",
    "cmake",
    "net-tools",
    "iputils-ping",
    "htop",
    "tree",
    "unzip",
    "zip",
  ],
};

/** Alpine equivalents for package presets. */
export const PACKAGE_PRESETS_ALPINE: Record<string, string[]> = {
  minimal: ["curl", "wget", "git", "vim", "jq"],
  python: ["python3", "py3-pip"],
  node: ["nodejs", "npm"],
  build: ["build-base", "cmake", "pkgconf"],
  network: ["net-tools", "iputils", "bind-tools", "traceroute", "nmap"],
  full: [
    "curl",
    "wget",
    "git",
    "vim",
    "jq",
    "python3",
    "py3-pip",
    "nodejs",
    "npm",
    "build-base",
    "cmake",
    "net-tools",
    "iputils",
    "htop",
    "tree",
    "unzip",
    "zip",
  ],
};

/** Max chars of injected computer context. */
export const MAX_INJECTED_CONTEXT_CHARS = 2_000;

/** Valid base images the user can select. */
export const VALID_IMAGES = [
  "ubuntu:24.04",
  "ubuntu:22.04",
  "alpine:3.20",
  "debian:bookworm-slim",
] as const;
export type ContainerImage = (typeof VALID_IMAGES)[number];

export const NETWORK_MODES = [
  "none",
  "bridge",
  "slirp4netns",
  "pasta",
  "podman-default",
] as const;
export type NetworkMode = (typeof NETWORK_MODES)[number];

export const PERSISTENCE_MODES = ["persistent", "ephemeral"] as const;
export type PersistenceMode = (typeof PERSISTENCE_MODES)[number];

export const CONTAINER_STATES = [
  "running",
  "stopped",
  "not_found",
  "error",
] as const;
export type ContainerState = (typeof CONTAINER_STATES)[number];
