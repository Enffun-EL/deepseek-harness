// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { SidebarRootComponentProps } from '../src/client/contract/slots.ts'
import { SidebarShell } from '../src/client/SidebarShell.tsx'
import { en } from '../src/client/locales.ts'

const t: SidebarRootComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key
const neverHook = (() => { throw new Error('shell must not read global hooks') }) as never

afterEach(cleanup)

function mountShell(desktopRail: boolean) {
  render(
    <SidebarShell
      collapsed={false}
      width={300}
      desktopRail={desktopRail}
      useSessions={neverHook}
      useWorkspaces={neverHook}
      startSession={vi.fn()}
      toggleSidebar={vi.fn()}
      t={t}
      renderSlot={(() => null) as SidebarRootComponentProps['renderSlot']}
    />,
  )
}

describe('SidebarShell', () => {
  it('keeps the web SidebarRoot when desktopRail is false', () => {
    mountShell(false)
    expect(document.querySelector('[data-desktop-rail]')).toBeNull()
    expect(screen.getAllByRole('button', { name: 'New session' }).length).toBeGreaterThan(0)
  })

  it('renders DesktopRail when desktopRail is true', () => {
    mountShell(true)
    expect(document.querySelector('[data-desktop-rail]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New task' })).toBeTruthy()
  })
})
