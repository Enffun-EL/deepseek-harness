/**
 * Allowlist validation for URLs the shell may open in the system browser.
 * Pure function — unit-tested without Electron.
 */

/**
 * Return true only when `url` is an absolute http(s) URL safe to open externally.
 * Rejects non-strings, relative URLs, and non-http(s) schemes (file, javascript, …).
 * @param url - candidate URL from the renderer
 * @returns whether main may call `shell.openExternal` with this value
 */
export function isAllowedExternalUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    // Invalid absolute URL (relative path, malformed string, etc.).
    return false
  }
}
