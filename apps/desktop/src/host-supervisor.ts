import { type ChildProcess, spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { parseHostWebUrl } from './parse-host-url.js'
import type { HostLaunchSpec } from './host-launcher.js'

/** Options for supervising one Host child. */
export interface HostSupervisorOptions {
  /** Spawn specification. */
  launch: HostLaunchSpec
  /** Extra environment merged over `process.env`. */
  env?: NodeJS.ProcessEnv
  /** Max time to wait for the readiness URL line. */
  readyTimeoutMs?: number
  /** Invoked for every stdout/stderr line (logging / UI status). */
  onLogLine?: (stream: 'stdout' | 'stderr', line: string) => void
}

/** A running Host plus its discovered loopback URL. */
export interface RunningHost {
  /** Child process handle. */
  process: ChildProcess
  /** Local UI origin, e.g. `http://127.0.0.1:49152`. */
  url: string
  /** Stop the child (SIGTERM then SIGKILL). */
  stop: () => Promise<void>
}

/**
 * Spawn `dsh web` and resolve when the `dsh web:` readiness line appears.
 * @param options - launch + timeouts
 * @returns running host with URL
 */
export async function startHost(options: HostSupervisorOptions): Promise<RunningHost> {
  const readyTimeoutMs = options.readyTimeoutMs ?? 120_000
  const child = spawn(options.launch.command, options.launch.args, {
    cwd: options.launch.cwd,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let settled = false
  let output = ''
  let resolveReady: (url: string) => void
  let rejectReady: (error: Error) => void
  const ready = new Promise<string>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const consider = (chunk: string): void => {
    output += chunk
    if (settled) return
    const url = parseHostWebUrl(output)
    if (url !== null) {
      settled = true
      resolveReady(url)
    }
  }

  const attach = (stream: 'stdout' | 'stderr', readable: NodeJS.ReadableStream | null): void => {
    if (readable === null) return
    const rl = createInterface({ input: readable })
    rl.on('line', (line) => {
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
          `dsh-desktop: Host exited before readiness (code=${String(code)}, signal=${String(signal)}). Output tail:\n${output.slice(-4000)}`,
        ),
      )
    }
  })

  const timer = setTimeout(() => {
    if (!settled) {
      settled = true
      rejectReady(
        new Error(
          `dsh-desktop: timed out after ${String(readyTimeoutMs)}ms waiting for Host URL. Output tail:\n${output.slice(-4000)}`,
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
      stop: async () => {
        await stopChild(child)
      },
    }
  } catch (error) {
    clearTimeout(timer)
    await stopChild(child)
    throw error
  }
}

/**
 * Terminate a child process tree politely, then forcefully.
 * @param child - spawned Host
 */
async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return

  await new Promise<void>((resolve) => {
    const forceTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL')
      }
    }, 5_000)

    child.once('exit', () => {
      clearTimeout(forceTimer)
      resolve()
    })

    // Windows: SIGTERM maps to TerminateProcess for node children in practice
    // via child.kill; taskkill is not required for a direct node CLI child.
    child.kill('SIGTERM')
  })
}
