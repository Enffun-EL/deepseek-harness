/**
 * Sidebar shell switch: web SidebarRoot by default; DesktopRail when the
 * plugin inject flag `desktopRail` is true (cordis Config or a desktop slot
 * that reuses the same inject face).
 */
import type { SidebarRootComponentProps } from './contract/slots.ts'
import { DesktopRail } from './DesktopRail.tsx'
import { SidebarRoot } from './SidebarRoot.tsx'

/**
 * Render the layout-owned sidebar occupant for the active chrome mode.
 * @param props - composed sidebar props including the desktopRail inject flag.
 * @returns DesktopRail or the existing web SidebarRoot.
 */
export function SidebarShell(props: SidebarRootComponentProps) {
  if (props.desktopRail) return <DesktopRail {...props} />
  return <SidebarRoot {...props} />
}
