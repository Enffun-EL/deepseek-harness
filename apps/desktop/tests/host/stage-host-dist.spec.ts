import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  HOST_MANIFEST_NAME,
  RUN_HOST_NAME,
  makeTempDir,
  stageHostDist,
} from '../../scripts/stage-host-dist-lib.mjs'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function makeMonorepoWithArtifacts(opts: { webDist?: boolean } = {}): string {
  const root = makeTempDir('dsh-mono-')
  temps.push(root)
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n')
  const lib = path.join(root, 'apps', 'cli', 'lib')
  mkdirSync(lib, { recursive: true })
  writeFileSync(path.join(lib, 'bin.js'), 'export {}\n')
  writeFileSync(path.join(lib, 'chunk.js'), 'export {}\n')
  writeFileSync(
    path.join(root, 'apps', 'cli', 'package.json'),
    JSON.stringify({ name: '@deepseek-ai/dsh', type: 'module' }),
  )
  mkdirSync(path.join(root, 'apps', 'cli', 'config', 'agent-presets'), { recursive: true })
  writeFileSync(path.join(root, 'apps', 'cli', 'config', 'agent-presets', 'x.yml'), 'id: x\n')
  if (opts.webDist !== false) {
    const dist = path.join(root, 'apps', 'web', 'dist')
    mkdirSync(dist, { recursive: true })
    writeFileSync(path.join(dist, 'index.html'), '<html></html>\n')
    writeFileSync(
      path.join(root, 'apps', 'web', 'package.json'),
      JSON.stringify({ name: '@deepseek-ai/dsh-web-frontend' }),
    )
  }
  return root
}

describe('stageHostDist', () => {
  it('writes a placeholder when CLI bin is missing', () => {
    const mono = makeTempDir('dsh-mono-empty-')
    temps.push(mono)
    writeFileSync(path.join(mono, 'pnpm-workspace.yaml'), 'packages: []\n')
    mkdirSync(path.join(mono, 'apps', 'cli'), { recursive: true })

    const hostDist = makeTempDir('dsh-host-dist-')
    temps.push(hostDist)

    const result = stageHostDist({ hostDist, monorepoRoot: mono, clean: true })
    expect(result.staged).toBe(false)
    expect(result.manifest.mode).toBe('placeholder')
    expect(existsSync(path.join(hostDist, HOST_MANIFEST_NAME))).toBe(true)
    expect(existsSync(path.join(hostDist, RUN_HOST_NAME))).toBe(false)
    expect(existsSync(path.join(hostDist, 'README.packaging-placeholder.txt'))).toBe(true)
  })

  it('stages CLI lib, web dist, run-host, and manifest when artifacts exist', () => {
    const mono = makeMonorepoWithArtifacts({ webDist: true })
    const hostDist = path.join(makeTempDir('dsh-desktop-'), 'host-dist')
    temps.push(path.dirname(hostDist))

    const result = stageHostDist({
      hostDist,
      monorepoRoot: mono,
      clean: true,
      productRuntime: false,
    })
    expect(result.staged).toBe(true)
    expect(result.manifest.mode).toBe('staged-artifacts')
    expect(result.manifest.hasCliBin).toBe(true)
    expect(result.manifest.hasWebDist).toBe(true)
    expect(result.manifest.hasCliConfig).toBe(true)
    expect(result.manifest.hasRuntimeDeploy).toBe(false)
    expect(result.manifest.hasPortableNode).toBe(false)
    expect(result.manifest.monorepoRoot).toBe(path.resolve(mono))

    expect(existsSync(path.join(hostDist, 'apps', 'cli', 'lib', 'bin.js'))).toBe(true)
    expect(existsSync(path.join(hostDist, 'apps', 'cli', 'lib', 'chunk.js'))).toBe(true)
    expect(existsSync(path.join(hostDist, 'apps', 'web', 'dist', 'index.html'))).toBe(true)
    expect(existsSync(path.join(hostDist, RUN_HOST_NAME))).toBe(true)
    expect(existsSync(path.join(hostDist, HOST_MANIFEST_NAME))).toBe(true)

    const manifest = JSON.parse(readFileSync(path.join(hostDist, HOST_MANIFEST_NAME), 'utf8')) as {
      mode: string
      monorepoRoot: string
      version: number
    }
    expect(manifest.mode).toBe('staged-artifacts')
    expect(manifest.version).toBe(2)
    expect(manifest.monorepoRoot).toBe(path.resolve(mono))

    const runner = readFileSync(path.join(hostDist, RUN_HOST_NAME), 'utf8')
    expect(runner).toContain('host-manifest.json')
    expect(runner).toContain('runtime')
    expect(runner).toContain('未找到可用的 Node.js')
  })

  it('stages without web dist when only CLI bin exists', () => {
    const mono = makeMonorepoWithArtifacts({ webDist: false })
    const hostDist = makeTempDir('dsh-host-dist-')
    temps.push(hostDist)

    const result = stageHostDist({
      hostDist,
      monorepoRoot: mono,
      clean: true,
      productRuntime: false,
    })
    expect(result.staged).toBe(true)
    expect(result.manifest.hasWebDist).toBe(false)
    expect(existsSync(path.join(hostDist, 'apps', 'cli', 'lib', 'bin.js'))).toBe(true)
    expect(existsSync(path.join(hostDist, 'apps', 'web', 'dist'))).toBe(false)
  })
})
