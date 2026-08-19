/**
 * Optional custom title bar constructor options for DSH Desktop.
 *
 * Opt-in only; default keeps the native frame so Linux and unfinished client
 * chrome never leave a window without window controls.
 * @module @deepseek-ai/dsh-desktop/titlebar-options
 */

/** Subset of Electron BrowserWindow options this stub may set. */
export interface CustomTitleBarWindowOptions {
  /** When false, the window is frameless (not used by this stub yet). */
  frame?: boolean
  /** Electron titleBarStyle (Windows / macOS). */
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
  /** Windows title bar overlay styling when titleBarStyle is hidden. */
  titleBarOverlay?: boolean | {
    color?: string
    symbolColor?: string
    height?: number
  }
}

/**
 * Whether to request custom title bar window chrome.
 *
 * Opt-in via `DSH_DESKTOP_CUSTOM_TITLEBAR=1` (or `true` / `on`). Default stays
 * the native frame. When enabled, only Windows and macOS get `titleBarStyle` /
 * overlay hints; Linux never drops the frame here (frameless without client
 * chrome is unusable). Full client-drawn chrome can tighten this later.
 * @param env - process env (injectable for tests)
 * @param platform - process.platform (injectable for tests)
 * @returns constructor option patch (may be empty)
 */
export function resolveCustomTitleBarWindowOptions(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): CustomTitleBarWindowOptions {
  const raw = env.DSH_DESKTOP_CUSTOM_TITLEBAR?.trim().toLowerCase()
  const enabled = raw === '1' || raw === 'true' || raw === 'on'
  if (!enabled) return {}

  // Linux: keep the native frame. Frameless + missing client chrome is a dead window.
  if (platform === 'linux') {
    return {}
  }

  if (platform === 'darwin') {
    return {
      titleBarStyle: 'hiddenInset',
      // trafficLightPosition can be tuned when client chrome owns the top bar.
    }
  }

  // Windows (and other non-Linux): keep a system title bar overlay seat without
  // setting frame:false yet — full custom chrome needs client hit-targets first.
  if (platform === 'win32') {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#0f172a',
        symbolColor: '#f8fafc',
        height: 36,
      },
    }
  }

  return {}
}

/**
 * Log when custom title bar env is set but ignored (Linux safety).
 * @param env - process env
 * @param platform - process.platform
 * @param log - logger (defaults to console.info)
 */
export function noteCustomTitleBarEnvIfIgnored(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  log: (message: string) => void = (message) => {
    console.info(message)
  },
): void {
  const raw = env.DSH_DESKTOP_CUSTOM_TITLEBAR?.trim().toLowerCase()
  const enabled = raw === '1' || raw === 'true' || raw === 'on'
  if (enabled && platform === 'linux') {
    log('dsh-desktop: DSH_DESKTOP_CUSTOM_TITLEBAR ignored on Linux (native frame retained)')
  }
}
