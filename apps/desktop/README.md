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

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-repo-root.ts` | Locate monorepo root from the packaged path |
| `src/smoke-host.ts` | Headless Host readiness smoke (no Electron GUI) |

## Headless Host smoke

Use this when you need a quick check that the desktop Host launch path boots and serves HTTP without opening Electron. It does **not** require `DEEPSEEK_API_KEY`.

From the repository root (preferred):

```sh
pnpm run desktop:smoke
```

Or from this package:

```sh
pnpm --filter @deepseek-ai/dsh-desktop run smoke:host
```

The script builds this package, starts Host the same way Electron main does (`resolveRepoRoot` + `resolveHostLaunch` + `startHost`), waits for the `dsh web:` readiness URL, `GET`s that URL (expects HTTP 200), stops Host, and exits `0` on success or `1` on failure. A temporary `DSH_HOME` under the OS temp directory keeps smoke state off the developer CLI home.

For a production-like Host (built CLI + web frontend), run `pnpm run build` at the repository root first. Without built artifacts the smoke falls back to the source CLI via `tsx` (same as desktop dev).

## Out of scope (this package)

- Installers / auto-update (later feature)
- IPC `file://` carrier (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

Unit tests cover pure launch/URL helpers only. Host readiness is a manual (or CI-optional) smoke via `smoke:host` / `desktop:smoke`.
