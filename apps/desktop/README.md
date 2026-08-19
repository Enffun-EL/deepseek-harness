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

## Out of scope (this package)

- Installers / auto-update (later feature)
- IPC `file://` carrier (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

## CI release

GitHub Actions workflow: [`.github/workflows/desktop-release.yml`](../../.github/workflows/desktop-release.yml).

### Triggers

| Event | When |
|---|---|
| Tag push | Tags matching `desktop-v*` (for example `desktop-v0.1.0`) |
| Manual | Actions → **Release (Desktop)** → **Run workflow** |

### What the workflow does today

1. Checkout, set up pnpm + Node 24, `pnpm install --frozen-lockfile`
2. `pnpm --filter @deepseek-ai/dsh-desktop run build`
3. `pnpm --filter @deepseek-ai/dsh-desktop test`
4. Upload `apps/desktop/lib/**` and `apps/desktop/package.json` as run artifacts

Matrix: **windows-latest** (required) and **macos-latest** (`continue-on-error` until packaging/signing is ready).

### Release checklist (maintainers)

1. Land desktop changes on the integration branch and confirm package tests pass locally.
2. Create and push an annotated tag: `git tag -a desktop-vX.Y.Z -m "desktop vX.Y.Z"` then `git push origin desktop-vX.Y.Z`.
3. Open the **Release (Desktop)** workflow run for that tag; confirm Windows is green (macOS may still be experimental).
4. Download the uploaded artifacts from the run. Today these are compiled main-process JS only — not an end-user installer.
5. **TODO:** when `electron-builder` (or equivalent) config exists under `apps/desktop`, extend the workflow packaging step and publish signed installers from the same tag run.

### Out of scope for CI today

- Full monorepo `pnpm run build` of Host/frontend (desktop unit tests do not require it)
- electron-builder installers, code signing, Apple notarization, auto-update feeds
