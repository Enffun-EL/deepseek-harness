import { describe, expect, it } from 'vitest'
import { parseHostWebUrl } from '../src/parse-host-url.js'

describe('parseHostWebUrl', () => {
  it('reads the local URL from a plain readiness line', () => {
    expect(parseHostWebUrl('dsh web: http://127.0.0.1:4567\n')).toBe('http://127.0.0.1:4567')
  })

  it('ignores an optional LAN suffix', () => {
    expect(parseHostWebUrl('dsh web: http://127.0.0.1:4567 (LAN: http://192.168.1.5:4567)\n')).toBe(
      'http://127.0.0.1:4567',
    )
  })

  it('finds the line among other log noise', () => {
    const text = [
      'loading plugins…',
      'dsh web: http://127.0.0.1:3080',
      'something else',
    ].join('\n')
    expect(parseHostWebUrl(text)).toBe('http://127.0.0.1:3080')
  })

  it('returns null when the readiness line is absent', () => {
    expect(parseHostWebUrl('still booting\n')).toBeNull()
  })
})
