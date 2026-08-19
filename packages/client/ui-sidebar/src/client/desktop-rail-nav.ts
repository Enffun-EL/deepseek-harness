/**
 * Pure presentational model for the Zcode-like Desktop left rail.
 * Ids and action names match apps/desktop/docs/zcode-home-interaction-contract.json;
 * labels resolve through the sidebar locale namespace at render time.
 */

/** Stable top-action ids in the Desktop left rail. */
export type DesktopRailNavId = 'newTask' | 'search' | 'automation' | 'pluginMarket'

/** Stable bottom-account cluster ids (settings remains the sidebar.settings seat). */
export type DesktopRailAccountId = 'account' | 'phoneRemote'

/** Stable project/task section ids with empty-state copy. */
export type DesktopRailSectionId = 'projects' | 'tasks'

/** Locale keys owned by the desktop-rail chrome (subset of the sidebar namespace). */
export type DesktopRailLabelKey =
  | 'task.new'
  | 'task.new.label'
  | 'nav.search'
  | 'nav.automation'
  | 'nav.pluginMarket'
  | 'section.projects'
  | 'section.tasks'
  | 'empty.projects'
  | 'empty.tasks'
  | 'account.connect'
  | 'account.phoneRemote'

/** One top-rail action row. */
export interface DesktopRailNavItem {
  /** Stable id (wiring / tests). */
  id: DesktopRailNavId
  /** Sidebar locale key for the visible label. */
  labelKey: DesktopRailLabelKey
  /** Optional keyboard shortcut hint shown beside the label when wide. */
  shortcut?: string
  /** Interaction-contract action name (handlers stay outside this model). */
  action: 'createTask' | 'openCommandPalette' | 'navigateAutomation' | 'navigatePluginMarket'
}

/** One project/task section shell. */
export interface DesktopRailSection {
  /** Stable section id. */
  id: DesktopRailSectionId
  /** Section heading locale key. */
  titleKey: DesktopRailLabelKey
  /** Empty-state body locale key. */
  emptyKey: DesktopRailLabelKey
}

/** One bottom-account placeholder control. */
export interface DesktopRailAccountItem {
  /** Stable id. */
  id: DesktopRailAccountId
  /** Sidebar locale key for the visible label. */
  labelKey: DesktopRailLabelKey
  /** Interaction-contract action name. */
  action: 'openAccountOrConnect' | 'openPhoneRemote'
}

/**
 * Build the ordered top-action list for the Desktop left rail.
 * @returns frozen presentational nav items (New Task, Search, Automation, Plugin Market).
 */
export function buildDesktopRailNavItems(): readonly DesktopRailNavItem[] {
  return Object.freeze([
    {
      id: 'newTask',
      labelKey: 'task.new',
      shortcut: 'Ctrl+N',
      action: 'createTask',
    },
    {
      id: 'search',
      labelKey: 'nav.search',
      shortcut: 'Ctrl+K',
      action: 'openCommandPalette',
    },
    {
      id: 'automation',
      labelKey: 'nav.automation',
      action: 'navigateAutomation',
    },
    {
      id: 'pluginMarket',
      labelKey: 'nav.pluginMarket',
      action: 'navigatePluginMarket',
    },
  ] satisfies DesktopRailNavItem[])
}

/**
 * Build the ordered project/task section shells (empty copy anchors).
 * @returns frozen section descriptors.
 */
export function buildDesktopRailSections(): readonly DesktopRailSection[] {
  return Object.freeze([
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
  ] satisfies DesktopRailSection[])
}

/**
 * Build the bottom account-cluster placeholders (settings stays a slot).
 * @returns frozen account items.
 */
export function buildDesktopRailAccountItems(): readonly DesktopRailAccountItem[] {
  return Object.freeze([
    {
      id: 'account',
      labelKey: 'account.connect',
      action: 'openAccountOrConnect',
    },
    {
      id: 'phoneRemote',
      labelKey: 'account.phoneRemote',
      action: 'openPhoneRemote',
    },
  ] satisfies DesktopRailAccountItem[])
}
