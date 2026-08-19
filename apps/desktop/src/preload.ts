/**
 * Sandboxed preload script for DSH Desktop.
 *
 * Exposes a minimal `window.dshDesktop` API via `contextBridge`. No Node
 * integration in the renderer; all privileged work goes through validated
 * main-process IPC handlers in `shell-bridge.ts`.
 *
 * Built as a single CommonJS bundle (`scripts/build-preload.mjs`) so Electron
 * can load it under `sandbox: true` without sibling `require()`s. Channel
 * names come from `ipc-channels.json` (shared with `shell-ipc.ts`) and are
 * inlined at bundle time.
 *
 * Shell chrome only - not a Host API / ApiClient replacement.
 * @module @deepseek-ai/dsh-desktop/preload
 */

import { contextBridge, ipcRenderer } from 'electron'
import channelNames from './ipc-channels.json'

const IPC_GET_SHELL_INFO = channelNames.IPC_GET_SHELL_INFO
const IPC_OPEN_EXTERNAL = channelNames.IPC_OPEN_EXTERNAL

/** Shell info payload from main (`DshDesktopShellInfo` in `shell-ipc.ts`). */
interface DshDesktopShellInfo {
  version: string
  platform: string
}

/** Renderer-facing desktop shell API (mirrored in `dsh-desktop.d.ts`). */
interface DshDesktopApi {
  getShellInfo: () => Promise<DshDesktopShellInfo>
  openExternal: (url: string) => Promise<void>
}

const api: DshDesktopApi = {
  getShellInfo: () => ipcRenderer.invoke(IPC_GET_SHELL_INFO) as Promise<DshDesktopShellInfo>,
  openExternal: (url: string) => ipcRenderer.invoke(IPC_OPEN_EXTERNAL, url) as Promise<void>,
}

contextBridge.exposeInMainWorld('dshDesktop', api)
