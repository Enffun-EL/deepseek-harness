import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** How the desktop shell should spawn the local `dsh web` Host. */
export interface HostLaunchSpec {
  /** Node binary (usually `process.execPath` is wrong under Electron — use Electron's node or system node). */
  command: string
  /** argv after the command. */
  args: string[]
  /** Working directory for the Host (monorepo root in dev). */
  cwd: string
}

/**
 * Build the Host launch command for the monorepo checkout.
 * Prefers the built CLI bin; falls back to the source launcher via tsx.
 * @param repoRoot - monorepo root
 * @param nodeCommand - Node executable that can load the CLI (not Electron's process.execPath)
 * @returns spawn spec for `dsh web --host 127.0.0.1 --port 0`
 */
export function resolveHostLaunch(repoRoot: string, nodeCommand: string): HostLaunchSpec {
  const builtBin = path.join(repoRoot, 'apps', 'cli', 'lib', 'bin.js')
  const sourceBin = path.join(repoRoot, 'apps', 'cli', 'src', 'bin.ts')
  const webArgs = ['web', '--host', '127.0.0.1', '--port', '0'] as const

  if (existsSync(builtBin)) {
    return {
      command: nodeCommand,
      args: [builtBin, ...webArgs],
      cwd: repoRoot,
    }
  }

  if (!existsSync(sourceBin)) {
    throw new Error(
      `dsh-desktop: neither built CLI (${builtBin}) nor source CLI (${sourceBin}) exists; run pnpm install in the monorepo`,
    )
  }

  // Source path matches root `pnpm dsh` (node --import tsx/esm apps/cli/src/bin.ts).
  return {
    command: nodeCommand,
    args: ['--import', 'tsx/esm', sourceBin, ...webArgs],
    cwd: repoRoot,
  }
}

/**
 * Resolve a system Node binary. Electron's `process.execPath` is the Electron
 * binary and cannot run the CLI; prefer PATH `node`, then `process.env.npm_node_execpath`.
 * @returns absolute or PATH-resolved node command
 */
export function resolveNodeCommand(): string {
  const fromNpm = process.env.npm_node_execpath
  if (typeof fromNpm === 'string' && fromNpm.length > 0 && existsSync(fromNpm)) {
    return fromNpm
  }
  // PATH lookup is deferred to the OS spawn; "node" is the supported name.
  return 'node'
}
