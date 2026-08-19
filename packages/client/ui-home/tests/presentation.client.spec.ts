import { describe, expect, it } from 'vitest'
import {
  HOME_PERMISSION_MODES,
  greetingDaypart,
  homeClassNames,
  isHomePermissionMode,
  permissionModeLabel,
  permissionModeLabelKey,
} from '../src/presentation.ts'
import { en, homeString, zh } from '../src/locales.ts'

describe('homeClassNames', () => {
  it('joins truthy class tokens and drops falsey ones', () => {
    expect(homeClassNames('a', false, undefined, null, '', 'b')).toBe('a b')
    expect(homeClassNames()).toBe('')
  })
})

describe('permission mode labels', () => {
  it('covers every canonical mode with zh and en dictionary keys', () => {
    for (const mode of HOME_PERMISSION_MODES) {
      const key = permissionModeLabelKey(mode)
      expect(zh[key]).toBeTruthy()
      expect(en[key]).toBe(permissionModeLabel(mode))
    }
  })

  it('returns product English labels for the three sandbox modes', () => {
    expect(permissionModeLabel('read-only')).toBe('Read only')
    expect(permissionModeLabel('workspace-write')).toBe('Workspace write')
    expect(permissionModeLabel('danger-full-access')).toBe('Full access')
  })

  it('narrows known machine values', () => {
    expect(isHomePermissionMode('workspace-write')).toBe(true)
    expect(isHomePermissionMode('full-access')).toBe(false)
  })
})

describe('homeString', () => {
  it('selects zh for zh tags and en otherwise', () => {
    expect(homeString('zh', 'greeting.hello')).toBe(zh['greeting.hello'])
    expect(homeString('zh-CN', 'greeting.hello')).toBe(zh['greeting.hello'])
    expect(homeString('en', 'greeting.hello')).toBe(en['greeting.hello'])
    expect(homeString('fr', 'model.missing.cta')).toBe(en['model.missing.cta'])
  })
})

describe('greetingDaypart', () => {
  it('splits the day into morning, afternoon, and evening', () => {
    expect(greetingDaypart(0)).toBe('morning')
    expect(greetingDaypart(11)).toBe('morning')
    expect(greetingDaypart(12)).toBe('afternoon')
    expect(greetingDaypart(17)).toBe('afternoon')
    expect(greetingDaypart(18)).toBe('evening')
    expect(greetingDaypart(23)).toBe('evening')
  })
})
