/**
 * Persist a simple first-launch flag under Electron userData (or any directory).
 * Pure fs helpers — no Electron import — so tests can use a temp directory.
 * @module @deepseek-ai/dsh-desktop/first-run-state
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** On-disk file name under the shell state directory. */
export const FIRST_RUN_STATE_FILE = 'desktop-shell-state.json'

/** JSON payload written under userData. */
export interface DesktopShellState {
  /** True after the user has completed one successful Host UI load. */
  hasCompletedFirstLaunch: boolean
}

const DEFAULT_STATE: DesktopShellState = {
  hasCompletedFirstLaunch: false,
}

/**
 * Absolute path to the shell state JSON file.
 * @param userDataPath - Electron `app.getPath('userData')` or a test directory
 * @returns state file path
 */
export function shellStatePath(userDataPath: string): string {
  return path.join(userDataPath, FIRST_RUN_STATE_FILE)
}

/**
 * Read whether this profile has finished a successful first launch.
 * Missing or invalid files count as first launch not completed.
 * @param userDataPath - directory that owns the state file
 * @returns true when the welcome strip should still be shown
 */
export function isFirstLaunch(userDataPath: string): boolean {
  return !readShellState(userDataPath).hasCompletedFirstLaunch
}

/**
 * Load shell state from disk.
 * @param userDataPath - directory that owns the state file
 * @returns parsed state or defaults
 */
export function readShellState(userDataPath: string): DesktopShellState {
  const filePath = shellStatePath(userDataPath)
  if (!existsSync(filePath)) return { ...DEFAULT_STATE }
  try {
    const raw = readFileSync(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_STATE }
    const flag = (parsed as { hasCompletedFirstLaunch?: unknown }).hasCompletedFirstLaunch
    return {
      hasCompletedFirstLaunch: flag === true,
    }
  } catch {
    // Corrupt or unreadable state: treat as first launch so UX recovers.
    return { ...DEFAULT_STATE }
  }
}

/**
 * Persist that the first successful Host UI load completed.
 * @param userDataPath - directory that owns the state file
 */
export function markFirstLaunchCompleted(userDataPath: string): void {
  const filePath = shellStatePath(userDataPath)
  mkdirSync(path.dirname(filePath), { recursive: true })
  const next: DesktopShellState = { hasCompletedFirstLaunch: true }
  writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}
