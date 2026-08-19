import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
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
 * True when `dir` can supply a Host launch path (run-host.mjs, CLI bin, or monorepo leaf).
 * Prefer {@link hasBuiltCliBin} when choosing among several candidates.
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
 * 3. Walk parents for monorepo roots, plus the primary git worktree (linked worktrees
 *    are siblings, not parents). Prefer a root with built `apps/cli/lib/bin.js`, then
 *    one with root `node_modules`, else the nearest marker.
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
  const seen = new Set<string>()
  const addCandidate = (candidate: string): void => {
    const normalized = path.resolve(candidate)
    if (seen.has(normalized)) return
    if (!isHostRoot(normalized) || !existsSync(path.join(normalized, 'pnpm-workspace.yaml'))) return
    seen.add(normalized)
    candidates.push(normalized)
  }

  let dir = startDir
  for (;;) {
    addCandidate(dir)
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  // Linked git worktrees sit beside the main checkout, not under it.
  for (const linked of discoverLinkedGitWorktreeRoots(startDir)) {
    addCandidate(linked)
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

  const fallback = candidates[0]
  if (fallback === undefined) {
    throw new Error('dsh-desktop: could not locate Host root after candidate scan.')
  }
  return fallback
}

/**
 * Best-effort discovery of the primary git worktree root for a linked worktree.
 * @param startDir - directory inside a checkout or worktree
 * @returns absolute paths that may be Host roots (never throws)
 */
function discoverLinkedGitWorktreeRoots(startDir: string): string[] {
  const found: string[] = []

  try {
    const commonDir = execFileSync('git', ['-C', startDir, 'rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3_000,
      windowsHide: true,
    }).trim()
    if (commonDir.length > 0) {
      const resolvedCommon = path.resolve(startDir, commonDir)
      // common-dir is typically <main>/.git
      const mainRoot = path.basename(resolvedCommon) === '.git'
        ? path.dirname(resolvedCommon)
        : resolvedCommon
      found.push(mainRoot)
    }
  } catch {
    // Not a git directory, git missing, or timeout.
  }

  // Fallback: parse `.git` file `gitdir: .../worktrees/<name>` → main .git → parent.
  try {
    let probe = startDir
    for (;;) {
      const gitPath = path.join(probe, '.git')
      if (existsSync(gitPath)) {
        try {
          const text = readFileSync(gitPath, 'utf8').trim()
          const match = /^gitdir:\s*(.+)$/m.exec(text)
          if (match?.[1] !== undefined) {
            const gitDir = path.resolve(probe, match[1].trim())
            // .../.git/worktrees/<wt> → .../.git → repo root
            const maybeGit = path.dirname(path.dirname(gitDir))
            if (path.basename(maybeGit) === '.git') {
              found.push(path.dirname(maybeGit))
            } else {
              found.push(path.dirname(gitDir))
            }
          }
        } catch {
          // Directory .git or unreadable file — primary checkout already covered by walk.
        }
        break
      }
      const parent = path.dirname(probe)
      if (parent === probe) break
      probe = parent
    }
  } catch {
    // ignore
  }

  return found
}

/**
 * @deprecated Use {@link resolveHostRoot}. Kept as a thin alias for monorepo-only call sites.
 * @param startDir - directory to begin the walk
 */
export function resolveRepoRoot(startDir?: string): string {
  return resolveHostRoot(startDir === undefined ? {} : { startDir })
}
