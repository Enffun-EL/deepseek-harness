// filterCommandPaletteItems: tab kind gates + multi-token query matching.
import { describe, expect, it } from 'vitest'
import { filterCommandPaletteItems, matchesQuery } from '../src/client/filter.ts'
import type { CommandPaletteItem } from '../src/client/types.ts'

const catalog: readonly CommandPaletteItem[] = [
  {
    id: 'a1',
    title: 'New task',
    description: 'Start a new session',
    kind: 'action',
    keywords: ['session', 'chat'],
  },
  {
    id: 'a2',
    title: 'Toggle sidebar',
    description: 'Collapse the left rail',
    kind: 'action',
    keywords: ['panel'],
  },
  {
    id: 't1',
    title: 'Fix login bug',
    description: 'Auth regression on staging',
    kind: 'task',
    keywords: ['auth'],
  },
  {
    id: 'f1',
    title: 'src/main.ts',
    description: 'Application entry',
    kind: 'file',
    keywords: ['entry'],
  },
]

describe('matchesQuery', () => {
  it('matches empty and whitespace-only queries', () => {
    expect(matchesQuery(catalog[0]!, '')).toBe(true)
    expect(matchesQuery(catalog[0]!, '   ')).toBe(true)
  })

  it('matches title, description, and keywords case-insensitively', () => {
    expect(matchesQuery(catalog[0]!, 'NEW')).toBe(true)
    expect(matchesQuery(catalog[0]!, 'session')).toBe(true)
    expect(matchesQuery(catalog[2]!, 'staging')).toBe(true)
    expect(matchesQuery(catalog[2]!, 'auth')).toBe(true)
  })

  it('requires every whitespace-separated token', () => {
    expect(matchesQuery(catalog[0]!, 'new session')).toBe(true)
    expect(matchesQuery(catalog[0]!, 'new missing')).toBe(false)
  })
})

describe('filterCommandPaletteItems', () => {
  it('returns the full catalog on the all tab with an empty query', () => {
    expect(filterCommandPaletteItems(catalog, 'all', '').map(i => i.id))
      .toEqual(['a1', 'a2', 't1', 'f1'])
  })

  it('keeps only actions on the actions tab', () => {
    expect(filterCommandPaletteItems(catalog, 'actions', '').map(i => i.id))
      .toEqual(['a1', 'a2'])
  })

  it('keeps only tasks on the tasks tab', () => {
    expect(filterCommandPaletteItems(catalog, 'tasks', '').map(i => i.id))
      .toEqual(['t1'])
  })

  it('keeps only files on the files tab', () => {
    expect(filterCommandPaletteItems(catalog, 'files', '').map(i => i.id))
      .toEqual(['f1'])
  })

  it('combines tab and query filters and preserves input order', () => {
    expect(filterCommandPaletteItems(catalog, 'actions', 'side').map(i => i.id))
      .toEqual(['a2'])
    expect(filterCommandPaletteItems(catalog, 'all', 'entry').map(i => i.id))
      .toEqual(['f1'])
    expect(filterCommandPaletteItems(catalog, 'tasks', 'sidebar')).toEqual([])
  })
})
