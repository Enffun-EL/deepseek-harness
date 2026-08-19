/**
 * Sandboxed preload script for DSH Desktop.
 *
 * Exposes a minimal `window.dshDesktop` API via `contextBridge`. No Node
 * integration in the renderer; all privileged work goes through validated
 * main-process IPC handlers in `shell-bridge.ts`.
 *
 * Compiled as CommonJS (`tsconfig.preload.json`) and kept free of relative
 * imports so Electron can load it under `sandbox: true`.
 *
 * Shell chrome only - not a Host API / ApiClient replacement.
 * @module @deepseek-ai/dsh-desktop/preload
 */

import { contextBridge, ipcRenderer } from 'electron'

/**
 * IPC channel names - keep identical to `shell-ipc.ts`
 * (preload cannot import that module under the sandbox loader).
 */
const IPC_GET_SHELL_INFO = 'dsh-desktop:get-shell-info' as const
const IPC_OPEN_EXTERNAL = 'dsh-desktop:open-external' as const

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
