import { describe, expect, it } from 'vitest'
import {
  canAdvanceRemoteWizardStep,
  canFinishRemoteWizard,
  EMPTY_REMOTE_WIZARD_DRAFT,
  isFirstRemoteWizardStep,
  isLastRemoteWizardStep,
  nextRemoteWizardStep,
  previousRemoteWizardStep,
  REMOTE_WIZARD_STEP_COUNT,
  REMOTE_WIZARD_STEPS,
  remoteWizardStepKey,
  type RemoteWizardDraft,
} from '../src/remote-wizard/steps.ts'
// Barrel smoke: package-internal re-exports stay reachable for the coverage gate.
import { REMOTE_WIZARD_STEP_COUNT as barrelStepCount } from '../src/remote-wizard/index.ts'

const draft = (patch: Partial<RemoteWizardDraft> = {}): RemoteWizardDraft => ({
  ...EMPTY_REMOTE_WIZARD_DRAFT,
  ...patch,
})

describe('remote wizard step navigation', () => {
  it('exposes four ordered steps', () => {
    expect(REMOTE_WIZARD_STEP_COUNT).toBe(4)
    expect(barrelStepCount).toBe(4)
    expect(REMOTE_WIZARD_STEPS).toEqual([1, 2, 3, 4])
  })

  it('advances and clamps at the ends', () => {
    expect(nextRemoteWizardStep(1)).toBe(2)
    expect(nextRemoteWizardStep(2)).toBe(3)
    expect(nextRemoteWizardStep(3)).toBe(4)
    expect(nextRemoteWizardStep(4)).toBe(4)
    expect(previousRemoteWizardStep(4)).toBe(3)
    expect(previousRemoteWizardStep(3)).toBe(2)
    expect(previousRemoteWizardStep(2)).toBe(1)
    expect(previousRemoteWizardStep(1)).toBe(1)
  })

  it('identifies first and last steps', () => {
    expect(isFirstRemoteWizardStep(1)).toBe(true)
    expect(isFirstRemoteWizardStep(2)).toBe(false)
    expect(isLastRemoteWizardStep(4)).toBe(true)
    expect(isLastRemoteWizardStep(3)).toBe(false)
  })

  it('gates forward progress on draft completeness per step', () => {
    expect(canAdvanceRemoteWizardStep(1, draft())).toBe(false)
    expect(canAdvanceRemoteWizardStep(1, draft({ kind: 'ssh' }))).toBe(true)

    expect(canAdvanceRemoteWizardStep(2, draft({ kind: 'wsl', connection: '' }))).toBe(false)
    expect(canAdvanceRemoteWizardStep(2, draft({ kind: 'wsl', connection: '   ' }))).toBe(false)
    expect(canAdvanceRemoteWizardStep(2, draft({ kind: 'wsl', connection: 'Ubuntu' }))).toBe(true)

    expect(canAdvanceRemoteWizardStep(3, draft({ kind: 'docker', connection: 'c1', path: '' }))).toBe(false)
    expect(canAdvanceRemoteWizardStep(3, draft({ kind: 'docker', connection: 'c1', path: '  ' }))).toBe(false)
    expect(canAdvanceRemoteWizardStep(3, draft({ kind: 'docker', connection: 'c1', path: '/work' }))).toBe(true)

    // Review never advances; finish is a separate gate.
    expect(canAdvanceRemoteWizardStep(4, draft({
      kind: 'ssh', connection: 'u@h', path: '/repo',
    }))).toBe(false)
  })

  it('allows finish only with kind, connection, and path', () => {
    expect(canFinishRemoteWizard(draft())).toBe(false)
    expect(canFinishRemoteWizard(draft({ kind: 'ssh' }))).toBe(false)
    expect(canFinishRemoteWizard(draft({ kind: 'ssh', connection: 'u@h' }))).toBe(false)
    expect(canFinishRemoteWizard(draft({ kind: 'ssh', connection: 'u@h', path: '  ' }))).toBe(false)
    expect(canFinishRemoteWizard(draft({ kind: 'ssh', connection: 'u@h', path: '/repo' }))).toBe(true)
  })

  it('returns the step key identity for locale suffixes', () => {
    expect(remoteWizardStepKey(1)).toBe(1)
    expect(remoteWizardStepKey(4)).toBe(4)
  })
})
