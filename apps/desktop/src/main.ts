/**
 * Electron main process for DSH Desktop (MVP-A).
 *
 * Owns: single-instance lock, Host child lifecycle (start / restart / stop),
 * BrowserWindow loading the loopback Web UI, branded shell status pages, a
 * one-time first-run strip, secure preload shell bridge, and auto-update
 * skeleton. Does not own agent loop, tools, or client business UI.
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
import { resolveHostRoot } from './resolve-host-root.js'
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
import {
  isFirstLaunch,
  markFirstLaunchCompleted,
} from './first-run-state.js'
import { formatHostStartErrorDetail } from './missing-node.js'
import {
  buildFirstRunWelcomeScript,
  buildShellPageDataUrl,
  classifyHostStartError,
  SHELL_RETRY_URL,
} from './shell-pages.js'

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
/** Whether the current profile has not yet completed a successful Host load. */
let pendingFirstRunWelcome = false
let shellHandlersBound = false

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
 * Create the shell window (once), start Host, navigate to the readiness URL.
 */
async function boot(): Promise<void> {
  if (starting) return
  starting = true

  const userDataPath = app.getPath('userData')
  pendingFirstRunWelcome = isFirstLaunch(userDataPath)

  ensureMainWindow()

  // Skeleton: check on start when packaged; manual check via controller later.
  // Never auto-downloads or silent-installs without consent (see auto-update.ts).
  if (autoUpdate === null) {
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
  }

  if (mainWindow === null) {
    starting = false
    return
  }

  await mainWindow.loadURL(
    buildShellPageDataUrl({
      kind: 'loading',
      isFirstLaunch: pendingFirstRunWelcome,
    }),
  )

  try {
    await startManagedHost()
  } catch (error) {
    await presentHostFailure(error)
  } finally {
    starting = false
  }
}

/**
 * Ensure the BrowserWindow exists and shell navigation handlers are bound once.
 */
function ensureMainWindow(): void {
  if (mainWindow !== null) return

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
    shellHandlersBound = false
  })

  if (!shellHandlersBound) {
    shellHandlersBound = true
    // Retry from branded error pages (data: URL → custom scheme).
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url !== SHELL_RETRY_URL) return
      event.preventDefault()
      void retryBoot()
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url === SHELL_RETRY_URL) {
        void retryBoot()
      }
      return { action: 'deny' }
    })
  }
}

/**
 * Spawn Host under the shared log ring and wire unexpected-exit restart.
 */
async function startManagedHost(): Promise<void> {
  const userDataPath = app.getPath('userData')
  // Stop a previous Host before relaunch (retry path).
  if (host !== null) {
    const previous = host
    host = null
    await previous.stop()
  }

  const hostRoot = resolveHostRoot({
    resourcesPath: app.isPackaged ? process.resourcesPath : null,
  })
  const nodeCommand = resolveNodeCommand()
  const launch = resolveHostLaunch(hostRoot, nodeCommand)
  const dshHome = path.join(userDataPath, 'dsh-home')
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

  if (pendingFirstRunWelcome && mainWindow !== null) {
    try {
      await mainWindow.webContents.executeJavaScript(buildFirstRunWelcomeScript(), true)
      markFirstLaunchCompleted(userDataPath)
      pendingFirstRunWelcome = false
    } catch (error) {
      // Welcome strip is non-blocking; keep first-run flag so a later boot can retry.
      console.warn(
        'dsh-desktop: first-run welcome strip failed',
        error instanceof Error ? error.message : error,
      )
    }
  }
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
      await mainWindow.loadURL(
        buildShellPageDataUrl({
          kind: 'failure',
          detail: message,
          showRetry: true,
        }),
      )
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
      buildShellPageDataUrl({
        kind: 'loading',
        detail: `本地 Host 已退出，正在重启（${attemptLabel}，${String(delayMs)}ms 后）…`,
      }),
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
  const base = formatHostStartErrorDetail(error)
  const tail = hostLogRing.toText().slice(-4000)
  const message = tail.length > 0 && !base.includes(tail) ? `${base}\n\n最近日志：\n${tail}` : base
  const kind = classifyHostStartError(message)
  console.error(message)
  if (mainWindow !== null) {
    await mainWindow.loadURL(
      buildShellPageDataUrl({
        kind,
        detail: message,
        showRetry: true,
      }),
    )
  }
  dialog.showErrorBox(kindTitle(kind), message)
}

/**
 * Stop any in-flight start and re-run {@link boot} from an error page retry.
 */
async function retryBoot(): Promise<void> {
  if (starting || quitting) return
  clearRestartTimer()
  failedRestarts = resetRestartStreak()
  await boot()
}

/**
 * Dialog title for a classified host failure.
 * @param kind - timeout or generic failure
 */
function kindTitle(kind: 'timeout' | 'failure'): string {
  return kind === 'timeout' ? 'DSH Desktop 启动超时' : 'DSH Desktop 启动失败'
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
