/**
 * @file safety/guard.ts
 * Command safety layer — screens commands before execution.
 *
 * When strict mode is enabled, blocks patterns known to be destructive.
 * This is a best-effort safety net, not a security boundary — the
 * container itself is the real isolation layer.
 */

import { BLOCKED_COMMANDS_STRICT } from "../constants";

/** Result of a safety check. */
export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Normalize a command for pattern matching:
 * - collapse whitespace
 * - lowercase
 * - strip leading sudo/doas
 */
function normalize(cmd: string): string {
  return cmd
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(sudo|doas)\s+/, "");
}

/**
 * Check a command against the strict blocklist.
 */
export function checkCommand(
  command: string,
  strictMode: boolean,
): SafetyCheckResult {
  if (!strictMode) {
    return { allowed: true };
  }

  const normalized = normalize(command);

  for (const pattern of BLOCKED_COMMANDS_STRICT) {
    const normalizedPattern = normalize(pattern);
    if (normalized.includes(normalizedPattern)) {
      return {
        allowed: false,
        reason:
          `Blocked by strict safety mode: command matches destructive pattern "${pattern}". ` +
          `Disable "Strict Safety Mode" in plugin settings if you need to run this.`,
      };
    }
  }

  if (/:\(\)\s*\{.*\}/.test(normalized) || /\.\(\)\s*\{.*\}/.test(normalized)) {
    return {
      allowed: false,
      reason: "Blocked by strict safety mode: detected fork bomb pattern.",
    };
  }

  if (
    />\s*\/dev\/[sh]d[a-z]/.test(normalized) ||
    /of=\/dev\/[sh]d[a-z]/.test(normalized)
  ) {
    return {
      allowed: false,
      reason: "Blocked by strict safety mode: direct write to block device.",
    };
  }

  return { allowed: true };
}
