# `@deepseek-ai/dsh-desktop`

English | [中文](README.zh.md)

**DSH Desktop** is the Codex-like desktop shell for DeepSeek Harness: an installable window that supervises a local Host and loads the existing Web UI. Agent loop, tools, sessions, sandbox × approval, and chat UI stay in Host + `packages/client/*`; this package owns only the Electron main process, Host lifecycle, and window.

## What it is

Product users who prefer a desktop entry get the same local coding-agent experience as `dsh web`, without learning the CLI first. The shell:

- Starts a single Electron window titled **DSH Desktop**
- Spawns local `dsh web` on loopback and waits for the `dsh web:` readiness line
- Loads that origin in a sandboxed `BrowserWindow`
- Stops the Host child on quit and focuses an existing window on a second launch

Business UI is not rewritten here. Packaging installers and auto-update are follow-up features, not part of this package today.

## Install and develop

There is no standalone installer in-tree yet. Run from a monorepo checkout.

### Requirements

- Monorepo dependencies installed (`pnpm install` at the repository root)
- Built Host/frontend artifacts for a production-like run (`pnpm run build`), **or** a source-capable tree for dev (`pnpm dsh` via `tsx`)
- System `node` on `PATH` (Electron's binary is not used to run the CLI)

### Develop

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

### Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

## Architecture: MVP-A and MVP-B

| Stage | Carriage | Product effect |
|---|---|---|
| **MVP-A** (this package) | Loopback HTTP: spawn `dsh web` on `127.0.0.1` with OS-assigned port; parse readiness URL; `BrowserWindow.loadURL` | Reuses Host + client unchanged; first desktop entry with minimal shell code |
| **MVP-B** (planned) | `file://` renderer + `IpcApiClient` over Electron IPC | No product dependence on `dsh-host-webserver` HTTP carriage; same client stack over a different transport |

MVP-A defaults: Electron (not Tauri) so a Node Cordis Host can be supervised in-tree; desktop `DSH_HOME` under `userData`; renderer with `contextIsolation`, no `nodeIntegration`, and sandbox on.

Design rationale, alternatives, and acceptance criteria live in the [desktop Electron MVP Agent Note](../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-electron-mvp.md).

## Security notes

- Bind the Host to **`127.0.0.1` only** until MVP-B removes the loopback HTTP surface.
- Renderer isolation: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. The shell does not add a second credential model.
- Host logs are main-process diagnostics; do not intentionally surface secrets in the window.
- Closing the app stops the Host child so the loopback port does not outlive the product window.
- Packaged installers must ship a Host layout later; a monorepo-only launch still needs system `node` and repository layout.

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
- IPC `file://` carrier (MVP-B; see the Agent Note above)
- Business UI (lives under `packages/client/*`)
- IDE editor, cloud multi-tenant, VS Code extension

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
