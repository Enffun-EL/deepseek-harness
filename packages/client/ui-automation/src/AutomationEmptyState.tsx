/** Empty-state copy block for the Automation page. */

import css from './Automation.module.css'
import { automationClassNames } from './presentation.ts'

/** Props for {@link AutomationEmptyState}. */
export interface AutomationEmptyStateProps {
  /** Primary empty-state line. */
  title: string
  /** Optional supporting line. */
  body?: string | undefined
  /** Extra class on the root. */
  className?: string | undefined
}

/**
 * Render the no-automations empty message.
 * @param props - see {@link AutomationEmptyStateProps}.
 * @returns the empty-state element tree.
 */
export function AutomationEmptyState({ title, body, className }: AutomationEmptyStateProps) {
  return (
    <div className={automationClassNames(css.empty, className)} data-automation="empty-state">
      <p className={css.emptyTitle}>{title}</p>
      {body !== undefined && body !== '' ? (
        <p className={css.emptyBody}>{body}</p>
      ) : null}
    </div>
  )
}