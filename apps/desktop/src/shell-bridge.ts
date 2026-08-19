/**
 * Main-process IPC handlers for the secure preload shell bridge.
 *
 * Exposes chrome-only capabilities (shell info, open external http(s) links).
 * This is **not** the Host API / ApiClient transport and must not grow agent
 * or session RPCs here — those stay on the loopback Host (MVP-B may add a
 * separate carrier later).
 * @module @deepseek-ai/dsh-desktop/shell-bridge
 */

import { app, ipcMain, shell } from 'electron'
import { isAllowedExternalUrl } from './external-url.js'
import {
  IPC_GET_SHELL_INFO,
  IPC_OPEN_EXTERNAL,
  type DshDesktopShellInfo,
} from './shell-ipc.js'

export {
  IPC_GET_SHELL_INFO,
  IPC_OPEN_EXTERNAL,
  type DshDesktopShellInfo,
} from './shell-ipc.js'

/**
 * Register shell-bridge `ipcMain` handlers. Idempotent for the process lifetime
 * of a normal desktop boot (call once from main before creating windows).
 */
export function registerShellBridgeHandlers(): void {
  ipcMain.handle(IPC_GET_SHELL_INFO, (): DshDesktopShellInfo => {
    return {
      version: app.getVersion(),
      platform: process.platform,
    }
  })

  ipcMain.handle(IPC_OPEN_EXTERNAL, async (_event, url: unknown): Promise<void> => {
    if (!isAllowedExternalUrl(url)) {
      throw new Error(
        'dsh-desktop: openExternal rejected URL (http(s) only; optional DSH_DESKTOP_OPEN_EXTERNAL_HOSTS host allowlist)',
      )
    }
    await shell.openExternal(url)
  })
}
