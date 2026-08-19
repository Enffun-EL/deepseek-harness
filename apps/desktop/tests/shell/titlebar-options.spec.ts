import { describe, expect, it, vi } from 'vitest'
import {
  noteCustomTitleBarEnvIfIgnored,
  resolveCustomTitleBarWindowOptions,
} from '../../src/shell/titlebar-options.js'

describe('resolveCustomTitleBarWindowOptions', () => {
  it('defaults to empty options (native frame)', () => {
    expect(resolveCustomTitleBarWindowOptions({}, 'win32')).toEqual({})
    expect(resolveCustomTitleBarWindowOptions({}, 'darwin')).toEqual({})
    expect(resolveCustomTitleBarWindowOptions({}, 'linux')).toEqual({})
  })

  it('enables Windows overlay chrome when env is set', () => {
    const opts = resolveCustomTitleBarWindowOptions(
      { DSH_DESKTOP_CUSTOM_TITLEBAR: '1' },
      'win32',
    )
    expect(opts.titleBarStyle).toBe('hidden')
    expect(opts.titleBarOverlay).toMatchObject({ height: 36 })
    expect(opts.frame).toBeUndefined()
  })

  it('enables macOS hiddenInset when env is set', () => {
    const opts = resolveCustomTitleBarWindowOptions(
      { DSH_DESKTOP_CUSTOM_TITLEBAR: 'true' },
      'darwin',
    )
    expect(opts).toEqual({ titleBarStyle: 'hiddenInset' })
  })

  it('never drops the Linux frame even when env is set', () => {
    expect(
      resolveCustomTitleBarWindowOptions({ DSH_DESKTOP_CUSTOM_TITLEBAR: 'on' }, 'linux'),
    ).toEqual({})
  })
})

describe('noteCustomTitleBarEnvIfIgnored', () => {
  it('logs only when env is set on Linux', () => {
    const log = vi.fn()
    noteCustomTitleBarEnvIfIgnored({ DSH_DESKTOP_CUSTOM_TITLEBAR: '1' }, 'linux', log)
    expect(log).toHaveBeenCalledOnce()
    expect(String(log.mock.calls[0]?.[0])).toContain('Linux')

    log.mockClear()
    noteCustomTitleBarEnvIfIgnored({ DSH_DESKTOP_CUSTOM_TITLEBAR: '1' }, 'win32', log)
    expect(log).not.toHaveBeenCalled()
  })
})
