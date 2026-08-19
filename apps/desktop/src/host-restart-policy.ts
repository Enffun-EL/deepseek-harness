/**
 * Pure restart / backoff policy for the desktop Host supervisor.
 * Kept free of Electron and child_process so unit tests stay keyless and fast.
 */

/** Tunables for post-ready Host crash recovery. */
export interface HostRestartPolicy {
  /** Maximum number of restart attempts after readiness (not counting the first start). */
  maxAttempts: number
  /** Delay before the first restart. */
  initialDelayMs: number
  /** Upper bound for exponential backoff. */
  maxDelayMs: number
  /** Multiplier applied per failed restart (`initial * factor ** attemptIndex`). */
  backoffFactor: number
}

/** Default desktop policy: a few quick retries, then back off up to 30s. */
export const DEFAULT_HOST_RESTART_POLICY: Readonly<HostRestartPolicy> = {
  maxAttempts: 5,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
}

/**
 * Whether a Host exit should trigger a supervised restart.
 * @param input - lifecycle flags and attempt budget
 * @returns true only for unexpected exits after the Host had become ready
 */
export function shouldRestartHost(input: {
  /** True once the readiness URL was observed for this generation. */
  hadReachedReady: boolean
  /** True when the shell is stopping the child on purpose (quit / replace). */
  stoppingIntentionally: boolean
  /** Restarts already consumed for the current failure streak. */
  failedRestarts: number
  /** Policy attempt cap. */
  maxAttempts: number
}): boolean {
  if (input.stoppingIntentionally) return false
  if (!input.hadReachedReady) return false
  if (input.failedRestarts < 0) return false
  return input.failedRestarts < input.maxAttempts
}

/**
 * Delay before the next restart, or `null` when the attempt budget is exhausted.
 * @param failedRestarts - crashes already handled in this streak (`0` = first restart)
 * @param policy - backoff tunables
 * @returns milliseconds to wait, or `null` to stop retrying
 */
export function restartBackoffMs(
  failedRestarts: number,
  policy: Readonly<HostRestartPolicy> = DEFAULT_HOST_RESTART_POLICY,
): number | null {
  if (!Number.isFinite(failedRestarts) || failedRestarts < 0) {
    return null
  }
  if (failedRestarts >= policy.maxAttempts) {
    return null
  }
  const delay = policy.initialDelayMs * policy.backoffFactor ** failedRestarts
  if (!Number.isFinite(delay) || delay < 0) {
    return null
  }
  return Math.min(policy.maxDelayMs, Math.floor(delay))
}

/**
 * Advance the failure streak after scheduling a restart.
 * @param failedRestarts - previous streak length
 * @returns next streak length
 */
export function recordRestartAttempt(failedRestarts: number): number {
  return Math.max(0, failedRestarts) + 1
}

/**
 * Clear the failure streak after the Host stays ready long enough.
 * @returns zeroed streak counter
 */
export function resetRestartStreak(): number {
  return 0
}
