/**
 * Electron main process for DSH Desktop (MVP-A).
 *
 * Owns: single-instance lock, Host child lifecycle, BrowserWindow loading the
 * loopback Web UI. Does not own agent loop, tools, or client business UI.
 * @module @deepseek-ai/dsh-desktop/main
 */

import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { startHost, type RunningHost } from './host-supervisor.js'
import { resolveHostLaunch, resolveNodeCommand } from './host-launcher.js'
import { resolveHostRoot } from './resolve-host-root.js'

let mainWindow: BrowserWindow | null = null
let host: RunningHost | null = null
let starting = false

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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  await mainWindow.loadURL(loadingDataUrl('正在启动本地 Host…'))

  try {
    const hostRoot = resolveHostRoot({
      resourcesPath: app.isPackaged ? process.resourcesPath : null,
    })
    const nodeCommand = resolveNodeCommand()
    const launch = resolveHostLaunch(hostRoot, nodeCommand)
    const dshHome = path.join(app.getPath('userData'), 'dsh-home')

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    if (mainWindow !== null) {
      await mainWindow.loadURL(loadingDataUrl(escapeHtml(message), true))
    }
    dialog.showErrorBox('DSH Desktop 启动失败', message)
  } finally {
    starting = false
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
