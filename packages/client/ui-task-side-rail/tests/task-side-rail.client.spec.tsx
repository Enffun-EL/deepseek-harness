// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitToolsCard } from '../src/GitToolsCard.tsx'
import { GoalCard } from '../src/GoalCard.tsx'
import { ProgressChecklist } from '../src/ProgressChecklist.tsx'
import { TaskSideRail } from '../src/TaskSideRail.tsx'

afterEach(cleanup)

const gitLabels = {
  title: 'Git',
  commit: '提交',
  commitDisabled: '无更改可提交',
}

const goalLabels = {
  title: '目标',
  phaseActive: '进行中的目标',
  phasePaused: '已暂停的目标',
  phaseBlocked: '受阻的目标',
}

const progressLabels = {
  title: '进度',
  percent: (n: number) => `${n}%`,
}

describe('GitToolsCard', () => {
  it('shows branch and change counts and fires commit when enabled', () => {
    const onCommit = vi.fn()
    render(
      <GitToolsCard
        branchName="feature/desktop-integration"
        changes={{ staged: 2, unstaged: 1, untracked: 0 }}
        labels={gitLabels}
        onCommit={onCommit}
      />,
    )
    expect(screen.getByText('feature/desktop-integration')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('disables commit with no changes or without a callback', () => {
    const { rerender } = render(
      <GitToolsCard
        branchName="main"
        changes={{ staged: 0, unstaged: 0, untracked: 0 }}
        labels={gitLabels}
        onCommit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '无更改可提交' })).toHaveProperty('disabled', true)

    rerender(
      <GitToolsCard
        branchName=""
        changes={{ staged: 1, unstaged: 0, untracked: 0 }}
        labels={gitLabels}
      />,
    )
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByRole('button', { name: '无更改可提交' })).toHaveProperty('disabled', true)
  })
})

describe('GoalCard', () => {
  it('renders nothing while loading, absent, or complete', () => {
    const loading = render(<GoalCard goal={undefined} labels={goalLabels} />)
    expect(loading.container.firstChild).toBeNull()
    cleanup()

    const absent = render(<GoalCard goal={null} labels={goalLabels} />)
    expect(absent.container.firstChild).toBeNull()
    cleanup()

    const complete = render(
      <GoalCard goal={{ objective: 'done', phase: 'complete' }} labels={goalLabels} />,
    )
    expect(complete.container.firstChild).toBeNull()
  })

  it('shows phase label and objective for an active goal', () => {
    render(
      <GoalCard
        goal={{ objective: 'Ship the redesign', phase: 'active' }}
        labels={goalLabels}
      />,
    )
    expect(screen.getByText('进行中的目标')).toBeTruthy()
    expect(screen.getByText('Ship the redesign')).toBeTruthy()
  })

  it('surfaces the blocked reason as the title attribute', () => {
    render(
      <GoalCard
        goal={{
          objective: 'Unblock CI',
          phase: 'blocked',
          blockedReason: { message: 'waiting on review' },
        }}
        labels={goalLabels}
      />,
    )
    expect(screen.getByTestId('goal-card').getAttribute('title')).toBe('waiting on review')
    expect(screen.getByText('受阻的目标')).toBeTruthy()
  })
})

describe('ProgressChecklist', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<ProgressChecklist items={[]} labels={progressLabels} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows percent text, progressbar value, and status rows', () => {
    render(
      <ProgressChecklist
        items={[
          { content: 'done', status: 'completed' },
          { content: 'active', status: 'in_progress' },
          { content: 'later', status: 'pending' },
        ]}
        labels={progressLabels}
      />,
    )
    expect(screen.getByTestId('progress-percent').textContent).toBe('33%')
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('33')
    expect(screen.getByText('done').closest('li')?.getAttribute('data-status')).toBe('completed')
    expect(screen.getByText('active').closest('li')?.getAttribute('data-status')).toBe('in_progress')
    expect(screen.getByText('later').closest('li')?.getAttribute('data-status')).toBe('pending')
  })
})

describe('TaskSideRail', () => {
  it('composes optional cards in Git → Goal → Progress order', () => {
    render(
      <TaskSideRail
        labels={{ region: '任务侧栏' }}
        git={{
          branchName: 'main',
          changes: { staged: 0, unstaged: 1, untracked: 0 },
          labels: gitLabels,
        }}
        goal={{
          goal: { objective: 'Ship', phase: 'paused' },
          labels: goalLabels,
        }}
        progress={{
          items: [{ content: 'one', status: 'completed' }],
          labels: progressLabels,
        }}
      />,
    )
    const rail = screen.getByTestId('task-side-rail')
    const cards = [...rail.querySelectorAll('[data-testid]')]
      .map(node => node.getAttribute('data-testid'))
      .filter(id => id !== 'task-side-rail' && id !== 'progress-percent')
    expect(cards).toEqual(['git-tools-card', 'goal-card', 'progress-checklist'])
    expect(screen.getByText('已暂停的目标')).toBeTruthy()
    expect(screen.getByTestId('progress-percent').textContent).toBe('100%')
  })

  it('omits seats the owner did not pass', () => {
    render(<TaskSideRail labels={{ region: '任务侧栏' }} />)
    expect(screen.queryByTestId('git-tools-card')).toBeNull()
    expect(screen.queryByTestId('goal-card')).toBeNull()
    expect(screen.queryByTestId('progress-checklist')).toBeNull()
  })
})
