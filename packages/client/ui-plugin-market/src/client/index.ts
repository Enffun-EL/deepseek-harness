/**
 * Plugin market shell, browser half. The scaffold registers locale
 * dictionaries. Layout-slot navigation wiring lands when the Desktop rail
 * gains a market route; hosts then mount the package-local shell component.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { en, NS, zh, type PluginMarketKey } from './locales.ts'

export type {
  PluginMarketCatalog,
  PluginMarketEntry,
  PluginMarketSection,
} from './catalog.ts'
export type { PluginMarketShellProps } from './PluginMarketShell.tsx'
export type { PluginMarketKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Plugin market shell copy. */
    pluginMarket: PluginMarketKey
  }
}

/** Required services for locale registration. */
export const inject = ['locale']

/**
 * Client plugin body: register the market dictionaries.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-plugin-market: dictionaries')
}
