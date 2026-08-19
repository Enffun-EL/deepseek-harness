/** Template card grid for the HOME empty state. */

import css from './Home.module.css'
import { homeClassNames } from './presentation.ts'

/** One template card. */
export interface TemplateCardItem {
  /** Stable identity. */
  id: string
  /** Card title. */
  title: string
  /** Optional short description. */
  description?: string | undefined
}

/** Props for {@link TemplateCardGrid}. */
export interface TemplateCardGridProps {
  /** Section heading (localized). */
  title: string
  /** Template cards. */
  items: readonly TemplateCardItem[]
  /** Empty-state copy when `items` is empty. */
  emptyLabel?: string | undefined
  /** Card click handler; receives the template id. */
  onSelect?: ((id: string) => void) | undefined
  /** Extra class on the section root. */
  className?: string | undefined
}

/**
 * Render a responsive grid of template cards.
 * @param props - see {@link TemplateCardGridProps}.
 * @returns the section element (empty hint when there are no cards).
 */
export function TemplateCardGrid({
  title,
  items,
  emptyLabel,
  onSelect,
  className,
}: TemplateCardGridProps) {
  const disabled = onSelect === undefined
  return (
    <section className={homeClassNames(css.section, className)} data-home="template-grid">
      <h2 className={css.sectionTitle}>{title}</h2>
      {items.length === 0 ? (
        emptyLabel !== undefined && emptyLabel !== '' ? (
          <p className={css.emptyHint}>{emptyLabel}</p>
        ) : null
      ) : (
        <ul className={css.templateGrid}>
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className={css.templateCard}
                disabled={disabled}
                onClick={() => onSelect?.(item.id)}
              >
                <span className={css.templateTitle}>{item.title}</span>
                {item.description !== undefined && item.description !== '' ? (
                  <span className={css.templateDescription}>{item.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
