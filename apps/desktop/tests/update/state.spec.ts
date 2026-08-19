import { describe, expect, it } from 'vitest'
import {
  canInstallUpdate,
  createInitialUpdateState,
  reduceUpdateState,
} from '../../src/update/state.js'
import { shouldCheckForUpdatesOnStart } from '../../src/update/policy.js'

describe('reduceUpdateState', () => {
  it('starts idle for the current app version', () => {
    const state = createInitialUpdateState('0.1.0-rc.7')
    expect(state.phase).toBe('idle')
    expect(state.currentVersion).toBe('0.1.0-rc.7')
    expect(state.installConsented).toBe(false)
    expect(canInstallUpdate(state)).toBe(false)
  })

  it('walks check → available → download → downloaded without install consent', () => {
    let state = createInitialUpdateState('0.1.0-rc.7')
    state = reduceUpdateState(state, { type: 'check-started' })
    expect(state.phase).toBe('checking')

    state = reduceUpdateState(state, { type: 'update-available', version: '0.1.0-rc.8' })
    expect(state.phase).toBe('update-available')
    expect(state.availableVersion).toBe('0.1.0-rc.8')

    state = reduceUpdateState(state, { type: 'download-started' })
    state = reduceUpdateState(state, { type: 'download-progress', percent: 40 })
    expect(state.phase).toBe('downloading')
    expect(state.downloadPercent).toBe(40)

    state = reduceUpdateState(state, { type: 'downloaded', version: '0.1.0-rc.8' })
    expect(state.phase).toBe('downloaded')
    expect(state.installConsented).toBe(false)
    expect(canInstallUpdate(state)).toBe(false)
  })

  it('allows install only after explicit consent on a downloaded update', () => {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'downloaded', version: '1.0.1' })
    state = reduceUpdateState(state, { type: 'consent-install' })
    expect(state.installConsented).toBe(true)
    expect(canInstallUpdate(state)).toBe(true)
  })

  it('ignores install consent before a download finishes', () => {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'update-available', version: '1.0.1' })
    state = reduceUpdateState(state, { type: 'consent-install' })
    expect(state.installConsented).toBe(false)
    expect(canInstallUpdate(state)).toBe(false)
  })

  it('records errors and clears download progress', () => {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'download-started' })
    state = reduceUpdateState(state, { type: 'error', message: 'network down' })
    expect(state.phase).toBe('error')
    expect(state.errorMessage).toBe('network down')
    expect(state.downloadPercent).toBeNull()
    expect(state.installConsented).toBe(false)
  })

  it('marks update-not-available after a clean check', () => {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'check-started' })
    state = reduceUpdateState(state, { type: 'update-not-available', version: '1.0.0' })
    expect(state.phase).toBe('update-not-available')
    expect(state.availableVersion).toBe('1.0.0')
  })
})

describe('shouldCheckForUpdatesOnStart', () => {
  it('checks by default only when packaged', () => {
    expect(shouldCheckForUpdatesOnStart(true, {})).toBe(true)
    expect(shouldCheckForUpdatesOnStart(false, {})).toBe(false)
  })

  it('honors DSH_DESKTOP_UPDATE_CHECK overrides', () => {
    expect(shouldCheckForUpdatesOnStart(false, { DSH_DESKTOP_UPDATE_CHECK: '1' })).toBe(true)
    expect(shouldCheckForUpdatesOnStart(true, { DSH_DESKTOP_UPDATE_CHECK: '0' })).toBe(false)
    expect(shouldCheckForUpdatesOnStart(false, { DSH_DESKTOP_UPDATE_CHECK: 'true' })).toBe(true)
    expect(shouldCheckForUpdatesOnStart(true, { DSH_DESKTOP_UPDATE_CHECK: 'off' })).toBe(false)
  })
})
