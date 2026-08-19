import { describe, expect, it } from 'vitest'
import {
  displayPermissionPreset,
  displayPresetName,
  FULL_ACCESS_PRESET,
  PERMISSION_PRESET_LABELS_EN,
  PERMISSION_PRESET_LABELS_ZH,
  permissionPresetLabelLocale,
  permissionPresetProductLabel,
  translatePermissionPreset,
} from '../src/client/presentation.ts'
import { accessEn, accessZh, en, zh } from '../src/client/locales.ts'

describe('permission preset product labels', () => {
  it('maps conventional preset ids to Zcode-aligned English and Chinese copy', () => {
    expect(PERMISSION_PRESET_LABELS_EN).toEqual({
      'read-only': 'Ask before edits',
      'workspace-write': 'Auto edit',
      [FULL_ACCESS_PRESET]: 'Full access',
    })
    expect(PERMISSION_PRESET_LABELS_ZH).toEqual({
      'read-only': '变更前确认',
      'workspace-write': '自动编辑',
      [FULL_ACCESS_PRESET]: '完全访问',
    })
    expect(permissionPresetProductLabel('read-only', 'en')).toBe('Ask before edits')
    expect(permissionPresetProductLabel('workspace-write', 'zh')).toBe('自动编辑')
    expect(permissionPresetProductLabel(FULL_ACCESS_PRESET, 'zh')).toBe('完全访问')
    expect(permissionPresetProductLabel('custom-mode')).toBeUndefined()
  })

  it('prefers product labels over host names and keeps unknown presets conventional', () => {
    expect(displayPermissionPreset('read-only', 'read-only', 'en')).toBe('Ask before edits')
    expect(displayPermissionPreset('workspace-write', 'Workspace', 'zh')).toBe('自动编辑')
    expect(displayPermissionPreset(FULL_ACCESS_PRESET, 'danger-full-access', 'en')).toBe('Full access')
    expect(displayPermissionPreset('agentish', 'agentish', 'en')).toBe('Agentish')
    expect(displayPermissionPreset('plain', 'Ask Every Time', 'zh')).toBe('Ask Every Time')
    expect(displayPresetName('workspace-write')).toBe('Workspace Write')
    expect(permissionPresetLabelLocale('zh')).toBe('zh')
    expect(permissionPresetLabelLocale('en')).toBe('en')
    expect(permissionPresetLabelLocale('fr')).toBe('en')
  })

  it('resolves labels through bound locale dictionaries', () => {
    const tEn = (key: string): string => en[key as keyof typeof en] ?? accessEn[key as keyof typeof accessEn] ?? key
    const tZh = (key: string): string => zh[key as keyof typeof zh] ?? accessZh[key as keyof typeof accessZh] ?? key
    expect(translatePermissionPreset('read-only', 'read-only', tEn)).toBe('Ask before edits')
    expect(translatePermissionPreset('workspace-write', 'workspace-write', tZh)).toBe('自动编辑')
    expect(translatePermissionPreset(FULL_ACCESS_PRESET, FULL_ACCESS_PRESET, tZh)).toBe('完全访问')
    expect(translatePermissionPreset('plain', 'Ask Every Time', tEn)).toBe('Ask Every Time')
    expect(zh['preset.read-only']).toBe('变更前确认')
    expect(en['preset.workspace-write']).toBe('Auto edit')
    expect(accessZh['preset.danger-full-access']).toBe('完全访问')
    expect(accessEn['confirm.enable']).toBe('Enable Full access')
  })
})
