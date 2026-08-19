/**
 * Pure dialog copy for desktop update download / install consent.
 * Free of Electron imports so unit tests can assert strings without launching a shell.
 * @module @deepseek-ai/dsh-desktop/update-consent-copy
 */

/** Buttons and labels for a Yes/No consent dialog. */
export interface UpdateConsentDialogCopy {
  /** Window title. */
  title: string
  /** Primary message body. */
  message: string
  /** Optional secondary detail (version context). */
  detail: string
  /** Button labels in display order (Yes first, then No). */
  buttons: readonly [string, string]
  /** Index of the affirmative button. */
  defaultId: 0
  /** Index of the dismiss / No button. */
  cancelId: 1
}

/**
 * Copy for “an update is available — download now?”.
 * @param version - remote version reported by the updater
 */
export function buildDownloadConsentCopy(version: string): UpdateConsentDialogCopy {
  return {
    title: 'Update available',
    message: 'A new version of DSH Desktop is available. Download it now?',
    detail: `Version ${version}`,
    buttons: ['Yes', 'No'],
    defaultId: 0,
    cancelId: 1,
  }
}

/**
 * Copy for “update downloaded — restart to install?”.
 * @param version - version that finished downloading
 */
export function buildInstallConsentCopy(version: string): UpdateConsentDialogCopy {
  return {
    title: 'Update ready to install',
    message: 'The update has been downloaded. Restart DSH Desktop to install it now?',
    detail: `Version ${version}`,
    buttons: ['Yes', 'No'],
    defaultId: 0,
    cancelId: 1,
  }
}
