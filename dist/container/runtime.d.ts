/**
 * @file container/runtime.ts
 * Auto-detects Docker or Podman on the host system.
 *
 * Priority: Docker first (most common), then Podman fallback.
 * Caches the result after first successful detection.
 */
import type { RuntimeInfo } from "../types";
/**
 * Detect the available container runtime.
 * Tries Docker first, then Podman. Caches the result.
 *
 * @throws Error if neither Docker nor Podman is found.
 */
export declare function detectRuntime(): Promise<RuntimeInfo>;
/**
 * Check if a container runtime is available without throwing.
 */
export declare function isRuntimeAvailable(): Promise<boolean>;
/**
 * Get the cached runtime, or null if not yet detected.
 */
export declare function getCachedRuntime(): RuntimeInfo | null;
/**
 * Clear the cached runtime (useful for testing or re-detection).
 */
export declare function clearRuntimeCache(): void;
//# sourceMappingURL=runtime.d.ts.map