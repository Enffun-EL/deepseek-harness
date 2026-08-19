/**
 * Pure progress math for the task side-rail checklist.
 * Status vocabulary matches the host todo projection (`pending` /
 * `in_progress` / `completed`) so owners can pass that list through without
 * a mapping step.
 */

/** One checklist row the progress helper and ProgressChecklist accept. */
export interface ProgressItem {
  /** Human-visible row label. */
  readonly content: string
  /** Work state for the row. */
  readonly status: 'pending' | 'in_progress' | 'completed'
}

/**
 * Fraction of checklist items marked completed, as an integer percent in
 * `[0, 100]`. An empty list is `0` (no work claimed, nothing complete).
 * Incomplete statuses never contribute, so a list of only `in_progress` /
 * `pending` rows stays at `0` until something finishes.
 *
 * @param items - checklist rows in display order (order does not affect the ratio).
 * @returns completed count over length, floored to a whole percent.
 */
export function progressPercent(items: readonly ProgressItem[]): number {
  if (items.length === 0) return 0
  const done = items.reduce((count, item) => count + (item.status === 'completed' ? 1 : 0), 0)
  return Math.floor((done / items.length) * 100)
}
