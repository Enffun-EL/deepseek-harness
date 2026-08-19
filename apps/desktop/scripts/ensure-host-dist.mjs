/**
 * Ensure `apps/desktop/host-dist` exists before electron-builder runs, and stage
 * a best-effort Host layout when monorepo build artifacts are present.
 *
 * electron-builder's `extraResources` entry fails when the source directory is
 * missing. When `apps/cli/lib/bin.js` exists in the monorepo, this script copies
 * CLI lib (+ config), optional `apps/web/dist`, and writes `run-host.mjs` plus
 * `host-manifest.json`. Full offline Host (node_modules + portable Node) is
 * deferred — see host-manifest notes and apps/desktop README Packaging.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stageHostDist } from './stage-host-dist-lib.mjs'

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hostDist = path.join(desktopRoot, 'host-dist')

const result = stageHostDist({ hostDist, clean: true })
const { manifest } = result

if (result.staged) {
  console.log(
    `dsh-desktop: staged Host layout at ${hostDist}` +
      ` (cliBin=${String(manifest.hasCliBin)} webDist=${String(manifest.hasWebDist)}` +
      ` monorepoRoot=${manifest.monorepoRoot ?? 'null'})`,
  )
} else {
  console.log(
    `dsh-desktop: host-dist placeholder at ${hostDist}` +
      ' (no apps/cli/lib/bin.js in monorepo — run pnpm run build, then re-run ensure-host-dist)',
  )
}
