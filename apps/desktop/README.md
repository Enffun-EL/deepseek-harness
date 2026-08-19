# `@deepseek-ai/dsh-desktop`

English | [中文](README.zh.md)

Electron shell for **DSH Desktop** (MVP-A). The main process starts a local `dsh web` Host on loopback (`127.0.0.1`, OS-assigned port), waits for the `dsh web:` readiness line, and loads that URL in a `BrowserWindow`. Agent loop, tools, sessions, and chat UI stay in the existing Host + `packages/client/*` stack.

A sandboxed **preload shell bridge** exposes `window.dshDesktop` (`getShellInfo`, `openExternal` for http(s) only). That API is **shell chrome only** — not a Host API / ApiClient replacement. Agent and session traffic still use the loopback Host; MVP-B may add a separate IPC carrier later.

## Requirements

- Monorepo dependencies installed (`pnpm install` at the repository root)
- Built Host/frontend artifacts for a production-like run (`pnpm run build`), **or** a source-capable tree for dev (`pnpm dsh` path via `tsx`)
- System `node` on `PATH` (Electron's binary is not used to run the CLI)

## Develop

From the repository root:

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-desktop run build
pnpm desktop
```

`pnpm desktop` builds this package and launches Electron. The Host uses `DSH_HOME` under the Electron `userData` directory (`…/dsh-home`) so desktop state does not clobber a developer CLI home.

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host |
| `src/preload.ts` | Sandboxed preload (CJS build): `contextBridge` → `window.dshDesktop` |
| `src/shell-ipc.ts` | Shared IPC channel names + shell-info payload type |
| `src/shell-bridge.ts` | Main-process IPC handlers for the shell bridge |
| `src/external-url.ts` | Pure http(s) allowlist for `openExternal` |
| `src/dsh-desktop.d.ts` | Ambient `Window.dshDesktop` types |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-repo-root.ts` | Locate monorepo root from the packaged path |

## Out of scope (this package)

- Installers / auto-update (later feature)
- IPC `file://` carrier / full Host ApiClient over preload (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)
- Replacing the loopback Host HTTP/WebSocket API with `window.dshDesktop`

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
