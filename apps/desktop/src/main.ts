/**
 * Electron main process for DSH Desktop (MVP-A).
 *
 * Owns: single-instance lock, Host child lifecycle (start / restart / stop),
 * BrowserWindow loading the loopback Web UI. Does not own agent loop, tools,
 * or client business UI.
 * @module @deepseek-ai/dsh-desktop/main
 */

import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  setupAutoUpdate,
  type AutoUpdateController,
} from './auto-update.js'
import { startHost, type RunningHost } from './host-supervisor.js'
import { resolveHostLaunch, resolveNodeCommand } from './host-launcher.js'
import { resolveRepoRoot } from './resolve-repo-root.js'
import { HostLogRing } from './host-log-ring.js'
import {
  DEFAULT_HOST_RESTART_POLICY,
  recordRestartAttempt,
  resetRestartStreak,
  restartBackoffMs,
  shouldRestartHost,
  type HostRestartPolicy,
} from './host-restart-policy.js'
import { resolveHostReadyTimeoutMs } from './host-ready-timeout.js'
import { registerShellBridgeHandlers } from './shell-bridge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Compiled preload entry (sandbox + contextIsolation). */
const PRELOAD_PATH = path.join(__dirname, 'preload.js')

let mainWindow: BrowserWindow | null = null
let host: RunningHost | null = null
let starting = false
let quitting = false
let restartTimer: ReturnType<typeof setTimeout> | null = null
let failedRestarts = 0
const hostLogRing = new HostLogRing()
const restartPolicy: HostRestartPolicy = { ...DEFAULT_HOST_RESTART_POLICY }
/** Auto-update controller; retained for a future menu "Check for updates" action. */
let autoUpdate: AutoUpdateController | null = null

/**
 * Manual-check / install-consent entry point for a future app menu.
 * @returns controller after boot has called {@link setupAutoUpdate}, else null
 */
export function getAutoUpdateController(): AutoUpdateController | null {
  return autoUpdate
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow !== null) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    registerShellBridgeHandlers()
    void boot()
  })

  app.on('window-all-closed', () => {
    // Desktop product: closing the window exits the app (and Host).
    app.quit()
  })

  app.on('before-quit', (event) => {
    if (quitting) return
    quitting = true
    clearRestartTimer()
    if (host === null) return
    event.preventDefault()
    const current = host
    host = null
    void current.stop().finally(() => {
      app.exit(0)
    })
  })
}

/**
 * Create the shell window, start Host, navigate to the readiness URL.
 */
async function boot(): Promise<void> {
  if (starting) return
  starting = true

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'DSH Desktop',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Skeleton: check on start when packaged; manual check via controller later.
  // Never auto-downloads or silent-installs without consent (see auto-update.ts).
  autoUpdate = setupAutoUpdate({
    getMainWindow: () => mainWindow,
    onStateChange: (state) => {
      console.log(
        `[auto-update] phase=${state.phase}` +
          (state.availableVersion !== null ? ` available=${state.availableVersion}` : '') +
          (state.errorMessage !== null ? ` error=${state.errorMessage}` : ''),
      )
    },
  })

  await mainWindow.loadURL(loadingDataUrl('正在启动本地 Host…'))

  try {
    await startManagedHost()
  } catch (error) {
    await presentHostFailure(error)
  } finally {
    starting = false
  }
}

/**
 * Spawn Host under the shared log ring and wire unexpected-exit restart.
 */
async function startManagedHost(): Promise<void> {
  const repoRoot = resolveRepoRoot()
  const nodeCommand = resolveNodeCommand()
  const launch = resolveHostLaunch(repoRoot, nodeCommand)
  const dshHome = path.join(app.getPath('userData'), 'dsh-home')
  const readyTimeoutMs = resolveHostReadyTimeoutMs()

  const next = await startHost({
    launch,
    env: {
      // Isolate desktop sessions/settings from a developer's CLI DSH_HOME.
      DSH_HOME: dshHome,
      // Honor user proxy env inside the Host when Node supports it.
      NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? '1',
    },
    readyTimeoutMs,
    logRing: hostLogRing,
    onLogLine: (stream, line) => {
      // Main-process diagnostics only; never surface secrets intentionally.
      console.log(`[host:${stream}] ${line}`)
    },
    onUnexpectedExit: ({ code, signal }) => {
      void handleHostCrash({ code, signal })
    },
  })

  if (quitting || mainWindow === null) {
    await next.stop()
    return
  }

  host = next
  await mainWindow.loadURL(next.url)
}

/**
 * Restart Host after an unexpected post-ready exit, with capped backoff.
 * @param info - child exit codes from the supervisor
 */
async function handleHostCrash(info: {
  code: number | null
  signal: NodeJS.Signals | null
}): Promise<void> {
  if (quitting) return

  const allow = shouldRestartHost({
    hadReachedReady: true,
    stoppingIntentionally: quitting,
    failedRestarts,
    maxAttempts: restartPolicy.maxAttempts,
  })

  const delayMs = restartBackoffMs(failedRestarts, restartPolicy)
  if (!allow || delayMs === null) {
    const tail = hostLogRing.toText().slice(-4000)
    const message = [
      `本地 Host 在就绪后异常退出（code=${String(info.code)}, signal=${String(info.signal)}），已达重启上限。`,
      tail.length > 0 ? `最近日志：\n${tail}` : '',
    ]
      .filter(part => part.length > 0)
      .join('\n\n')
    console.error(message)
    if (mainWindow !== null) {
      await mainWindow.loadURL(loadingDataUrl(escapeHtml(message), true))
    }
    dialog.showErrorBox('DSH Desktop Host 已停止', message)
    host = null
    return
  }

  failedRestarts = recordRestartAttempt(failedRestarts)
  host = null

  const attemptLabel = `${String(failedRestarts)}/${String(restartPolicy.maxAttempts)}`
  console.warn(
    `dsh-desktop: Host crashed after ready (code=${String(info.code)}, signal=${String(info.signal)}); restart ${attemptLabel} in ${String(delayMs)}ms`,
  )

  if (mainWindow !== null) {
    await mainWindow.loadURL(
      loadingDataUrl(`本地 Host 已退出，正在重启（${attemptLabel}，${String(delayMs)}ms 后）…`),
    )
  }

  clearRestartTimer()
  restartTimer = setTimeout(() => {
    restartTimer = null
    void (async () => {
      if (quitting) return
      try {
        await startManagedHost()
        // Successful ready → clear the streak so a later crash gets a full budget.
        failedRestarts = resetRestartStreak()
      } catch (error) {
        const delay = restartBackoffMs(failedRestarts, restartPolicy)
        if (
          shouldRestartHost({
            hadReachedReady: true,
            stoppingIntentionally: quitting,
            failedRestarts,
            maxAttempts: restartPolicy.maxAttempts,
          }) &&
          delay !== null
        ) {
          // Treat failed restart spawn as another crash in the streak.
          await handleHostCrash({ code: null, signal: null })
          return
        }
        await presentHostFailure(error)
      }
    })()
  }, delayMs)
}

/**
 * Surface a start/restart failure in the window and a modal dialog.
 * @param error - thrown failure
 */
async function presentHostFailure(error: unknown): Promise<void> {
  const base = error instanceof Error ? error.message : String(error)
  const tail = hostLogRing.toText().slice(-4000)
  const message = tail.length > 0 && !base.includes(tail) ? `${base}\n\n最近日志：\n${tail}` : base
  console.error(message)
  if (mainWindow !== null) {
    await mainWindow.loadURL(loadingDataUrl(escapeHtml(message), true))
  }
  dialog.showErrorBox('DSH Desktop 启动失败', message)
}

/**
 * Cancel a pending delayed restart.
 */
function clearRestartTimer(): void {
  if (restartTimer !== null) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
}

/**
 * Minimal status page shown before the Host URL is known (or on failure).
 * @param message - status or error text
 * @param isError - style as error when true
 */
function loadingDataUrl(message: string, isError = false): string {
  const color = isError ? '#b91c1c' : '#0f172a'
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>DSH Desktop</title>
  <style>
    html, body { height: 100%; margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; color: ${color}; }
    main { min-height: 100%; display: grid; place-items: center; padding: 2rem; box-sizing: border-box; }
    pre { white-space: pre-wrap; word-break: break-word; max-width: 48rem; line-height: 1.5; }
  </style>
</head>
<body><main><pre>${message}</pre></main></body>
</html>`
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

/**
 * Escape text embedded into the loading HTML.
 * @param value - raw message
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
