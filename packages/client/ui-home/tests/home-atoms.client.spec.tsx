// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HomeComposerChrome } from '../src/HomeComposerChrome.tsx'
import { HomeEmptyState } from '../src/HomeEmptyState.tsx'
import { HomeGreeting } from '../src/HomeGreeting.tsx'
import { ModelStatusBanner } from '../src/ModelStatusBanner.tsx'
import { ProjectPickerButton } from '../src/ProjectPickerButton.tsx'
import { StarterPromptList } from '../src/StarterPromptList.tsx'
import { TemplateCardGrid } from '../src/TemplateCardGrid.tsx'
import { en } from '../src/locales.ts'

afterEach(cleanup)

describe('HomeGreeting', () => {
  it('renders title and optional subtitle', () => {
    const { rerender } = render(<HomeGreeting title={en['greeting.hello']} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hello')
    expect(screen.queryByText(en['greeting.subtitle'])).toBeNull()
    rerender(<HomeGreeting title={en['greeting.hello']} subtitle={en['greeting.subtitle']} />)
    expect(screen.getByText(en['greeting.subtitle'])).toBeTruthy()
  })
})

describe('ModelStatusBanner', () => {
  it('renders nothing when a model is configured', () => {
    const { container } = render(
      <ModelStatusBanner
        hasModel
        title={en['model.missing.title']}
        body={en['model.missing.body']}
        ctaLabel={en['model.missing.cta']}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('fires the configure callback when the model is missing', () => {
    const onConfigure = vi.fn()
    render(
      <ModelStatusBanner
        hasModel={false}
        title={en['model.missing.title']}
        body={en['model.missing.body']}
        ctaLabel={en['model.missing.cta']}
        onConfigure={onConfigure}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: en['model.missing.cta'] }))
    expect(onConfigure).toHaveBeenCalledTimes(1)
  })
})

describe('ProjectPickerButton', () => {
  it('invokes onClick and disables without a handler', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <ProjectPickerButton label={en['project.picker']} onClick={onClick} />,
    )
    fireEvent.click(screen.getByRole('button', { name: en['project.picker'] }))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<ProjectPickerButton label={en['project.picker']} />)
    expect(screen.getByRole('button', { name: en['project.picker'] })).toHaveProperty('disabled', true)
  })
})

describe('HomeComposerChrome', () => {
  it('forwards permission, model, and submit callbacks', () => {
    const onPermissionModeChange = vi.fn()
    const onModelChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <HomeComposerChrome
        permissionMode="read-only"
        permissionAriaLabel={en['composer.permission.aria']}
        onPermissionModeChange={onPermissionModeChange}
        models={[{ id: 'deepseek-chat', label: 'DeepSeek Chat' }]}
        modelId="deepseek-chat"
        modelAriaLabel={en['composer.model.aria']}
        onModelChange={onModelChange}
        submitLabel={en['composer.submit']}
        onSubmit={onSubmit}
        placeholder={en['composer.placeholder']}
      />,
    )
    fireEvent.change(screen.getByLabelText(en['composer.permission.aria']), {
      target: { value: 'workspace-write' },
    })
    expect(onPermissionModeChange).toHaveBeenCalledWith('workspace-write')
    fireEvent.change(screen.getByLabelText(en['composer.model.aria']), {
      target: { value: 'deepseek-chat' },
    })
    expect(onModelChange).toHaveBeenCalledWith('deepseek-chat')
    fireEvent.click(screen.getByRole('button', { name: en['composer.submit'] }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByText(en['composer.placeholder'])).toBeTruthy()
  })
})

describe('StarterPromptList', () => {
  it('hides an empty list and selects a prompt by id', () => {
    const onSelect = vi.fn()
    const { container, rerender } = render(
      <StarterPromptList title={en['starters.title']} items={[]} onSelect={onSelect} />,
    )
    expect(container.firstChild).toBeNull()
    rerender(
      <StarterPromptList
        title={en['starters.title']}
        items={[{ id: 's1', label: 'Explain this repo' }]}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Explain this repo' }))
    expect(onSelect).toHaveBeenCalledWith('s1')
  })
})

describe('TemplateCardGrid', () => {
  it('shows the empty hint and selects a template card', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <TemplateCardGrid
        title={en['templates.title']}
        items={[]}
        emptyLabel={en['templates.empty']}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText(en['templates.empty'])).toBeTruthy()
    rerender(
      <TemplateCardGrid
        title={en['templates.title']}
        items={[{ id: 't1', title: 'CLI app', description: 'Scaffold a CLI' }]}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /CLI app/ }))
    expect(onSelect).toHaveBeenCalledWith('t1')
  })
})

describe('HomeEmptyState', () => {
  it('composes the MVP atoms', () => {
    render(
      <HomeEmptyState
        greetingTitle={en['greeting.hello']}
        greetingSubtitle={en['greeting.subtitle']}
        modelBanner={{
          hasModel: false,
          title: en['model.missing.title'],
          body: en['model.missing.body'],
          ctaLabel: en['model.missing.cta'],
        }}
        project={{ label: en['project.picker'] }}
        composer={{
          permissionMode: 'workspace-write',
          permissionAriaLabel: en['composer.permission.aria'],
          models: [],
          modelId: '',
          modelAriaLabel: en['composer.model.aria'],
          submitLabel: en['composer.submit'],
        }}
        starters={{ title: en['starters.title'], items: [] }}
        templates={{
          title: en['templates.title'],
          items: [],
          emptyLabel: en['templates.empty'],
        }}
      />,
    )
    expect(document.querySelector('[data-home="empty-state"]')).toBeTruthy()
    expect(screen.getByText(en['model.missing.title'])).toBeTruthy()
    expect(screen.getByText(en['templates.empty'])).toBeTruthy()
  })
})
