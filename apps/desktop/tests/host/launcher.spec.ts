import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveBundledNodePath, resolveHostLaunch } from '../../src/host/launcher.js'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('resolveHostLaunch', () => {
  it('prefers run-host.mjs with bundled portable Node when present', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    writeFileSync(path.join(root, 'run-host.mjs'), '// stub\n')
    const nodePath = process.platform === 'win32'
      ? path.join(root, 'node', 'node.exe')
      : path.join(root, 'node', 'bin', 'node')
    mkdirSync(path.dirname(nodePath), { recursive: true })
    writeFileSync(nodePath, '')

    const launch = resolveHostLaunch(root, '/usr/bin/node')
    expect(launch.command).toBe(nodePath)
    expect(launch.args[0]).toBe(path.join(root, 'run-host.mjs'))
    expect(launch.cwd).toBe(root)
    expect(resolveBundledNodePath(root)).toBe(nodePath)
  })

  it('prefers deployed runtime/lib/bin.js over monorepo apps/cli', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    const runtimeBin = path.join(root, 'runtime', 'lib', 'bin.js')
    mkdirSync(path.dirname(runtimeBin), { recursive: true })
    writeFileSync(runtimeBin, '// deployed\n')
    const monoBin = path.join(root, 'apps', 'cli', 'lib', 'bin.js')
    mkdirSync(path.dirname(monoBin), { recursive: true })
    writeFileSync(monoBin, '// mono\n')

    const launch = resolveHostLaunch(root, '/usr/bin/node')
    expect(launch.args[0]).toBe(runtimeBin)
    expect(launch.cwd).toBe(path.join(root, 'runtime'))
  })

  it('prefers the built CLI bin when present', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    const binDir = path.join(root, 'apps', 'cli', 'lib')
    mkdirSync(binDir, { recursive: true })
    writeFileSync(path.join(binDir, 'bin.js'), '// stub\n')

    const launch = resolveHostLaunch(root, '/usr/bin/node')
    expect(launch.command).toBe('/usr/bin/node')
    expect(launch.cwd).toBe(root)
    expect(launch.args[0]).toBe(path.join(binDir, 'bin.js'))
    expect(launch.args.slice(1)).toEqual(['web', '--host', '127.0.0.1', '--port', '0'])
  })

  it('falls back to the source CLI via tsx when lib is missing but node_modules exists', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    const srcDir = path.join(root, 'apps', 'cli', 'src')
    mkdirSync(srcDir, { recursive: true })
    mkdirSync(path.join(root, 'node_modules'), { recursive: true })
    writeFileSync(path.join(srcDir, 'bin.ts'), '// stub\n')

    const launch = resolveHostLaunch(root, 'node')
    expect(launch.args.slice(0, 3)).toEqual([
      '--import',
      'tsx/esm',
      path.join(srcDir, 'bin.ts'),
    ])
    expect(launch.args.slice(3)).toEqual(['web', '--host', '127.0.0.1', '--port', '0'])
  })

  it('refuses a source-only tree without node_modules (bare worktree)', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    const srcDir = path.join(root, 'apps', 'cli', 'src')
    mkdirSync(srcDir, { recursive: true })
    writeFileSync(path.join(srcDir, 'bin.ts'), '// stub\n')

    expect(() => resolveHostLaunch(root, 'node')).toThrow(/worktrees|node_modules|runtime|installer/i)
  })
})
