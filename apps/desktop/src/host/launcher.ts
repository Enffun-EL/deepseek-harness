import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** How the desktop shell should spawn the local `dsh web` Host. */
export interface HostLaunchSpec {
  /** Node binary (bundled portable Node preferred; never Electron). */
  command: string
  /** argv after the command. */
  args: string[]
  /** Working directory for the Host process. */
  cwd: string
}

/** Fixed `dsh web` argv shared by every launch mode. */
const WEB_ARGS = ['web', '--host', '127.0.0.1', '--port', '0'] as const

/**
 * Resolve a portable Node binary bundled under a Host root (`node/…`).
 * @param hostRoot - packaged resources/host or host-dist root
 * @returns absolute path, or null when absent
 */
export function resolveBundledNodePath(hostRoot: string): string | null {
  if (process.platform === 'win32') {
    const candidate = path.join(hostRoot, 'node', 'node.exe')
    return existsSync(candidate) ? candidate : null
  }
  const candidate = path.join(hostRoot, 'node', 'bin', 'node')
  return existsSync(candidate) ? candidate : null
}

/**
 * Build the Host launch command for a Host root.
 *
 * Preference:
 * 1. `run-host.mjs` (packaged product entry; uses bundled Node + runtime/)
 * 2. Deployed product runtime `runtime/lib/bin.js`
 * 3. Built monorepo CLI `apps/cli/lib/bin.js`
 * 4. Source CLI via tsx when root `node_modules` exists
 *
 * @param hostRoot - Host root (monorepo, host-dist, or resources/host)
 * @param nodeCommand - Node executable fallback when no bundled Node exists
 */
export function resolveHostLaunch(hostRoot: string, nodeCommand: string): HostLaunchSpec {
  const bundledNode = resolveBundledNodePath(hostRoot)
  const nodeBin = bundledNode ?? nodeCommand

  const runHost = path.join(hostRoot, 'run-host.mjs')
  if (existsSync(runHost)) {
    return {
      command: nodeBin,
      args: [runHost, ...WEB_ARGS],
      cwd: hostRoot,
    }
  }

  const deployedBin = path.join(hostRoot, 'runtime', 'lib', 'bin.js')
  if (existsSync(deployedBin)) {
    return {
      command: nodeBin,
      args: [deployedBin, ...WEB_ARGS],
      cwd: path.join(hostRoot, 'runtime'),
    }
  }

  const builtBin = path.join(hostRoot, 'apps', 'cli', 'lib', 'bin.js')
  const sourceBin = path.join(hostRoot, 'apps', 'cli', 'src', 'bin.ts')
  const hasInstallGraph = existsSync(path.join(hostRoot, 'node_modules'))

  if (existsSync(builtBin)) {
    return {
      command: nodeBin,
      args: [builtBin, ...WEB_ARGS],
      cwd: hostRoot,
    }
  }

  if (!existsSync(sourceBin)) {
    throw new Error(
      `dsh-desktop: Host root ${hostRoot} has no run-host.mjs, runtime/lib/bin.js, or apps/cli bin. ` +
        'Pack with product runtime (ensure-host-dist) or set DSH_DESKTOP_HOST_ROOT to a built monorepo.',
    )
  }

  if (!hasInstallGraph) {
    throw new Error(
      `dsh-desktop: Host root ${hostRoot} has source CLI but no node_modules and no built runtime. ` +
        'Git worktrees are not a runnable Host. Use the main checkout or a product installer build.',
    )
  }

  return {
    command: nodeBin,
    args: ['--import', 'tsx/esm', sourceBin, ...WEB_ARGS],
    cwd: hostRoot,
  }
}

/**
 * Resolve a system/dev Node binary when no portable Node is bundled.
 * Electron's `process.execPath` is never returned.
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
