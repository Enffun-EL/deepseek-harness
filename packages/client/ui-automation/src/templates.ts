/**
 * Static idle-template catalog for the Automation scaffold.
 * Titles and descriptions are dictionary keys so owners can localize without
 * embedding product copy in the component tree.
 */

import type { AutomationKey } from './locales.ts'

/** One idle-template card identity and its locale keys. */
export interface IdleTemplateDefinition {
  /** Stable template id (also the selection callback argument). */
  id: 'git-weekly-summary' | 'ci-flaky-report' | 'docs-sync'
  /** Locale key for the card title. */
  titleKey: AutomationKey
  /** Locale key for the card description. */
  descriptionKey: AutomationKey
}

/**
 * Shipped idle templates (presentation-only; no Host scheduling yet).
 * Order is the product order shown on the page.
 */
export const IDLE_TEMPLATE_DEFINITIONS: readonly IdleTemplateDefinition[] = [
  {
    id: 'git-weekly-summary',
    titleKey: 'template.gitWeekly.title',
    descriptionKey: 'template.gitWeekly.description',
  },
  {
    id: 'ci-flaky-report',
    titleKey: 'template.ciFlaky.title',
    descriptionKey: 'template.ciFlaky.description',
  },
  {
    id: 'docs-sync',
    titleKey: 'template.docsSync.title',
    descriptionKey: 'template.docsSync.description',
  },
]

/** Resolved idle template ready for the template grid. */
export interface IdleTemplateItem {
  /** Stable template id. */
  id: IdleTemplateDefinition['id']
  /** Localized title. */
  title: string
  /** Localized description. */
  description: string
}

/**
 * Materialize the static idle-template catalog with a string resolver.
 * @param resolve - maps a dictionary key to display text (owner locale path).
 * @returns localized template cards in product order.
 */
export function resolveIdleTemplates(
  resolve: (key: AutomationKey) => string,
): readonly IdleTemplateItem[] {
  return IDLE_TEMPLATE_DEFINITIONS.map((template) => ({
    id: template.id,
    title: resolve(template.titleKey),
    description: resolve(template.descriptionKey),
  }))
}