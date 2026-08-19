import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isHostRoot, resolveHostRoot } from '../src/resolve-host-root.js'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function makeTemp(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-host-'))
  temps.push(root)
  return root
}

describe('isHostRoot', () => {
  it('accepts a monorepo marker pair', () => {
    const root = makeTemp()
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n')
    mkdirSync(path.join(root, 'apps', 'cli'), { recursive: true })
    expect(isHostRoot(root)).toBe(true)
  })

  it('accepts a packaged host with built CLI bin only', () => {
    const root = makeTemp()
    const binDir = path.join(root, 'apps', 'cli', 'lib')
    mkdirSync(binDir, { recursive: true })
    writeFileSync(path.join(binDir, 'bin.js'), '// stub\n')
    expect(isHostRoot(root)).toBe(true)
  })

  it('accepts a staged host-dist with run-host.mjs only', () => {
    const root = makeTemp()
    writeFileSync(path.join(root, 'run-host.mjs'), '// stub\n')
    expect(isHostRoot(root)).toBe(true)
  })

  it('rejects an empty directory', () => {
    expect(isHostRoot(makeTemp())).toBe(false)
  })
})

describe('resolveHostRoot', () => {
  it('prefers DSH_DESKTOP_HOST_ROOT when valid', () => {
    const root = makeTemp()
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n')
    mkdirSync(path.join(root, 'apps', 'cli'), { recursive: true })
    const decoy = makeTemp()

    const resolved = resolveHostRoot({
      startDir: decoy,
      env: { DSH_DESKTOP_HOST_ROOT: root },
      resourcesPath: null,
    })
    expect(resolved).toBe(path.resolve(root))
  })

  it('rejects an invalid DSH_DESKTOP_HOST_ROOT', () => {
    const empty = makeTemp()
    expect(() =>
      resolveHostRoot({
        startDir: empty,
        env: { DSH_DESKTOP_HOST_ROOT: empty },
      }),
    ).toThrow(/DSH_DESKTOP_HOST_ROOT/)
  })

  it('uses packaged resources/host before the monorepo walk', () => {
    const resources = makeTemp()
    const host = path.join(resources, 'host')
    const binDir = path.join(host, 'apps', 'cli', 'lib')
    mkdirSync(binDir, { recursive: true })
    writeFileSync(path.join(binDir, 'bin.js'), '// stub\n')

    const decoy = makeTemp()
    const resolved = resolveHostRoot({
      startDir: decoy,
      env: {},
      resourcesPath: resources,
    })
    expect(resolved).toBe(host)
  })

  it('accepts packaged resources/host that only has run-host.mjs', () => {
    const resources = makeTemp()
    const host = path.join(resources, 'host')
    mkdirSync(host, { recursive: true })
    writeFileSync(path.join(host, 'run-host.mjs'), '// stub\n')

    const decoy = makeTemp()
    const resolved = resolveHostRoot({
      startDir: decoy,
      env: {},
      resourcesPath: resources,
    })
    expect(resolved).toBe(host)
  })

  it('walks parents to a monorepo root', () => {
    const root = makeTemp()
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n')
    mkdirSync(path.join(root, 'apps', 'cli'), { recursive: true })
    const nested = path.join(root, 'apps', 'desktop', 'lib')
    mkdirSync(nested, { recursive: true })

    const resolved = resolveHostRoot({
      startDir: nested,
      env: {},
      resourcesPath: null,
    })
    expect(resolved).toBe(root)
  })

  it('throws a packaging-aware error when nothing matches', () => {
    const empty = makeTemp()
    expect(() =>
      resolveHostRoot({
        startDir: empty,
        env: {},
        resourcesPath: null,
      }),
    ).toThrow(/could not locate Host root/)
  })
})
