// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { en, type PluginMarketKey } from '../src/client/locales.ts'
import {
  PLUGIN_MARKET_FIXTURE_CATALOG,
  PluginMarketShell,
  type PluginMarketShellProps,
} from '../src/client/PluginMarketShell.tsx'

afterEach(cleanup)

const t = ((
  key: PluginMarketKey,
  params?: Record<string, unknown>,
): string => {
  const template = en[key]
  if (params === undefined) return template
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  )
}) as PluginMarketShellProps['t']

function renderShell(
  props: Partial<PluginMarketShellProps> = {},
): ReturnType<typeof render> {
  return render(<PluginMarketShell t={t} {...props} />)
}

describe('PluginMarketShell', () => {
  it('renders search, installed placeholders, category sections, and create CTA', () => {
    renderShell()

    expect(screen.getByRole('heading', { level: 1, name: en.title })).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: en.search })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en.installed })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '开发者工具' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '效率工具' })).toBeTruthy()
    expect(screen.getByRole('button', { name: en.createPlugin })).toBeTruthy()

    expect(screen.getAllByText('本地笔记')).toHaveLength(2)
    expect(screen.getByText('差异透镜')).toBeTruthy()
    expect(screen.getByText('站会卡片')).toBeTruthy()
    expect(PLUGIN_MARKET_FIXTURE_CATALOG.installed).toHaveLength(2)
    expect(PLUGIN_MARKET_FIXTURE_CATALOG.sections).toHaveLength(2)
  })

  it('filters installed rows and category cards from the search box', () => {
    renderShell()
    const search = screen.getByRole('searchbox', { name: en.search })

    fireEvent.change(search, { target: { value: '差异透镜' } })
    expect(screen.getByText(en.installedEmptySearch)).toBeTruthy()
    expect(screen.getByText('差异透镜')).toBeTruthy()
    expect(screen.queryByText('站会卡片')).toBeNull()
    expect(screen.queryByRole('heading', { name: '效率工具' })).toBeNull()
    expect(screen.getByRole('heading', { name: '开发者工具' })).toBeTruthy()

    fireEvent.change(search, { target: { value: 'not-a-plugin-xyz' } })
    expect(screen.getByText(en.installedEmptySearch)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe(en.catalogEmptySearch)
    expect(screen.queryByText('差异透镜')).toBeNull()
  })

  it('invokes the create-plugin callback when provided and no-ops by default', () => {
    const onCreatePlugin = vi.fn()
    const withHandler = renderShell({ onCreatePlugin })
    fireEvent.click(screen.getByRole('button', { name: en.createPlugin }))
    expect(onCreatePlugin).toHaveBeenCalledOnce()
    withHandler.unmount()

    renderShell()
    fireEvent.click(screen.getByRole('button', { name: en.createPlugin }))
  })
})
