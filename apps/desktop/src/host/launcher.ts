import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** How the desktop shell should spawn the local `dsh web` Host. */
export interface HostLaunchSpec {
  /** Node binary (not Electron's `process.execPath`). */
  command: string
  /** argv after the command. */
  args: string[]
  /** Working directory for the Host (monorepo root or staged host root). */
  cwd: string
}

/** Fixed `dsh web` argv shared by every launch mode. */
const WEB_ARGS = ['web', '--host', '127.0.0.1', '--port', '0'] as const

/**
 * Build the Host launch command for a Host root (monorepo checkout or staged host-dist).
 *
 * Preference order:
 * 1. Packaged `run-host.mjs` (staged host-dist / resources/host)
 * 2. Built CLI `apps/cli/lib/bin.js`
 * 3. Source CLI via tsx when root `node_modules` exists
 *
 * Bare git worktrees without lib/bin.js and without node_modules fail fast.
 *
 * @param hostRoot - Host root (monorepo root or packaged resources/host)
 * @param nodeCommand - Node executable that can load the CLI
 * @returns spawn spec for `dsh web --host 127.0.0.1 --port 0`
 */
export function resolveHostLaunch(hostRoot: string, nodeCommand: string): HostLaunchSpec {
  const runHost = path.join(hostRoot, 'run-host.mjs')
  if (existsSync(runHost)) {
    return {
      command: nodeCommand,
      args: [runHost, ...WEB_ARGS],
      cwd: hostRoot,
    }
  }

  const builtBin = path.join(hostRoot, 'apps', 'cli', 'lib', 'bin.js')
  const sourceBin = path.join(hostRoot, 'apps', 'cli', 'src', 'bin.ts')
  const hasInstallGraph = existsSync(path.join(hostRoot, 'node_modules'))

  if (existsSync(builtBin)) {
    return {
      command: nodeCommand,
      args: [builtBin, ...WEB_ARGS],
      cwd: hostRoot,
    }
  }

  if (!existsSync(sourceBin)) {
    throw new Error(
      `dsh-desktop: neither packaged run-host.mjs, built CLI (${builtBin}), nor source CLI (${sourceBin}) exists; run pnpm install && pnpm run build in the monorepo, pack with ensure-host-dist, or set DSH_DESKTOP_HOST_ROOT`,
    )
  }

  if (!hasInstallGraph) {
    throw new Error(
      `dsh-desktop: Host root ${hostRoot} has source CLI but no node_modules and no apps/cli/lib/bin.js. ` +
        'Git worktrees are not a runnable Host by themselves. Set DSH_DESKTOP_HOST_ROOT to the main checkout with build artifacts, or run pnpm install && pnpm run build there.',
    )
  }

  return {
    command: nodeCommand,
    args: ['--import', 'tsx/esm', sourceBin, ...WEB_ARGS],
    cwd: hostRoot,
  }
}

/**
 * Resolve a system Node binary. Electron's `process.execPath` cannot run the CLI.
 * @returns absolute or PATH-resolved node command
 */
export function resolveNodeCommand(): string {
  const fromEnv = process.env.NODE
  if (typeof fromEnv === 'string' && fromEnv.length > 0 && existsSync(fromEnv)) {
    return fromEnv
  }
  const fromNpm = process.env.npm_node_execpath
  if (typeof fromNpm === 'string' && fromNpm.length > 0 && existsSync(fromNpm)) {
    return fromNpm
  }
  return 'node'
}
