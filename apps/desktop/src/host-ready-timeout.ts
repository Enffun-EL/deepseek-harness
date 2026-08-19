/**
 * Resolve the Host readiness wait from the environment.
 *
 * `DSH_DESKTOP_HOST_READY_MS` — positive integer milliseconds. Invalid or
 * absent values fall back to the default so a bad shell export cannot hang
 * the desktop forever with `0` / `NaN`.
 */

/** Default readiness wait when the env override is absent or invalid. */
export const DEFAULT_HOST_READY_TIMEOUT_MS = 120_000

/** Env var name for the desktop Host readiness timeout. */
export const HOST_READY_TIMEOUT_ENV = 'DSH_DESKTOP_HOST_READY_MS'

/**
 * Parse `DSH_DESKTOP_HOST_READY_MS` into a positive finite timeout.
 * @param env - environment map (defaults to `process.env`)
 * @param fallbackMs - used when unset or invalid
 * @returns timeout in milliseconds
 */
export function resolveHostReadyTimeoutMs(
  env: NodeJS.ProcessEnv = process.env,
  fallbackMs: number = DEFAULT_HOST_READY_TIMEOUT_MS,
): number {
  const fallback =
    Number.isFinite(fallbackMs) && fallbackMs > 0 ? Math.floor(fallbackMs) : DEFAULT_HOST_READY_TIMEOUT_MS
  const raw = env[HOST_READY_TIMEOUT_ENV]
  if (typeof raw !== 'string' || raw.trim() === '') {
    return fallback
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}
