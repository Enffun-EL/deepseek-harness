import { describe, expect, it } from 'vitest'
import { compareVersions, isNewerVersion } from '../../src/update/version-compare.js'

describe('compareVersions', () => {
  it('orders core versions numerically', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0)
    expect(compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0)
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
  })

  it('treats a final release as newer than a prerelease with the same core', () => {
    expect(compareVersions('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0-rc.1', '1.0.0')).toBeLessThan(0)
  })

  it('orders prerelease identifiers', () => {
    expect(compareVersions('0.1.0-rc.7', '0.1.0-rc.8')).toBeLessThan(0)
    expect(compareVersions('0.1.0-beta.2', '0.1.0-beta.10')).toBeLessThan(0)
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0)
  })

  it('accepts a leading v and ignores build metadata', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
    expect(compareVersions('1.2.3+build.5', '1.2.3')).toBe(0)
  })

  it('rejects empty or malformed versions', () => {
    expect(() => compareVersions('', '1.0.0')).toThrow(/empty version/)
    expect(() => compareVersions('not-a-version', '1.0.0')).toThrow(/invalid version/)
  })
})

describe('isNewerVersion', () => {
  it('returns true only when the candidate is strictly newer', () => {
    expect(isNewerVersion('0.1.0-rc.7', '0.1.0-rc.8')).toBe(true)
    expect(isNewerVersion('0.1.0-rc.7', '0.1.0-rc.7')).toBe(false)
    expect(isNewerVersion('1.0.0', '1.0.0-rc.1')).toBe(false)
  })
})
