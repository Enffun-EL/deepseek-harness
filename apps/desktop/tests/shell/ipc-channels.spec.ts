import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import channelNames from '../../src/shell/ipc-channels.json' with { type: 'json' }
import { IPC_GET_SHELL_INFO, IPC_OPEN_EXTERNAL } from '../../src/shell/ipc.js'

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '../..')
const srcDir = join(pkgDir, 'src')
const libDir = join(pkgDir, 'lib')

describe('ipc channel single-source', () => {
  it('shell-ipc exports match ipc-channels.json', () => {
    expect(IPC_GET_SHELL_INFO).toBe(channelNames.IPC_GET_SHELL_INFO)
    expect(IPC_OPEN_EXTERNAL).toBe(channelNames.IPC_OPEN_EXTERNAL)
  })

  it('preload source imports ipc-channels.json (no hard-coded channel literals)', () => {
    const preloadSource = readFileSync(join(srcDir, 'preload.ts'), 'utf8')
    expect(preloadSource).toMatch(/from ['"]\.\/shell\/ipc-channels\.json['"]/)
    expect(preloadSource).toContain('channelNames.IPC_GET_SHELL_INFO')
    expect(preloadSource).toContain('channelNames.IPC_OPEN_EXTERNAL')
    expect(preloadSource).not.toMatch(/['"]dsh-desktop:[^'"]+['"]/)
  })

  it('bundled preload inlines the same channel names without sibling requires', () => {
    const preloadJsPath = join(libDir, 'preload.js')
    if (!existsSync(preloadJsPath)) {
      // Source-plane unit runs do not require a prior package build.
      return
    }
    const bundled = readFileSync(preloadJsPath, 'utf8')
    expect(bundled).toContain(channelNames.IPC_GET_SHELL_INFO)
    expect(bundled).toContain(channelNames.IPC_OPEN_EXTERNAL)
    // Sandboxed preload must stay a single file (electron only).
    expect(bundled).not.toMatch(/require\(['"]\.\/[^'"]+['"]\)/)
    expect(bundled).not.toMatch(/require\(['"][^'"]*ipc-channels/)
  })

  it('json keys stay the closed set consumed by shell-ipc and preload', () => {
    expect(Object.keys(channelNames).sort()).toEqual([
      'IPC_GET_SHELL_INFO',
      'IPC_OPEN_EXTERNAL',
    ])
  })
})
