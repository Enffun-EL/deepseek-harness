/** Pure presentation helpers for the Automation page surface. */

/**
 * Join CSS module class names, dropping falsey entries.
 * @param parts - class tokens or falsey skips.
 * @returns a space-joined className string (empty when nothing truthy remains).
 */
export function automationClassNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.length > 0).join(' ')
}