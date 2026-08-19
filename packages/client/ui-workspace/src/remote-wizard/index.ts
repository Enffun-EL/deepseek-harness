/**
 * Remote workspace wizard presentation (package-internal scaffold). Same-package
 * tests import modules directly; the public `./client` surface stays limited to
 * Loader exports until a slot registration mounts this flow.
 */
export {
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
  type RemoteWizardStep,
  type RemoteWorkspaceKind,
} from './steps.ts'
export {
  DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY,
  RemoteWorkspaceWizard,
  type RemoteWorkspaceWizardCopy,
  type RemoteWorkspaceWizardProps,
} from './RemoteWorkspaceWizard.tsx'
