/**
 * Static default shell actions for the command palette scaffold.
 * Titles and descriptions are English placeholders; the host replaces them
 * with localized copy via {@link resolveDefaultActions}.
 */
import type { CommandPaletteItem } from './types.ts'

/** Stable ids for the four shipped default actions. */
export const DEFAULT_ACTION_IDS = {
  newTask: 'action.new-task',
  openWorkspace: 'action.open-workspace',
  settings: 'action.settings',
  toggleSidebar: 'action.toggle-sidebar',
} as const

/** Locale keys used for default-action title/description rows. */
export type DefaultActionCopyKey =
  | 'action.newTask.title'
  | 'action.newTask.description'
  | 'action.openWorkspace.title'
  | 'action.openWorkspace.description'
  | 'action.settings.title'
  | 'action.settings.description'
  | 'action.toggleSidebar.title'
  | 'action.toggleSidebar.description'

/** One static default action with the locale keys that replace its copy. */
interface DefaultActionSpec {
  readonly item: CommandPaletteItem
  readonly titleKey: DefaultActionCopyKey
  readonly descriptionKey: DefaultActionCopyKey
}

/**
 * Catalog rows for the scaffold. Labels are English placeholders; the host
 * replaces them with `t(...)` when building the visible list.
 */
const DEFAULT_ACTION_SPECS: readonly DefaultActionSpec[] = [
  {
    item: {
      id: DEFAULT_ACTION_IDS.newTask,
      title: 'New task',
      description: 'Start a new session',
      kind: 'action',
      shortcut: ['Ctrl', 'N'],
      keywords: ['session', 'chat', 'new'],
    },
    titleKey: 'action.newTask.title',
    descriptionKey: 'action.newTask.description',
  },
  {
    item: {
      id: DEFAULT_ACTION_IDS.openWorkspace,
      title: 'Open workspace',
      description: 'Open or create a workspace',
      kind: 'action',
      keywords: ['folder', 'project', 'directory'],
    },
    titleKey: 'action.openWorkspace.title',
    descriptionKey: 'action.openWorkspace.description',
  },
  {
    item: {
      id: DEFAULT_ACTION_IDS.settings,
      title: 'Settings',
      description: 'Open settings',
      kind: 'action',
      keywords: ['preferences', 'config'],
    },
    titleKey: 'action.settings.title',
    descriptionKey: 'action.settings.description',
  },
  {
    item: {
      id: DEFAULT_ACTION_IDS.toggleSidebar,
      title: 'Toggle sidebar',
      description: 'Collapse or expand the left rail',
      kind: 'action',
      keywords: ['panel', 'rail', 'layout'],
    },
    titleKey: 'action.toggleSidebar.title',
    descriptionKey: 'action.toggleSidebar.description',
  },
]

/** English placeholder catalog (same rows as {@link resolveDefaultActions} before localization). */
export const DEFAULT_ACTION_CATALOG: readonly CommandPaletteItem[] =
  DEFAULT_ACTION_SPECS.map(spec => spec.item)

/**
 * Build localized default-action rows from a dictionary lookup.
 * @param t - locale bind for the `commandPalette` namespace.
 * @returns catalog rows with localized title and description.
 */
export function resolveDefaultActions(
  t: (key: DefaultActionCopyKey) => string,
): CommandPaletteItem[] {
  return DEFAULT_ACTION_SPECS.map(spec => ({
    ...spec.item,
    title: t(spec.titleKey),
    description: t(spec.descriptionKey),
  }))
}
