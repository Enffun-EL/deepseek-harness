/**
 * Ensure `apps/desktop/host-dist` exists before electron-builder runs.
 *
 * electron-builder's `extraResources` entry fails when the source directory is
 * missing. A full Host bundle is deferred; this script creates an empty tree
 * (with a README marker) so shell-only packs succeed. Drop a real Host layout
 * into `host-dist/` (apps/cli/lib/bin.js + runtime deps) to ship a self-contained build.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hostDist = path.join(desktopRoot, 'host-dist')

mkdirSync(hostDist, { recursive: true })

const marker = path.join(hostDist, 'README.packaging-placeholder.txt')
if (!existsSync(path.join(hostDist, 'apps', 'cli'))) {
  writeFileSync(
    marker,
    [
      'Placeholder Host tree for electron-builder extraResources.',
      'This directory is not a runnable Host.',
      'Populate host-dist with a prepared Host layout (apps/cli/lib/bin.js and runtime)',
      'or set DSH_DESKTOP_HOST_ROOT at runtime. See apps/desktop README Packaging section.',
      '',
    ].join('\n'),
    'utf8',
  )
}

console.log(`dsh-desktop: host-dist ready at ${hostDist}`)
