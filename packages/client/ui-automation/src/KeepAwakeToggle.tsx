/** Local keep-awake toggle for the Automation page (React state only). */

import css from './Automation.module.css'
import { automationClassNames } from './presentation.ts'

/** Props for {@link KeepAwakeToggle}. */
export interface KeepAwakeToggleProps {
  /** Whether keep-awake is on. */
  checked: boolean
  /** Toggle change handler; omit to render a disabled control. */
  onChange?: ((next: boolean) => void) | undefined
  /** Visible label text (localized). */
  label: string
  /** Accessible name for the switch control. */
  ariaLabel?: string | undefined
  /** Optional helper line under the control. */
  hint?: string | undefined
  /** Extra class on the root. */
  className?: string | undefined
}

/**
 * Render a local keep-awake switch. The owner holds the boolean in React state;
 * this package does not call Host power/idle APIs.
 * @param props - see {@link KeepAwakeToggleProps}.
 * @returns the labeled switch element tree.
 */
export function KeepAwakeToggle({
  checked,
  onChange,
  label,
  ariaLabel,
  hint,
  className,
}: KeepAwakeToggleProps) {
  const disabled = onChange === undefined
  return (
    <div className={automationClassNames(css.keepAwake, className)} data-automation="keep-awake">
      <label className={css.keepAwakeLabel}>
        <button
          type="button"
          role="switch"
          className={css.keepAwakeSwitch}
          aria-checked={checked}
          aria-label={ariaLabel ?? label}
          data-on={checked ? 'true' : 'false'}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
        >
          <span className={css.keepAwakeThumb} aria-hidden="true" />
        </button>
        <span>{label}</span>
      </label>
      {hint !== undefined && hint !== '' ? (
        <p className={css.keepAwakeHint}>{hint}</p>
      ) : null}
    </div>
  )
}