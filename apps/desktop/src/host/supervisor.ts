import { type ChildProcess, spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import process from 'node:process'
import { parseHostWebUrl } from './parse-url.js'
import type { HostLaunchSpec } from './launcher.js'
import { HostLogRing } from './log-ring.js'
import {
  DEFAULT_HOST_READY_TIMEOUT_MS,
  resolveHostReadyTimeoutMs,
} from './ready-timeout.js'

/** Options for supervising one Host child. */
export interface HostSupervisorOptions {
  /** Spawn specification. */
  launch: HostLaunchSpec
  /** Extra environment merged over `process.env`. */
  env?: NodeJS.ProcessEnv
  /**
   * Max time to wait for the readiness URL line.
   * Defaults to `DSH_DESKTOP_HOST_READY_MS` or {@link DEFAULT_HOST_READY_TIMEOUT_MS}.
   */
  readyTimeoutMs?: number
  /** Invoked for every stdout/stderr line (logging / UI status). */
  onLogLine?: (stream: 'stdout' | 'stderr', line: string) => void
  /**
   * Optional ring that receives every Host log line (for crash dialogs).
   * When omitted, a private ring still bounds the readiness error tail.
   */
  logRing?: HostLogRing
  /**
   * Invoked once when the child exits after readiness was observed.
   * Not called for intentional stops via {@link RunningHost.stop}.
   */
  onUnexpectedExit?: (info: { code: number | null; signal: NodeJS.Signals | null }) => void
}

/** A running Host plus its discovered loopback URL. */
export interface RunningHost {
  /** Child process handle. */
  process: ChildProcess
  /** Local UI origin, e.g. `http://127.0.0.1:49152`. */
  url: string
  /** Stop the child (graceful then forceful; Windows may use taskkill tree). */
  stop: () => Promise<void>
  /** Bounded Host log ring shared with the supervisor. */
  logRing: HostLogRing
}

/**
 * Spawn `dsh web` and resolve when the `dsh web:` readiness line appears.
 * @param options - launch + timeouts
 * @returns running host with URL
 */
export async function startHost(options: HostSupervisorOptions): Promise<RunningHost> {
  const readyTimeoutMs =
    options.readyTimeoutMs ?? resolveHostReadyTimeoutMs(process.env, DEFAULT_HOST_READY_TIMEOUT_MS)
  const logRing = options.logRing ?? new HostLogRing()
  const child = spawn(options.launch.command, options.launch.args, {
    cwd: options.launch.cwd,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    // Detached false: we own the tree and stop it explicitly.
    detached: false,
  })

  let settled = false
  let intentionalStop = false
  let reachedReady = false
  let resolveReady: (url: string) => void
  let rejectReady: (error: Error) => void
  const ready = new Promise<string>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const consider = (chunk: string): void => {
    if (settled) return
    // Prefer the latest line; fall back to the ring in case the ready line was split.
    const url = parseHostWebUrl(chunk) ?? parseHostWebUrl(logRing.toText())
    if (url !== null) {
      settled = true
      reachedReady = true
      resolveReady(url)
    }
  }

  const attach = (stream: 'stdout' | 'stderr', readable: NodeJS.ReadableStream | null): void => {
    if (readable === null) return
    const rl = createInterface({ input: readable })
    rl.on('line', (line) => {
      logRing.push(stream, line)
      options.onLogLine?.(stream, line)
      consider(`${line}\n`)
    })
  }

  attach('stdout', child.stdout)
  attach('stderr', child.stderr)

  child.once('error', (error) => {
    if (!settled) {
      settled = true
      rejectReady(error instanceof Error ? error : new Error(String(error)))
    }
  })

  child.once('exit', (code, signal) => {
    if (!settled) {
      settled = true
      rejectReady(
        new Error(
          `dsh-desktop: Host exited before readiness (code=${String(code)}, signal=${String(signal)}). Output tail:\n${logRing.toText().slice(-4000)}`,
        ),
      )
      return
    }
    if (reachedReady && !intentionalStop) {
      try {
        options.onUnexpectedExit?.({ code, signal })
      } catch {
        // Swallow onUnexpectedExit throws: exit handlers must not reject the child exit path.
      }
    }
  })

  const timer = setTimeout(() => {
    if (!settled) {
      settled = true
      rejectReady(
        new Error(
          `dsh-desktop: timed out after ${String(readyTimeoutMs)}ms waiting for Host URL. Output tail:\n${logRing.toText().slice(-4000)}`,
        ),
      )
      void stopChild(child)
    }
  }, readyTimeoutMs)

  try {
    const url = await ready
    clearTimeout(timer)
    return {
      process: child,
      url,
      logRing,
      stop: async () => {
        intentionalStop = true
        await stopChild(child)
      },
    }
  } catch (error) {
    clearTimeout(timer)
    intentionalStop = true
    await stopChild(child)
    throw error
  }
}

/**
 * Terminate a child process tree politely, then forcefully.
 * On Windows, uses `taskkill /T` so orphaned grandchildren cannot outlive the shell.
 * @param child - spawned Host
 */
async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return

  await new Promise<void>((resolve) => {
    let settled = false
    const done = (): void => {
      if (settled) return
      settled = true
      clearTimeout(forceTimer)
      clearTimeout(treeTimer)
      resolve()
    }

    child.once('exit', () => {
      done()
    })

    // Windows: SIGTERM on a console-less child often maps to TerminateProcess for
    // that one PID only. Prefer taskkill tree first so pnpm/node grandchildren die.
    if (process.platform === 'win32' && typeof child.pid === 'number') {
      void killWindowsProcessTree(child.pid).catch(() => {
        // Swallow taskkill spawn failures; SIGTERM/SIGKILL below still run.
      })
    }

    try {
      child.kill('SIGTERM')
    } catch {
      // Swallow kill races when the child exited between the live check and kill.
      done()
      return
    }

    const treeTimer = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) return
      if (process.platform === 'win32' && typeof child.pid === 'number') {
        void killWindowsProcessTree(child.pid, true).catch(() => {
          // Swallow forced taskkill failures; SIGKILL below still runs.
        })
      }
    }, 2_000)

    const forceTimer = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) return
      try {
        child.kill('SIGKILL')
      } catch {
        // Swallow kill races when the child already exited.
        done()
      }
    }, 5_000)
  })
}

/**
 * Kill a Windows PID and its descendants via `taskkill`.
 * @param pid - root process id
 * @param force - pass `/F` for hard kill
 */
async function killWindowsProcessTree(pid: number, force = false): Promise<void> {
  const args = ['/pid', String(pid), '/T']
  if (force) args.push('/F')
  await new Promise<void>((resolve) => {
    const killer = spawn('taskkill', args, {
      stdio: 'ignore',
      windowsHide: true,
    })
    killer.once('error', () => {
      // taskkill missing or access denied — caller falls back to child.kill.
      resolve()
    })
    killer.once('exit', () => {
      resolve()
    })
  })
}
