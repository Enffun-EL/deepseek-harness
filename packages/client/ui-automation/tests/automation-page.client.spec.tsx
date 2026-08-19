// @vitest-environment jsdom
/**
 * Automation page pure atoms: empty state, create CTAs, local keep-awake
 * toggle, and static idle template cards. No Host / cordis wiring.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { AutomationEmptyState } from '../src/AutomationEmptyState.tsx'
import { AutomationPage } from '../src/AutomationPage.tsx'
import { IdleTemplateGrid } from '../src/IdleTemplateGrid.tsx'
import { KeepAwakeToggle } from '../src/KeepAwakeToggle.tsx'
import { automationString, en, zh } from '../src/locales.ts'
import { automationClassNames } from '../src/presentation.ts'
import {
  IDLE_TEMPLATE_DEFINITIONS,
  resolveIdleTemplates,
} from '../src/templates.ts'

afterEach(cleanup)

const templates = resolveIdleTemplates((key) => en[key])

function pageProps(overrides: Partial<Parameters<typeof AutomationPage>[0]> = {}) {
  return {
    title: en['page.title'],
    subtitle: en['page.subtitle'],
    empty: {
      title: en['empty.title'],
      body: en['empty.body'],
    },
    createScheduled: {
      label: en['cta.scheduled'],
      onClick: vi.fn(),
    },
    createIdle: {
      label: en['cta.idle'],
      onClick: vi.fn(),
    },
    keepAwake: {
      label: en['keepAwake.label'],
      ariaLabel: en['keepAwake.aria'],
      hint: en['keepAwake.hint'],
    },
    templates: {
      title: en['section.templates'],
      items: templates,
      emptyLabel: en['templates.empty'],
      onSelect: vi.fn(),
    },
    ...overrides,
  }
}

describe('AutomationPage', () => {
  it('renders the empty state, create CTAs, keep-awake, and idle templates', () => {
    const props = pageProps()
    const view = render(<AutomationPage {...props} />)

    expect(view.getByRole('heading', { name: 'Automation' })).toBeTruthy()
    expect(view.getByText(en['empty.title'])).toBeTruthy()
    expect(view.getByText(en['empty.body'])).toBeTruthy()
    expect(view.getByRole('button', { name: en['cta.scheduled'] })).toBeTruthy()
    expect(view.getByRole('button', { name: en['cta.idle'] })).toBeTruthy()
    expect(view.getByRole('switch', { name: en['keepAwake.aria'] }).getAttribute('aria-checked')).toBe('false')
    expect(view.getByText(en['template.gitWeekly.title'])).toBeTruthy()
    expect(view.getByText(en['template.ciFlaky.title'])).toBeTruthy()
    expect(view.getByText(en['template.docsSync.title'])).toBeTruthy()
  })

  it('invokes create scheduled and idle CTAs', () => {
    const props = pageProps()
    const view = render(<AutomationPage {...props} />)

    fireEvent.click(view.getByRole('button', { name: en['cta.scheduled'] }))
    fireEvent.click(view.getByRole('button', { name: en['cta.idle'] }))
    expect(props.createScheduled.onClick).toHaveBeenCalledTimes(1)
    expect(props.createIdle.onClick).toHaveBeenCalledTimes(1)
  })

  it('toggles keep-awake in local React state when unchecked is uncontrolled', () => {
    const view = render(<AutomationPage {...pageProps()} />)
    const toggle = view.getByRole('switch', { name: en['keepAwake.aria'] })

    expect(toggle.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('respects a controlled keep-awake value and onChange', () => {
    const onChange = vi.fn()
    const view = render(
      <AutomationPage
        {...pageProps({
          keepAwake: {
            label: en['keepAwake.label'],
            ariaLabel: en['keepAwake.aria'],
            checked: true,
            onChange,
          },
        })}
      />,
    )
    const toggle = view.getByRole('switch', { name: en['keepAwake.aria'] })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('hides the empty state once hasAutomations is true', () => {
    const view = render(<AutomationPage {...pageProps({ hasAutomations: true })} />)
    expect(view.queryByText(en['empty.title'])).toBeNull()
  })

  it('forwards idle template selection by id', () => {
    const onSelect = vi.fn()
    const view = render(
      <AutomationPage
        {...pageProps({
          templates: {
            title: en['section.templates'],
            items: templates,
            onSelect,
          },
        })}
      />,
    )
    fireEvent.click(view.getByRole('button', { name: (n) => n.startsWith(en['template.gitWeekly.title']) }))
    expect(onSelect).toHaveBeenCalledWith('git-weekly-summary')
  })

  it('disables CTAs and templates when handlers are omitted', () => {
    const view = render(
      <AutomationPage
        {...pageProps({
          createScheduled: { label: en['cta.scheduled'] },
          createIdle: { label: en['cta.idle'] },
          templates: {
            title: en['section.templates'],
            items: templates,
          },
        })}
      />,
    )
    expect((view.getByRole('button', { name: en['cta.scheduled'] }) as HTMLButtonElement).disabled).toBe(true)
    expect((view.getByRole('button', { name: en['cta.idle'] }) as HTMLButtonElement).disabled).toBe(true)
    expect((view.getByRole('button', { name: (n) => n.startsWith(en['template.docsSync.title']) }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('AutomationEmptyState', () => {
  it('renders title and optional body', () => {
    const withBody = render(<AutomationEmptyState title="None" body="Start one" />)
    expect(withBody.getByText('None')).toBeTruthy()
    expect(withBody.getByText('Start one')).toBeTruthy()
    cleanup()

    const titleOnly = render(<AutomationEmptyState title="None" />)
    expect(titleOnly.getByText('None')).toBeTruthy()
    expect(titleOnly.container.querySelectorAll('p')).toHaveLength(1)
  })
})

describe('KeepAwakeToggle', () => {
  it('calls onChange with the inverted value and disables without a handler', () => {
    const onChange = vi.fn()
    const view = render(
      <KeepAwakeToggle checked={false} onChange={onChange} label="Keep awake" ariaLabel="Keep awake" />,
    )
    fireEvent.click(view.getByRole('switch', { name: 'Keep awake' }))
    expect(onChange).toHaveBeenCalledWith(true)
    cleanup()

    const disabled = render(<KeepAwakeToggle checked={true} label="Keep awake" />)
    expect((disabled.getByRole('switch') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('IdleTemplateGrid', () => {
  it('renders cards, empty hint, and selection', () => {
    const onSelect = vi.fn()
    const view = render(
      <IdleTemplateGrid
        title="Templates"
        items={templates}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(view.getByRole('button', { name: (n) => n.startsWith(en['template.ciFlaky.title']) }))
    expect(onSelect).toHaveBeenCalledWith('ci-flaky-report')
    cleanup()

    const empty = render(
      <IdleTemplateGrid title="Templates" items={[]} emptyLabel="No templates yet" />,
    )
    expect(empty.getByText('No templates yet')).toBeTruthy()
  })
})

describe('static catalogs and helpers', () => {
  it('ships the three product idle templates in order', () => {
    expect(IDLE_TEMPLATE_DEFINITIONS.map((item) => item.id)).toEqual([
      'git-weekly-summary',
      'ci-flaky-report',
      'docs-sync',
    ])
    const zhCards = resolveIdleTemplates((key) => zh[key])
    expect(zhCards.map((card) => card.title)).toEqual([
      zh['template.gitWeekly.title'],
      zh['template.ciFlaky.title'],
      zh['template.docsSync.title'],
    ])
  })

  it('resolves locale strings with zh preference and en fallback', () => {
    expect(automationString('zh', 'page.title')).toBe(zh['page.title'])
    expect(automationString('zh-CN', 'page.title')).toBe(zh['page.title'])
    expect(automationString('en', 'page.title')).toBe(en['page.title'])
    expect(automationString('fr', 'page.title')).toBe(en['page.title'])
  })

  it('joins class names and drops falsey parts', () => {
    expect(automationClassNames('a', false, undefined, '', 'b')).toBe('a b')
    expect(automationClassNames(null, undefined)).toBe('')
  })
})