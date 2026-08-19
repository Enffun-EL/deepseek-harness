# Agent Note: Desktop electron-builder packaging

Status: implemented

English | [中文](2026-08-19-desktop-electron-builder-packaging.zh.md)

## Problem

The [Desktop Electron shell (MVP-A)](../../proposed/architecture/2026-08-19-dsh-desktop-electron-mvp.md) can run from a monorepo checkout, but product distribution still needs a declared installer path: Windows NSIS/portable and macOS DMG configuration, package scripts, and a Host-discovery strategy that does not pretend a full monorepo is inside the first installer.

## Decision

**`apps/desktop` owns electron-builder.** `electron-builder.yml` defines Windows (`nsis`, `portable` x64), macOS (`dmg` x64/arm64), and an optional Linux AppImage target. The package pins **electron-builder 24.x** so install stays inside the monorepo supply-chain gate (v26 pulls `@electron/rebuild` → git `@electron/node-gyp`, which `blockExoticSubdeps` rejects). Package scripts `pack`, `dist`, `dist:win`, `dist:mac`, and `dist:linux` build the TypeScript main process then invoke electron-builder. Root hooks `pnpm desktop:pack` and `pnpm desktop:dist` forward to the filter. Output goes to gitignored `apps/desktop/release/`.

**Host root resolution is explicit and ordered.** `resolveHostRoot` (replacing monorepo-only discovery in the main process) checks, in order: `DSH_DESKTOP_HOST_ROOT`, packaged `process.resourcesPath/host` (from `extraResources` ← `host-dist/`), then a parent walk for `pnpm-workspace.yaml` + `apps/cli`. Full Host bundling into the installer is deferred; `scripts/ensure-host-dist.mjs` only guarantees the `host-dist` path exists so electron-builder does not fail on a missing `extraResources` source. A placeholder tree is not treated as a runnable Host.

**System Node still spawns Host.** Packaging does not switch the CLI onto Electron's `process.execPath`. Docs in `apps/desktop` README (EN/ZH) state how to produce installers and the Host-layout limitations.

## Alternatives considered

**Bundle the entire monorepo into every installer in this change.** Rejected: size, native addon matrix, and monorepo gates make a correct first cut larger than the packaging feature; the env + `resources/host` seam leaves a clear follow-up without blocking shell artifacts.

**electron-forge instead of electron-builder.** Rejected: electron-builder matches the requested NSIS/portable/DMG matrix with less forge-specific scaffolding in a pnpm workspace.

**Keep monorepo-only root walk and document installers as manual zip of `electron .`.** Rejected: no stable artifact layout or CI-ready targets for product distribution.

## Consequences

Developers can run focused `pack`/`dist` scripts and get platform artifacts without a full product Host inside the binary. Packaged first-run still fails closed with a packaging-aware error unless `DSH_DESKTOP_HOST_ROOT` or a real `host-dist` Host tree is supplied. Unit tests cover env, packaged resources, and monorepo walk paths. Auto-update, signing, and notarization remain outside this decision.
