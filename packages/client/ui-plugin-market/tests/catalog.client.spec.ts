import { describe, expect, it } from 'vitest'
import {
  filterPluginMarketCatalog,
  matchesPluginMarketEntry,
  type PluginMarketCatalog,
} from '../src/client/catalog.ts'
import fixtureCatalog from '../src/client/fixtures/catalog.json'

const CATALOG = fixtureCatalog as PluginMarketCatalog

describe('filterPluginMarketCatalog', () => {
  it('returns the same catalog reference when the query is blank or whitespace', () => {
    expect(filterPluginMarketCatalog(CATALOG, '')).toBe(CATALOG)
    expect(filterPluginMarketCatalog(CATALOG, '   ')).toBe(CATALOG)
  })

  it('filters installed rows and section plugins by name, id, summary, or category', () => {
    const byName = filterPluginMarketCatalog(CATALOG, '\u7ad9\u4f1a')
    expect(byName.installed).toEqual([])
    expect(byName.sections).toHaveLength(1)
    expect(byName.sections[0]?.id).toBe('productivity')
    expect(byName.sections[0]?.plugins.map(entry => entry.id)).toEqual([
      'fixture.standup-card',
    ])

    const byId = filterPluginMarketCatalog(CATALOG, 'fixture.diff-lens')
    expect(byId.installed).toEqual([])
    expect(byId.sections).toHaveLength(1)
    expect(byId.sections[0]?.plugins.map(entry => entry.id)).toEqual([
      'fixture.diff-lens',
    ])

    const byCategory = filterPluginMarketCatalog(CATALOG, 'developer-tools')
    expect(byCategory.installed.map(entry => entry.id)).toEqual([
      'fixture.symbol-jump',
    ])
    expect(byCategory.sections.map(section => section.id)).toEqual([
      'developer-tools',
    ])
    expect(byCategory.sections[0]?.plugins).toHaveLength(3)

    const bySummary = filterPluginMarketCatalog(CATALOG, '\u756a\u8304\u949f')
    expect(bySummary.sections[0]?.plugins.map(entry => entry.id)).toEqual([
      'fixture.focus-timer',
    ])
  })

  it('drops sections that have no remaining plugins after filtering', () => {
    const filtered = filterPluginMarketCatalog(CATALOG, '\u672c\u5730\u7b14\u8bb0')
    expect(filtered.installed.map(entry => entry.id)).toEqual([
      'fixture.local-notes',
    ])
    expect(filtered.sections.map(section => section.id)).toEqual([
      'productivity',
    ])
  })

  it('returns empty installed and sections when nothing matches', () => {
    const filtered = filterPluginMarketCatalog(CATALOG, 'not-a-plugin-xyz')
    expect(filtered.installed).toEqual([])
    expect(filtered.sections).toEqual([])
  })
})

describe('matchesPluginMarketEntry', () => {
  const entry = CATALOG.installed[0]!

  it('matches an empty normalized query', () => {
    expect(matchesPluginMarketEntry(entry, '')).toBe(true)
  })

  it('is case-insensitive over id and name', () => {
    // Caller normalizes the query (filterPluginMarketCatalog lowercases first).
    expect(matchesPluginMarketEntry(entry, 'fixture.local-notes')).toBe(true)
    expect(matchesPluginMarketEntry(entry, '\u672c\u5730')).toBe(true)
    expect(matchesPluginMarketEntry(entry, 'missing')).toBe(false)
  })
})
