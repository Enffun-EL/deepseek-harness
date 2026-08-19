# Agent Note: 远程工作区向导 UI 脚手架

Status: implemented

[English](2026-08-20-remote-workspace-wizard-ui-scaffold.md) | 中文

## Problem

Desktop Agent IDE 地图要求在本地目录选择之外提供远程工作区入口（SSH / WSL / Docker），但 Host 侧远程提供方与接入添加流程的组合尚未落地。若现在就建完整的 `ui-remote-workspace` 包或 slot 注册，会在传输约定尚不真实时过早引入 Loader、locale 与 Host 接缝。

## Decision

在 `@deepseek-ai/dsh-client-ui-workspace` 的 `src/remote-wizard/` 下脚手架一个**纯展示**远程工作区向导：

1. **类型卡片** — 第 1 步提供 SSH、WSL、Docker。
2. **步骤指示** — 步骤 1..4（类型 → 连接 → 路径 → 确认）。
3. **仅回调** — `onCancel` / `onFinish(draft)`（以及可选的步骤／草稿观察回调）。不发起 SSH、WSL 或 Docker I/O。
4. **纯导航** — `steps.ts` 负责前进／后退钳制与逐步完整性门槛；单元测试覆盖这些函数。React 外壳可在无 plugin apply 的情况下挂载做展示测试。

该模块保持包内可见（同包测试直接导入）。**不**从 `./client` 导出，也**不**注册进 slot，直至后续 Host 驱动的组合落地。单独的 `ui-remote-workspace` 包被延后：架构地图已将远程向导缺口放在 `ui-workspace` 上，仅为纯 UI 再建包只会重复 Loader 样板。

## Alternatives considered

- **现在新建 `ui-remote-workspace` 包** — 若远程流程日后膨胀会是更干净的归属，但在尚无 Host 提供方、slot 归属或 locale 命名空间需求时过早；本脚手架予以拒绝。
- **立即接入 WorkspacePickFlow／directory-flow 孔位** — 要么伪造传输，要么破坏仅本地选择器约定；在 Host 远程物化存在前拒绝。
- **在 client 内用真实 SSH 探测驱动步骤** — 违背 Host 中介的工作区身份与浏览器信任边界；拒绝。

## Consequences

- 设计与 Desktop IA 可用桩挂载该外壳；产品文案默认以中文放在组件上，直至接入 locale 注册。
- Host 驱动的完成动作必须留在本模块之外（属主回调或后续驱动），不得进入展示树。
- 导出纪律仍然适用：为该脚手架放宽 `./client` 需要明确的产品决定。
