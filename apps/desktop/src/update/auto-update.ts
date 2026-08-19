/**
 * electron-updater integration for DSH Desktop (main process).
 *
 * Safe defaults:
 * - no auto-download; no auto-install on quit
 * - check-on-start only when packaged (or when forced via env)
 * - install runs only after {@link requestInstallDownloadedUpdate} records consent
 *
 * Dev / unsigned builds: feed checks may fail or no-op; signing is not required
 * for local `electron .` runs. See package README.
 * @module @deepseek-ai/dsh-desktop/auto-update
 */

import { app, type BrowserWindow } from 'electron'
// electron-updater is CJS; named ESM imports crash Electron main at load time.
import electronUpdater from 'electron-updater'
import type { AppUpdater, ProgressInfo, UpdateInfo } from 'electron-updater'
import { describeUpdateFeed, resolveUpdateFeed, type UpdateFeedConfig } from './feed-url.js'

const { autoUpdater } = electronUpdater
import { shouldCheckForUpdatesOnStart } from './policy.js'
import {
  canInstallUpdate,
  createInitialUpdateState,
  reduceUpdateState,
  type UpdateEvent,
  type UpdateState,
} from './state.js'

export { shouldCheckForUpdatesOnStart } from './policy.js'

/** Options for {@link setupAutoUpdate}. */
export interface AutoUpdateSetupOptions {
  /**
   * When true, call `checkForUpdates` shortly after setup.
   * Defaults to `app.isPackaged` so `electron .` dev runs stay quiet unless forced.
   */
  checkOnStart?: boolean
  /** Override feed resolution (tests). */
  feed?: UpdateFeedConfig
  /** Override updater instance (tests). */
  updater?: AppUpdater
  /** Optional main window accessor (consent dialogs parent via main). */
  getMainWindow?: () => BrowserWindow | null
  /**
   * Called whenever pure state advances.
   * Main wires download / install consent dialogs here (see `update-consent.ts`).
   */
  onStateChange?: (state: UpdateState) => void
  /** Logger sink; defaults to `console`. */
  log?: (message: string) => void
}

/** Handle returned by {@link setupAutoUpdate}. */
export interface AutoUpdateController {
  /** Latest pure state snapshot. */
  getState: () => UpdateState
  /** Manual check stub (menu / command palette can call this later). */
  checkForUpdates: () => Promise<void>
  /** Begin download after an available update (still requires install consent later). */
  downloadUpdate: () => Promise<void>
  /**
   * Record user consent and quit-and-install when a download is ready.
   * No-ops (and logs) when consent/preconditions are missing.
   */
  requestInstallDownloadedUpdate: () => void
  /** Detach listeners (tests / rare re-init). */
  dispose: () => void
}

/**
 * Configure electron-updater with consent-preserving defaults and optional start check.
 * @param options - feed / hooks
 * @returns controller for manual check / install consent
 */
export function setupAutoUpdate(options: AutoUpdateSetupOptions = {}): AutoUpdateController {
  const log = options.log ?? ((message: string) => {
    console.log(`[auto-update] ${message}`)
  })
  const updater = options.updater ?? autoUpdater
  const feed = options.feed ?? resolveUpdateFeed()
  const currentVersion = app.getVersion()

  let state = createInitialUpdateState(currentVersion)
  const emit = (event: UpdateEvent): void => {
    state = reduceUpdateState(state, event)
    options.onStateChange?.(state)
  }

  // Consent-preserving defaults: never silent-install; never download without a call.
  updater.autoDownload = false
  updater.autoInstallOnAppQuit = false
  // Disable differential download noise in early skeletons; full packages only.
  updater.disableDifferentialDownload = true

  try {
    updater.setFeedURL(feed)
    log(`feed ${describeUpdateFeed(feed)} (app ${currentVersion})`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`failed to set feed URL: ${message}`)
    emit({ type: 'error', message })
  }

  const onChecking = (): void => {
    emit({ type: 'check-started' })
    log('checking for updates')
  }
  const onAvailable = (info: UpdateInfo): void => {
    emit({ type: 'update-available', version: info.version })
    log(`update available: ${info.version}`)
  }
  const onNotAvailable = (info: UpdateInfo): void => {
    emit({ type: 'update-not-available', version: info.version })
    log(`no update (latest known: ${info.version})`)
  }
  const onProgress = (progress: ProgressInfo): void => {
    emit({ type: 'download-progress', percent: progress.percent })
  }
  const onDownloaded = (info: UpdateInfo): void => {
    emit({ type: 'downloaded', version: info.version })
    log(`downloaded ${info.version}; waiting for install consent`)
  }
  const onError = (error: Error): void => {
    emit({ type: 'error', message: error.message })
    log(`error: ${error.message}`)
  }

  updater.on('checking-for-update', onChecking)
  updater.on('update-available', onAvailable)
  updater.on('update-not-available', onNotAvailable)
  updater.on('download-progress', onProgress)
  updater.on('update-downloaded', onDownloaded)
  updater.on('error', onError)

  const checkForUpdates = async (): Promise<void> => {
    try {
      // `checkForUpdates` returns null when the updater skips (e.g. no publish config in some modes).
      await updater.checkForUpdates()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      emit({ type: 'error', message })
      log(`check failed: ${message}`)
    }
  }

  const downloadUpdate = async (): Promise<void> => {
    if (state.phase !== 'update-available' && state.phase !== 'error') {
      log(`download skipped (phase=${state.phase})`)
      return
    }
    emit({ type: 'download-started' })
    try {
      await updater.downloadUpdate()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      emit({ type: 'error', message })
      log(`download failed: ${message}`)
    }
  }

  const requestInstallDownloadedUpdate = (): void => {
    state = reduceUpdateState(state, { type: 'consent-install' })
    options.onStateChange?.(state)
    if (!canInstallUpdate(state)) {
      log(`install refused (phase=${state.phase}, consented=${String(state.installConsented)})`)
      return
    }
    // User consented: allow quit-and-install for this downloaded package only.
    updater.autoInstallOnAppQuit = true
    log('install consent recorded; quitting to install')
    updater.quitAndInstall()
  }

  const dispose = (): void => {
    updater.off('checking-for-update', onChecking)
    updater.off('update-available', onAvailable)
    updater.off('update-not-available', onNotAvailable)
    updater.off('download-progress', onProgress)
    updater.off('update-downloaded', onDownloaded)
    updater.off('error', onError)
  }

  const checkOnStart = options.checkOnStart ?? shouldCheckForUpdatesOnStart(app.isPackaged)
  if (checkOnStart) {
    // Defer so window boot is not blocked on the network.
    setImmediate(() => {
      void checkForUpdates()
    })
  } else {
    log('start check skipped (unpackaged or DSH_DESKTOP_UPDATE_CHECK=0)')
  }

  return {
    getState: () => state,
    checkForUpdates,
    downloadUpdate,
    requestInstallDownloadedUpdate,
    dispose,
  }
}
