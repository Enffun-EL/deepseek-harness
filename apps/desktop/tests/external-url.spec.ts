import { describe, expect, it } from 'vitest'
import { isAllowedExternalUrl } from '../src/external-url.js'

describe('isAllowedExternalUrl', () => {
  it('allows http and https absolute URLs', () => {
    expect(isAllowedExternalUrl('https://example.com/docs')).toBe(true)
    expect(isAllowedExternalUrl('http://127.0.0.1:3080/path?q=1')).toBe(true)
  })

  it('rejects non-http(s) schemes', () => {
    expect(isAllowedExternalUrl('file:///etc/passwd')).toBe(false)
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedExternalUrl('data:text/html,hi')).toBe(false)
    expect(isAllowedExternalUrl('shell:foo')).toBe(false)
  })

  it('rejects relative and empty values', () => {
    expect(isAllowedExternalUrl('/relative')).toBe(false)
    expect(isAllowedExternalUrl('example.com')).toBe(false)
    expect(isAllowedExternalUrl('')).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isAllowedExternalUrl(undefined)).toBe(false)
    expect(isAllowedExternalUrl(null)).toBe(false)
    expect(isAllowedExternalUrl(42)).toBe(false)
    expect(isAllowedExternalUrl({ href: 'https://example.com' })).toBe(false)
  })
})
