# Agent Note: 客户端自动化页脚手架（`ui-automation`）

Status: implemented

[English](2026-08-20-client-ui-automation-page-scaffold.md) | 中文

## 问题

Desktop 产品信息架构定义了 **自动化** 路由（`/automation`），含定时与空闲分区以及保持唤醒控件（[interaction contract](../../../../apps/desktop/docs/zcode-home-interaction-contract.json)；[Agent IDE note](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)）。现有客户端包覆盖 workflow-run 聊天节点、会话 job 镜像与 goal，但没有一方拥有自动化 **页面** 的空状态、创建 CTA 或空闲模板卡片。若缺少纯 UI 包边界，首版实现容易把展示埋进 `apps/desktop`，或在 jobs/cron 缝尚未成型时发明 Host 调度。

## 决策

交付 `@deepseek-ai/dsh-client-ui-automation` 作为 **纯 React 原子**（形态同 `ui-attachment`）：

- `AutomationPage` 组合空状态、创建定时/空闲 CTA、保持唤醒开关与空闲模板网格。
- 空闲模板为静态数据：Git 周报摘要、CI 不稳定报告、文档同步（`IDLE_TEMPLATE_DEFINITIONS`）。
- 保持唤醒 **仅本地 React state**（受控或非受控）；无 OS 电源 API，无 Host 设置写入。
- 无 cordis `apply`、无 `dsh.client` web-app 行、无 RPC — 持有方稍后挂载并传入回调。
- 包 README 说明未来 **Host `dsh` jobs / 调度** 接入路径，但不实现后端。

## 备选方案

### 同一变更内实现 Host cron + 空闲触发

否决。调度需要 Host 权威、持久注册与对模型可见的 job 语义；并入首个 UI 脚手架会阻塞页面，并把展示耦合到未完成的缝。

### 把页面放在 `apps/desktop` 渲染进程

否决。业务 UI 留在 `packages/client/*`（[Agent IDE note](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)）；Electron shell 不得长出第二套设计系统。

### 把 `ui-jobs` 扩成自动化页

否决。`ui-jobs` 是会话标题栏对实时 `jobsBySession` 的镜像。自动化是产品级列表/创建表面（定时 + 空闲模板），生命周期长于单会话 job 快照。进行中的可见性可后续复用 jobs；不要压垮标题栏弹层。

### P0 脚手架就做完整 cordis 插件 + 侧栏路由

本变更否决。路由归属与 slot 声明应在导航就绪后由 layout/sidebar 组合承担；纯原子让 Home/Desktop 工作可推进，且不产生虚假的 Host 能力宣称。

## 后果

- 新包：`packages/client/ui-automation`，含组件规格与 invariant companion。
- `tsconfig.client.json` 与 `tsconfig.base.json` paths 将该包纳入 client 程序；web-app bundle 组合仍为后续工作。
- 创建/模板处理器与真实保持唤醒策略留在持有方层的显式 TODO。
- Host 自动化落地时，优先使用毗邻 jobs/goal/workflow 的 remote/command；本包保持 props 入 / 回调出。

## 验证

- 包组件规格：空状态、两个 CTA、本地保持唤醒开关、三张模板卡片及选择 id。
- Invariant companion 以包名注册。
- 针对 `packages/client/ui-automation` 的聚焦 `vitest`（jsdom）。