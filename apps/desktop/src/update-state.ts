/**
 * Pure update lifecycle state for the desktop shell.
 * electron-updater events map onto {@link UpdateEvent}; UI/IPC can subscribe later
 * without coupling to electron-updater types. Install never becomes allowed until
 * the user has consented after a successful download.
 * @module @deepseek-ai/dsh-desktop/update-state
 */

/** High-level phase shown to logs / future UI. */
export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'update-not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

/** Discrete inputs that advance {@link UpdateState}. */
export type UpdateEvent =
  | { type: 'check-started' }
  | { type: 'update-available'; version: string }
  | { type: 'update-not-available'; version?: string }
  | { type: 'download-started' }
  | { type: 'download-progress'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string }
  | { type: 'consent-install' }
  | { type: 'reset' }

/** Snapshot of the auto-update machine. */
export interface UpdateState {
  /** Current phase. */
  phase: UpdatePhase
  /** App version reported at boot. */
  currentVersion: string
  /** Remote version when known. */
  availableVersion: string | null
  /** Download progress 0–100, or null when not downloading. */
  downloadPercent: number | null
  /** Last error message, if any. */
  errorMessage: string | null
  /**
   * Whether the user explicitly consented to install the downloaded update.
   * Silent install is never implied by download completion alone.
   */
  installConsented: boolean
}

/**
 * Create the idle state for a running app version.
 * @param currentVersion - `app.getVersion()` (or package version in tests)
 */
export function createInitialUpdateState(currentVersion: string): UpdateState {
  return {
    phase: 'idle',
    currentVersion,
    availableVersion: null,
    downloadPercent: null,
    errorMessage: null,
    installConsented: false,
  }
}

/**
 * Pure reducer for update lifecycle events.
 * @param state - previous state
 * @param event - lifecycle event
 * @returns next state (new object)
 */
export function reduceUpdateState(state: UpdateState, event: UpdateEvent): UpdateState {
  switch (event.type) {
    case 'reset':
      return createInitialUpdateState(state.currentVersion)
    case 'check-started':
      return {
        ...state,
        phase: 'checking',
        errorMessage: null,
        downloadPercent: null,
        installConsented: false,
      }
    case 'update-available':
      return {
        ...state,
        phase: 'update-available',
        availableVersion: event.version,
        errorMessage: null,
        downloadPercent: null,
        installConsented: false,
      }
    case 'update-not-available':
      return {
        ...state,
        phase: 'update-not-available',
        availableVersion: event.version ?? state.currentVersion,
        errorMessage: null,
        downloadPercent: null,
        installConsented: false,
      }
    case 'download-started':
      return {
        ...state,
        phase: 'downloading',
        downloadPercent: 0,
        errorMessage: null,
        installConsented: false,
      }
    case 'download-progress': {
      const percent = clampPercent(event.percent)
      return {
        ...state,
        phase: 'downloading',
        downloadPercent: percent,
        errorMessage: null,
      }
    }
    case 'downloaded':
      return {
        ...state,
        phase: 'downloaded',
        availableVersion: event.version,
        downloadPercent: 100,
        errorMessage: null,
        // Consent must be a separate user action.
        installConsented: false,
      }
    case 'error':
      return {
        ...state,
        phase: 'error',
        errorMessage: event.message,
        downloadPercent: null,
        installConsented: false,
      }
    case 'consent-install':
      if (state.phase !== 'downloaded') {
        return state
      }
      return {
        ...state,
        installConsented: true,
      }
    default: {
      const _exhaustive: never = event
      return _exhaustive
    }
  }
}

/**
 * Whether it is safe to call quit-and-install (downloaded + explicit consent).
 * @param state - current state
 */
export function canInstallUpdate(state: UpdateState): boolean {
  return state.phase === 'downloaded' && state.installConsented
}

/**
 * Clamp a progress value into 0–100.
 * @param value - raw percent
 */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}
