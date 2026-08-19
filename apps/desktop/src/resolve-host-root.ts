import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Options for locating the Host tree the desktop shell should supervise. */
export interface ResolveHostRootOptions {
  /** Directory to begin the monorepo walk (defaults to this module's directory). */
  startDir?: string
  /** Environment map (defaults to `process.env`). */
  env?: NodeJS.ProcessEnv
  /**
   * Electron `process.resourcesPath` when the app is packaged.
   * Pass `null` or omit outside a packaged build.
   */
  resourcesPath?: string | null
}

/**
 * True when `dir` can supply a Host launch path for `dsh web`.
 * Accepts: staged `run-host.mjs`, built/source CLI under `apps/cli`, or monorepo leaf.
 * @param dir - candidate Host root
 */
export function isHostRoot(dir: string): boolean {
  // Staged host-dist / resources/host (ensure-host-dist writes run-host.mjs).
  if (existsSync(path.join(dir, 'run-host.mjs'))) return true

  const cliDir = path.join(dir, 'apps', 'cli')
  if (!existsSync(cliDir)) return false
  if (existsSync(path.join(cliDir, 'lib', 'bin.js'))) return true
  if (existsSync(path.join(cliDir, 'src', 'bin.ts'))) return true
  // Monorepo checkout before the first CLI build still counts; launcher errors later if neither bin exists.
  return existsSync(path.join(dir, 'pnpm-workspace.yaml'))
}

/**
 * Resolve the Host root the shell spawns `dsh web` from.
 *
 * Order:
 * 1. `DSH_DESKTOP_HOST_ROOT` when set and valid
 * 2. Packaged `resources/host` (`extraResources`) when `resourcesPath` is provided
 * 3. Walk parents for a monorepo root (`pnpm-workspace.yaml` + `apps/cli`)
 *
 * Packaged builds prefer `resources/host` staged by `ensure-host-dist` (run-host.mjs +
 * CLI/web artifacts + optional same-machine monorepo bridge). Full offline Host
 * (vendored node_modules + portable Node) remains deferred.
 *
 * @param options - env, packaged resources path, and walk start
 * @returns absolute Host root path
 */
export function resolveHostRoot(options: ResolveHostRootOptions = {}): string {
  const env = options.env ?? process.env
  const fromEnv = env.DSH_DESKTOP_HOST_ROOT
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    const resolved = path.resolve(fromEnv.trim())
    if (!isHostRoot(resolved)) {
      throw new Error(
        `dsh-desktop: DSH_DESKTOP_HOST_ROOT=${resolved} is not a Host root (expected apps/cli with bin or monorepo markers)`,
      )
    }
    return resolved
  }

  const resourcesPath = options.resourcesPath
  if (typeof resourcesPath === 'string' && resourcesPath.length > 0) {
    const packagedHost = path.join(resourcesPath, 'host')
    if (isHostRoot(packagedHost)) {
      return packagedHost
    }
  }

  const startDir = options.startDir ?? path.dirname(fileURLToPath(import.meta.url))
  let dir = startDir
  for (;;) {
    if (isHostRoot(dir) && existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw new Error(
        'dsh-desktop: could not locate Host root. Dev: open a monorepo checkout. Packaged: set DSH_DESKTOP_HOST_ROOT or ship resources/host (see apps/desktop README).',
      )
    }
    dir = parent
  }
}

/**
 * @deprecated Use {@link resolveHostRoot}. Kept as a thin alias for monorepo-only call sites.
 * @param startDir - directory to begin the walk
 */
export function resolveRepoRoot(startDir?: string): string {
  return resolveHostRoot(startDir === undefined ? {} : { startDir })
}
