/**
 * Command palette plugin, browser half: global Ctrl/Cmd+K overlay registered
 * into `shell.overlay`. Scaffold ships static default shell actions and pure
 * tab/query filter logic; task and file sources are deferred.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-layout SlotMap merge (shell.overlay) and ctx.layout.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { CommandPalette, type CommandPaletteInjected } from './CommandPalette.tsx'
import { en, zh, type CommandPaletteKey } from './locales.ts'

export type {
  CommandPaletteFilterTab,
  CommandPaletteItem,
  CommandPaletteItemKind,
} from './types.ts'
export type { CommandPaletteInjected, CommandPaletteProps } from './CommandPalette.tsx'
export type { CommandPaletteKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Command palette chrome and default-action copy. */
    commandPalette: CommandPaletteKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'commandPalette'

/**
 * Required services: slot registry, layout (toggle sidebar), workspaces
 * (new task), and locale dictionaries. Settings open is a scaffold stub.
 */
export const inject = ['slots', 'layout', 'workspaces', 'locale']

/**
 * Client plugin body: dictionaries + shell.overlay registration.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-command-palette: dictionaries')

  const injectProps = (): CommandPaletteInjected => ({
    startSession: (workspaceId) => { ctx.workspaces.startSession(workspaceId) },
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
    // Scaffold: no shared open-workspace service yet; new-session blank page
    // is the closest existing path (workspace picker lives on that hero).
    openWorkspace: () => { ctx.workspaces.startSession() },
    // Scaffold: settings visibility is owned inside ui-settings-general.
    // A later PR will route through a shared open API; no-op keeps the row.
    openSettings: () => {},
  })

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'command-palette',
    order: 50,
    locale: NS,
    inject: injectProps,
  }, CommandPalette))
}
