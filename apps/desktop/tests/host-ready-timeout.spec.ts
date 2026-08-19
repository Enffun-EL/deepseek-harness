import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOST_READY_TIMEOUT_MS,
  HOST_READY_TIMEOUT_ENV,
  resolveHostReadyTimeoutMs,
} from '../src/host-ready-timeout.js'

describe('resolveHostReadyTimeoutMs', () => {
  it('returns the default when unset', () => {
    expect(resolveHostReadyTimeoutMs({})).toBe(DEFAULT_HOST_READY_TIMEOUT_MS)
  })

  it('parses a positive integer from DSH_DESKTOP_HOST_READY_MS', () => {
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: '45000' })).toBe(45_000)
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: '100.9' })).toBe(100)
  })

  it('falls back on invalid values', () => {
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: '0' })).toBe(
      DEFAULT_HOST_READY_TIMEOUT_MS,
    )
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: '-5' })).toBe(
      DEFAULT_HOST_READY_TIMEOUT_MS,
    )
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: 'nope' })).toBe(
      DEFAULT_HOST_READY_TIMEOUT_MS,
    )
    expect(resolveHostReadyTimeoutMs({ [HOST_READY_TIMEOUT_ENV]: '   ' })).toBe(
      DEFAULT_HOST_READY_TIMEOUT_MS,
    )
  })

  it('honors an explicit fallback when env is absent', () => {
    expect(resolveHostReadyTimeoutMs({}, 8_000)).toBe(8_000)
  })
})
