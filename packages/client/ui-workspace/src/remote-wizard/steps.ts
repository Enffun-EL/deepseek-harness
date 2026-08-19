/**
 * Pure step model for the remote workspace wizard. The presentational shell
 * and future Host-backed drivers share these transitions; nothing here talks
 * to SSH, WSL, or Docker.
 */

/** Closed set of remote workspace entry kinds the wizard offers. */
export type RemoteWorkspaceKind = 'ssh' | 'wsl' | 'docker'

/** Wizard step index, 1-based to match the step indicator copy. */
export type RemoteWizardStep = 1 | 2 | 3 | 4

/** Total steps shown in the indicator (kind → connect → path → review). */
export const REMOTE_WIZARD_STEP_COUNT = 4 as const

/** Ordered step list used by the indicator and navigation clamps. */
export const REMOTE_WIZARD_STEPS = [1, 2, 3, 4] as const satisfies readonly RemoteWizardStep[]

/** Draft values the wizard collects across steps (callbacks own persistence). */
export interface RemoteWizardDraft {
  /** Selected remote kind; absent until the operator picks a card on step 1. */
  readonly kind: RemoteWorkspaceKind | null
  /** Free-text connection target (host, distro name, or container id). */
  readonly connection: string
  /** Project root path on the remote side. */
  readonly path: string
}

/** Empty draft for a freshly opened wizard. */
export const EMPTY_REMOTE_WIZARD_DRAFT: RemoteWizardDraft = {
  kind: null,
  connection: '',
  path: '',
}

/**
 * Whether the draft is complete enough to leave the given step forward.
 * Step 4 is the review surface: advancing is not meaningful; finish is separate.
 * @param step - current step.
 * @param draft - values collected so far.
 * @returns true when Next may leave this step.
 */
export function canAdvanceRemoteWizardStep(step: RemoteWizardStep, draft: RemoteWizardDraft): boolean {
  switch (step) {
    case 1:
      return draft.kind !== null
    case 2:
      return draft.connection.trim() !== ''
    case 3:
      return draft.path.trim() !== ''
    case 4:
      return false
  }
}

/**
 * Whether the review step may finish (all prior fields present).
 * @param draft - values collected so far.
 * @returns true when Finish is enabled.
 */
export function canFinishRemoteWizard(draft: RemoteWizardDraft): boolean {
  return draft.kind !== null
    && draft.connection.trim() !== ''
    && draft.path.trim() !== ''
}

/**
 * Advance one step, clamped at the last step.
 * @param step - current step.
 * @returns the next step, or the same step when already last.
 */
export function nextRemoteWizardStep(step: RemoteWizardStep): RemoteWizardStep {
  if (step >= REMOTE_WIZARD_STEP_COUNT) return step
  return (step + 1) as RemoteWizardStep
}

/**
 * Move one step back, clamped at the first step.
 * @param step - current step.
 * @returns the previous step, or the same step when already first.
 */
export function previousRemoteWizardStep(step: RemoteWizardStep): RemoteWizardStep {
  if (step <= 1) return step
  return (step - 1) as RemoteWizardStep
}

/**
 * Whether the step is the first in the flow.
 * @param step - current step.
 */
export function isFirstRemoteWizardStep(step: RemoteWizardStep): boolean {
  return step === 1
}

/**
 * Whether the step is the review/finish surface.
 * @param step - current step.
 */
export function isLastRemoteWizardStep(step: RemoteWizardStep): boolean {
  return step === REMOTE_WIZARD_STEP_COUNT
}

/**
 * Dictionary key suffix for a step title (`remoteWizard.step.<n>.title`).
 * @param step - current step.
 * @returns the step number as used in locale keys.
 */
export function remoteWizardStepKey(step: RemoteWizardStep): RemoteWizardStep {
  return step
}
