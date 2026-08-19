/**
 * Ambient types for the secure preload bridge (`window.dshDesktop`).
 * Consumed by renderer / client TypeScript that runs inside the desktop shell.
 *
 * This file is declaration-only; copy stays under `src/` and is referenced by
 * consumers that include the desktop package types. Channel contracts live in
 * `shell-ipc.ts`.
 */

import type { DshDesktopShellInfo } from './shell/ipc.js'

/** Renderer-facing desktop shell API exposed by `preload.ts`. */
export interface DshDesktopApi {
  /**
   * Read shell version and platform from the main process.
   * @returns shell info snapshot
   */
  getShellInfo: () => Promise<DshDesktopShellInfo>
  /**
   * Open an http(s) URL in the system default browser.
   * @param url - absolute http or https URL
   */
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    /** Present only when the page runs inside DSH Desktop with the preload bridge. */
    readonly dshDesktop?: DshDesktopApi
  }
}

export type { DshDesktopShellInfo }
