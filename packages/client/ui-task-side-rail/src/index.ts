/**
 * Pure React task side-rail atoms (zero cordis): Git tools card, goal card,
 * progress checklist, and their TaskSideRail composition. Owners resolve
 * every string through their own locale namespace and pass live data down;
 * nothing here reads application state or registers slots.
 * @module @deepseek-ai/dsh-client-ui-task-side-rail
 */

export { GitToolsCard } from './GitToolsCard.tsx'
export type { GitChangeCounts, GitToolsCardLabels, GitToolsCardProps } from './GitToolsCard.tsx'
export { GoalCard } from './GoalCard.tsx'
export type { GoalCardGoal, GoalCardLabels, GoalCardPhase, GoalCardProps } from './GoalCard.tsx'
export { ProgressChecklist } from './ProgressChecklist.tsx'
export type { ProgressChecklistLabels, ProgressChecklistProps } from './ProgressChecklist.tsx'
export { progressPercent } from './progress.ts'
export type { ProgressItem } from './progress.ts'
export { TaskSideRail } from './TaskSideRail.tsx'
export type { TaskSideRailLabels, TaskSideRailProps } from './TaskSideRail.tsx'
