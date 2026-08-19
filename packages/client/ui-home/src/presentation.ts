/** Pure presentation helpers for the HOME empty-state surface. */

import { en, type HomeKey } from './locales.ts'

/** Canonical permission-mode machine values rendered by HomeComposerChrome. */
export type HomePermissionMode = 'read-only' | 'workspace-write' | 'danger-full-access'

/** Ordered permission options exposed by the composer chrome. */
export const HOME_PERMISSION_MODES: readonly HomePermissionMode[] = [
  'read-only',
  'workspace-write',
  'danger-full-access',
]

const PERMISSION_LABEL_KEYS = {
  'read-only': 'permission.read-only',
  'workspace-write': 'permission.workspace-write',
  'danger-full-access': 'permission.danger-full-access',
} as const satisfies Record<HomePermissionMode, HomeKey>

/**
 * Dictionary key that labels a permission mode in the home namespace.
 * @param mode - machine permission value.
 * @returns the home locale key for that mode.
 */
export function permissionModeLabelKey(mode: HomePermissionMode): HomeKey {
  return PERMISSION_LABEL_KEYS[mode]
}

/**
 * English product label for a permission mode (stable for tests and fallbacks).
 * @param mode - machine permission value.
 * @returns the English label from the home dictionary.
 */
export function permissionModeLabel(mode: HomePermissionMode): string {
  return en[permissionModeLabelKey(mode)]
}

/**
 * Whether a string is one of the known home permission modes.
 * @param value - candidate machine value.
 * @returns true when the value is a {@link HomePermissionMode}.
 */
export function isHomePermissionMode(value: string): value is HomePermissionMode {
  return (HOME_PERMISSION_MODES as readonly string[]).includes(value)
}

/**
 * Join CSS module class names, dropping falsey entries.
 * @param parts - class tokens or falsey skips.
 * @returns a space-joined className string (empty when nothing truthy remains).
 */
export function homeClassNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.length > 0).join(' ')
}

/**
 * Daypart greeting suffix for a wall-clock hour (0–23).
 * @param hour - local hour of day.
 * @returns `morning` | `afternoon` | `evening`.
 */
export function greetingDaypart(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
