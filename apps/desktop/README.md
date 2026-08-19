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

### Host reliability

- After the Host has printed its readiness URL, an unexpected exit triggers capped exponential restart backoff; the window reloads the new URL on success.
- Ready wait defaults to 120s and is overridable with `DSH_DESKTOP_HOST_READY_MS` (positive milliseconds).
- Host stdout/stderr are kept in a bounded in-memory ring for crash dialogs (not unbounded process output).
- Stop is cross-platform (`SIGTERM` then `SIGKILL`); on Windows the supervisor also runs `taskkill /T` so grandchild processes do not orphan.

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host, post-ready restart |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child tree |
| `src/host-restart-policy.ts` | Pure restart/backoff policy |
| `src/host-log-ring.ts` | Bounded Host log ring for crash context |
| `src/host-ready-timeout.ts` | `DSH_DESKTOP_HOST_READY_MS` resolution |
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
