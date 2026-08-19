/**
 * Pure update consent orchestration (no Electron imports).
 * Maps {@link UpdateState} transitions onto download / install Yes-No prompts.
 * @module @deepseek-ai/dsh-desktop/update-consent-handler
 */

import type { UpdateState } from './state.js'

/** Actions the consent handler may invoke on the auto-update controller. */
export interface UpdateConsentActions {
  /** Begin download after the user accepts the available-update prompt. */
  downloadUpdate: () => Promise<void>
  /** Record install consent and quit-and-install after the user accepts. */
  requestInstallDownloadedUpdate: () => void
}

/** Injectable Yes/No prompts (tests supply fakes; production uses Electron dialogs). */
export interface UpdateConsentDialogs {
  /**
   * Ask whether to download an available update.
   * @param version - remote version
   * @returns true when the user chose Yes
   */
  askDownload: (version: string) => Promise<boolean>
  /**
   * Ask whether to restart and install a downloaded update.
   * @param version - downloaded version
   * @returns true when the user chose Yes
   */
  askInstall: (version: string) => Promise<boolean>
}

/** Options for {@link createUpdateConsentHandler}. */
export interface UpdateConsentHandlerOptions {
  /** Controller actions (download / install). */
  actions: UpdateConsentActions
  /** Dialog implementation. */
  dialogs: UpdateConsentDialogs
  /** Optional log sink. */
  log?: (message: string) => void
}

/**
 * Build a state-change listener that prompts once per version for download and install.
 * Concurrent prompts are serialized. Declining does not re-prompt for the same version
 * until a new check cycle resets the download prompt marker.
 * @param options - actions + dialogs
 * @returns handler suitable for `setupAutoUpdate({ onStateChange })`
 */
export function createUpdateConsentHandler(
  options: UpdateConsentHandlerOptions,
): (state: UpdateState) => void {
  const log = options.log ?? (() => {})
  let promptedDownloadVersion: string | null = null
  let promptedInstallVersion: string | null = null
  let chain: Promise<void> = Promise.resolve()

  const enqueue = (work: () => Promise<void>): void => {
    chain = chain.then(work).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      log(`consent handler error: ${message}`)
    })
  }

  return (state: UpdateState): void => {
    if (state.phase === 'checking' || state.phase === 'idle') {
      // A new check cycle may legitimately re-offer the same version.
      promptedDownloadVersion = null
      return
    }

    if (state.phase === 'update-available' && state.availableVersion !== null) {
      const version = state.availableVersion
      if (promptedDownloadVersion === version) return
      promptedDownloadVersion = version
      enqueue(async () => {
        log(`prompt download consent for ${version}`)
        const accepted = await options.dialogs.askDownload(version)
        if (!accepted) {
          log(`download declined for ${version}`)
          return
        }
        log(`download accepted for ${version}`)
        await options.actions.downloadUpdate()
      })
      return
    }

    if (state.phase === 'downloaded' && state.availableVersion !== null) {
      const version = state.availableVersion
      if (promptedInstallVersion === version) return
      promptedInstallVersion = version
      enqueue(async () => {
        log(`prompt install consent for ${version}`)
        const accepted = await options.dialogs.askInstall(version)
        if (!accepted) {
          log(`install declined for ${version}`)
          return
        }
        log(`install accepted for ${version}`)
        options.actions.requestInstallDownloadedUpdate()
      })
    }
  }
}
