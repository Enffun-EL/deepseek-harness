/**
 * Pure React Automation page atoms (zero cordis plugin body): empty state,
 * scheduled/idle create CTAs, local keep-awake toggle, and static idle
 * template cards. Owners resolve every string through their own locale path
 * (or the exported `zh`/`en` maps) and pass actions via callbacks. Host job
 * scheduling (`dsh` jobs) is intentionally not wired here — see the package
 * README for the future integration path.
 * @module @deepseek-ai/dsh-client-ui-automation
 */

export { AutomationPage } from './AutomationPage.tsx'
export type { AutomationPageProps } from './AutomationPage.tsx'
export { AutomationEmptyState } from './AutomationEmptyState.tsx'
export type { AutomationEmptyStateProps } from './AutomationEmptyState.tsx'
export { KeepAwakeToggle } from './KeepAwakeToggle.tsx'
export type { KeepAwakeToggleProps } from './KeepAwakeToggle.tsx'
export { IdleTemplateGrid } from './IdleTemplateGrid.tsx'
export type { IdleTemplateGridProps } from './IdleTemplateGrid.tsx'
export {
  IDLE_TEMPLATE_DEFINITIONS,
  resolveIdleTemplates,
} from './templates.ts'
export type {
  IdleTemplateDefinition,
  IdleTemplateItem,
} from './templates.ts'
export { automationClassNames } from './presentation.ts'
export { automationString, en, zh } from './locales.ts'
export type { AutomationKey } from './locales.ts'