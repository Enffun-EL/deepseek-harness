/**
 * Electron dialog adapters for desktop update download / install consent.
 * @module @deepseek-ai/dsh-desktop/update-consent
 */

import { dialog, type BrowserWindow } from 'electron'
import {
  buildDownloadConsentCopy,
  buildInstallConsentCopy,
  type UpdateConsentDialogCopy,
} from './consent-copy.js'
import type { UpdateConsentDialogs } from './consent-handler.js'

export type { UpdateConsentDialogs } from './consent-handler.js'
export { createUpdateConsentHandler } from './consent-handler.js'

/**
 * Show a modal Yes/No box from pure {@link UpdateConsentDialogCopy}.
 * @param copy - title / message / buttons
 * @param parent - optional BrowserWindow parent
 * @returns true when the user selected the affirmative (index 0) button
 */
export async function showConsentMessageBox(
  copy: UpdateConsentDialogCopy,
  parent?: BrowserWindow | null,
): Promise<boolean> {
  const payload = {
    type: 'question' as const,
    buttons: [...copy.buttons],
    defaultId: copy.defaultId,
    cancelId: copy.cancelId,
    title: copy.title,
    message: copy.message,
    detail: copy.detail,
    noLink: true,
  }
  const result =
    parent !== null && parent !== undefined && !parent.isDestroyed()
      ? await dialog.showMessageBox(parent, payload)
      : await dialog.showMessageBox(payload)
  return result.response === copy.defaultId
}

/**
 * Electron-backed dialogs parented to the main window when available.
 * @param getMainWindow - live main BrowserWindow accessor
 */
export function createElectronUpdateConsentDialogs(
  getMainWindow: () => BrowserWindow | null,
): UpdateConsentDialogs {
  return {
    askDownload: async (version: string) =>
      showConsentMessageBox(buildDownloadConsentCopy(version), getMainWindow()),
    askInstall: async (version: string) =>
      showConsentMessageBox(buildInstallConsentCopy(version), getMainWindow()),
  }
}
