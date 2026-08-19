# `@deepseek-ai/dsh-desktop`

English | [中文](README.zh.md)

Electron shell for **DSH Desktop** (MVP-A). The main process starts a local `dsh web` Host on loopback (`127.0.0.1`, OS-assigned port), waits for the `dsh web:` readiness line, and loads that URL in a `BrowserWindow`. Agent loop, tools, sessions, and chat UI stay in the existing Host + `packages/client/*` stack.

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

## First-run and shell status UX

While the local Host starts, the main process shows a branded Chinese **loading** page (data URL). On Host **failure** or **readiness timeout**, it shows a matching error page with a **Retry** control that re-runs boot (stops any prior child, then starts Host again). Pages are built by pure helpers in `src/shell-pages.ts` (unit-tested; no `nodeIntegration`).

On the first successful Host UI load for a profile, the shell injects a short **welcome status strip** at the top of the Web UI. The strip does not block interaction and auto-dismisses. Completion is stored as `hasCompletedFirstLaunch` in `desktop-shell-state.json` under Electron `userData`. Later launches skip the strip. Corrupt or missing state is treated as not completed.

Security invariants for the shell window stay fixed: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host, first-run strip |
| `src/shell-pages.ts` | Pure HTML builders for loading / timeout / failure pages |
| `src/first-run-state.ts` | Read/write `hasCompletedFirstLaunch` under userData |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-repo-root.ts` | Locate monorepo root from the packaged path |

## Out of scope (this package)

- Installers / auto-update (later feature)
- IPC `file://` carrier (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
