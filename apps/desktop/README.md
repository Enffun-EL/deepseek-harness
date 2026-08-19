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
| `src/main.ts` | Electron main: window, single-instance, quit → stop Host |
| `src/host-supervisor.ts` | Spawn Host, parse readiness URL, stop child |
| `src/host-launcher.ts` | Resolve built vs source `dsh` launch argv |
| `src/parse-host-url.ts` | Pure parser for `dsh web: http://…` |
| `src/resolve-host-root.ts` | Host root: env, packaged `resources/host`, monorepo walk |
| `electron-builder.yml` | Windows / macOS / Linux pack targets |
| `scripts/ensure-host-dist.mjs` | Ensure `host-dist/` exists before electron-builder |

## Out of scope (this package)

- Auto-update / code signing pipeline
- IPC `file://` carrier (MVP-B; see the desktop architecture Agent Note)
- Business UI (lives under `packages/client/*`)

## Tests

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
