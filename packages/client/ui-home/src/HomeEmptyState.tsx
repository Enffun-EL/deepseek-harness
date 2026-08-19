/** Optional composed HOME empty-state layout over the pure atoms. */

import type { ReactNode } from 'react'
import css from './Home.module.css'
import { HomeComposerChrome, type HomeComposerChromeProps } from './HomeComposerChrome.tsx'
import { HomeGreeting } from './HomeGreeting.tsx'
import { ModelStatusBanner } from './ModelStatusBanner.tsx'
import { homeClassNames } from './presentation.ts'
import { ProjectPickerButton } from './ProjectPickerButton.tsx'
import { StarterPromptList, type StarterPromptItem } from './StarterPromptList.tsx'
import { TemplateCardGrid, type TemplateCardItem } from './TemplateCardGrid.tsx'

/** Props for {@link HomeEmptyState}. */
export interface HomeEmptyStateProps {
  /** Greeting title. */
  greetingTitle: string
  /** Greeting subtitle. */
  greetingSubtitle?: string | undefined
  /** Model banner visibility + copy. */
  modelBanner: {
    hasModel: boolean
    title: string
    body: string
    ctaLabel: string
    onConfigure?: (() => void) | undefined
  }
  /** Project picker props. */
  project: {
    label: string
    ariaLabel?: string | undefined
    selected?: boolean | undefined
    onClick?: (() => void) | undefined
  }
  /** Composer chrome props (minus className). */
  composer: Omit<HomeComposerChromeProps, 'className' | 'children'>
  /** Optional body seated inside the composer chrome. */
  composerBody?: ReactNode
  /** Starter prompts section. */
  starters: {
    title: string
    items: readonly StarterPromptItem[]
    onSelect?: ((id: string) => void) | undefined
  }
  /** Template grid section. */
  templates: {
    title: string
    items: readonly TemplateCardItem[]
    emptyLabel?: string | undefined
    onSelect?: ((id: string) => void) | undefined
  }
  /** Extra class on the root. */
  className?: string | undefined
}

/**
 * Compose the MVP HOME empty-state atoms into one vertical stack.
 * Owners may also mount the individual exports without this shell.
 * @param props - see {@link HomeEmptyStateProps}.
 * @returns the composed empty-state element tree.
 */
export function HomeEmptyState({
  greetingTitle,
  greetingSubtitle,
  modelBanner,
  project,
  composer,
  composerBody,
  starters,
  templates,
  className,
}: HomeEmptyStateProps) {
  return (
    <div className={homeClassNames(css.root, className)} data-home="empty-state">
      <HomeGreeting title={greetingTitle} subtitle={greetingSubtitle} />
      <ModelStatusBanner {...modelBanner} />
      <ProjectPickerButton {...project} />
      <HomeComposerChrome {...composer}>{composerBody}</HomeComposerChrome>
      <StarterPromptList {...starters} />
      <TemplateCardGrid {...templates} />
    </div>
  )
}
