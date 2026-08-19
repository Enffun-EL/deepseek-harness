/**
 * Command-palette item and filter types. Pure data only — no React or cordis.
 */

/** Filter tabs shown in the palette chrome (Zcode home contract). */
export type CommandPaletteFilterTab = 'all' | 'actions' | 'tasks' | 'files'

/** Category of a palette entry; drives tab filtering. */
export type CommandPaletteItemKind = 'action' | 'task' | 'file'

/**
 * One selectable palette row. Static default actions ship in this package;
 * later sources (session tasks, files) append the same shape.
 */
export interface CommandPaletteItem {
  /** Stable id used as React key and for run dispatch. */
  readonly id: string
  /** Visible primary label. */
  readonly title: string
  /** Optional secondary line under the title. */
  readonly description?: string
  /** Kind used by the filter tabs. */
  readonly kind: CommandPaletteItemKind
  /**
   * Optional keyboard-hint tokens shown on the row (e.g. `['Ctrl', 'N']`).
   * Display only — the host does not bind these shortcuts.
   */
  readonly shortcut?: readonly string[]
  /** Optional free-text keywords included in query matching. */
  readonly keywords?: readonly string[]
}

/** Ordered filter-tab ids matching the Zcode home interaction contract. */
export const COMMAND_PALETTE_FILTER_TABS = [
  'all',
  'actions',
  'tasks',
  'files',
] as const satisfies readonly CommandPaletteFilterTab[]

/** Primary open shortcut tokens for the palette chrome hint. */
export const COMMAND_PALETTE_OPEN_HINT = ['Ctrl', 'K'] as const
