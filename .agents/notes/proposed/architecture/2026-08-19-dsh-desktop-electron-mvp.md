# Agent Note: DSH Desktop Electron shell (MVP-A)

Status: proposed

English | [中文](2026-08-19-dsh-desktop-electron-mvp.zh.md)

## Problem

DeepSeek Harness already ships a full local Web GUI (`dsh web` + `packages/client/*`), but product users who have never used the CLI still lack a downloadable desktop entry comparable to Codex-style coding agents. The missing piece is not another agent loop or chat UI — it is a **desktop shell**: installable window, Host process lifecycle, and later packaging/update — without forking business UI or weakening the existing sandbox × approval model.

## Proposal

Ship **`apps/desktop` (`@deepseek-ai/dsh-desktop`)** as an Electron main-process supervisor:

1. **MVP-A (this change):** spawn local `dsh web` on `127.0.0.1` with `--port 0`, parse the existing `dsh web:` readiness line, `BrowserWindow.loadURL` that origin. Reuse Host + client unchanged.
2. **MVP-B (later):** `file://` + `IpcApiClient` extending `AbstractApiClient`, no product dependence on `dsh-host-webserver` carriage — already reserved in the [GUI layering note](../../implemented/architecture/2026-07-19-gui-layering-and-rpc-protocol.md).
3. **Non-goals for MVP:** IDE editor, cloud multi-tenant, VS Code extension, app-store full flow, business UI inside `apps/desktop`.

Defaults for MVP-A:

- Electron over Tauri (Node Host + existing Web client).
- Desktop `DSH_HOME` under Electron `userData` so CLI and Desktop state do not clobber each other.
- Renderer: `contextIsolation`, no `nodeIntegration`, sandbox on; no second credential model in the shell.
- One feature → one push on the product fork; electron-builder installers are a separate feature ([packaging note](../../implemented/feature/2026-08-19-desktop-electron-builder-packaging.md)); auto-update remains later.


## Alternatives considered

- **Tauri shell** — smaller binary; weaker fit for supervising a Node Cordis Host in-tree today. Revisit if package size becomes the top complaint.
- **IPC-only first delivery** — correct end state, higher first-delivery cost; deferred to MVP-B.
- **Rewrite UI in Electron** — rejected; doubles maintenance against `packages/client/*`.

## Acceptance criteria

- Unit tests cover readiness URL parsing and launch argv resolution (`apps/desktop/tests`).
- `pnpm desktop` from a monorepo checkout opens a window that loads the existing Web UI after Host ready (manual until Electron e2e exists).
- Closing the app stops the Host child; a second instance focuses the existing window.
- Business UI remains only under `packages/client/*`; the shell adds no agent-loop package.

## Risks

- Dev-tree launch depends on system `node` and monorepo layout; packaged shells resolve Host via `DSH_DESKTOP_HOST_ROOT` or optional `resources/host` until full Host bundling ships ([packaging note](../../implemented/feature/2026-08-19-desktop-electron-builder-packaging.md)).

- Loopback HTTP remains a local port surface until MVP-B; must stay on `127.0.0.1` only.
- If Host readiness logging changes, the shell parser breaks — keep the `dsh web:` line contract or introduce an explicit supervisor channel later.
