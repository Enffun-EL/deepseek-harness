/**
 * Git tools card: branch name, change counts, and a commit affordance.
 * Presentational only — the owner wires SCM RPCs and resolves every string.
 */

import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './GitToolsCard.module.css'

/** Counts the owner derives from a workspace SCM status snapshot. */
export interface GitChangeCounts {
  /** Files with unstaged content changes (modified / deleted / typechange). */
  readonly unstaged: number
  /** Files already staged for the next commit. */
  readonly staged: number
  /** Untracked paths not yet added. */
  readonly untracked: number
}

/** Owner-resolved copy for the Git tools card. */
export interface GitToolsCardLabels {
  /** Accessible name of the card region. */
  readonly title: string
  /** Visible commit control label. */
  readonly commit: string
  /** Accessible name when commit is unavailable (e.g. nothing staged). */
  readonly commitDisabled?: string
}

export interface GitToolsCardProps {
  /** Current branch tip name; empty/unknown renders a placeholder dash. */
  readonly branchName: string
  /** Change tally shown as staged / unstaged / untracked chips. */
  readonly changes: GitChangeCounts
  /** Owner-resolved strings. */
  readonly labels: GitToolsCardLabels
  /**
   * Commit gesture. Omitted or when every count is zero leaves the control
   * disabled so a dead button never promises work the owner cannot do.
   */
  readonly onCommit?: () => void
  /** When true, forces the commit control disabled regardless of counts. */
  readonly commitDisabled?: boolean
}

/**
 * Compact Git summary card for the task side rail.
 *
 * @param props - branch, change counts, labels, and optional commit callback.
 * @returns the card element.
 */
export function GitToolsCard({
  branchName,
  changes,
  labels,
  onCommit,
  commitDisabled = false,
}: GitToolsCardProps) {
  const total = changes.staged + changes.unstaged + changes.untracked
  const canCommit = onCommit !== undefined && !commitDisabled && total > 0
  const branch = branchName.trim() === '' ? '—' : branchName
  const commitLabel = !canCommit && labels.commitDisabled !== undefined
    ? labels.commitDisabled
    : labels.commit

  return (
    <section className={css.root} data-testid="git-tools-card" aria-label={labels.title}>
      <header className={css.header}>
        <span className={css.lead} aria-hidden><IconBranchOutline16 size={14} /></span>
        <h2 className={css.title}>{labels.title}</h2>
      </header>
      <div className={css.branchRow}>
        <span className={css.branch} title={branch}>{branch}</span>
        <span className={css.counts} aria-label={`${changes.staged}/${changes.unstaged}/${changes.untracked}`}>
          <span className={css.count} data-kind="staged">{changes.staged}</span>
          <span className={css.count} data-kind="unstaged">{changes.unstaged}</span>
          <span className={css.count} data-kind="untracked">{changes.untracked}</span>
        </span>
      </div>
      <div className={css.actions}>
        <button
          type="button"
          className={css.commit}
          disabled={!canCommit}
          aria-label={commitLabel}
          onClick={() => { onCommit?.() }}
        >
          {labels.commit}
        </button>
      </div>
    </section>
  )
}
