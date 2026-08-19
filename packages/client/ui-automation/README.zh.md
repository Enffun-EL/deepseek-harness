# @deepseek-ai/dsh-client-ui-automation

[English](README.md) | 中文

面向 Zcode 风格 **自动化** 页的纯 React 原子组件（零 cordis 插件体）：带空状态的页面壳、**创建定时任务** / **创建空闲任务** CTA、仅保存在本地 React state 的 **保持唤醒** 开关，以及静态 **空闲模板** 卡片（Git 周报摘要、CI 不稳定报告、文档同步）。所有文案由持有方通过自有 locale 路径（或导出的 `zh` / `en` 词典）解析后传入，动作经回调给出。本包不读取会话状态、不发起 RPC、也不调度 Host 工作。

本包是 **展示脚手架**。尚未挂入 web-app 组合；后续 shell 持有方（侧栏路由或 layout 页面 slot）导入 `AutomationPage` 并提供处理器。该表面的产品信息架构见 [Zcode home interaction contract](../../../apps/desktop/docs/zcode-home-interaction-contract.json)（`automation` 路由与分区）与 [Desktop Agent IDE note](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)。

## 表面

| 导出 | 职责 |
| --- | --- |
| `AutomationPage` | 组合页：标题、CTA、保持唤醒、空状态、模板网格 |
| `AutomationEmptyState` | 尚无自动化时的虚线空状态文案 |
| `KeepAwakeToggle` | 可访问的 `role="switch"`；仅持有方或页面本地布尔值 |
| `IdleTemplateGrid` | 基于已解析模板项的卡片网格 |
| `IDLE_TEMPLATE_DEFINITIONS` / `resolveIdleTemplates` | 静态目录 + 本地化物化 |
| `zh` / `en` / `automationString` | 尚无 locale 插件时的词典辅助 |

`hasAutomations` 默认为 `false`，脚手架下显示空状态；Host 列表就绪后再翻转。省略 `onClick` / `onSelect` 时 CTA 与模板按钮禁用，只读挂载保持诚实。

保持唤醒是 **本地 UI 状态**：非受控模式使用 `AutomationPage` 内的 `useState`（`defaultChecked`）；受控模式传入 `checked` + `onChange`。两条路径都不会调用 OS 电源 API 或 Host 设置。

## 未来 Host 任务调度（`dsh` jobs）

**不要**在本包内实现调度。当 Host 自动化能力存在时，由薄的客户端持有方（插件或路由壳）接线，而不是把这些原子长成 store：

1. **列表 / 空状态** — Host 对定时 + 空闲自动化的投影或 RPC 替换 `hasAutomations` 与未来的列表区；空状态仍是零条情形。
2. **创建定时 / 空闲** — CTA 打开创建流并调用 Host API（多半毗邻会话 **jobs** / 后台运行缝，以及未来的 cron 或空闲触发注册表）。优先复用 jobs/goal/workflow 包已有的 command 或 remote，而不是并行的客户端调度器。
3. **模板** — 静态卡片变为「从模板创建」载荷（prompt + 触发类型 + 默认节奏）。目录以后可迁到 Host；在此之前 `IDLE_TEMPLATE_DEFINITIONS` 是产品顺序的权威来源。
4. **保持唤醒** — 仅当真实电源/空闲策略存在时（`apps/desktop` 或 Host 设置），再把本地状态提升为 Host 或桌面 shell 偏好。在此之前开关只是 UX 占位，不得宣称机器不会休眠。
5. **进行中的运行** — 运行中自动化的可见性继续以 [`ui-jobs`](../ui-jobs/README.md)（会话 job 镜像）为种子；不要在本页复制 job 注册表。

决策边界与否决方案见本包 Agent Note。

## 模型体验

无。该包在浏览器中渲染纯 React 原子组件；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **无 Host 接线** — 创建处理器、模板选择与保持唤醒均不持久化、不调度。
- **无自动化列表 UI** — 仅有空状态 + 模板；Host 数据就绪后再做已填充列表。
- **未编入 web-app** — 本变更不含 `cordis.patch.yml` 行，也不注册侧栏路由。
- **保持唤醒仅为外观** — 仅本地 React state；不会阻止系统休眠。
