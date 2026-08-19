import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveHostLaunch } from '../src/host-launcher.js'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('resolveHostLaunch', () => {
  it('prefers packaged run-host.mjs over the built CLI bin', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    writeFileSync(path.join(root, 'run-host.mjs'), '// stub runner\n')
    const binDir = path.join(root, 'apps', 'cli', 'lib')
    mkdirSync(binDir, { recursive: true })
    writeFileSync(path.join(binDir, 'bin.js'), '// stub\n')

    const launch = resolveHostLaunch(root, '/usr/bin/node')
    expect(launch.command).toBe('/usr/bin/node')
    expect(launch.cwd).toBe(root)
    expect(launch.args[0]).toBe(path.join(root, 'run-host.mjs'))
    expect(launch.args.slice(1)).toEqual(['web', '--host', '127.0.0.1', '--port', '0'])
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

  it('falls back to the source CLI via tsx when lib is missing', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    const srcDir = path.join(root, 'apps', 'cli', 'src')
    mkdirSync(srcDir, { recursive: true })
    writeFileSync(path.join(srcDir, 'bin.ts'), '// stub\n')

    const launch = resolveHostLaunch(root, 'node')
    expect(launch.args.slice(0, 3)).toEqual([
      '--import',
      'tsx/esm',
      path.join(srcDir, 'bin.ts'),
    ])
    expect(launch.args.slice(3)).toEqual(['web', '--host', '127.0.0.1', '--port', '0'])
  })

  it('throws when no launch path exists', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-'))
    temps.push(root)
    expect(() => resolveHostLaunch(root, 'node')).toThrow(/neither packaged run-host/)
  })
})
