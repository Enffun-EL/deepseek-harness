/** Registers the sidebar shell into the layout-owned slot. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import z from '@deepseek-ai/schemastery'
import type { SidebarRootInjected } from './contract/slots.ts'
import { SidebarShell } from './SidebarShell.tsx'
import { en, zh, type SidebarKey } from './locales.ts'

export type {
  SidebarFooterActionOwnerProps, SidebarRootComponentProps, SidebarRootInjected,
  SidebarSectionOwnerProps, SidebarSettingsOwnerProps,
} from './contract/slots.ts'
export type { SidebarKey } from './locales.ts'
export type {
  DesktopRailAccountId, DesktopRailAccountItem, DesktopRailLabelKey, DesktopRailNavId,
  DesktopRailNavItem, DesktopRailSection, DesktopRailSectionId,
} from './desktop-rail-nav.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Sidebar shell controls copy. */
    sidebar: SidebarKey
  }
}

/** Dictionary namespace owned by this plugin (shell controls copy). */
const NS = 'sidebar'

/**
 * Plugin config: opt into the Zcode-like Desktop left rail without replacing
 * the web sidebar path. Desktop compositions set `desktopRail: true`.
 */
export interface Config {
  /**
   * When true, the `sidebar` slot renders DesktopRail (top actions, project/task
   * empty sections, account cluster placeholders). Default false keeps SidebarRoot.
   */
  desktopRail?: boolean
}

/** Cordis-validated config schema (same-named export). */
export const Config: z<Config> = z.object({
  desktopRail: z.boolean().default(false),
})

/** Services required by the sidebar plugin. */
export const inject = ['slots', 'layout', 'sessions', 'workspaces', 'locale']

/** Registers the sidebar shell and its service callbacks.
 * @param ctx - Client root context.
 * @param config - validated {@link Config} (optional when tests mount apply without the schema).
 */
export function apply(ctx: ClientContext, config: Config = {}): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sidebar: dictionaries')

  // Cordis+schemastery defaults desktopRail to false; direct mounts pass {}.
  const desktopRail = config.desktopRail === true

  const injectProps = (): SidebarRootInjected => ({
    // The shell's New Session / New Task button rides the runtime's shared
    // action (current Session Workspace, then recent Workspace).
    startSession: (workspaceId) => { ctx.workspaces.startSession(workspaceId) },
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
    desktopRail,
  })
  ctx.effect(
    () => ctx.slots.register({
      name: 'sidebar',
      locale: NS,
      // The shell owns geometry; ui-workspace registers the whole browsing
      // region (header, search, session list, workspace dialogs), ui-settings
      // registers the foot trigger + settings panel.
      children: {
        'sidebar.workspaces': { kind: 'single', scope: 'root' },
        'sidebar.settings': { kind: 'single', scope: 'root' },
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
      },
      inject: injectProps,
    }, SidebarShell),
    'ui-sidebar: slot registration',
  )
}
