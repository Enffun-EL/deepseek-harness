/**
 * Allowlist validation for URLs the shell may open in the system browser.
 * Pure functions — unit-tested without Electron.
 *
 * Default policy: absolute http(s) only (any host). Dangerous schemes
 * (`file:`, `javascript:`, `data:`, …) are always rejected.
 *
 * Optional host policy: when `DSH_DESKTOP_OPEN_EXTERNAL_HOSTS` is set to a
 * comma-separated host list, only those hosts **and localhost** are allowed.
 * @module @deepseek-ai/dsh-desktop/external-url
 */

/** Env var: comma-separated hostnames permitted for `openExternal` (plus localhost). */
export const OPEN_EXTERNAL_HOSTS_ENV = 'DSH_DESKTOP_OPEN_EXTERNAL_HOSTS'

/** Options for {@link isAllowedExternalUrl}. */
export interface ExternalUrlPolicyOptions {
  /**
   * Explicit host allowlist. When `undefined`, the value is read from
   * {@link OPEN_EXTERNAL_HOSTS_ENV} on `env` (default `process.env`).
   * When `null`, any http(s) host is allowed.
   * When a (possibly empty) array, only listed hosts and localhost pass.
   */
  allowedHosts?: readonly string[] | null
  /** Env bag used when `allowedHosts` is omitted. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv
}

/**
 * Parse a comma-separated host allowlist string.
 * @param raw - env value or config string; empty/whitespace → empty list
 * @returns lowercased hostnames with empties dropped
 */
export function parseOpenExternalHostAllowlist(raw: string | undefined | null): string[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  return raw
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(part => part.length > 0)
}

/**
 * Resolve the effective host allowlist from options / env.
 * @param options - optional explicit list or env bag
 * @returns `null` when unrestricted; otherwise the allowlist (localhost still always ok)
 */
export function resolveOpenExternalHostAllowlist(
  options?: ExternalUrlPolicyOptions,
): string[] | null {
  if (options !== undefined && 'allowedHosts' in options) {
    return options.allowedHosts === null
      ? null
      : [...(options.allowedHosts ?? [])].map(h => h.trim().toLowerCase()).filter(h => h.length > 0)
  }
  const env = options?.env ?? process.env
  const raw = env[OPEN_EXTERNAL_HOSTS_ENV]
  // Unset / undefined → no host restriction. Empty string → allowlist mode with only localhost.
  if (raw === undefined) return null
  return parseOpenExternalHostAllowlist(raw)
}

/**
 * Return true when the hostname is loopback / localhost (always allowed under host policy).
 * @param hostname - URL hostname (WHATWG; IPv6 without brackets)
 */
export function isLocalhostHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase()
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '[::1]' ||
    h.endsWith('.localhost')
  )
}

/**
 * Return true only when `url` is an absolute http(s) URL safe to open externally.
 * Rejects non-strings, relative URLs, and non-http(s) schemes (file, javascript, …).
 * When a host allowlist is active (env or options), only listed hosts and localhost pass.
 * @param url - candidate URL from the renderer
 * @param options - optional host policy override
 * @returns whether main may call `shell.openExternal` with this value
 */
export function isAllowedExternalUrl(
  url: unknown,
  options?: ExternalUrlPolicyOptions,
): url is string {
  if (typeof url !== 'string' || url.length === 0) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const allowlist = resolveOpenExternalHostAllowlist(options)
    if (allowlist === null) return true
    const host = parsed.hostname.toLowerCase()
    if (isLocalhostHostname(host)) return true
    return allowlist.includes(host)
  } catch {
    // Invalid absolute URL (relative path, malformed string, etc.).
    return false
  }
}
