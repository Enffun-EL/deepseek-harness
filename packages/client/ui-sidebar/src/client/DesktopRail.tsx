/**
 * Zcode-like Desktop left rail: presentational information architecture.
 * Top actions, project/task empty sections, optional workspaces seat, and a
 * bottom account cluster with the existing settings/footer seats. Activated
 * when the ui-sidebar plugin config sets `desktopRail: true` (or a future
 * desktop composition slot wires the same inject flag). The web SidebarRoot
 * path is unchanged when the flag is off.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react'
import clsx from 'clsx'
import {
  IconCordisPluginOutline14, IconGoalOutline16, IconNewChatOutline16,
  IconPanelLeftOutline16, IconSearchOutline16, IconShareOutline16, IconUserOutline16,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarRootComponentProps } from './contract/slots.ts'
import {
  buildDesktopRailAccountItems, buildDesktopRailNavItems, buildDesktopRailSections,
  type DesktopRailAccountId, type DesktopRailNavId,
} from './desktop-rail-nav.ts'
import css from './DesktopRail.module.css'

/** How long the column's scrollbars stay drawn after the pointer leaves it. */
const SCROLLBAR_LINGER_MS = 2000

const NAV_ITEMS = buildDesktopRailNavItems()
const SECTIONS = buildDesktopRailSections()
const ACCOUNT_ITEMS = buildDesktopRailAccountItems()

/**
 * Resolve the glyph for one top-rail action.
 * @param id - nav item id.
 * @param size - icon pixel size.
 * @returns the icon element.
 */
function navIcon(id: DesktopRailNavId, size: number): ReactElement {
  switch (id) {
    case 'newTask':
      return <IconNewChatOutline16 size={size} />
    case 'search':
      return <IconSearchOutline16 size={size} />
    case 'automation':
      return <IconGoalOutline16 size={size} />
    case 'pluginMarket':
      return <IconCordisPluginOutline14 size={size} />
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

/**
 * Resolve the glyph for one account-cluster placeholder.
 * @param id - account item id.
 * @param size - icon pixel size.
 * @returns the icon element.
 */
function accountIcon(id: DesktopRailAccountId, size: number): ReactElement {
  switch (id) {
    case 'account':
      return <IconUserOutline16 size={size} />
    case 'phoneRemote':
      return <IconShareOutline16 size={size} />
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

/**
 * Optionally wrap a control in a tooltip when the rail is collapsed.
 * @param wide - expanded column shows inline labels (no tooltip).
 * @param label - tooltip / accessible name.
 * @param control - the control element.
 * @returns the control, optionally wrapped.
 */
function maybeTooltip(wide: boolean, label: string, control: ReactElement): ReactElement {
  if (wide) return control
  return <Tooltip label={label} delayMs={500}>{control}</Tooltip>
}

/**
 * Render the Desktop left-rail shell.
 * @param props - same composed props as SidebarRoot (runtime + inject + locale + child seats).
 * @returns the desktop rail element tree.
 */
export function DesktopRail({
  collapsed,
  width,
  startSession,
  toggleSidebar,
  t,
  renderSlot,
}: SidebarRootComponentProps) {
  const column = useRef<HTMLDivElement>(null)
  const [pointerInside, setPointerInside] = useState(false)
  const lingerTimer = useRef<number | undefined>(undefined)
  const armLinger = (): void => {
    if (lingerTimer.current !== undefined) return
    lingerTimer.current = window.setTimeout(() => {
      lingerTimer.current = undefined
      setPointerInside(false)
    }, SCROLLBAR_LINGER_MS)
  }
  const cancelLinger = (): void => {
    window.clearTimeout(lingerTimer.current)
    lingerTimer.current = undefined
  }
  useEffect(() => {
    if (!pointerInside) return
    const onMove = (event: PointerEvent): void => {
      const rect = column.current?.getBoundingClientRect()
      /* v8 ignore next -- the listener only exists while the column is mounted and revealed. */
      if (rect === undefined) return
      const inside = event.clientX >= rect.left && event.clientX < rect.right
        && event.clientY >= rect.top && event.clientY < rect.bottom
      if (inside) cancelLinger()
      else armLinger()
    }
    document.addEventListener('pointermove', onMove)
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelLinger()
    }
  }, [pointerInside])

  const wide = !collapsed
  const iconSize = wide ? 16 : 18

  const onNav = (action: (typeof NAV_ITEMS)[number]['action']): void => {
    if (action === 'createTask') startSession()
    // Search / automation / market stay presentational until desktop routes land.
  }

  return (
    <div
      ref={column}
      className={clsx(css.root, collapsed && css.collapsed, !pointerInside && css.quietBars)}
      style={{ width }}
      data-desktop-rail=""
      onPointerEnter={() => {
        cancelLinger()
        setPointerInside(true)
      }}
      onPointerLeave={() => { armLinger() }}
    >
      <div className={css.header}>
        <Tooltip label={collapsed ? t('toggle.open') : t('toggle.collapse')} delayMs={500}>
          <button
            type="button"
            className={css.iconButton}
            aria-label={collapsed ? t('toggle.open') : t('toggle.collapse')}
            onClick={() => { toggleSidebar() }}
          >
            <IconPanelLeftOutline16 size={iconSize} />
          </button>
        </Tooltip>
      </div>

      <div className={css.topActions} role="navigation" aria-label={t('rail.nav')}>
        {NAV_ITEMS.map((item) => {
          const label = item.id === 'newTask' ? t('task.new.label') : t(item.labelKey)
          return (
            <div key={item.id}>
              {maybeTooltip(
                wide,
                label,
                <button
                  type="button"
                  className={clsx(css.navButton, item.id === 'newTask' && css.navButtonPrimary)}
                  aria-label={label}
                  data-rail-nav={item.id}
                  data-rail-action={item.action}
                  onClick={() => { onNav(item.action) }}
                >
                  {navIcon(item.id, iconSize)}
                  {wide && <span className={css.navLabel}>{t(item.labelKey)}</span>}
                  {wide && item.shortcut !== undefined && (
                    <span className={css.navShortcut}>{item.shortcut}</span>
                  )}
                </button>,
              )}
            </div>
          )
        })}
      </div>

      <div className={css.sections}>
        {SECTIONS.map((section) => {
          const isTasks = section.id === 'tasks'
          return (
            <section
              key={section.id}
              className={clsx(css.section, isTasks && css.sectionGrow)}
              data-rail-section={section.id}
            >
              {wide && <h2 className={css.sectionTitle}>{t(section.titleKey)}</h2>}
              {wide && (
                <p className={css.emptyCopy} data-rail-empty={section.id}>
                  {t(section.emptyKey)}
                </p>
              )}
              {isTasks && (
                <div className={css.regionArea}>
                  {renderSlot('sidebar.workspaces', {
                    wide,
                    expandSidebar: () => { if (collapsed) toggleSidebar() },
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <div className={css.footArea}>
        <div className={css.accountCluster} data-rail-account-cluster="">
          {ACCOUNT_ITEMS.map((item) => {
            const label = t(item.labelKey)
            return (
              <div key={item.id}>
                {maybeTooltip(
                  wide,
                  label,
                  <button
                    type="button"
                    className={css.accountButton}
                    aria-label={label}
                    data-rail-account={item.id}
                    data-rail-action={item.action}
                    // Placeholders: account / phone-remote product routes are not wired yet.
                    disabled
                  >
                    {accountIcon(item.id, iconSize)}
                    {wide && <span className={css.accountLabel}>{label}</span>}
                  </button>,
                )}
              </div>
            )
          })}
        </div>
        <div className={css.footerActions}>
          {renderSlot('sidebar.footer.action', { wide })}
        </div>
        <div className={css.settingsArea}>
          {renderSlot('sidebar.settings', { wide })}
        </div>
      </div>
    </div>
  )
}
