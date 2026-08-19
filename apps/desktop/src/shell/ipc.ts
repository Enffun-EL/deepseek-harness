/**
 * Shared IPC channel names and payload types for the desktop shell bridge.
 *
 * Channel string literals live in `ipc-channels.json` so the sandboxed CJS
 * preload and the ESM main process share one source (preload cannot import
 * this ESM module under `sandbox: true`).
 */

import channelNames from './ipc-channels.json' with { type: 'json' }

/** IPC channel: renderer asks for shell version/platform. */
export const IPC_GET_SHELL_INFO = channelNames.IPC_GET_SHELL_INFO

/** IPC channel: renderer asks to open a URL in the system browser. */
export const IPC_OPEN_EXTERNAL = channelNames.IPC_OPEN_EXTERNAL

/** Payload returned by {@link IPC_GET_SHELL_INFO}. */
export interface DshDesktopShellInfo {
  /** Electron app version (`package.json` / set via `app.setVersion`). */
  version: string
  /** Node `process.platform` of the main process. */
  platform: string
}
