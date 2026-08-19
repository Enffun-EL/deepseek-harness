/**
 * Progress checklist: percent header + status rows for the task side rail.
 * Mirrors the composer TodoPanel vocabulary without collapse chrome so the
 * details column can keep the full plan visible beside the timeline.
 */

import { useId } from 'react'
import { IconChecklistOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import { progressPercent, type ProgressItem } from './progress.ts'
import css from './ProgressChecklist.module.css'

/** Owner-resolved copy for the progress checklist. */
export interface ProgressChecklistLabels {
  /** Accessible name and visible title of the card. */
  readonly title: string
  /**
   * Percent line. Receives `{percent}` as the floored completed ratio.
   * Owners may ignore the placeholder and pass a preformatted string.
   */
  readonly percent: (percent: number) => string
}

export interface ProgressChecklistProps {
  /** Checklist rows; empty list renders nothing. */
  readonly items: readonly ProgressItem[]
  /** Owner-resolved strings. */
  readonly labels: ProgressChecklistLabels
}

/* v8 ignore next 3 -- closed-union backstop; only reached if status is forged */
function assertNever(value: never): never {
  throw new Error(`unreachable progress status: ${String(value)}`)
}

function CompletedGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true" className={css.glyphCompleted}>
      <circle cx="7" cy="7" r="6.4" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10.9631 5.71411L7.70154 8.97571C7.48011 9.19714 7.27736 9.40099 7.09229 9.54993C6.89742 9.70669 6.66314 9.85279 6.3634 9.90027C6.2049 9.92534 6.04339 9.92534 5.88489 9.90027C5.58515 9.85279 5.35087 9.70669 5.15601 9.54993C4.97093 9.40099 4.76818 9.19714 4.54675 8.97571L3.03516 7.46411L3.96313 6.53613L5.47473 8.04773C5.7169 8.28989 5.86196 8.43389 5.97888 8.52795C6.08597 8.61409 6.10875 8.60701 6.08997 8.604C6.11259 8.60758 6.13571 8.60758 6.15833 8.604C6.13954 8.60701 6.16232 8.61409 6.26941 8.52795C6.38633 8.43389 6.53139 8.28989 6.77356 8.04773L10.0352 4.78613L10.9631 5.71411Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ProgressGlyph() {
  const gradientId = useId()
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true" className={css.glyphProgress}>
      <defs>
        <linearGradient id={gradientId} x1="2.5" y1="12" x2="10.5" y2="3.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="7" cy="7" r="6.4" stroke={`url(#${gradientId})`} strokeWidth="1.2" />
    </svg>
  )
}

function PendingGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true" className={css.glyphPending}>
      <circle cx="7" cy="7" r="6.4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.4 2.4" />
    </svg>
  )
}

function StatusGlyph({ status }: { status: ProgressItem['status'] }) {
  switch (status) {
    case 'completed': return <CompletedGlyph />
    case 'in_progress': return <ProgressGlyph />
    case 'pending': return <PendingGlyph />
    /* v8 ignore next -- closed ProgressItem status union */
    default: return assertNever(status)
  }
}

/**
 * Expanded checklist with a percent header for the task side rail.
 *
 * @param props - items and labels.
 * @returns the card, or `null` when the list is empty.
 */
export function ProgressChecklist({ items, labels }: ProgressChecklistProps) {
  if (items.length === 0) return null

  const percent = progressPercent(items)

  return (
    <section className={css.root} data-testid="progress-checklist" aria-label={labels.title}>
      <header className={css.header}>
        <span className={css.lead} aria-hidden><IconChecklistOutline14 /></span>
        <h2 className={css.title}>{labels.title}</h2>
        <span className={css.percent} data-testid="progress-percent">{labels.percent(percent)}</span>
      </header>
      <div
        className={css.meter}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={labels.percent(percent)}
      >
        <div className={css.meterFill} style={{ width: `${percent}%` }} />
      </div>
      <ul className={css.list}>
        {items.map(item => (
          <li key={item.content} className={css.item} data-status={item.status}>
            <span className={css.glyph} aria-hidden><StatusGlyph status={item.status} /></span>
            <span className={css.content}>{item.content}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
