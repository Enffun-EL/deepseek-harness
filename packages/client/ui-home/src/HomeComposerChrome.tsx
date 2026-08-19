/** Composer chrome: permission mode, model select, and submit placeholder. */

import type { ChangeEvent, ReactNode } from 'react'
import css from './Home.module.css'
import {
  HOME_PERMISSION_MODES,
  homeClassNames,
  permissionModeLabel,
  type HomePermissionMode,
} from './presentation.ts'

/** One model option shown in the model select. */
export interface HomeModelOption {
  /** Machine model id. */
  id: string
  /** User-facing label. */
  label: string
}

/** Props for {@link HomeComposerChrome}. */
export interface HomeComposerChromeProps {
  /** Current permission mode. */
  permissionMode: HomePermissionMode
  /** Permission-mode options; defaults to {@link HOME_PERMISSION_MODES}. */
  permissionModes?: readonly HomePermissionMode[] | undefined
  /** Localized labels keyed by permission mode; falls back to English product labels. */
  permissionLabels?: Partial<Record<HomePermissionMode, string>> | undefined
  /** Accessible name for the permission select. */
  permissionAriaLabel: string
  /** Permission change callback. */
  onPermissionModeChange?: ((mode: HomePermissionMode) => void) | undefined
  /** Available models. */
  models: readonly HomeModelOption[]
  /** Selected model id, or empty when none. */
  modelId: string
  /** Accessible name for the model select. */
  modelAriaLabel: string
  /** Model change callback. */
  onModelChange?: ((modelId: string) => void) | undefined
  /** Submit button label. */
  submitLabel: string
  /** Placeholder copy under the toolbar (composer body stays owner-owned). */
  placeholder?: string | undefined
  /** Whether submit is enabled. */
  submitDisabled?: boolean | undefined
  /** Submit click handler (owner owns the real send path). */
  onSubmit?: (() => void) | undefined
  /** Optional body content between toolbar and placeholder. */
  children?: ReactNode
  /** Extra class on the root element. */
  className?: string | undefined
}

/**
 * Render HOME composer chrome: permission + model selects and a submit stub.
 * @param props - see {@link HomeComposerChromeProps}.
 * @returns the composer chrome element tree.
 */
export function HomeComposerChrome({
  permissionMode,
  permissionModes = HOME_PERMISSION_MODES,
  permissionLabels,
  permissionAriaLabel,
  onPermissionModeChange,
  models,
  modelId,
  modelAriaLabel,
  onModelChange,
  submitLabel,
  placeholder,
  submitDisabled = false,
  onSubmit,
  children,
  className,
}: HomeComposerChromeProps) {
  const permissionDisabled = onPermissionModeChange === undefined
  const modelDisabled = onModelChange === undefined || models.length === 0

  const handlePermission = (event: ChangeEvent<HTMLSelectElement>) => {
    onPermissionModeChange?.(event.target.value as HomePermissionMode)
  }

  const handleModel = (event: ChangeEvent<HTMLSelectElement>) => {
    onModelChange?.(event.target.value)
  }

  return (
    <section className={homeClassNames(css.composer, className)} data-home="composer-chrome">
      <div className={css.composerToolbar}>
        <select
          className={css.composerSelect}
          aria-label={permissionAriaLabel}
          value={permissionMode}
          disabled={permissionDisabled}
          onChange={handlePermission}
          data-home="permission-select"
        >
          {permissionModes.map(mode => (
            <option key={mode} value={mode}>
              {permissionLabels?.[mode] ?? permissionModeLabel(mode)}
            </option>
          ))}
        </select>
        <select
          className={css.composerSelect}
          aria-label={modelAriaLabel}
          value={modelId}
          disabled={modelDisabled}
          onChange={handleModel}
          data-home="model-select"
        >
          {models.length === 0 ? (
            <option value="">{/* empty */}</option>
          ) : (
            models.map(model => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          className={css.composerSubmit}
          disabled={submitDisabled || onSubmit === undefined}
          onClick={onSubmit}
          data-home="submit"
        >
          {submitLabel}
        </button>
      </div>
      {children}
      {placeholder !== undefined && placeholder !== '' ? (
        <p className={css.composerPlaceholder}>{placeholder}</p>
      ) : null}
    </section>
  )
}
