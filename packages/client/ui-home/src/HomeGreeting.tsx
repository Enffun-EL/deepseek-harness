/** Centered greeting block for the HOME empty state. */

import type { ReactNode } from 'react'
import css from './Home.module.css'
import { homeClassNames } from './presentation.ts'

/** Props for {@link HomeGreeting}. */
export interface HomeGreetingProps {
  /** Primary greeting line (already localized by the owner). */
  title: string
  /** Optional secondary line under the title. */
  subtitle?: string | undefined
  /** Optional trailing content (e.g. daypart badge). */
  children?: ReactNode
  /** Extra class on the root element. */
  className?: string | undefined
}

/**
 * Render the HOME greeting headline and optional subtitle.
 * @param props - see {@link HomeGreetingProps}.
 * @returns the greeting element tree.
 */
export function HomeGreeting({ title, subtitle, children, className }: HomeGreetingProps) {
  return (
    <header className={homeClassNames(css.greeting, className)} data-home="greeting">
      <h1 className={css.greetingTitle}>{title}</h1>
      {subtitle !== undefined && subtitle !== '' ? (
        <p className={css.greetingSubtitle}>{subtitle}</p>
      ) : null}
      {children}
    </header>
  )
}
