// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type {
  SidebarFooterActionOwnerProps, SidebarRootComponentProps, SidebarSectionOwnerProps,
  SidebarSettingsOwnerProps,
} from '../src/client/contract/slots.ts'
import { DesktopRail } from '../src/client/DesktopRail.tsx'
import { en } from '../src/client/locales.ts'

const t: SidebarRootComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => {
  cleanup()
})

const neverHook = (() => { throw new Error('shell must not read global hooks') }) as never

function mountRail({ collapsed = false, width = 300 }: { collapsed?: boolean; width?: number } = {}) {
  const startSession = vi.fn()
  const toggleSidebar = vi.fn()
  let regionOwner: SidebarSectionOwnerProps | undefined
  let settingsOwner: SidebarSettingsOwnerProps | undefined
  let footerActionOwner: SidebarFooterActionOwnerProps | undefined
  render(
    <DesktopRail
      collapsed={collapsed}
      width={width}
      desktopRail
      useSessions={neverHook}
      useWorkspaces={neverHook}
      startSession={startSession}
      toggleSidebar={toggleSidebar}
      t={t}
      renderSlot={((
        key: string,
        owner: SidebarFooterActionOwnerProps | SidebarSectionOwnerProps | SidebarSettingsOwnerProps,
      ) => {
        if (key === 'sidebar.settings') {
          settingsOwner = owner
          return <div data-testid="settings-seat" data-wide={owner.wide} />
        }
        if (key === 'sidebar.footer.action') {
          footerActionOwner = owner
          return <div data-testid="footer-action-seat" data-wide={owner.wide} />
        }
        regionOwner = owner as SidebarSectionOwnerProps
        return <div data-testid="region" data-wide={owner.wide} />
      }) as SidebarRootComponentProps['renderSlot']}
    />,
  )
  return {
    startSession,
    toggleSidebar,
    regionOwner: () => {
      if (regionOwner === undefined) throw new Error('region owner not rendered')
      return regionOwner
    },
    settingsOwner: () => {
      if (settingsOwner === undefined) throw new Error('settings owner not rendered')
      return settingsOwner
    },
    footerActionOwner: () => {
      if (footerActionOwner === undefined) throw new Error('footer action owner not rendered')
      return footerActionOwner
    },
  }
}

describe('DesktopRail', () => {
  it('renders top actions, empty section copy, and account placeholders when wide', () => {
    const b = mountRail()
    expect(document.querySelector('[data-desktop-rail]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New task' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Automation' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Plugin Market' })).toBeTruthy()
    expect(screen.getByText('No project open yet')).toBeTruthy()
    expect(screen.getByText('No tasks yet')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Phone remote' }) as HTMLButtonElement).disabled).toBe(true)
    expect(b.regionOwner().wide).toBe(true)
    expect(b.settingsOwner().wide).toBe(true)
    expect(b.footerActionOwner().wide).toBe(true)
  })

  it('starts a task from New Task and toggles the column', () => {
    const b = mountRail()
    fireEvent.click(screen.getByRole('button', { name: 'New task' }))
    expect(b.startSession).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(b.toggleSidebar).toHaveBeenCalledOnce()
  })

  it('collapses to icon chrome without empty copy and keeps seats mounted', () => {
    const b = mountRail({ collapsed: true, width: 56 })
    expect(screen.queryByText('No project open yet')).toBeNull()
    expect(screen.queryByText('No tasks yet')).toBeNull()
    expect(screen.getByRole('button', { name: 'New task' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy()
    expect(b.regionOwner().wide).toBe(false)
    b.regionOwner().expandSidebar()
    expect(b.toggleSidebar).toHaveBeenCalledOnce()
  })
})
