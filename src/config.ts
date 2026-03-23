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

import { createConfigSchematics } from "@lmstudio/sdk";

export const configSchematics = createConfigSchematics()
  .field(
    "internetAccess",
    "select",
    {
      displayName: "Internet Access",
      subtitle:
        "Allow the computer to reach the internet (toggle container network mode)",
      options: [
        { value: "on", displayName: "On — container has full internet access" },
        { value: "off", displayName: "Off — completely airgapped, no network" },
      ],
    },
    "off",
  )

  .field(
    "persistenceMode",
    "select",
    {
      displayName: "Persistence Mode",
      subtitle: "Whether the computer keeps its state when LM Studio closes",
      options: [
        {
          value: "persistent",
          displayName:
            "Persistent — keep files, packages, and state across sessions",
        },
        {
          value: "ephemeral",
          displayName: "Ephemeral — fresh clean environment every time",
        },
      ],
    },
    "persistent",
  )

  .field(
    "baseImage",
    "select",
    {
      displayName: "Base Image",
      subtitle: "The Linux distribution running inside the container",
      options: [
        {
          value: "ubuntu:24.04",
          displayName: "Ubuntu 24.04 (recommended — widest compatibility)",
        },
        { value: "ubuntu:22.04", displayName: "Ubuntu 22.04 (LTS stable)" },
        {
          value: "debian:bookworm-slim",
          displayName: "Debian Bookworm Slim (lightweight)",
        },
        {
          value: "alpine:3.20",
          displayName: "Alpine 3.20 (ultra-lightweight ~5MB, musl libc)",
        },
      ],
    },
    "ubuntu:24.04",
  )

  .field(
    "cpuLimit",
    "numeric",
    {
      displayName: "CPU Core Limit",
      subtitle: "Maximum CPU cores allocated to the computer (0 = no limit)",
      min: 0,
      max: 8,
      int: true,
      slider: { step: 1, min: 0, max: 8 },
    },
    2,
  )

  .field(
    "memoryLimitMB",
    "numeric",
    {
      displayName: "Memory Limit (MB)",
      subtitle: "Maximum RAM in megabytes (256-8192)",
      min: 256,
      max: 8192,
      int: true,
      slider: { step: 256, min: 256, max: 8192 },
    },
    1024,
  )

  .field(
    "diskLimitMB",
    "numeric",
    {
      displayName: "Disk Limit (MB)",
      subtitle:
        "Maximum disk space in megabytes (512-32768). Only enforced on new containers.",
      min: 512,
      max: 32768,
      int: true,
      slider: { step: 512, min: 512, max: 32768 },
    },
    4096,
  )

  .field(
    "commandTimeout",
    "numeric",
    {
      displayName: "Command Timeout (seconds)",
      subtitle:
        "Maximum time a single command can run before being killed (5-300)",
      min: 5,
      max: 300,
      int: true,
      slider: { step: 5, min: 5, max: 300 },
    },
    30,
  )

  .field(
    "maxOutputSize",
    "numeric",
    {
      displayName: "Max Output Size (KB)",
      subtitle:
        "Maximum stdout/stderr returned to the model per command (1-128 KB). Larger output is truncated.",
      min: 1,
      max: 128,
      int: true,
      slider: { step: 1, min: 1, max: 128 },
    },
    32,
  )

  .field(
    "maxToolCallsPerTurn",
    "numeric",
    {
      displayName: "Max Tool Calls Per Turn",
      subtitle:
        "Maximum number of times the model can use the computer per conversational turn (1-100). It resets each time you send a message. Prevents infinite or long loops.",
      min: 1,
      max: 100,
      int: true,
      slider: { step: 1, min: 1, max: 100 },
    },
    10,
  )

  .field(
    "autoInstallPreset",
    "select",
    {
      displayName: "Auto-Install Packages",
      subtitle: "Pre-install common tools when the container is first created",
      options: [
        { value: "none", displayName: "None — bare OS, install manually" },
        { value: "minimal", displayName: "Minimal — curl, wget, git, vim, jq" },
        { value: "python", displayName: "Python — python3, pip, venv" },
        { value: "node", displayName: "Node.js — nodejs, npm" },
        { value: "build", displayName: "Build Tools — gcc, cmake, make" },
        {
          value: "full",
          displayName: "Full — all of the above + networking tools",
        },
      ],
    },
    "minimal",
  )

  .field(
    "portForwards",
    "string",
    {
      displayName: "Port Forwards",
      subtitle:
        "Comma-separated host:container port pairs (e.g., '8080:80,3000:3000'). Allows accessing services running inside the container.",
    },
    "",
  )

  .field(
    "hostMountPath",
    "string",
    {
      displayName: "Shared Folder (Host Mount)",
      subtitle:
        "Absolute path to a folder on your computer that will be accessible inside the container at /mnt/shared. Leave empty to disable.",
    },
    "",
  )

  .field(
    "strictSafety",
    "select",
    {
      displayName: "Strict Safety Mode",
      subtitle:
        "Block known destructive commands (fork bombs, disk wipers). Disable only if you know what you're doing.",
      options: [
        {
          value: "on",
          displayName:
            "On — block obviously destructive commands (recommended)",
        },
        {
          value: "off",
          displayName: "Off — allow everything, I accept the risk",
        },
      ],
    },
    "on",
  )

  .field(
    "autoInjectContext",
    "select",
    {
      displayName: "Auto-Inject Computer Context",
      subtitle:
        "Automatically tell the model about its computer (OS, installed tools, running processes) at the start of each turn",
      options: [
        {
          value: "on",
          displayName:
            "On — model always knows its computer state (recommended)",
        },
        {
          value: "off",
          displayName: "Off — model discovers state via tools only",
        },
      ],
    },
    "on",
  )

  .build();
