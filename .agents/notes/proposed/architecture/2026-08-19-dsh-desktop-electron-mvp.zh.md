# Agent Note: DSH Desktop Electron 壳（MVP-A）

Status: proposed

[English](2026-08-19-dsh-desktop-electron-mvp.md) | 中文

## Problem

DeepSeek Harness 已具备完整的本地 Web GUI（`dsh web` + `packages/client/*`），但从未用过 CLI 的编码用户仍缺少可对标 Codex 类产品的**可下载桌面入口**。缺口不是第二套 agent loop 或聊天 UI，而是**桌面壳**：可安装窗口、Host 进程生命周期，以及后续的打包／更新——且不能分叉业务 UI，也不能削弱现有的沙箱 × 审批模型。

## Proposal

交付 **`apps/desktop`（`@deepseek-ai/dsh-desktop`）** 作为 Electron 主进程监护程序：

1. **MVP-A（本变更）：** 在 `127.0.0.1` 上以 `--port 0` 拉起本地 `dsh web`，解析既有的 `dsh web:` 就绪行，对 `BrowserWindow.loadURL` 使用该 origin。Host 与 client 原样复用。
2. **MVP-B（后续）：** `file://` + 继承 `AbstractApiClient` 的 `IpcApiClient`，产品路径不再依赖 `dsh-host-webserver` 载体——已在 [GUI 分层说明](../../implemented/architecture/2026-07-19-gui-layering-and-rpc-protocol.md) 中预留。
3. **MVP 非目标：** IDE 编辑器、云端多租户、VS Code 扩展、应用商店完整流程、在 `apps/desktop` 内实现业务 UI。

MVP-A 默认选择：

- 选 Electron 而非 Tauri（Node Host + 现有 Web client）。
- 桌面 `DSH_HOME` 放在 Electron `userData` 下，避免与 CLI home 互相覆盖。
- Renderer：`contextIsolation`、关闭 `nodeIntegration`、开启 sandbox；壳层不另建凭据模型。
- 一个功能一次推送到产品 fork；electron-builder 安装包为独立功能（[打包说明](../../implemented/feature/2026-08-19-desktop-electron-builder-packaging.md)）；自动更新仍靠后。

## Alternatives considered

- **Tauri 壳** — 包体更小；与树内监护 Node Cordis Host 的契合度当前更弱。若包体积成为首要差评再评估。
- **首交付即 IPC-only** — 终态正确，首交付成本高；延后到 MVP-B。
- **在 Electron 内重写 UI** — 拒绝；相对 `packages/client/*` 双倍维护。

## Acceptance criteria

- 单元测试覆盖就绪 URL 解析与启动 argv 解析（`apps/desktop/tests`）。
- 在 monorepo 检出中执行 `pnpm desktop`，Host 就绪后窗口加载既有 Web UI（在具备 Electron e2e 前为手工验收）。
- 关闭应用会停止 Host 子进程；第二次启动聚焦已有窗口。
- 业务 UI 仍只存在于 `packages/client/*`；壳不新增 agent-loop 包。

## Risks

- 开发树启动依赖系统 `node` 与 monorepo 布局；打包壳通过 `DSH_DESKTOP_HOST_ROOT` 或可选的 `resources/host` 解析 Host，直至完整 Host 捆绑上线（[打包说明](../../implemented/feature/2026-08-19-desktop-electron-builder-packaging.md)）。
- 在 MVP-B 之前仍暴露回环 HTTP 端口面；必须只绑定 `127.0.0.1`。
- 若 Host 就绪日志变更，壳解析会失效——应保持 `dsh web:` 行约定，或稍后引入显式监护通道。
