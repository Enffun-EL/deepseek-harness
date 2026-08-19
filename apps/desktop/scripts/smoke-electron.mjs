/**
 * Electron main-process startup smoke for DSH Desktop.
 *
 * Launches the real Electron binary against this package so main-process load
 * errors (for example CJS named-import crashes from electron-updater) fail the
 * gate even when unit tests pass. Prefers Host readiness (`dsh web: http://`)
 * when available; otherwise accepts a healthy auto-update log without a crash.
 *
 * Exit codes:
 * - 0 success
 * - 1 failure (main crash / timeout without success / unexpected exit)
 * - 2 skip (opt-out env, or Electron binary unavailable after install attempt)
 *
 * Opt out: DSH_DESKTOP_SMOKE_ELECTRON=0
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const desktopRoot = path.resolve(__dirname, '..')
const packageJsonPath = path.join(desktopRoot, 'package.json')
const mainEntry = path.join(desktopRoot, 'lib', 'main.js')

const DEFAULT_TIMEOUT_MS = 75_000

/** Host printed its loopback readiness line (full success). */
const SUCCESS_HOST = /dsh web:\s+https?:\/\//i
/**
 * Main reached setupAutoUpdate without throwing.
 * Unpackaged dev logs `feed …` then `start check skipped`; packaged may log phase=.
 */
const SUCCESS_MAIN_LOADED = /\[auto-update\]\s+(feed |start check skipped|phase=)/i

const FAILURE_PATTERNS = [
  /App threw an error/i,
  /Named export\b/i,
  /Uncaught Exception/i,
  /Error \[ERR_MODULE_NOT_FOUND\]/i,
  /SyntaxError:/i,
  /Cannot find module/i,
  /must be loaded with/i,
  /does not provide an export named/i,
  /ERR_REQUIRE_ESM/i,
]

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
function isSkipEnv(value) {
  if (value === undefined || value === '') return false
  const normalized = value.trim().toLowerCase()
  return normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no'
}

/**
 * @param {string} haystack
 * @returns {boolean}
 */
function isSuccessOutput(haystack) {
  return SUCCESS_HOST.test(haystack) || SUCCESS_MAIN_LOADED.test(haystack)
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, shell?: boolean }} [options]
 * @returns {Promise<number>}
 */
function runCaptured(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    // Never default shell:true for absolute paths (Windows breaks on spaces in
    // `C:\Program Files\…` / custom Node installs). Only pnpm needs a shell on win32.
    const useShell = options.shell === true
    const child = spawn(command, args, {
      cwd: options.cwd ?? desktopRoot,
      env: options.env ?? process.env,
      stdio: 'inherit',
      shell: useShell,
      windowsHide: true,
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited via signal ${signal}`))
        return
      }
      resolve(code ?? 1)
    })
  })
}

/**
 * Ensure `lib/main.js` exists by running the package build when needed.
 * @returns {Promise<void>}
 */
async function ensureDesktopBuilt() {
  if (existsSync(mainEntry)) {
    console.log(`dsh-desktop electron-smoke: using existing build ${mainEntry}`)
    return
  }
  console.log('dsh-desktop electron-smoke: building package…')
  const code = await runCaptured('pnpm', ['run', 'build'], {
    cwd: desktopRoot,
    // pnpm is a cmd shim on Windows.
    shell: process.platform === 'win32',
  })
  if (code !== 0) {
    throw new Error(`desktop build failed with exit ${String(code)}`)
  }
  if (!existsSync(mainEntry)) {
    throw new Error(`desktop build finished but missing ${mainEntry}`)
  }
}

/**
 * Locate the `electron` package root from this package's dependency tree.
 * @returns {string | null}
 */
function resolveElectronPackageRoot() {
  try {
    const require = createRequire(packageJsonPath)
    return path.dirname(require.resolve('electron/package.json'))
  } catch {
    return null
  }
}

/**
 * Resolve a runnable Electron binary path, or null if missing.
 * @returns {string | null}
 */
function resolveElectronBinary() {
  const electronRoot = resolveElectronPackageRoot()
  if (electronRoot === null) return null

  try {
    const require = createRequire(packageJsonPath)
    // Outside Electron, `require('electron')` yields the binary path string.
    const fromExport = require('electron')
    if (typeof fromExport === 'string' && fromExport.length > 0 && existsSync(fromExport)) {
      return fromExport
    }
  } catch {
    // path.txt / dist may be missing until install.js runs
  }

  const pathTxt = path.join(electronRoot, 'path.txt')
  if (existsSync(pathTxt)) {
    const rel = readFileSync(pathTxt, 'utf8').trim()
    if (rel.length > 0) {
      const candidate = path.join(electronRoot, 'dist', rel)
      if (existsSync(candidate)) return candidate
    }
  }

  // Platform fallbacks when path.txt is absent but dist was unpacked manually.
  const candidates =
    process.platform === 'win32'
      ? [path.join(electronRoot, 'dist', 'electron.exe')]
      : process.platform === 'darwin'
        ? [
            path.join(electronRoot, 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron'),
          ]
        : [path.join(electronRoot, 'dist', 'electron')]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

/**
 * @returns {{ command: string, args: string[] } | null}
 */
function resolveElectronLaunch() {
  const binary = resolveElectronBinary()
  if (binary !== null) {
    return { command: binary, args: ['.'] }
  }

  const electronRoot = resolveElectronPackageRoot()
  if (electronRoot === null) return null
  const cli = path.join(electronRoot, 'cli.js')
  if (!existsSync(cli)) return null
  // cli.js will try to resolve/download the binary on first use.
  return { command: process.execPath, args: [cli, '.'] }
}

/**
 * Try to install the Electron binary via electron/install.js (network).
 * @returns {Promise<boolean>} true when a binary path is available afterward
 */
async function tryInstallElectronBinary() {
  const electronRoot = resolveElectronPackageRoot()
  if (electronRoot === null) {
    console.error(
      'dsh-desktop electron-smoke: electron package not installed under @deepseek-ai/dsh-desktop',
    )
    return false
  }

  const installJs = path.join(electronRoot, 'install.js')
  if (!existsSync(installJs)) {
    console.error(`dsh-desktop electron-smoke: missing ${installJs}`)
    return false
  }

  const env = {
    ...process.env,
    // Prefer npmmirror when no explicit electron mirror is set (common in CN networks).
    ELECTRON_MIRROR:
      process.env.ELECTRON_MIRROR ??
      process.env.npm_config_electron_mirror ??
      'https://npmmirror.com/mirrors/electron/',
    HTTP_PROXY: process.env.HTTP_PROXY ?? process.env.http_proxy ?? '',
    HTTPS_PROXY: process.env.HTTPS_PROXY ?? process.env.https_proxy ?? '',
  }

  console.log('dsh-desktop electron-smoke: attempting electron binary install via install.js…')
  try {
    const code = await runCaptured(process.execPath, [installJs], {
      cwd: electronRoot,
      env,
    })
    if (code !== 0) {
      console.error(`dsh-desktop electron-smoke: electron install.js exited ${String(code)}`)
      return false
    }
  } catch (error) {
    console.error(
      `dsh-desktop electron-smoke: electron install failed — ${error instanceof Error ? error.message : String(error)}`,
    )
    return false
  }

  return resolveElectronBinary() !== null || resolveElectronLaunch() !== null
}

/**
 * Kill a process tree best-effort (Windows taskkill / POSIX process group).
 * @param {import('node:child_process').ChildProcess} child
 * @param {number | undefined} pid
 */
function killProcessTree(child, pid) {
  if (pid === undefined) {
    try {
      child.kill('SIGKILL')
    } catch {
      // already gone
    }
    return
  }

  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      return
    } catch {
      // fall through
    }
  } else {
    try {
      process.kill(-pid, 'SIGKILL')
      return
    } catch {
      // fall through to direct kill
    }
  }

  try {
    child.kill('SIGKILL')
  } catch {
    // already gone
  }
}

/**
 * Drop Host child log lines echoed by main (`[host:stdout]` / `[host:stderr]`).
 * Host may be incomplete in a partial workspace; this smoke gates main load.
 * @param {string} text
 * @returns {string}
 */
function mainProcessOutput(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/\[host:(stdout|stderr)\]/i.test(line))
    .join('\n')
}

/**
 * @param {string} chunk
 * @returns {boolean}
 */
function hasFailure(chunk) {
  const mainOnly = mainProcessOutput(chunk)
  return FAILURE_PATTERNS.some((pattern) => pattern.test(mainOnly))
}

/**
 * Run Electron once and classify stdout/stderr.
 * @returns {Promise<number>}
 */
async function runElectronSmoke() {
  if (isSkipEnv(process.env.DSH_DESKTOP_SMOKE_ELECTRON)) {
    console.log('dsh-desktop electron-smoke: skipped (DSH_DESKTOP_SMOKE_ELECTRON=0)')
    return 2
  }

  await ensureDesktopBuilt()

  let launch = resolveElectronLaunch()
  if (launch === null || resolveElectronBinary() === null) {
    const installed = await tryInstallElectronBinary()
    if (!installed) {
      console.error(
        'dsh-desktop electron-smoke: Electron binary unavailable. Install the desktop devDependency (`pnpm install` / electron download) and retry. Exit 2 (skip).',
      )
      return 2
    }
    launch = resolveElectronLaunch()
    if (launch === null) {
      console.error(
        'dsh-desktop electron-smoke: Electron binary still unavailable after install. Exit 2 (skip).',
      )
      return 2
    }
  }

  const timeoutMs = Number.parseInt(process.env.DSH_DESKTOP_SMOKE_ELECTRON_MS ?? '', 10)
  const budgetMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS

  const userDataDir = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-electron-smoke-'))
  const dshHome = path.join(userDataDir, 'dsh-home')

  let combined = ''
  let settled = false
  let mainLoadedGraceTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null)
  /** @type {(code: number) => void} */
  let finish = () => {}
  const done = new Promise((resolve) => {
    finish = (code) => {
      if (settled) return
      settled = true
      if (mainLoadedGraceTimer !== null) {
        clearTimeout(mainLoadedGraceTimer)
        mainLoadedGraceTimer = null
      }
      resolve(code)
    }
  })

  const env = {
    ...process.env,
    DSH_HOME: dshHome,
    NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? '1',
    ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
  }

  // Unique user-data-dir avoids clobbering a developer profile and usually
  // avoids single-instance lock collisions with an already-open Desktop.
  const args = [...launch.args, `--user-data-dir=${userDataDir}`]

  console.log(
    `dsh-desktop electron-smoke: launch=${launch.command} ${args.join(' ')} (timeout ${String(budgetMs)}ms)`,
  )

  const child = spawn(launch.command, args, {
    cwd: desktopRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    // New process group on POSIX so we can kill the Host tree with the shell.
    detached: process.platform !== 'win32',
    windowsHide: true,
  })

  const timer = setTimeout(() => {
    console.error(`dsh-desktop electron-smoke: timed out after ${String(budgetMs)}ms`)
    killProcessTree(child, child.pid)
    finish(1)
  }, budgetMs)

  /**
   * @param {Buffer | string} buf
   * @param {'stdout' | 'stderr'} stream
   */
  const onChunk = (buf, stream) => {
    const text = typeof buf === 'string' ? buf : buf.toString('utf8')
    combined += text
    for (const line of text.split(/\r?\n/)) {
      if (line.length === 0) continue
      console.log(`[electron:${stream}] ${line}`)
    }

    // Main-process crash patterns win only before we have already proven main loaded.
    // After auto-update logs, Host child failures must not fail this gate.
    if (!SUCCESS_MAIN_LOADED.test(combined) && hasFailure(combined)) {
      console.error('dsh-desktop electron-smoke: detected main-process failure pattern')
      killProcessTree(child, child.pid)
      finish(1)
      return
    }

    if (SUCCESS_HOST.test(combined)) {
      console.log('dsh-desktop electron-smoke: Host readiness observed')
      killProcessTree(child, child.pid)
      finish(0)
      return
    }

    if (SUCCESS_MAIN_LOADED.test(combined) && mainLoadedGraceTimer === null && !settled) {
      // Main imported electron-updater and ran setupAutoUpdate. Prefer Host
      // readiness when it arrives soon; otherwise accept main-process load.
      console.log(
        'dsh-desktop electron-smoke: main process loaded (auto-update log); waiting briefly for Host readiness…',
      )
      mainLoadedGraceTimer = setTimeout(() => {
        mainLoadedGraceTimer = null
        if (settled) return
        if (SUCCESS_HOST.test(combined)) {
          console.log('dsh-desktop electron-smoke: Host readiness observed')
          killProcessTree(child, child.pid)
          finish(0)
          return
        }
        console.log(
          'dsh-desktop electron-smoke: accepting main-process load without Host readiness',
        )
        killProcessTree(child, child.pid)
        finish(0)
      }, 15_000)
    }
  }

  child.stdout.on('data', (buf) => {
    onChunk(buf, 'stdout')
  })
  child.stderr.on('data', (buf) => {
    onChunk(buf, 'stderr')
  })

  child.on('error', (error) => {
    console.error(
      `dsh-desktop electron-smoke: spawn failed — ${error instanceof Error ? error.message : String(error)}`,
    )
    finish(1)
  })

  child.on('exit', (code, signal) => {
    if (settled) return
    if (isSuccessOutput(combined)) {
      finish(0)
      return
    }
    if (hasFailure(combined)) {
      console.error(
        `dsh-desktop electron-smoke: Electron exited with failure output (code=${String(code)}, signal=${String(signal)})`,
      )
      finish(1)
      return
    }
    console.error(
      `dsh-desktop electron-smoke: Electron exited before success signal (code=${String(code)}, signal=${String(signal)})`,
    )
    if (combined.trim().length > 0) {
      console.error('dsh-desktop electron-smoke: captured output tail:')
      console.error(combined.slice(-4000))
    }
    finish(1)
  })

  let exitCode = 1
  try {
    exitCode = await done
  } finally {
    clearTimeout(timer)
    killProcessTree(child, child.pid)
    // Give taskkill a brief moment on Windows before temp cleanup.
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 500 : 100))
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {
      // best-effort temp cleanup
    }
  }

  if (exitCode === 0) {
    console.log('dsh-desktop electron-smoke: ok')
  } else {
    console.error(`dsh-desktop electron-smoke: failed (exit ${String(exitCode)})`)
  }
  return exitCode
}

const isDirect =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === __filename

if (isDirect) {
  void runElectronSmoke()
    .then((code) => {
      process.exit(code)
    })
    .catch((error) => {
      console.error(
        `dsh-desktop electron-smoke: unexpected error — ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exit(1)
    })
}

export { runElectronSmoke }
