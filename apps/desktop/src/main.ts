/**
 * Electron main process for DSH Desktop (MVP-A).
 *
 * Owns: single-instance lock, Host child lifecycle, BrowserWindow loading the
 * loopback Web UI, branded shell status pages, and a one-time first-run strip.
 * Does not own agent loop, tools, or client business UI.
 * @module @deepseek-ai/dsh-desktop/main
 */

import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { startHost, type RunningHost } from './host-supervisor.js'
import { resolveHostLaunch, resolveNodeCommand } from './host-launcher.js'
import { resolveRepoRoot } from './resolve-repo-root.js'
import {
  isFirstLaunch,
  markFirstLaunchCompleted,
} from './first-run-state.js'
import {
  buildFirstRunWelcomeScript,
  buildShellPageDataUrl,
  classifyHostStartError,
  SHELL_RETRY_URL,
} from './shell-pages.js'

let mainWindow: BrowserWindow | null = null
let host: RunningHost | null = null
let starting = false
/** Whether the current profile has not yet completed a successful Host load. */
let pendingFirstRunWelcome = false

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
    void boot()
  })

  app.on('window-all-closed', () => {
    // Desktop product: closing the window exits the app (and Host).
    app.quit()
  })

  app.on('before-quit', (event) => {
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

  if (mainWindow === null) {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 840,
      minWidth: 900,
      minHeight: 600,
      title: 'DSH Desktop',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })

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

  await mainWindow.loadURL(
    buildShellPageDataUrl({
      kind: 'loading',
      isFirstLaunch: pendingFirstRunWelcome,
    }),
  )

  try {
    // Stop a previous Host before relaunch (retry path).
    if (host !== null) {
      const previous = host
      host = null
      await previous.stop()
    }

    const repoRoot = resolveRepoRoot()
    const nodeCommand = resolveNodeCommand()
    const launch = resolveHostLaunch(repoRoot, nodeCommand)
    const dshHome = path.join(userDataPath, 'dsh-home')

    host = await startHost({
      launch,
      env: {
        // Isolate desktop sessions/settings from a developer's CLI DSH_HOME.
        DSH_HOME: dshHome,
        // Honor user proxy env inside the Host when Node supports it.
        NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? '1',
      },
      onLogLine: (stream, line) => {
        // Main-process diagnostics only; never surface secrets intentionally.
        console.log(`[host:${stream}] ${line}`)
      },
    })

    if (mainWindow === null) {
      await host.stop()
      host = null
      return
    }

    await mainWindow.loadURL(host.url)

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
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
  } finally {
    starting = false
  }
}

/**
 * Stop any in-flight start and re-run {@link boot} from an error page retry.
 */
async function retryBoot(): Promise<void> {
  if (starting) return
  await boot()
}

/**
 * Dialog title for a classified host failure.
 * @param kind - timeout or generic failure
 */
function kindTitle(kind: 'timeout' | 'failure'): string {
  return kind === 'timeout' ? 'DSH Desktop 启动超时' : 'DSH Desktop 启动失败'
}
