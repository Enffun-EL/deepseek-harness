/**
 * Zcode-like plugin market shell: search, installed placeholders, category
 * sections from static fixtures, and a create-plugin CTA with a no-op default.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { IconSearchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import {
  filterPluginMarketCatalog,
  type PluginMarketCatalog,
  type PluginMarketEntry,
} from './catalog.ts'
import fixtureCatalog from './fixtures/catalog.json'
import { type PluginMarketKey } from './locales.ts'
import css from './PluginMarketShell.module.css'

/** Static fixture catalog shipped with the package. */
export const PLUGIN_MARKET_FIXTURE_CATALOG = fixtureCatalog as PluginMarketCatalog

/** Props for the pure market shell (no slot runtime shares in the scaffold). */
export interface PluginMarketShellProps {
  /** Namespace translator for `pluginMarket` keys. */
  readonly t: Translate<PluginMarketKey>
  /**
   * Catalog to render. Defaults to the package fixture JSON so hosts and
   * tests can override without touching the component tree.
   */
  readonly catalog?: PluginMarketCatalog
  /**
   * Create-plugin CTA handler. Defaults to a no-op; product wiring supplies
   * navigation or an authoring flow later.
   */
  readonly onCreatePlugin?: () => void
}

/** One installed or browse card. */
function PluginCard({
  entry,
  t,
}: {
  readonly entry: PluginMarketEntry
  readonly t: Translate<PluginMarketKey>
}): ReactNode {
  return (
    <li className={css.card} data-plugin-id={entry.id}>
      <strong className={css.cardName}>{entry.name}</strong>
      <p className={css.cardSummary}>{entry.summary}</p>
      <p className={css.cardMeta}>{t('version', { version: entry.version })}</p>
    </li>
  )
}

/**
 * Plugin market presentation shell.
 * @param props - translator, optional catalog override, optional CTA callback.
 * @returns the market page chrome over the filtered catalog view.
 */
export function PluginMarketShell({
  t,
  catalog = PLUGIN_MARKET_FIXTURE_CATALOG,
  onCreatePlugin,
}: PluginMarketShellProps): ReactNode {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => filterPluginMarketCatalog(catalog, query),
    [catalog, query],
  )
  const hasQuery = query.trim().length > 0
  const catalogPluginCount = filtered.sections.reduce(
    (count, section) => count + section.plugins.length,
    0,
  )

  const handleCreate = onCreatePlugin ?? ((): void => {})

  return (
    <div className={css.shell} data-plugin-market-shell>
      <header className={css.header}>
        <h1>{t('title')}</h1>
        <button
          type="button"
          className={css.createButton}
          onClick={handleCreate}
        >
          {t('createPlugin')}
        </button>
      </header>

      <label className={css.search}>
        <IconSearchOutline16 aria-hidden="true" />
        <span className={css.visuallyHidden}>{t('search')}</span>
        <input
          type="search"
          value={query}
          placeholder={t('search')}
          aria-label={t('search')}
          onChange={(event) => { setQuery(event.currentTarget.value) }}
        />
      </label>

      <section className={css.section} aria-labelledby="plugin-market-installed">
        <h2 className={css.sectionTitle} id="plugin-market-installed">
          {t('installed')}
        </h2>
        {filtered.installed.length === 0 ? (
          <p className={css.status}>
            {hasQuery ? t('installedEmptySearch') : t('installedEmpty')}
          </p>
        ) : (
          <ul className={css.list} data-installed-list>
            {filtered.installed.map(entry => (
              <PluginCard key={entry.id} entry={entry} t={t} />
            ))}
          </ul>
        )}
      </section>

      {catalogPluginCount === 0 && hasQuery ? (
        <p className={css.status} role="status">{t('catalogEmptySearch')}</p>
      ) : null}

      {filtered.sections.map(section => (
        <section
          key={section.id}
          className={css.section}
          data-market-section={section.id}
          aria-labelledby={`plugin-market-section-${section.id}`}
        >
          <h2
            className={css.sectionTitle}
            id={`plugin-market-section-${section.id}`}
          >
            {section.label}
          </h2>
          <ul className={css.list}>
            {section.plugins.map(entry => (
              <PluginCard key={entry.id} entry={entry} t={t} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
