/**
 * Pure command-palette filter: tab kind + case-insensitive query over title,
 * description, and keywords. Zero React / cordis.
 */
import type {
  CommandPaletteFilterTab,
  CommandPaletteItem,
  CommandPaletteItemKind,
} from './types.ts'

/** Map a filter tab to the item kind it keeps, or null for "all". */
function kindForTab(tab: CommandPaletteFilterTab): CommandPaletteItemKind | null {
  switch (tab) {
    case 'all':
      return null
    case 'actions':
      return 'action'
    case 'tasks':
      return 'task'
    case 'files':
      return 'file'
  }
}

/**
 * True when `query` is empty or every whitespace-separated token appears as a
 * case-insensitive substring of the item's title, description, or keywords.
 * @param item - palette row under test.
 * @param query - raw search box text.
 * @returns whether the item matches the query.
 */
export function matchesQuery(item: CommandPaletteItem, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (normalized.length === 0) return true
  const haystack = [
    item.title,
    item.description ?? '',
    ...(item.keywords ?? []),
  ].join(' ').toLowerCase()
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0)
  return tokens.every(token => haystack.includes(token))
}

/**
 * Filter palette items by the active tab and search query, preserving input order.
 * @param items - full catalog (static defaults plus later sources).
 * @param tab - active filter tab.
 * @param query - raw search box text.
 * @returns items that pass both the kind and query gates.
 */
export function filterCommandPaletteItems(
  items: readonly CommandPaletteItem[],
  tab: CommandPaletteFilterTab,
  query: string,
): CommandPaletteItem[] {
  const kind = kindForTab(tab)
  return items.filter(item =>
    (kind === null || item.kind === kind) && matchesQuery(item, query))
}
