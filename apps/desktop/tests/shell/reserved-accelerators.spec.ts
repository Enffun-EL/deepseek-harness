import { describe, expect, it } from 'vitest'
import {
  isReservedClientAccelerator,
  RESERVED_CLIENT_ACCELERATORS,
} from '../../src/shell/reserved-accelerators.js'

describe('RESERVED_CLIENT_ACCELERATORS', () => {
  it('documents Ctrl+N and Ctrl+K for client actions', () => {
    const keys = RESERVED_CLIENT_ACCELERATORS.map(entry => entry.accelerator)
    expect(keys).toEqual(['Ctrl+N', 'Ctrl+K'])
    expect(RESERVED_CLIENT_ACCELERATORS.map(entry => entry.clientAction)).toEqual([
      'createTask',
      'openCommandPalette',
    ])
  })
})

describe('isReservedClientAccelerator', () => {
  it('matches Windows, macOS, and CmdOrCtrl spellings', () => {
    expect(isReservedClientAccelerator('Ctrl+N')).toBe(true)
    expect(isReservedClientAccelerator('Command+N')).toBe(true)
    expect(isReservedClientAccelerator('CmdOrCtrl+N')).toBe(true)
    expect(isReservedClientAccelerator('ctrl+k')).toBe(true)
    expect(isReservedClientAccelerator('CommandOrControl+K')).toBe(true)
  })

  it('rejects unrelated chords', () => {
    expect(isReservedClientAccelerator('Ctrl+T')).toBe(false)
    expect(isReservedClientAccelerator('Ctrl+Shift+N')).toBe(false)
    expect(isReservedClientAccelerator('')).toBe(false)
    expect(isReservedClientAccelerator('Alt+K')).toBe(false)
  })
})
