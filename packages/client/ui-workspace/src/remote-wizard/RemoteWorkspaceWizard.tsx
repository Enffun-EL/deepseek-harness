/**
 * Presentational remote workspace wizard: SSH | WSL | Docker kind cards and a
 * 1..4 step indicator. All Host / transport work stays with the owner through
 * callbacks — this shell never opens SSH, talks to WSL, or inspects Docker.
 */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  canAdvanceRemoteWizardStep,
  canFinishRemoteWizard,
  EMPTY_REMOTE_WIZARD_DRAFT,
  isFirstRemoteWizardStep,
  isLastRemoteWizardStep,
  nextRemoteWizardStep,
  previousRemoteWizardStep,
  REMOTE_WIZARD_STEPS,
  type RemoteWizardDraft,
  type RemoteWizardStep,
  type RemoteWorkspaceKind,
} from './steps.ts'
import css from './RemoteWorkspaceWizard.module.css'

/** Localized copy the wizard needs; owners may pass dictionary lookups or stubs. */
export interface RemoteWorkspaceWizardCopy {
  title: string
  subtitle: string
  cancel: string
  back: string
  next: string
  finish: string
  stepTitles: readonly [string, string, string, string]
  kinds: {
    ssh: { title: string; description: string }
    wsl: { title: string; description: string }
    docker: { title: string; description: string }
  }
  connectionLabel: (kind: RemoteWorkspaceKind) => string
  connectionPlaceholder: (kind: RemoteWorkspaceKind) => string
  pathLabel: string
  pathPlaceholder: string
  reviewKind: string
  reviewConnection: string
  reviewPath: string
}

/** Owner-driven wizard props: draft callbacks only, no transport. */
export interface RemoteWorkspaceWizardProps {
  /** Initial draft (defaults to empty). */
  initialDraft?: RemoteWizardDraft
  /** Starting step (defaults to 1). */
  initialStep?: RemoteWizardStep
  /** Localized strings. */
  copy: RemoteWorkspaceWizardCopy
  /** Disable footer actions while an owner finish is in flight. */
  busy?: boolean
  /** Close without finishing. */
  onCancel: () => void
  /** Finish with the collected draft (owner materializes the workspace). */
  onFinish: (draft: RemoteWizardDraft) => void
  /** Optional observation hook when the step changes. */
  onStepChange?: (step: RemoteWizardStep) => void
  /** Optional observation hook when the draft changes. */
  onDraftChange?: (draft: RemoteWizardDraft) => void
}

const KIND_ORDER: readonly RemoteWorkspaceKind[] = ['ssh', 'wsl', 'docker']

/**
 * Chinese product defaults for standalone mounts and tests (wired locales come later).
 */
export const DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY: RemoteWorkspaceWizardCopy = {
  title: '添加远程工作区',
  subtitle: '通过 SSH、WSL 或 Docker 连接项目目录。当前为界面脚手架，不会发起真实连接。',
  cancel: '取消',
  back: '上一步',
  next: '下一步',
  finish: '完成',
  stepTitles: ['选择类型', '连接信息', '项目路径', '确认'],
  kinds: {
    ssh: { title: 'SSH', description: '远程主机上的项目根目录' },
    wsl: { title: 'WSL', description: 'Windows 子系统发行版中的路径' },
    docker: { title: 'Docker', description: '容器或开发容器中的工作区' },
  },
  connectionLabel: (kind) => {
    switch (kind) {
      case 'ssh': return '主机（user@host）'
      case 'wsl': return '发行版名称'
      case 'docker': return '容器名称或 ID'
    }
  },
  connectionPlaceholder: (kind) => {
    switch (kind) {
      case 'ssh': return 'user@example.com'
      case 'wsl': return 'Ubuntu'
      case 'docker': return 'devcontainer'
    }
  },
  pathLabel: '项目路径',
  pathPlaceholder: '/home/me/project',
  reviewKind: '类型',
  reviewConnection: '连接',
  reviewPath: '路径',
}

/**
 * Render the remote workspace wizard shell.
 * @param props - owner callbacks and copy.
 * @returns the wizard element.
 */
export function RemoteWorkspaceWizard({
  initialDraft = EMPTY_REMOTE_WIZARD_DRAFT,
  initialStep = 1,
  copy,
  busy = false,
  onCancel,
  onFinish,
  onStepChange,
  onDraftChange,
}: RemoteWorkspaceWizardProps) {
  const [step, setStep] = useState<RemoteWizardStep>(initialStep)
  const [draft, setDraft] = useState<RemoteWizardDraft>(initialDraft)

  const updateDraft = (patch: Partial<RemoteWizardDraft>): void => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      onDraftChange?.(next)
      return next
    })
  }

  const goTo = (next: RemoteWizardStep): void => {
    setStep(next)
    onStepChange?.(next)
  }

  const canNext = canAdvanceRemoteWizardStep(step, draft)
  const canFinish = canFinishRemoteWizard(draft)
  const kindLabel = useMemo(() => {
    if (draft.kind === null) return '—'
    return copy.kinds[draft.kind].title
  }, [copy.kinds, draft.kind])

  return (
    <div className={css.frame} data-remote-wizard="" data-step={step}>
      <header className={css.header}>
        <h2 className={css.title}>{copy.title}</h2>
        <p className={css.subtitle}>{copy.subtitle}</p>
      </header>

      <ol className={css.steps} aria-label={copy.title}>
        {REMOTE_WIZARD_STEPS.map((item, index) => {
          const current = item === step
          const done = item < step
          return (
            <li
              key={item}
              className={clsx(css.step, current && css.stepCurrent, done && css.stepDone)}
              aria-current={current ? 'step' : undefined}
            >
              <span className={css.stepIndex} aria-hidden="true">{item}</span>
              <span className={css.stepLabel}>{copy.stepTitles[item - 1]}</span>
              {index < REMOTE_WIZARD_STEPS.length - 1 && <span className={css.stepRail} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>

      <div className={css.body}>
        {step === 1 && (
          <div className={css.cards} role="listbox" aria-label={copy.stepTitles[0]}>
            {KIND_ORDER.map((kind) => {
              const selected = draft.kind === kind
              return (
                <button
                  key={kind}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={clsx(css.card, selected && css.cardSelected)}
                  disabled={busy}
                  onClick={() => { updateDraft({ kind }) }}
                >
                  <span className={css.cardTitle}>{copy.kinds[kind].title}</span>
                  <span className={css.cardDesc}>{copy.kinds[kind].description}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && draft.kind !== null && (
          <label className={css.field}>
            <span className={css.fieldLabel}>{copy.connectionLabel(draft.kind)}</span>
            <input
              className={css.input}
              value={draft.connection}
              placeholder={copy.connectionPlaceholder(draft.kind)}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => { updateDraft({ connection: event.target.value }) }}
            />
          </label>
        )}

        {step === 2 && draft.kind === null && (
          <p className={css.subtitle}>{copy.stepTitles[0]}</p>
        )}

        {step === 3 && (
          <label className={css.field}>
            <span className={css.fieldLabel}>{copy.pathLabel}</span>
            <input
              className={css.input}
              value={draft.path}
              placeholder={copy.pathPlaceholder}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => { updateDraft({ path: event.target.value }) }}
            />
          </label>
        )}

        {step === 4 && (
          <dl className={css.review}>
            <div className={css.reviewRow}>
              <dt className={css.reviewTerm}>{copy.reviewKind}</dt>
              <dd className={css.reviewValue}>{kindLabel}</dd>
            </div>
            <div className={css.reviewRow}>
              <dt className={css.reviewTerm}>{copy.reviewConnection}</dt>
              <dd className={css.reviewValue}>{draft.connection.trim() || '—'}</dd>
            </div>
            <div className={css.reviewRow}>
              <dt className={css.reviewTerm}>{copy.reviewPath}</dt>
              <dd className={css.reviewValue}>{draft.path.trim() || '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      <footer className={css.footer}>
        <Button variant="outline" className={css.footerStart} disabled={busy} onClick={onCancel}>
          {copy.cancel}
        </Button>
        {!isFirstRemoteWizardStep(step) && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => { goTo(previousRemoteWizardStep(step)) }}
          >
            {copy.back}
          </Button>
        )}
        {isLastRemoteWizardStep(step)
          ? (
            <Button
              variant="primary"
              disabled={busy || !canFinish}
              onClick={() => { onFinish(draft) }}
            >
              {copy.finish}
            </Button>
          )
          : (
            <Button
              variant="primary"
              disabled={busy || !canNext}
              onClick={() => { goTo(nextRemoteWizardStep(step)) }}
            >
              {copy.next}
            </Button>
          )}
      </footer>
    </div>
  )
}
