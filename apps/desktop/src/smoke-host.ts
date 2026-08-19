/**
 * Headless Host readiness smoke for DSH Desktop.
 *
 * Starts the same `dsh web` Host launch path as Electron main, waits for the
 * readiness URL, GETs it (expect HTTP 200), stops the Host, and exits 0/1.
 * Does not open Electron or require `DEEPSEEK_API_KEY`.
 * @module @deepseek-ai/dsh-desktop/smoke-host
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { resolveHostLaunch, resolveNodeCommand } from './host-launcher.js'
import { startHost } from './host-supervisor.js'
import { resolveRepoRoot } from './resolve-repo-root.js'

const DEFAULT_READY_TIMEOUT_MS = 120_000
const DEFAULT_HTTP_TIMEOUT_MS = 15_000

/**
 * Run the headless Host smoke once.
 * @returns process exit code (0 success, 1 failure)
 */
export async function runHostSmoke(): Promise<number> {
  const repoRoot = resolveRepoRoot()
  const nodeCommand = resolveNodeCommand()
  const launch = resolveHostLaunch(repoRoot, nodeCommand)
  const dshHome = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-smoke-'))

  console.log(`dsh-desktop smoke: repoRoot=${repoRoot}`)
  console.log(`dsh-desktop smoke: launch=${launch.command} ${launch.args.join(' ')}`)

  let host: Awaited<ReturnType<typeof startHost>> | null = null
  try {
    host = await startHost({
      launch,
      readyTimeoutMs: DEFAULT_READY_TIMEOUT_MS,
      env: {
        DSH_HOME: dshHome,
        NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? '1',
      },
      onLogLine: (stream, line) => {
        console.log(`[host:${stream}] ${line}`)
      },
    })

    console.log(`dsh-desktop smoke: ready at ${host.url}`)
    const status = await getHttpStatus(host.url, DEFAULT_HTTP_TIMEOUT_MS)
    if (status !== 200) {
      console.error(`dsh-desktop smoke: expected HTTP 200 from ${host.url}, got ${String(status)}`)
      return 1
    }

    console.log(`dsh-desktop smoke: GET ${host.url} → 200`)
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`dsh-desktop smoke: failed — ${message}`)
    return 1
  } finally {
    if (host !== null) {
      try {
        await host.stop()
      } catch (error) {
        // Best-effort teardown: surface but do not mask the primary result.
        console.error(
          `dsh-desktop smoke: Host stop warning — ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
    try {
      rmSync(dshHome, { recursive: true, force: true })
    } catch {
      // Temp home cleanup is best-effort after process exit paths.
    }
  }
}

/**
 * HTTP GET a URL and return the status code (or throw on network/timeout).
 * @param url - loopback Host origin
 * @param timeoutMs - abort after this many ms
 * @returns response status
 */
async function getHttpStatus(url: string, timeoutMs: number): Promise<number> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
    })
    return response.status
  } finally {
    clearTimeout(timer)
  }
}

const entryArg = process.argv[1]
const isDirectRun =
  entryArg !== undefined && import.meta.url === pathToFileURL(path.resolve(entryArg)).href

if (isDirectRun) {
  void runHostSmoke().then((code) => {
    process.exit(code)
  })
}
