/**
 * Pure policy helpers for when the desktop shell should touch the update feed.
 * Kept free of electron / electron-updater imports so unit tests stay keyless.
 * @module @deepseek-ai/dsh-desktop/update-policy
 */

/**
 * Whether startup update checks should run under the current process/env.
 * @param isPackaged - `app.isPackaged`
 * @param env - environment map
 */
export function shouldCheckForUpdatesOnStart(
  isPackaged: boolean,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const forced = env.DSH_DESKTOP_UPDATE_CHECK?.trim().toLowerCase()
  if (forced === '0' || forced === 'false' || forced === 'off') return false
  if (forced === '1' || forced === 'true' || forced === 'on') return true
  return isPackaged
}
