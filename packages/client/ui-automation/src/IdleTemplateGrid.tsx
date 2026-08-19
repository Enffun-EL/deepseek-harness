/** Idle-template card grid for the Automation page. */

import css from './Automation.module.css'
import { automationClassNames } from './presentation.ts'
import type { IdleTemplateItem } from './templates.ts'

/** Props for {@link IdleTemplateGrid}. */
export interface IdleTemplateGridProps {
  /** Section heading (localized). */
  title: string
  /** Template cards (usually from {@link resolveIdleTemplates}). */
  items: readonly IdleTemplateItem[]
  /** Empty-state copy when `items` is empty. */
  emptyLabel?: string | undefined
  /** Card click handler; receives the template id. */
  onSelect?: ((id: IdleTemplateItem['id']) => void) | undefined
  /** Extra class on the section root. */
  className?: string | undefined
}

/**
 * Render a responsive grid of idle-template cards.
 * @param props - see {@link IdleTemplateGridProps}.
 * @returns the section element (empty hint when there are no cards).
 */
export function IdleTemplateGrid({
  title,
  items,
  emptyLabel,
  onSelect,
  className,
}: IdleTemplateGridProps) {
  const disabled = onSelect === undefined
  return (
    <section className={automationClassNames(css.section, className)} data-automation="idle-templates">
      <h2 className={css.sectionTitle}>{title}</h2>
      {items.length === 0 ? (
        emptyLabel !== undefined && emptyLabel !== '' ? (
          <p className={css.emptyHint}>{emptyLabel}</p>
        ) : null
      ) : (
        <div className={css.templateGrid} role="list">
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <button
                type="button"
                className={css.templateCard}
                disabled={disabled}
                onClick={() => onSelect?.(item.id)}
              >
                <p className={css.templateTitle}>{item.title}</p>
                {item.description !== '' ? (
                  <p className={css.templateDescription}>{item.description}</p>
                ) : null}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}