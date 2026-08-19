/**
 * Static plugin-market catalog types and pure search filter.
 * The scaffold reads fixture JSON only; install/remote catalog comes later.
 */

/** One market plugin card (installed row or category listing). */
export interface PluginMarketEntry {
  /** Stable fixture id used as React key and search target. */
  readonly id: string
  /** Localized display name (Chinese product copy in the fixture). */
  readonly name: string
  /** One-line description shown under the name. */
  readonly summary: string
  /** Category key matching a section id. */
  readonly category: string
  /** Display version string. */
  readonly version: string
}

/** One category section in the browse area. */
export interface PluginMarketSection {
  /** Stable section id (`developer-tools` / `productivity`). */
  readonly id: string
  /** Section heading label. */
  readonly label: string
  /** Plugins listed under this section. */
  readonly plugins: readonly PluginMarketEntry[]
}

/** Full static market catalog loaded from fixture JSON. */
export interface PluginMarketCatalog {
  /** Installed-row placeholders (not Host inventory). */
  readonly installed: readonly PluginMarketEntry[]
  /** Category browse sections. */
  readonly sections: readonly PluginMarketSection[]
}

/**
 * Whether a catalog entry matches the normalized search query.
 * Empty query matches everything. Match is case-insensitive substring over
 * id, name, summary, and category.
 * @param entry - catalog row to test.
 * @param normalizedQuery - trimmed lower-case query (caller normalizes).
 * @returns true when the row should stay visible.
 */
export function matchesPluginMarketEntry(
  entry: PluginMarketEntry,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) return true
  return [entry.id, entry.name, entry.summary, entry.category]
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

/**
 * Filter installed rows and each section's plugins by the user query.
 * Sections that retain zero plugins after filtering are dropped.
 * @param catalog - static fixture catalog.
 * @param query - raw search box value.
 * @returns a new catalog view with only matching entries.
 */
export function filterPluginMarketCatalog(
  catalog: PluginMarketCatalog,
  query: string,
): PluginMarketCatalog {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (normalizedQuery.length === 0) return catalog

  const installed = catalog.installed.filter(entry =>
    matchesPluginMarketEntry(entry, normalizedQuery))
  const sections = catalog.sections
    .map(section => ({
      ...section,
      plugins: section.plugins.filter(entry =>
        matchesPluginMarketEntry(entry, normalizedQuery)),
    }))
    .filter(section => section.plugins.length > 0)

  return { installed, sections }
}
