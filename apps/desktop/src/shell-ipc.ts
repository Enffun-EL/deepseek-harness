/**
 * Shared IPC channel names and payload types for the desktop shell bridge.
 * Safe to import from both main and the sandboxed preload (no main-only APIs).
 */

/** IPC channel: renderer asks for shell version/platform. */
export const IPC_GET_SHELL_INFO = 'dsh-desktop:get-shell-info' as const

/** IPC channel: renderer asks to open a URL in the system browser. */
export const IPC_OPEN_EXTERNAL = 'dsh-desktop:open-external' as const

/** Payload returned by {@link IPC_GET_SHELL_INFO}. */
export interface DshDesktopShellInfo {
  /** Electron app version (`package.json` / set via `app.setVersion`). */
  version: string
  /** Node `process.platform` of the main process. */
  platform: string
}
