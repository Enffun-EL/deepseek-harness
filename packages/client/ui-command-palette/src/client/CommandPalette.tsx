/**
 * CommandPalette host: open/close, query, filter tabs, keyboard navigation,
 * and static default action rows. Registered into `shell.overlay`.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent,
} from 'react'
import clsx from 'clsx'
import type { WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { filterCommandPaletteItems } from './filter.ts'
import { DEFAULT_ACTION_IDS, resolveDefaultActions } from './defaults.ts'
import {
  COMMAND_PALETTE_FILTER_TABS,
  COMMAND_PALETTE_OPEN_HINT,
  type CommandPaletteFilterTab,
  type CommandPaletteItem,
} from './types.ts'
import type { CommandPaletteKey } from './locales.ts'
import css from './CommandPalette.module.css'

/** Injected shell verbs closed over ctx in apply. */
export interface CommandPaletteInjected {
  /** Start a new frontend session (optional workspace). */
  startSession: (workspaceId?: WorkspaceId) => void
  /** Collapse or expand the left rail. */
  toggleSidebar: () => void
  /**
   * Open workspace flow. Scaffold stub — ui-workspace owns the real picker;
   * until a shared service exists this may be a no-op or startSession only.
   */
  openWorkspace: () => void
  /**
   * Open settings. Scaffold stub — settings shell owns visibility locally;
   * until a shared open API exists this may be a no-op.
   */
  openSettings: () => void
}

/** Full component props: root-scope runtime share + locale + inject face. */
export type CommandPaletteProps =
  & PropsRuntime<'shell.overlay'>
  & { t: (key: CommandPaletteKey) => string }
  & CommandPaletteInjected

/** Locale key for each filter tab label. */
const TAB_LABEL_KEY: Record<CommandPaletteFilterTab, CommandPaletteKey> = {
  all: 'filter.all',
  actions: 'filter.actions',
  tasks: 'filter.tasks',
  files: 'filter.files',
}

/**
 * Render keyboard-hint chips for a shortcut token list.
 * @param tokens - ordered key labels (e.g. Ctrl, K).
 * @returns kbd elements.
 */
function ShortcutHint({ tokens }: { tokens: readonly string[] }) {
  return (
    <span className={css.hint} aria-hidden="true">
      {tokens.map((token, index) => (
        <kbd key={`${token}-${index}`} className={css.kbd}>{token}</kbd>
      ))}
    </span>
  )
}

/**
 * Global command palette host.
 * @param props - composed slot props (runtime + locale + inject verbs).
 * @returns the overlay tree (null chrome when closed still mounts the hotkey listener).
 */
export function CommandPalette({
  t,
  startSession,
  toggleSidebar,
  openWorkspace,
  openSettings,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<CommandPaletteFilterTab>('all')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const items = useMemo(() => resolveDefaultActions(t), [t])
  const visible = useMemo(
    () => filterCommandPaletteItems(items, tab, query),
    [items, tab, query],
  )

  const close = useCallback((): void => {
    setOpen(false)
    setQuery('')
    setTab('all')
    setActiveIndex(0)
  }, [])

  const openPalette = useCallback((): void => {
    setOpen(true)
    setQuery('')
    setTab('all')
    setActiveIndex(0)
  }, [])

  // Keep highlight inside the filtered list when the catalog shrinks.
  useEffect(() => {
    if (activeIndex >= visible.length) {
      setActiveIndex(visible.length === 0 ? 0 : visible.length - 1)
    }
  }, [visible.length, activeIndex])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  // Global Ctrl/Cmd+K open/toggle; Escape closes when open.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        if (open) close()
        else openPalette()
        return
      }
      if (open && event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [open, close, openPalette])

  const runItem = useCallback((item: CommandPaletteItem): void => {
    switch (item.id) {
      case DEFAULT_ACTION_IDS.newTask:
        startSession()
        break
      case DEFAULT_ACTION_IDS.openWorkspace:
        openWorkspace()
        break
      case DEFAULT_ACTION_IDS.settings:
        openSettings()
        break
      case DEFAULT_ACTION_IDS.toggleSidebar:
        toggleSidebar()
        break
      default:
        break
    }
    close()
  }, [startSession, openWorkspace, openSettings, toggleSidebar, close])

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (visible.length === 0) return
      setActiveIndex(i => (i + 1) % visible.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (visible.length === 0) return
      setActiveIndex(i => (i - 1 + visible.length) % visible.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = visible[activeIndex]
      if (item !== undefined) runItem(item)
    }
  }

  if (!open) return null

  return (
    <div className={css.root} role="presentation">
      <div className={css.mask} aria-hidden="true" onMouseDown={close} />
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title')}
        onKeyDown={onDialogKeyDown}
      >
        <div className={css.header}>
          <div className={css.searchRow}>
            <input
              ref={inputRef}
              className={css.input}
              type="search"
              value={query}
              placeholder={t('palette.placeholder')}
              aria-label={t('palette.placeholder')}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
            />
            <span title={t('palette.openHint')}>
              <ShortcutHint tokens={COMMAND_PALETTE_OPEN_HINT} />
            </span>
          </div>
          <div className={css.tabs} role="tablist" aria-label={t('palette.title')}>
            {COMMAND_PALETTE_FILTER_TABS.map(id => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={clsx(css.tab, tab === id && css.tabActive)}
                onClick={() => {
                  setTab(id)
                  setActiveIndex(0)
                }}
              >
                {t(TAB_LABEL_KEY[id])}
              </button>
            ))}
          </div>
        </div>
        <div className={css.list} role="listbox" aria-label={t('palette.title')}>
          {visible.length === 0
            ? <div className={css.empty}>{t('palette.empty')}</div>
            : visible.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={clsx(css.row, index === activeIndex && css.rowActive)}
                onMouseEnter={() => { setActiveIndex(index) }}
                onClick={() => { runItem(item) }}
              >
                <span className={css.rowBody}>
                  <span className={css.rowTitle}>{item.title}</span>
                  {item.description !== undefined && item.description !== '' && (
                    <span className={css.rowDescription}>{item.description}</span>
                  )}
                </span>
                {item.shortcut !== undefined && item.shortcut.length > 0 && (
                  <span className={css.rowShortcut}>
                    <ShortcutHint tokens={item.shortcut} />
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
