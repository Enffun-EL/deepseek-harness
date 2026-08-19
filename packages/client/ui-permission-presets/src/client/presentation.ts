/**
 * User-visible permission-preset labels. Machine preset ids stay unchanged;
 * this module only maps known shipped presets onto Zcode-aligned product copy.
 */

/** Machine value of the preset that requires an explicit GUI risk gate. */
export const FULL_ACCESS_PRESET = 'danger-full-access'

/** Locales the product label tables cover. */
export type PermissionPresetLabelLocale = 'en' | 'zh'

/**
 * English product labels for the conventional sandbox presets, aligned with the
 * Zcode permission-mode vocabulary (ask before edits / auto edit / full access).
 * Plan mode is a separate collaboration control, not a permission preset.
 */
export const PERMISSION_PRESET_LABELS_EN = {
  'read-only': 'Ask before edits',
  'workspace-write': 'Auto edit',
  [FULL_ACCESS_PRESET]: 'Full access',
} as const satisfies Record<string, string>

/**
 * Simplified Chinese product labels for the same conventional presets
 * (变更前确认 / 自动编辑 / 完全访问).
 */
export const PERMISSION_PRESET_LABELS_ZH = {
  'read-only': '变更前确认',
  'workspace-write': '自动编辑',
  [FULL_ACCESS_PRESET]: '完全访问',
} as const satisfies Record<string, string>

const LABEL_TABLES: Record<PermissionPresetLabelLocale, Readonly<Record<string, string>>> = {
  en: PERMISSION_PRESET_LABELS_EN,
  zh: PERMISSION_PRESET_LABELS_ZH,
}

/**
 * Resolve the product label for one conventional preset id.
 * @param value - preset machine value.
 * @param locale - active UI locale; unknown ids fall back to English tables only when known.
 * @returns the product label, or undefined when the value is not a conventional preset.
 */
export function permissionPresetProductLabel(
  value: string,
  locale: PermissionPresetLabelLocale = 'en',
): string | undefined {
  return LABEL_TABLES[locale][value] ?? LABEL_TABLES.en[value]
}

/**
 * Convert conventional kebab-case preset names into user-facing title case.
 * @param name - host-supplied preset label or key.
 * @returns the title-cased conventional key, or a non-kebab label unchanged.
 */
export function displayPresetName(name: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return name
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

/**
 * Render a permission preset under its product label.
 * Known conventional presets use the Zcode-aligned copy; host-configured
 * names keep title-case or passthrough display. Machine values are never renamed.
 * @param value - preset machine value.
 * @param name - host-supplied preset name (fallback when the value is not conventional).
 * @param locale - active UI locale for product copy.
 * @returns the localized product label or the conventional display name.
 */
export function displayPermissionPreset(
  value: string,
  name: string,
  locale: PermissionPresetLabelLocale = 'en',
): string {
  return permissionPresetProductLabel(value, locale) ?? displayPresetName(name)
}

/**
 * Normalize a locale id to the tables this module owns.
 * @param locale - active locale id from the client locale runtime.
 * @returns `zh` for Simplified Chinese, otherwise `en`.
 */
export function permissionPresetLabelLocale(locale: string): PermissionPresetLabelLocale {
  return locale === 'zh' ? 'zh' : 'en'
}

/** Locale dictionary keys for the three conventional product presets. */
const PRESET_LOCALE_KEYS = {
  'read-only': 'preset.read-only',
  'workspace-write': 'preset.workspace-write',
  [FULL_ACCESS_PRESET]: 'preset.danger-full-access',
} as const

/** Locale keys used for conventional permission preset product labels. */
export type PermissionPresetLocaleKey =
  (typeof PRESET_LOCALE_KEYS)[keyof typeof PRESET_LOCALE_KEYS]

/**
 * Resolve a preset label through a bound locale dictionary when the value is
 * conventional; otherwise fall back to the host name display transform.
 * @param value - preset machine value.
 * @param name - host-supplied preset name.
 * @param t - bound translator that owns the `preset.*` keys.
 * @returns the localized product label or the conventional display name.
 */
export function translatePermissionPreset(
  value: string,
  name: string,
  t: (key: PermissionPresetLocaleKey) => string,
): string {
  const key = PRESET_LOCALE_KEYS[value as keyof typeof PRESET_LOCALE_KEYS]
  return key === undefined ? displayPresetName(name) : t(key)
}
