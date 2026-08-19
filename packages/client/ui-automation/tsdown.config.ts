import { clientOnly } from '../tsdown.client.ts'

/**
 * ui-automation is browser-only pure React atoms. Its lib bundle is importable
 * under plain Node (same pattern as ui-attachment): CSS imports are stubbed to
 * empty modules. Bundlers that compile `src` directly receive the real CSS
 * Modules class maps.
 */
export default clientOnly([{
  entry: ['lib/types/index.js', 'lib/types/invariant.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'neutral',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  plugins: [{
    name: 'dsh-css-stub',
    resolveId(source: string) {
      if (!source.endsWith('.css')) return null
      return `\0dsh-css-stub:${source}.mjs`
    },
    load(id: string) {
      if (!id.startsWith('\0dsh-css-stub:')) return null
      return 'export default {};'
    },
  }],
}])
