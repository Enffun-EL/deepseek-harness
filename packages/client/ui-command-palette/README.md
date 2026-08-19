# @deepseek-ai/dsh-client-ui-command-palette

English | [中文](README.zh.md)

Global command palette scaffold (Zcode Ctrl+K): a `shell.overlay` host with open/close, search query, filter tabs (`全部` / `操作` / `任务` / `文件` → `all` / `actions` / `tasks` / `files`), keyboard-hint chips, and four static default shell actions (new task, open workspace, settings, toggle sidebar). Session-scoped `/` command discovery stays in [ui-commands](../ui-commands/README.md); this package is the app-wide action surface. Product anchors: [Zcode home interaction contract](../../../apps/desktop/docs/zcode-home-interaction-contract.json) and [parity inventory](../../../apps/desktop/docs/zcode-parity-inventory.md).

`filterCommandPaletteItems` is a pure helper over item kind + case-insensitive multi-token query (title, description, keywords). The host binds Ctrl/Cmd+K to open or close and Escape to close; arrow keys and Enter navigate the filtered list. Default action verbs inject from apply: `startSession` and `toggleSidebar` call existing runtime/layout services; open-workspace currently falls back to `startSession()` (workspace picker remains on the blank session hero); open-settings is a no-op until settings exposes a shared open API. Task and file catalog sources are not wired in this scaffold.

The `/client` exports are the plugin body (`apply`/`inject`) plus the item/filter/inject types. The host component, default catalog, and filter helpers stay package-internal for same-package tests.

## Model Experience

None; the palette is a client navigation and shell-action surface. Nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Task and file tabs are empty until sources land** — the filter tabs are present; only static `action` rows ship today.
- **Open workspace / settings are scaffold stubs** — workspace picker and settings visibility remain owned by their packages without a shared open service.
- **No Electron dependency** — the palette is a pure browser client plugin; desktop packaging loads the same web client tree.
