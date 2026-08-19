import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Walk parents from this package until the monorepo root
 * (`pnpm-workspace.yaml` + `apps/cli`) is found.
 * @param startDir - directory to begin the walk (defaults to this file's package)
 * @returns absolute monorepo root path
 */
export function resolveRepoRoot(startDir = path.dirname(fileURLToPath(import.meta.url))): string {
  let dir = startDir
  for (;;) {
    if (
      existsSync(path.join(dir, 'pnpm-workspace.yaml'))
      && existsSync(path.join(dir, 'apps', 'cli'))
    ) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw new Error('dsh-desktop: could not locate monorepo root (pnpm-workspace.yaml + apps/cli)')
    }
    dir = parent
  }
}
