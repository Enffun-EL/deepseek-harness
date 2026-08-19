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
 * True when `dir` looks like a Host / monorepo leaf the shell can target.
 * Prefer {@link hasBuiltCliBin} when choosing among several candidates.
 * @param dir - candidate Host root
 */
export function isHostRoot(dir: string): boolean {
  const cliDir = path.join(dir, 'apps', 'cli')
  if (!existsSync(cliDir)) return false
  if (existsSync(path.join(cliDir, 'lib', 'bin.js'))) return true
  if (existsSync(path.join(cliDir, 'src', 'bin.ts'))) return true
  // Monorepo checkout before the first CLI build still counts; launcher errors later if neither bin exists.
  return existsSync(path.join(dir, 'pnpm-workspace.yaml'))
}

/**
 * True when `dir` has a built CLI entry (`apps/cli/lib/bin.js`).
 * Worktrees often have sources but no `lib/` or install graph; those must not win over a built checkout.
 * @param dir - candidate Host root
 */
export function hasBuiltCliBin(dir: string): boolean {
  return existsSync(path.join(dir, 'apps', 'cli', 'lib', 'bin.js'))
}

/**
 * Resolve the Host root the shell spawns `dsh web` from.
 *
 * Order:
 * 1. `DSH_DESKTOP_HOST_ROOT` when set and valid
 * 2. Packaged `resources/host` (`extraResources`) when `resourcesPath` is provided
 * 3. Walk parents for monorepo roots; prefer one with built `apps/cli/lib/bin.js`,
 *    then one that also has a root `node_modules` (real install), else the nearest marker
 *
 * Full Host bundling inside the installer is deferred; packaged builds either ship a
 * prepared `resources/host` tree or require `DSH_DESKTOP_HOST_ROOT` / a monorepo checkout.
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
  const candidates: string[] = []
  let dir = startDir
  for (;;) {
    if (isHostRoot(dir) && existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      candidates.push(dir)
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  if (candidates.length === 0) {
    throw new Error(
      'dsh-desktop: could not locate Host root. Dev: open a monorepo checkout with built apps/cli (pnpm run build). Packaged: set DSH_DESKTOP_HOST_ROOT or ship resources/host (see apps/desktop README). Git worktrees without lib/bin.js are not enough.',
    )
  }

  const withBuiltBin = candidates.find(hasBuiltCliBin)
  if (withBuiltBin !== undefined) return withBuiltBin

  const withNodeModules = candidates.find(candidate => existsSync(path.join(candidate, 'node_modules')))
  if (withNodeModules !== undefined) return withNodeModules

  // Last resort: nearest monorepo markers (may still fail at launch if deps/lib missing).
  const fallback = candidates[0]
  if (fallback === undefined) {
    throw new Error('dsh-desktop: could not locate Host root after candidate scan.')
  }
  return fallback
}

/**
 * @deprecated Use {@link resolveHostRoot}. Kept as a thin alias for monorepo-only call sites.
 * @param startDir - directory to begin the walk
 */
export function resolveRepoRoot(startDir?: string): string {
  return resolveHostRoot(startDir === undefined ? {} : { startDir })
}
