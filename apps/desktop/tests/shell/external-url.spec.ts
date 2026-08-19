import { describe, expect, it } from 'vitest'
import {
  isAllowedExternalUrl,
  isLocalhostHostname,
  OPEN_EXTERNAL_HOSTS_ENV,
  parseOpenExternalHostAllowlist,
  resolveOpenExternalHostAllowlist,
} from '../../src/shell/external-url.js'

describe('isAllowedExternalUrl', () => {
  it('allows http and https absolute URLs to any host by default', () => {
    expect(isAllowedExternalUrl('https://example.com/docs', { allowedHosts: null })).toBe(true)
    expect(isAllowedExternalUrl('http://127.0.0.1:3080/path?q=1', { allowedHosts: null })).toBe(
      true,
    )
    expect(isAllowedExternalUrl('https://evil.example/phish', { allowedHosts: null })).toBe(true)
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

  it('when allowlist is set, allows listed hosts and localhost only', () => {
    const allowedHosts = ['docs.example.com', 'github.com']
    expect(isAllowedExternalUrl('https://docs.example.com/a', { allowedHosts })).toBe(true)
    expect(isAllowedExternalUrl('https://GITHUB.com/org/repo', { allowedHosts })).toBe(true)
    expect(isAllowedExternalUrl('http://localhost:5173/app', { allowedHosts })).toBe(true)
    expect(isAllowedExternalUrl('http://127.0.0.1:3080/', { allowedHosts })).toBe(true)
    expect(isAllowedExternalUrl('http://[::1]/', { allowedHosts })).toBe(true)
    expect(isAllowedExternalUrl('https://evil.example/', { allowedHosts })).toBe(false)
    expect(isAllowedExternalUrl('https://example.com/', { allowedHosts })).toBe(false)
  })

  it('empty allowlist still permits localhost only', () => {
    expect(isAllowedExternalUrl('http://localhost/', { allowedHosts: [] })).toBe(true)
    expect(isAllowedExternalUrl('https://example.com/', { allowedHosts: [] })).toBe(false)
  })

  it('reads DSH_DESKTOP_OPEN_EXTERNAL_HOSTS from env when options omit allowedHosts', () => {
    const env = {
      [OPEN_EXTERNAL_HOSTS_ENV]: 'docs.example.com, api.example.com',
    }
    expect(isAllowedExternalUrl('https://docs.example.com/x', { env })).toBe(true)
    expect(isAllowedExternalUrl('https://other.example/', { env })).toBe(false)
    expect(isAllowedExternalUrl('http://127.0.0.1/', { env })).toBe(true)
  })

  it('treats unset env as unrestricted and empty env as localhost-only', () => {
    expect(isAllowedExternalUrl('https://anywhere.example/', { env: {} })).toBe(true)
    expect(
      isAllowedExternalUrl('https://anywhere.example/', {
        env: { [OPEN_EXTERNAL_HOSTS_ENV]: '' },
      }),
    ).toBe(false)
    expect(
      isAllowedExternalUrl('http://localhost/', {
        env: { [OPEN_EXTERNAL_HOSTS_ENV]: '   ' },
      }),
    ).toBe(true)
  })
})

describe('parseOpenExternalHostAllowlist', () => {
  it('splits, trims, lowercases, and drops empties', () => {
    expect(parseOpenExternalHostAllowlist(' Docs.Example.com , ,GITHUB.com ')).toEqual([
      'docs.example.com',
      'github.com',
    ])
    expect(parseOpenExternalHostAllowlist(undefined)).toEqual([])
    expect(parseOpenExternalHostAllowlist('')).toEqual([])
  })
})

describe('resolveOpenExternalHostAllowlist', () => {
  it('returns null when unrestricted', () => {
    expect(resolveOpenExternalHostAllowlist({ allowedHosts: null })).toBeNull()
    expect(resolveOpenExternalHostAllowlist({ env: {} })).toBeNull()
  })

  it('returns parsed env list when set', () => {
    expect(
      resolveOpenExternalHostAllowlist({
        env: { [OPEN_EXTERNAL_HOSTS_ENV]: 'a.com,b.com' },
      }),
    ).toEqual(['a.com', 'b.com'])
  })
})

describe('isLocalhostHostname', () => {
  it('recognizes loopback names', () => {
    expect(isLocalhostHostname('localhost')).toBe(true)
    expect(isLocalhostHostname('LOCALHOST')).toBe(true)
    expect(isLocalhostHostname('127.0.0.1')).toBe(true)
    expect(isLocalhostHostname('::1')).toBe(true)
    expect(isLocalhostHostname('app.localhost')).toBe(true)
    expect(isLocalhostHostname('example.com')).toBe(false)
  })
})
