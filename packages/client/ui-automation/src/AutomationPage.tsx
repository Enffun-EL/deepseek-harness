/** Composed Automation page shell over pure atoms (no Host wiring). */

import { useState } from 'react'
import css from './Automation.module.css'
import { AutomationEmptyState } from './AutomationEmptyState.tsx'
import { IdleTemplateGrid } from './IdleTemplateGrid.tsx'
import { KeepAwakeToggle } from './KeepAwakeToggle.tsx'
import { automationClassNames } from './presentation.ts'
import type { IdleTemplateItem } from './templates.ts'

/** Props for {@link AutomationPage}. */
export interface AutomationPageProps {
  /** Page title. */
  title: string
  /** Optional subtitle under the title. */
  subtitle?: string | undefined
  /** Empty-state copy (shown when `hasAutomations` is false). */
  empty: {
    title: string
    body?: string | undefined
  }
  /** Create-scheduled-task CTA. */
  createScheduled: {
    label: string
    onClick?: (() => void) | undefined
  }
  /** Create-idle-task CTA. */
  createIdle: {
    label: string
    onClick?: (() => void) | undefined
  }
  /** Keep-awake control. When `checked` is omitted, the page owns local React state. */
  keepAwake: {
    label: string
    ariaLabel?: string | undefined
    hint?: string | undefined
    checked?: boolean | undefined
    onChange?: ((next: boolean) => void) | undefined
    /** Initial value when the page owns local state (default false). */
    defaultChecked?: boolean | undefined
  }
  /** Idle template section. */
  templates: {
    title: string
    items: readonly IdleTemplateItem[]
    emptyLabel?: string | undefined
    onSelect?: ((id: IdleTemplateItem['id']) => void) | undefined
  }
  /**
   * Whether any automations already exist. Scaffold default is false so the
   * empty state shows; owners flip this once Host lists are wired.
   */
  hasAutomations?: boolean | undefined
  /** Extra class on the page root. */
  className?: string | undefined
}

/**
 * Compose the Automation page: header, create CTAs, keep-awake toggle,
 * empty state, and static idle template cards.
 * @param props - see {@link AutomationPageProps}.
 * @returns the page element tree.
 */
export function AutomationPage({
  title,
  subtitle,
  empty,
  createScheduled,
  createIdle,
  keepAwake,
  templates,
  hasAutomations = false,
  className,
}: AutomationPageProps) {
  const controlled = keepAwake.checked !== undefined
  const [localKeepAwake, setLocalKeepAwake] = useState(keepAwake.defaultChecked ?? false)
  const keepAwakeChecked = controlled ? keepAwake.checked! : localKeepAwake
  const onKeepAwakeChange = keepAwake.onChange
    ?? (controlled ? undefined : setLocalKeepAwake)

  return (
    <div className={automationClassNames(css.root, className)} data-automation="page">
      <header className={css.header} data-automation="header">
        <h1 className={css.title}>{title}</h1>
        {subtitle !== undefined && subtitle !== '' ? (
          <p className={css.subtitle}>{subtitle}</p>
        ) : null}
      </header>

      <div className={css.toolbar} data-automation="toolbar">
        <div className={css.ctaRow} data-automation="create-ctas">
          <button
            type="button"
            className={css.cta}
            disabled={createScheduled.onClick === undefined}
            onClick={() => createScheduled.onClick?.()}
          >
            {createScheduled.label}
          </button>
          <button
            type="button"
            className={automationClassNames(css.cta, css.ctaSecondary)}
            disabled={createIdle.onClick === undefined}
            onClick={() => createIdle.onClick?.()}
          >
            {createIdle.label}
          </button>
        </div>
        <KeepAwakeToggle
          checked={keepAwakeChecked}
          onChange={onKeepAwakeChange}
          label={keepAwake.label}
          ariaLabel={keepAwake.ariaLabel}
          hint={keepAwake.hint}
        />
      </div>

      {!hasAutomations ? (
        <AutomationEmptyState title={empty.title} body={empty.body} />
      ) : null}

      <IdleTemplateGrid
        title={templates.title}
        items={templates.items}
        emptyLabel={templates.emptyLabel}
        onSelect={templates.onSelect}
      />
    </div>
  )
}