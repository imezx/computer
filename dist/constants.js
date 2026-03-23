"use strict";
/**
 * @file constants.ts
 * Single source of truth for every tunable parameter.
 * Grouped by subsystem for easy discovery.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTAINER_STATES = exports.PERSISTENCE_MODES = exports.NETWORK_MODES = exports.VALID_IMAGES = exports.MAX_INJECTED_CONTEXT_CHARS = exports.PACKAGE_PRESETS_ALPINE = exports.PACKAGE_PRESETS = exports.CONTAINER_ENV_VARS = exports.BLOCKED_COMMANDS_STRICT = exports.DEFAULT_TRANSFER_DIR = exports.MAX_TRANSFER_BYTES = exports.MAX_FILE_WRITE_BYTES = exports.MAX_FILE_READ_BYTES = exports.MAX_TOOL_CALLS_PER_TURN = exports.MIN_TOOL_CALLS_PER_TURN = exports.DEFAULT_MAX_TOOL_CALLS_PER_TURN = exports.MAX_OUTPUT_BYTES = exports.DEFAULT_MAX_OUTPUT_BYTES = exports.MAX_TIMEOUT_SECONDS = exports.MIN_TIMEOUT_SECONDS = exports.DEFAULT_TIMEOUT_SECONDS = exports.MAX_DISK_LIMIT_MB = exports.DEFAULT_DISK_LIMIT_MB = exports.MAX_MEMORY_LIMIT_MB = exports.DEFAULT_MEMORY_LIMIT_MB = exports.MAX_CPU_LIMIT = exports.DEFAULT_CPU_LIMIT = exports.CONTAINER_SHELL_ALPINE = exports.CONTAINER_SHELL = exports.CONTAINER_WORKDIR = exports.ALPINE_IMAGE = exports.DEFAULT_IMAGE = exports.CONTAINER_NAME_PREFIX = void 0;
/** Name prefix for managed containers. */
exports.CONTAINER_NAME_PREFIX = "lms-computer";
/** Default container image. */
exports.DEFAULT_IMAGE = "ubuntu:24.04";
/** Lightweight alternative image. */
exports.ALPINE_IMAGE = "alpine:3.20";
/** Default working directory inside the container. */
exports.CONTAINER_WORKDIR = "/home/user";
/** Default shell to exec into. */
exports.CONTAINER_SHELL = "/bin/bash";
/** Alpine shell fallback. */
exports.CONTAINER_SHELL_ALPINE = "/bin/sh";
/** Default CPU core limit (0 = unlimited). */
exports.DEFAULT_CPU_LIMIT = 2;
/** Maximum allowed CPU cores. */
exports.MAX_CPU_LIMIT = 8;
/** Default memory limit in MB. */
exports.DEFAULT_MEMORY_LIMIT_MB = 1024;
/** Maximum memory limit in MB. */
exports.MAX_MEMORY_LIMIT_MB = 8192;
/** Default disk size limit in MB. */
exports.DEFAULT_DISK_LIMIT_MB = 4096;
/** Maximum disk limit in MB. */
exports.MAX_DISK_LIMIT_MB = 32768;
/** Default command timeout in seconds. */
exports.DEFAULT_TIMEOUT_SECONDS = 30;
/** Minimum timeout. */
exports.MIN_TIMEOUT_SECONDS = 5;
/** Maximum timeout. */
exports.MAX_TIMEOUT_SECONDS = 300;
/** Default max output size in bytes returned to the model. */
exports.DEFAULT_MAX_OUTPUT_BYTES = 32_768;
/** Absolute max output bytes. */
exports.MAX_OUTPUT_BYTES = 131_072;
/** Default max tool calls per turn. */
exports.DEFAULT_MAX_TOOL_CALLS_PER_TURN = 25;
/** Minimum allowed tool calls per turn. */
exports.MIN_TOOL_CALLS_PER_TURN = 1;
/** Maximum allowed tool calls per turn. */
exports.MAX_TOOL_CALLS_PER_TURN = 100;
/** Max file size for read operations (bytes). */
exports.MAX_FILE_READ_BYTES = 512_000;
/** Max file size for write operations (bytes). */
exports.MAX_FILE_WRITE_BYTES = 5_242_880;
/** Max file size for upload/download (bytes). */
exports.MAX_TRANSFER_BYTES = 52_428_800;
/** Default host transfer directory. */
exports.DEFAULT_TRANSFER_DIR = "lms-computer-files";
/** Commands blocked in strict mode (pattern-matched). */
exports.BLOCKED_COMMANDS_STRICT = [
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
exports.CONTAINER_ENV_VARS = {
    TERM: "xterm-256color",
    LANG: "en_US.UTF-8",
    HOME: exports.CONTAINER_WORKDIR,
    LMS_COMPUTER: "1",
};
/** Package sets available for pre-installation. */
exports.PACKAGE_PRESETS = {
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
exports.PACKAGE_PRESETS_ALPINE = {
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
exports.MAX_INJECTED_CONTEXT_CHARS = 2_000;
/** Valid base images the user can select. */
exports.VALID_IMAGES = [
    "ubuntu:24.04",
    "ubuntu:22.04",
    "alpine:3.20",
    "debian:bookworm-slim",
];
exports.NETWORK_MODES = [
    "none",
    "bridge",
    "slirp4netns",
    "pasta",
    "podman-default",
];
exports.PERSISTENCE_MODES = ["persistent", "ephemeral"];
exports.CONTAINER_STATES = [
    "running",
    "stopped",
    "not_found",
    "error",
];
//# sourceMappingURL=constants.js.map