/**
 * @file safety/guard.ts
 * Command safety layer — screens commands before execution.
 *
 * When strict mode is enabled, blocks patterns known to be destructive.
 * This is a best-effort safety net, not a security boundary — the
 * container itself is the real isolation layer.
 */
/** Result of a safety check. */
export interface SafetyCheckResult {
    allowed: boolean;
    reason?: string;
}
/**
 * Check a command against the strict blocklist.
 */
export declare function checkCommand(command: string, strictMode: boolean): SafetyCheckResult;
//# sourceMappingURL=guard.d.ts.map