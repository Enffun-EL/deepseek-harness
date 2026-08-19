/**
 * Shell menu / keyboard accelerators reserved for the client Web UI.
 *
 * Electron main must not bind these on the application menu or global shortcuts
 * so the sandboxed client can own Zcode-parity actions (new task, command palette).
 * @module @deepseek-ai/dsh-desktop/reserved-accelerators
 */

/**
 * One accelerator reserved for the client (not claimed by the desktop shell menu).
 */
export interface ReservedClientAccelerator {
  /** Electron-style accelerator string (Windows/Linux primary). */
  accelerator: string
  /** macOS Command equivalent when it differs only by modifier branding. */
  acceleratorMac: string
  /** Stable client action id (matches Zcode home interaction contract). */
  clientAction: 'createTask' | 'openCommandPalette'
  /** Short product description (Chinese primary). */
  summaryZh: string
  /** Short product description (English). */
  summaryEn: string
}

/**
 * Accelerators the desktop shell leaves free for the Host-loaded client.
 *
 * | Shortcut | Client action |
 * |---|---|
 * | Ctrl+N (⌘N) | New task (`createTask`) |
 * | Ctrl+K (⌘K) | Command palette (`openCommandPalette`) |
 *
 * When adding an Electron `Menu` template or `globalShortcut`, skip these chords.
 * Product anchors: `docs/zcode-home-interaction-contract.json` leftRail / routes.
 */
export const RESERVED_CLIENT_ACCELERATORS: readonly ReservedClientAccelerator[] = [
  {
    accelerator: 'Ctrl+N',
    acceleratorMac: 'Command+N',
    clientAction: 'createTask',
    summaryZh: '新建任务（客户端左栏 / 命令面板）',
    summaryEn: 'New task (client left rail / command palette)',
  },
  {
    accelerator: 'Ctrl+K',
    acceleratorMac: 'Command+K',
    clientAction: 'openCommandPalette',
    summaryZh: '打开命令面板（全局搜索与操作）',
    summaryEn: 'Open command palette (global search and actions)',
  },
] as const

/**
 * True when an Electron accelerator string collides with a client-reserved chord.
 * Accepts `Ctrl+N`, `CmdOrCtrl+N`, `Command+N`, and case-insensitive variants.
 * @param accelerator - candidate menu or globalShortcut accelerator
 * @returns whether the shell must not claim this binding
 */
export function isReservedClientAccelerator(accelerator: string): boolean {
  const normalized = normalizeAccelerator(accelerator)
  if (normalized === null) return false
  for (const entry of RESERVED_CLIENT_ACCELERATORS) {
    const win = normalizeAccelerator(entry.accelerator)
    const mac = normalizeAccelerator(entry.acceleratorMac)
    if (normalized === win || normalized === mac) return true
  }
  return false
}

/**
 * Normalize accelerator text for equality checks (modifier synonyms + key).
 * @param accelerator - raw accelerator
 * @returns canonical `mod+key` lower-case form, or null if empty
 */
function normalizeAccelerator(accelerator: string): string | null {
  const trimmed = accelerator.trim()
  if (trimmed.length === 0) return null
  const parts = trimmed.split('+').map(part => part.trim().toLowerCase()).filter(part => part.length > 0)
  if (parts.length === 0) return null
  const key = parts[parts.length - 1]
  if (key === undefined) return null
  const mods = new Set(parts.slice(0, -1).map((mod) => {
    if (mod === 'cmd' || mod === 'command' || mod === 'super' || mod === 'meta') return 'meta'
    if (mod === 'control' || mod === 'ctrl' || mod === 'cmdorctrl' || mod === 'commandorcontrol') {
      return 'ctrl'
    }
    if (mod === 'option' || mod === 'alt') return 'alt'
    if (mod === 'shift') return 'shift'
    return mod
  }))
  // Client-reserved chords are ctrl/meta + letter only; treat ctrl and meta as the same seat.
  const primary = mods.has('ctrl') || mods.has('meta') ? 'ctrl' : [...mods].sort().join('+')
  const extras = [...mods].filter(mod => mod !== 'ctrl' && mod !== 'meta').sort()
  const prefix = extras.length > 0 ? `${primary}+${extras.join('+')}` : primary
  return `${prefix}+${key}`
}
