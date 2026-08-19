import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** How the desktop shell should spawn the local `dsh web` Host. */
export interface HostLaunchSpec {
  /** Node binary (usually `process.execPath` is wrong under Electron — use Electron's node or system node). */
  command: string
  /** argv after the command. */
  args: string[]
  /** Working directory for the Host (monorepo root in dev; staged host root when packaged). */
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
 * 3. Source CLI via tsx (`apps/cli/src/bin.ts`)
 *
 * @param hostRoot - Host root (monorepo root or packaged resources/host)
 * @param nodeCommand - Node executable that can load the CLI (not Electron's process.execPath)
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

  if (existsSync(builtBin)) {
    return {
      command: nodeCommand,
      args: [builtBin, ...WEB_ARGS],
      cwd: hostRoot,
    }
  }

  if (!existsSync(sourceBin)) {
    throw new Error(
      `dsh-desktop: neither packaged run-host.mjs, built CLI (${builtBin}), nor source CLI (${sourceBin}) exists; run pnpm install / pnpm run build in the monorepo, or pack with ensure-host-dist after a monorepo build`,
    )
  }

  // Source path matches root `pnpm dsh` (node --import tsx/esm apps/cli/src/bin.ts).
  return {
    command: nodeCommand,
    args: ['--import', 'tsx/esm', sourceBin, ...WEB_ARGS],
    cwd: hostRoot,
  }
}

/**
 * Resolve a system Node binary. Electron's `process.execPath` is the Electron
 * binary and cannot run the CLI; prefer PATH `node`, then `process.env.npm_node_execpath`.
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
  // PATH lookup is deferred to the OS spawn; "node" is the supported name.
  return 'node'
}
