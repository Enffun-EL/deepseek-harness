/**
 * Pure React HOME empty-state atoms (zero cordis plugin body): greeting,
 * missing-model CTA, project picker, composer chrome, starter prompts, and
 * template cards. Owners resolve every string through their own locale path
 * (or the exported `zh`/`en` maps) and pass actions via callbacks.
 * @module @deepseek-ai/dsh-client-ui-home
 */

export { HomeGreeting } from './HomeGreeting.tsx'
export type { HomeGreetingProps } from './HomeGreeting.tsx'
export { ModelStatusBanner } from './ModelStatusBanner.tsx'
export type { ModelStatusBannerProps } from './ModelStatusBanner.tsx'
export { ProjectPickerButton } from './ProjectPickerButton.tsx'
export type { ProjectPickerButtonProps } from './ProjectPickerButton.tsx'
export { HomeComposerChrome } from './HomeComposerChrome.tsx'
export type { HomeComposerChromeProps, HomeModelOption } from './HomeComposerChrome.tsx'
export { StarterPromptList } from './StarterPromptList.tsx'
export type { StarterPromptItem, StarterPromptListProps } from './StarterPromptList.tsx'
export { TemplateCardGrid } from './TemplateCardGrid.tsx'
export type { TemplateCardItem, TemplateCardGridProps } from './TemplateCardGrid.tsx'
export { HomeEmptyState } from './HomeEmptyState.tsx'
export type { HomeEmptyStateProps } from './HomeEmptyState.tsx'
export {
  HOME_PERMISSION_MODES,
  greetingDaypart,
  homeClassNames,
  isHomePermissionMode,
  permissionModeLabel,
  permissionModeLabelKey,
} from './presentation.ts'
export type { HomePermissionMode } from './presentation.ts'
export { en, homeString, zh } from './locales.ts'
export type { HomeKey } from './locales.ts'
