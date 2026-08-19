# Agent Note: Desktop electron-builder packaging

Status: implemented

[English](2026-08-19-desktop-electron-builder-packaging.md) | 中文

## Problem

[Desktop Electron 壳（MVP-A）](../../proposed/architecture/2026-08-19-dsh-desktop-electron-mvp.md) 已能从 monorepo 检出运行，但产品分发仍需要明确的安装包路径：Windows NSIS／portable 与 macOS DMG 配置、package 脚本，以及不在首个安装包中假装内嵌完整 monorepo 的 Host 发现策略。

## Decision

**由 `apps/desktop` 持有 electron-builder。** `electron-builder.yml` 定义 Windows（`nsis`、`portable` x64）、macOS（`dmg` x64／arm64）以及可选的 Linux AppImage 目标。包依赖钉在 **electron-builder 24.x**，以便安装仍落在 monorepo 供应链门禁内（v26 会拉取 `@electron/rebuild` → git `@electron/node-gyp`，被 `blockExoticSubdeps` 拒绝）。包脚本 `pack`、`dist`、`dist:win`、`dist:mac`、`dist:linux` 先构建 TypeScript 主进程再调用 electron-builder。根目录钩子 `pnpm desktop:pack` 与 `pnpm desktop:dist` 转发到该 filter。产物写入已 gitignore 的 `apps/desktop/release/`。

**Host 根解析顺序明确。** `resolveHostRoot`（主进程中取代仅 monorepo 发现）依次检查：`DSH_DESKTOP_HOST_ROOT`、打包后的 `process.resourcesPath/host`（来自 `extraResources` ← `host-dist/`），再上溯父目录寻找 `pnpm-workspace.yaml` + `apps/cli`。安装包内完整捆绑 Host 延后；`scripts/ensure-host-dist.mjs` 只保证 `host-dist` 路径存在，避免 electron-builder 因缺少 `extraResources` 源失败。占位树不会被当作可运行 Host。

**仍由系统 Node 拉起 Host。** 打包不会把 CLI 切到 Electron 的 `process.execPath`。`apps/desktop` README（中英）说明如何产出安装包以及 Host 布局限制。

## Alternatives considered

**在本变更中把整个 monorepo 打进每个安装包。** 否决：体积、原生 addon 矩阵与 monorepo 门禁使正确的首刀大于打包功能本身；环境变量 + `resources/host` 接缝留下清晰后续，且不阻塞 shell 产物。

**用 electron-forge 替代 electron-builder。** 否决：electron-builder 更直接覆盖所要求的 NSIS／portable／DMG 矩阵，在 pnpm workspace 中脚手架更少。

**保持仅 monorepo 上溯，并把安装包文档写成手动 zip `electron .`。** 否决：没有稳定产物布局，也没有可供产品分发的 CI 目标。

## Consequences

开发者可运行聚焦的 `pack`／`dist` 脚本得到平台产物，而二进制内不必含完整产品 Host。除非提供 `DSH_DESKTOP_HOST_ROOT` 或真正的 `host-dist` Host 树，打包后的首次启动会以面向打包的错误闭合失败。单元测试覆盖环境变量、打包 resources 与 monorepo 上溯路径。自动更新、签名与公证仍不在本决策范围内。
