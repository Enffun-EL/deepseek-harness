/** Project / workspace picker control (props + callbacks only). */

import css from './Home.module.css'
import { homeClassNames } from './presentation.ts'

/** Props for {@link ProjectPickerButton}. */
export interface ProjectPickerButtonProps {
  /** Visible label (project name or "Choose project" placeholder). */
  label: string
  /** Accessible name; defaults to `label` when omitted. */
  ariaLabel?: string | undefined
  /** Whether a project is already selected (presentation only). */
  selected?: boolean | undefined
  /** Disabled state. */
  disabled?: boolean | undefined
  /** Click handler supplied by the owner (opens picker / native dialog). */
  onClick?: (() => void) | undefined
  /** Extra class on the button. */
  className?: string | undefined
}

/**
 * Render the project picker button. Actions stay on the owner via `onClick`.
 * @param props - see {@link ProjectPickerButtonProps}.
 * @returns the picker button element.
 */
export function ProjectPickerButton({
  label,
  ariaLabel,
  selected = false,
  disabled = false,
  onClick,
  className,
}: ProjectPickerButtonProps) {
  return (
    <button
      type="button"
      className={homeClassNames(css.projectButton, className)}
      data-home="project-picker"
      data-selected={selected ? 'true' : 'false'}
      aria-label={ariaLabel ?? label}
      disabled={disabled || onClick === undefined}
      onClick={onClick}
    >
      <span className={css.projectLabel}>{label}</span>
    </button>
  )
}
