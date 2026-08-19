/**
 * Bundle the sandboxed preload into a single CommonJS file.
 *
 * Electron `sandbox: true` preload must not `require()` sibling modules, so
 * channel names from `ipc-channels.json` are inlined here while main keeps the
 * ESM import of the same JSON via `shell-ipc.ts`.
 */
import * as esbuild from 'esbuild'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ['src/preload.ts'],
  outfile: 'lib/preload.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2022',
  external: ['electron'],
  sourcemap: true,
  logLevel: 'info',
})
