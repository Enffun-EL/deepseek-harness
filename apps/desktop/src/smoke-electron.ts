/**
 * Lightweight Electron binary smoke for DSH Desktop CI.
 *
 * Confirms the `electron` package binary is present and can start far enough
 * to print a version string. Does not open a window, start Host, or require
 * `DEEPSEEK_API_KEY`. Exit codes: `0` success, `1` binary failed, `2` binary
 * missing (typical postinstall download failure — CI may soft-fail only this).
 * @module @deepseek-ai/dsh-desktop/smoke-electron
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/** Exit code when the Electron binary is not on disk (download/install gap). */
export const ELECTRON_BINARY_MISSING_EXIT = 2

/**
 * Resolve the absolute Electron executable from the `electron` package.
 * @returns path when present on disk, otherwise `null`
 */
export function resolveElectronBinaryPath(): string | null {
  try {
    const require = createRequire(import.meta.url)
    const resolved = require('electron') as unknown
    if (typeof resolved !== 'string' || resolved.length === 0) {
      return null
    }
    return existsSync(resolved) ? resolved : null
  } catch {
    // electron package missing or its path export failed to load.
    return null
  }
}

/**
 * Run the Electron binary smoke once.
 * @returns process exit code (`0` / `1` / {@link ELECTRON_BINARY_MISSING_EXIT})
 */
export function runElectronSmoke(): number {
  const electronPath = resolveElectronBinaryPath()
  if (electronPath === null) {
    console.error(
      'dsh-desktop smoke:electron: Electron binary missing (postinstall download may have failed)',
    )
    return ELECTRON_BINARY_MISSING_EXIT
  }

  console.log(`dsh-desktop smoke:electron: binary=${electronPath}`)
  const result = spawnSync(electronPath, ['--version'], {
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      // Avoid GPU/display requirements on headless CI runners.
      ELECTRON_DISABLE_GPU: '1',
      ELECTRON_NO_ATTACH_CONSOLE: '1',
    },
  })

  if (result.error !== undefined) {
    const message = result.error.message
    console.error(`dsh-desktop smoke:electron: spawn failed — ${message}`)
    if (/ENOENT/i.test(message)) {
      return ELECTRON_BINARY_MISSING_EXIT
    }
    return 1
  }

  const version = (result.stdout ?? '').trim() || (result.stderr ?? '').trim()
  if (result.status !== 0) {
    console.error(
      `dsh-desktop smoke:electron: electron --version exited ${String(result.status)}` +
        (version.length > 0 ? `: ${version}` : ''),
    )
    return 1
  }

  if (version.length === 0) {
    console.error('dsh-desktop smoke:electron: electron --version produced no output')
    return 1
  }

  console.log(`dsh-desktop smoke:electron: version ${version}`)
  return 0
}

const entryArg = process.argv[1]
const isDirectRun =
  entryArg !== undefined && import.meta.url === pathToFileURL(path.resolve(entryArg)).href

if (isDirectRun) {
  process.exit(runElectronSmoke())
}
