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

## Auto-update (skeleton)

Main-process updates use [`electron-updater`](https://www.electron.build/auto-update) with **safe defaults**:

| Behavior | Default |
|---|---|
| Check on start | Only when the app is **packaged** (`app.isPackaged`). Dev `electron .` skips the network check. |
| Manual check | `setupAutoUpdate().checkForUpdates()` stub for a future menu item |
| Auto-download | **Off** (`autoDownload = false`) |
| Silent install | **Never** — install runs only after explicit consent via `requestInstallDownloadedUpdate()` |
| Auto-install on quit | **Off** until the user consents to install a downloaded update |

**Feed URL (placeholder):** GitHub Releases for `Enffun-EL/deepseek-harness` (`provider: github`). Override with env:

| Variable | Effect |
|---|---|
| `DSH_DESKTOP_UPDATE_FEED_URL` | Generic HTTP directory that serves `latest.yml` / artifacts |
| `DSH_DESKTOP_UPDATE_GITHUB_OWNER` / `DSH_DESKTOP_UPDATE_GITHUB_REPO` | GitHub Releases owner/repo |
| `DSH_DESKTOP_UPDATE_CHANNEL` | Channel name for either provider |
| `DSH_DESKTOP_UPDATE_CHECK` | `1`/`true` force start check; `0`/`false`/`off` disable it |

### Signing and development

Code signing and notarization are **not** configured in this skeleton. Unsigned or dev builds may fail signature verification, find no published installer artifacts, or no-op the updater. That is expected for local development; production installers must ship signed packages and a real publish pipeline before relying on auto-update.

Pure helpers (version compare, feed URL builder, update state machine) are unit-tested without launching Electron.

## First-run and shell status UX

While the local Host starts, the main process shows a branded Chinese **loading** page (data URL). On Host **failure** or **readiness timeout**, it shows a matching error page with a **Retry** control that re-runs boot (stops any prior child, then starts Host again). Pages are built by pure helpers in `src/shell-pages.ts` (unit-tested; no `nodeIntegration`).

Missing system `node` (spawn `ENOENT` / not on `PATH`) is classified by `describeHostLaunchError` into branded Chinese product copy instead of an opaque stack, with the same Retry control.

On the first successful Host UI load for a profile, the shell injects a short **welcome status strip** at the top of the Web UI via `did-finish-load` (up to 3 non-blocking attempts). The strip does not block interaction and auto-dismisses. Completion is stored as `hasCompletedFirstLaunch` in `desktop-shell-state.json` under Electron `userData`. Later launches skip the strip. Corrupt or missing state is treated as not completed.

Security invariants for the shell window stay fixed: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

## Packaging (electron-builder)

This package ships an [electron-builder](https://www.electron.build/) **24.x** config (`electron-builder.yml`; 24 avoids a git exotic subdependency blocked by the monorepo supply-chain gate) for:

| Platform | Targets |
|---|---|
| Windows | NSIS installer + portable (x64) |
| macOS | DMG (x64 + arm64) |
| Linux | AppImage (x64; optional convenience target) |

### Produce installers

From the repository root (after `pnpm install`):

```sh
# Unpacked app directory only (fast smoke of the pack layout)
pnpm desktop:pack
# or: pnpm --filter @deepseek-ai/dsh-desktop run pack

# Platform installers for the machine you are on
pnpm desktop:dist
# or: pnpm --filter @deepseek-ai/dsh-desktop run dist

# Explicit targets
pnpm --filter @deepseek-ai/dsh-desktop run dist:win
pnpm --filter @deepseek-ai/dsh-desktop run dist:mac
pnpm --filter @deepseek-ai/dsh-desktop run dist:linux
```

Artifacts land in `apps/desktop/release/` (gitignored). macOS DMG production on a non-mac host needs the usual electron-builder cross-build constraints; the config is still complete for CI mac runners.

### How the packaged app finds Host

The shell does **not** embed a full monorepo Host bundle in MVP packaging. At runtime `resolveHostRoot` picks the first match:

1. **`DSH_DESKTOP_HOST_ROOT`** — absolute path to a Host root that contains `apps/cli` (built `lib/bin.js` and/or source `src/bin.ts`).
2. **`resources/host`** — optional tree copied from `apps/desktop/host-dist` via electron-builder `extraResources` (present only when you populate `host-dist` before pack).
3. **Monorepo walk** — parent directories with `pnpm-workspace.yaml` + `apps/cli` (developer checkouts / `pnpm desktop`).

`pnpm run ensure-host-dist` (invoked by `pack` / `dist`) creates a placeholder `host-dist/` so electron-builder's `extraResources` source path exists. That placeholder is **not** a runnable Host. For a self-contained installer, place a prepared Host layout under `apps/desktop/host-dist/` (at least `apps/cli/lib/bin.js` plus the runtime closure the CLI needs) before `dist`, or document that end users must set `DSH_DESKTOP_HOST_ROOT` to an installed monorepo/CLI tree.

System `node` remains required to spawn Host; Electron's `process.execPath` is never used as the Node binary.

### Limitations (current MVP)

- Full Host + frontend vendoring into the installer is **deferred**; shell-only artifacts start only when a Host root is discoverable as above.
- Code signing, notarization, and auto-update are out of scope here.
- Cross-building every target on one OS is not guaranteed; prefer native CI runners per platform.

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host, auto-update setup |
| `src/auto-update.ts` | electron-updater wiring + consent-preserving controller |
| `src/feed-url.ts` | Feed URL / GitHub provider config (pure) |
| `src/update-policy.ts` | When to check on start (pure) |
| `src/update-state.ts` | Update lifecycle state machine (pure) |
| `src/version-compare.ts` | Version ordering helper (pure) |

| `src/main.ts` | Electron main: window, single-instance, quit → stop Host, first-run strip |
| `src/shell-pages.ts` | Pure HTML builders for loading / timeout / failure pages |
| `src/first-run-state.ts` | Read/write `hasCompletedFirstLaunch` under userData |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-host-root.ts` | Host root: env, packaged `resources/host`, monorepo walk |
| `electron-builder.yml` | Windows / macOS / Linux pack targets |
| `scripts/ensure-host-dist.mjs` | Ensure `host-dist/` exists before electron-builder |

## Out of scope (this package)

- Installer packaging pipeline / code signing CI (separate work)
- Client UI for update prompts (logs + controller only in this skeleton)
- IPC `file://` carrier (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
pnpm --filter @deepseek-ai/dsh-desktop run build
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
- `openExternal` (preload → main) allows **absolute http(s) only** by default (any host). Non-http(s) schemes (`file:`, `javascript:`, `data:`, …) are always rejected. Set `DSH_DESKTOP_OPEN_EXTERNAL_HOSTS` to a comma-separated hostname list to restrict opens to those hosts **plus localhost** (`localhost`, `127.0.0.1`, `::1`, `*.localhost`).
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
| `src/preload.ts` | Sandboxed preload exposing `window.dshDesktop` shell chrome API |
| `src/shell-bridge.ts` | Main-process IPC handlers for the preload bridge |
| `src/external-url.ts` | http(s) + optional host allowlist for `openExternal` |
| `src/shell-pages.ts` | Branded loading/error HTML; first-run script; `describeHostLaunchError` |
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

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

Unit tests cover pure launch/URL helpers only. Host readiness is a manual (or CI-optional) smoke via `smoke:host` / `desktop:smoke`.
