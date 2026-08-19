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

## Layout

| Path | Role |
|---|---|
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host, auto-update setup |
| `src/auto-update.ts` | electron-updater wiring + consent-preserving controller |
| `src/feed-url.ts` | Feed URL / GitHub provider config (pure) |
| `src/update-policy.ts` | When to check on start (pure) |
| `src/update-state.ts` | Update lifecycle state machine (pure) |
| `src/version-compare.ts` | Version ordering helper (pure) |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-repo-root.ts` | Locate monorepo root from the packaged path |

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
