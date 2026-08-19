/** Nav item model builder for the Zcode-like Desktop left rail. */
import { describe, expect, it } from 'vitest'
import {
  buildDesktopRailAccountItems, buildDesktopRailNavItems, buildDesktopRailSections,
} from '../src/client/desktop-rail-nav.ts'

describe('buildDesktopRailNavItems', () => {
  it('orders New Task, Search, Automation, and Plugin Market with contract actions', () => {
    const items = buildDesktopRailNavItems()
    expect(items.map(item => item.id)).toEqual([
      'newTask',
      'search',
      'automation',
      'pluginMarket',
    ])
    expect(items.map(item => item.action)).toEqual([
      'createTask',
      'openCommandPalette',
      'navigateAutomation',
      'navigatePluginMarket',
    ])
    expect(items.map(item => item.labelKey)).toEqual([
      'task.new',
      'nav.search',
      'nav.automation',
      'nav.pluginMarket',
    ])
    expect(items[0]?.shortcut).toBe('Ctrl+N')
    expect(items[1]?.shortcut).toBe('Ctrl+K')
    expect(items[2]?.shortcut).toBeUndefined()
    expect(items[3]?.shortcut).toBeUndefined()
  })

  it('returns a frozen list', () => {
    const items = buildDesktopRailNavItems()
    expect(Object.isFrozen(items)).toBe(true)
  })
})

describe('buildDesktopRailSections', () => {
  it('exposes project and task empty-copy anchors', () => {
    const sections = buildDesktopRailSections()
    expect(sections).toEqual([
      {
        id: 'projects',
        titleKey: 'section.projects',
        emptyKey: 'empty.projects',
      },
      {
        id: 'tasks',
        titleKey: 'section.tasks',
        emptyKey: 'empty.tasks',
      },
    ])
    expect(Object.isFrozen(sections)).toBe(true)
  })
})

describe('buildDesktopRailAccountItems', () => {
  it('lists account and phone-remote placeholders', () => {
    const items = buildDesktopRailAccountItems()
    expect(items.map(item => item.id)).toEqual(['account', 'phoneRemote'])
    expect(items.map(item => item.action)).toEqual([
      'openAccountOrConnect',
      'openPhoneRemote',
    ])
    expect(Object.isFrozen(items)).toBe(true)
  })
})
