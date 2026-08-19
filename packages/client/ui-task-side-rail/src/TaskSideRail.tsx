/**
 * Task side rail: presentational stack of Git tools, goal, and progress.
 * Owners place this in the details column (or a future task-rail slot) and
 * supply already-resolved labels plus live props from projections/SCM.
 */

import { GitToolsCard, type GitToolsCardProps } from './GitToolsCard.tsx'
import { GoalCard, type GoalCardProps } from './GoalCard.tsx'
import { ProgressChecklist, type ProgressChecklistProps } from './ProgressChecklist.tsx'
import css from './TaskSideRail.module.css'

/** Owner-resolved chrome strings for the rail shell. */
export interface TaskSideRailLabels {
  /** Accessible name of the rail landmark. */
  readonly region: string
}

export interface TaskSideRailProps {
  /** Shell labels. */
  readonly labels: TaskSideRailLabels
  /** Git card props; omit to hide the Git seat entirely. */
  readonly git?: GitToolsCardProps
  /** Goal card props; omit to hide the Goal seat (card may still null itself). */
  readonly goal?: GoalCardProps
  /** Progress checklist props; omit to hide the Progress seat. */
  readonly progress?: ProgressChecklistProps
}

/**
 * Composes the three task side-rail cards in fixed order: Git → Goal → Progress.
 *
 * @param props - optional card props and rail labels.
 * @returns the rail landmark (empty of cards when every seat is omitted/null).
 */
export function TaskSideRail({ labels, git, goal, progress }: TaskSideRailProps) {
  return (
    <aside className={css.root} data-testid="task-side-rail" aria-label={labels.region}>
      {git !== undefined && <GitToolsCard {...git} />}
      {goal !== undefined && <GoalCard {...goal} />}
      {progress !== undefined && <ProgressChecklist {...progress} />}
    </aside>
  )
}
