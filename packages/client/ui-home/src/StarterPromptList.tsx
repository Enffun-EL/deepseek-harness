/** Clickable starter-prompt list for the HOME empty state. */

import css from './Home.module.css'
import { homeClassNames } from './presentation.ts'

/** One starter prompt row. */
export interface StarterPromptItem {
  /** Stable identity. */
  id: string
  /** Visible prompt text. */
  label: string
}

/** Props for {@link StarterPromptList}. */
export interface StarterPromptListProps {
  /** Section heading (localized). */
  title: string
  /** Prompt rows. */
  items: readonly StarterPromptItem[]
  /** Row click handler; receives the item id. */
  onSelect?: ((id: string) => void) | undefined
  /** Extra class on the section root. */
  className?: string | undefined
}

/**
 * Render a vertical list of starter prompts.
 * @param props - see {@link StarterPromptListProps}.
 * @returns the section element, or null when `items` is empty.
 */
export function StarterPromptList({ title, items, onSelect, className }: StarterPromptListProps) {
  if (items.length === 0) return null
  const disabled = onSelect === undefined
  return (
    <section className={homeClassNames(css.section, className)} data-home="starter-prompts">
      <h2 className={css.sectionTitle}>{title}</h2>
      <ul className={css.starterList}>
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              className={css.starterItem}
              disabled={disabled}
              onClick={() => onSelect?.(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
