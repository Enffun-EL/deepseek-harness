/**
 * Ensure `apps/desktop/host-dist` exists before electron-builder runs.
 *
 * Product packaging (`DSH_DESKTOP_PRODUCT_RUNTIME=1`, default for pack/dist):
 * stages portable Node + pnpm-deployed `@deepseek-ai/dsh` runtime closure so a
 * clean machine can boot Host without a monorepo checkout.
 *
 * Dev/tests may set `DSH_DESKTOP_PRODUCT_RUNTIME=0` for lightweight artifact-only staging.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stageHostDist } from './stage-host-dist-lib.mjs'

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hostDist = path.join(desktopRoot, 'host-dist')

const productRuntime = process.env.DSH_DESKTOP_PRODUCT_RUNTIME !== '0'

const result = stageHostDist({
  hostDist,
  clean: true,
  productRuntime,
})

const { manifest } = result
if (result.staged) {
  console.log(
    `dsh-desktop: staged Host at ${hostDist}` +
      ` mode=${manifest.mode}` +
      ` runtime=${String(manifest.hasRuntimeDeploy)}` +
      ` portableNode=${String(manifest.hasPortableNode)}` +
      ` webDist=${String(manifest.hasWebDist)}`,
  )
  for (const note of manifest.notes) console.log(`  - ${note}`)
} else {
  console.log(
    `dsh-desktop: host-dist placeholder at ${hostDist}` +
      ' (no apps/cli/lib/bin.js — run pnpm run build, then ensure-host-dist)',
  )
}
