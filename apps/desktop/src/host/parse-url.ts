/**
 * Parse the readiness line printed by `@deepseek-ai/dsh-web-app` when
 * `printUrl` is enabled. Supervisors (this desktop shell) treat the first
 * matching line as "Host is serving".
 */

/** Match `dsh web: http://127.0.0.1:PORT` and optional LAN suffix. */
const HOST_URL_LINE = /^dsh web:\s+(https?:\/\/[^\s]+)/m

/**
 * Extract the local Web UI URL from Host process output.
 * @param text - combined stdout/stderr chunk or buffer so far
 * @returns the first local URL, or null when the readiness line is absent
 */
export function parseHostWebUrl(text: string): string | null {
  const match = HOST_URL_LINE.exec(text)
  return match?.[1] ?? null
}
