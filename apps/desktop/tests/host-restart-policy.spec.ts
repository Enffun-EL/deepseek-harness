import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOST_RESTART_POLICY,
  recordRestartAttempt,
  resetRestartStreak,
  restartBackoffMs,
  shouldRestartHost,
  type HostRestartPolicy,
} from '../src/host-restart-policy.js'

const tight: HostRestartPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 2_000,
  backoffFactor: 2,
}

describe('shouldRestartHost', () => {
  it('restarts only after ready, when not intentional, under the attempt cap', () => {
    expect(
      shouldRestartHost({
        hadReachedReady: true,
        stoppingIntentionally: false,
        failedRestarts: 0,
        maxAttempts: 3,
      }),
    ).toBe(true)

    expect(
      shouldRestartHost({
        hadReachedReady: false,
        stoppingIntentionally: false,
        failedRestarts: 0,
        maxAttempts: 3,
      }),
    ).toBe(false)

    expect(
      shouldRestartHost({
        hadReachedReady: true,
        stoppingIntentionally: true,
        failedRestarts: 0,
        maxAttempts: 3,
      }),
    ).toBe(false)

    expect(
      shouldRestartHost({
        hadReachedReady: true,
        stoppingIntentionally: false,
        failedRestarts: 3,
        maxAttempts: 3,
      }),
    ).toBe(false)
  })
})

describe('restartBackoffMs', () => {
  it('applies exponential backoff capped by maxDelayMs', () => {
    expect(restartBackoffMs(0, tight)).toBe(500)
    expect(restartBackoffMs(1, tight)).toBe(1_000)
    expect(restartBackoffMs(2, tight)).toBe(2_000)
    // 500 * 2^3 = 4000, capped at maxDelayMs.
    expect(restartBackoffMs(3, { ...tight, maxAttempts: 4 })).toBe(2_000)
  })

  it('returns null when the attempt budget is exhausted or input is invalid', () => {
    expect(restartBackoffMs(3, tight)).toBeNull()
    expect(restartBackoffMs(-1, tight)).toBeNull()
    expect(restartBackoffMs(Number.NaN, tight)).toBeNull()
  })

  it('uses the default policy when omitted', () => {
    expect(restartBackoffMs(0)).toBe(DEFAULT_HOST_RESTART_POLICY.initialDelayMs)
    expect(restartBackoffMs(DEFAULT_HOST_RESTART_POLICY.maxAttempts)).toBeNull()
  })
})

describe('restart streak helpers', () => {
  it('increments and resets the failure streak', () => {
    expect(recordRestartAttempt(0)).toBe(1)
    expect(recordRestartAttempt(4)).toBe(5)
    expect(recordRestartAttempt(-3)).toBe(1)
    expect(resetRestartStreak()).toBe(0)
  })
})
