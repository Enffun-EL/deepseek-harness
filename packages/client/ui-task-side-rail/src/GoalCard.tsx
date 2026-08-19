/**
 * Goal card for the task side rail: phase label + objective, no mutations.
 * Complements the composer GoalBar; owners keep edit/pause/clear there or
 * pass richer chrome later. Complete / absent goals render nothing.
 */

import { IconGoalOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './GoalCard.module.css'

/** Durable goal phases the card can present (matches host GoalPhase minus complete). */
export type GoalCardPhase = 'active' | 'paused' | 'blocked'

/** Snapshot slice the side-rail goal card needs. */
export interface GoalCardGoal {
  /** Human-requested completion objective. */
  readonly objective: string
  /** Durable lifecycle phase. */
  readonly phase: GoalCardPhase | 'complete'
  /** Present while blocked; shown as the card title attribute. */
  readonly blockedReason?: { readonly message: string }
}

/** Owner-resolved copy for the goal card. */
export interface GoalCardLabels {
  /** Accessible name of the card region. */
  readonly title: string
  /** Visible phase label for an active goal. */
  readonly phaseActive: string
  /** Visible phase label for a paused goal. */
  readonly phasePaused: string
  /** Visible phase label for a blocked goal. */
  readonly phaseBlocked: string
}

export interface GoalCardProps {
  /**
   * Current goal; `null` / `undefined` / `complete` render nothing so the
   * rail collapses empty seats the way the composer GoalBar does.
   */
  readonly goal: GoalCardGoal | null | undefined
  /** Owner-resolved strings. */
  readonly labels: GoalCardLabels
}

const PHASE_LABEL = {
  active: 'phaseActive',
  paused: 'phasePaused',
  blocked: 'phaseBlocked',
} as const satisfies Record<GoalCardPhase, keyof GoalCardLabels>

/**
 * Read-only goal summary for the task side rail.
 *
 * @param props - goal snapshot slice and labels.
 * @returns the card, or `null` when there is nothing to show.
 */
export function GoalCard({ goal, labels }: GoalCardProps) {
  if (goal === undefined || goal === null || goal.phase === 'complete') return null

  const phaseKey = PHASE_LABEL[goal.phase]
  const title = goal.phase === 'blocked' ? goal.blockedReason?.message : undefined

  return (
    <section
      className={css.root}
      data-testid="goal-card"
      data-phase={goal.phase}
      aria-label={labels.title}
      title={title}
    >
      <span className={css.lead} aria-hidden><IconGoalOutline16 size={14} /></span>
      <div className={css.body}>
        <div className={css.phase}>{labels[phaseKey]}</div>
        <div className={css.objective}>{goal.objective}</div>
      </div>
    </section>
  )
}
