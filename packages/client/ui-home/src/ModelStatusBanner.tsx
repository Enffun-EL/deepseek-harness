/** Missing-model call-to-action banner for the HOME empty state. */

import css from './Home.module.css'
import { homeClassNames } from './presentation.ts'

/** Props for {@link ModelStatusBanner}. */
export interface ModelStatusBannerProps {
  /** Whether a usable model is already configured. When true, renders nothing. */
  hasModel: boolean
  /** Banner title (localized). */
  title: string
  /** Banner body copy (localized). */
  body: string
  /** CTA button label (localized). */
  ctaLabel: string
  /** CTA click handler; omit or leave undefined to disable the button. */
  onConfigure?: (() => void) | undefined
  /** Extra class on the root element. */
  className?: string | undefined
}

/**
 * Render a missing-model CTA, or nothing when a model is already present.
 * @param props - see {@link ModelStatusBannerProps}.
 * @returns the banner element, or null when `hasModel` is true.
 */
export function ModelStatusBanner({
  hasModel,
  title,
  body,
  ctaLabel,
  onConfigure,
  className,
}: ModelStatusBannerProps) {
  if (hasModel) return null
  return (
    <aside
      className={homeClassNames(css.banner, className)}
      data-home="model-status"
      role="status"
    >
      <div className={css.bannerCopy}>
        <p className={css.bannerTitle}>{title}</p>
        <p className={css.bannerBody}>{body}</p>
      </div>
      <button
        type="button"
        className={css.bannerCta}
        disabled={onConfigure === undefined}
        onClick={onConfigure}
      >
        {ctaLabel}
      </button>
    </aside>
  )
}
