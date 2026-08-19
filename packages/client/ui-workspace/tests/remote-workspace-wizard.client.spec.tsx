// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY,
  RemoteWorkspaceWizard,
} from '../src/remote-wizard/RemoteWorkspaceWizard.tsx'

afterEach(cleanup)

describe('RemoteWorkspaceWizard presentation', () => {
  it('renders SSH, WSL, and Docker cards with a four-step indicator', () => {
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />,
    )
    expect(screen.getByRole('option', { name: /SSH/ })).toBeTruthy()
    expect(screen.getByRole('option', { name: /WSL/ })).toBeTruthy()
    expect(screen.getByRole('option', { name: /Docker/ })).toBeTruthy()
    expect(screen.getByText('选择类型')).toBeTruthy()
    expect(screen.getByText('连接信息')).toBeTruthy()
    expect(screen.getByText('项目路径')).toBeTruthy()
    expect(screen.getByText('确认')).toBeTruthy()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '下一步' }).disabled).toBe(true)
  })

  it('walks steps through callbacks without owning transport', () => {
    const onFinish = vi.fn()
    const onStepChange = vi.fn()
    const onCancel = vi.fn()
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        onCancel={onCancel}
        onFinish={onFinish}
        onStepChange={onStepChange}
      />,
    )

    fireEvent.click(screen.getByRole('option', { name: /SSH/ }))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(onStepChange).toHaveBeenLastCalledWith(2)

    fireEvent.change(screen.getByLabelText('主机（user@host）'), {
      target: { value: 'dev@host' },
    })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(onStepChange).toHaveBeenLastCalledWith(3)

    fireEvent.change(screen.getByLabelText('项目路径'), {
      target: { value: '/srv/app' },
    })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(onStepChange).toHaveBeenLastCalledWith(4)

    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(onFinish).toHaveBeenCalledWith({
      kind: 'ssh',
      connection: 'dev@host',
      path: '/srv/app',
    })

    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('lets Back reverse one step', () => {
    const onStepChange = vi.fn()
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        initialDraft={{ kind: 'wsl', connection: 'Ubuntu', path: '' }}
        initialStep={2}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
        onStepChange={onStepChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    expect(onStepChange).toHaveBeenCalledWith(1)
    expect(screen.getByRole('option', { name: /WSL/ }).getAttribute('aria-selected')).toBe('true')
  })

  it('uses Docker connection copy and reports draft changes', () => {
    const onDraftChange = vi.fn()
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        initialDraft={{ kind: 'docker', connection: '', path: '' }}
        initialStep={2}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
        onDraftChange={onDraftChange}
      />,
    )
    expect(screen.getByLabelText('容器名称或 ID')).toBeTruthy()
    expect(screen.getByPlaceholderText('devcontainer')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('容器名称或 ID'), {
      target: { value: 'box-1' },
    })
    expect(onDraftChange).toHaveBeenCalledWith({
      kind: 'docker',
      connection: 'box-1',
      path: '',
    })
  })

  it('shows a step-2 recovery hint when kind is still empty', () => {
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        initialStep={2}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />,
    )
    // Header subtitle plus the body recovery line both use step-1 title text
    // when kind is missing; assert the body path via the duplicate count.
    expect(screen.getAllByText('选择类型').length).toBeGreaterThanOrEqual(2)
  })

  it('renders review placeholders for blank connection and path', () => {
    render(
      <RemoteWorkspaceWizard
        copy={DEFAULT_REMOTE_WORKSPACE_WIZARD_COPY}
        initialDraft={{ kind: null, connection: '  ', path: '' }}
        initialStep={4}
        onCancel={vi.fn()}
        onFinish={vi.fn()}
      />,
    )
    const values = screen.getAllByRole('definition').map(node => node.textContent)
    expect(values).toEqual(['—', '—', '—'])
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '完成' }).disabled).toBe(true)
  })
})
