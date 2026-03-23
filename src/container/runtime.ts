/**
 * @file container/runtime.ts
 * Auto-detects Docker or Podman on the host system.
 *
 * Priority: Docker first (most common), then Podman fallback.
 * Caches the result after first successful detection.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import type { RuntimeInfo, RuntimeKind } from "../types";

const execAsync = promisify(execFile);

/** Cached runtime info after first detection. */
let cachedRuntime: RuntimeInfo | null = null;

/**
 * Attempt to detect a specific runtime by running `<cmd> --version`.
 */
async function probe(
  cmd: string,
  kind: RuntimeKind,
): Promise<RuntimeInfo | null> {
  try {
    const { stdout } = await execAsync(cmd, ["--version"], { timeout: 5_000 });
    const version = stdout.trim().split("\n")[0] ?? "unknown";
    return { kind, path: cmd, version };
  } catch {
    return null;
  }
}

/**
 * Returns runtime candidates ordered by priority.
 * On Windows, also probes known Docker Desktop install paths since
 * LM Studio may launch with a restricted PATH that omits Program Files.
 */
function getRuntimeCandidates(): Array<{ cmd: string; kind: RuntimeKind }> {
  const candidates: Array<{ cmd: string; kind: RuntimeKind }> = [
    { cmd: "docker", kind: "docker" },
    { cmd: "podman", kind: "podman" },
  ];
  if (process.platform === "win32") {
    candidates.push(
      {
        cmd: "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe",
        kind: "docker",
      },
      {
        cmd: "C:\\Program Files\\Docker\\Docker\\resources\\docker.exe",
        kind: "docker",
      },
    );
  }
  return candidates;
}

/**
 * Detect the available container runtime.
 * Tries Docker first, then Podman. Caches the result.
 *
 * @throws Error if neither Docker nor Podman is found.
 */
export async function detectRuntime(): Promise<RuntimeInfo> {
  if (cachedRuntime) return cachedRuntime;

  for (const { cmd, kind } of getRuntimeCandidates()) {
    const result = await probe(cmd, kind);
    if (result) {
      cachedRuntime = result;
      return result;
    }
  }

  const isWin = process.platform === "win32";
  throw new Error(
    "No container runtime found. Please install Docker Desktop" +
      (isWin
        ? " from https://docs.docker.com/desktop/setup/install/windows-install/"
        : " (https://docs.docker.com/get-docker/)") +
      " or Podman (https://podman.io/getting-started/installation) to use this plugin.",
  );
}

/**
 * Check if a container runtime is available without throwing.
 */
export async function isRuntimeAvailable(): Promise<boolean> {
  try {
    await detectRuntime();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the cached runtime, or null if not yet detected.
 */
export function getCachedRuntime(): RuntimeInfo | null {
  return cachedRuntime;
}

/**
 * Clear the cached runtime (useful for testing or re-detection).
 */
export function clearRuntimeCache(): void {
  cachedRuntime = null;
}
