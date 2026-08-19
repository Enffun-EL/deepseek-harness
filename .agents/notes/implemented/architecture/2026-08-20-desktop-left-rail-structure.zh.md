# Agent Note: 将 Zcode 风格 Desktop 左侧栏作为可选的 ui-sidebar 外壳

Status: implemented

[English](2026-08-20-desktop-left-rail-structure.md) | 中文

## 问题

Desktop 产品信息架构（[Zcode 风格 Agent IDE 地图](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)、[首页交互约定](../../../../apps/desktop/docs/zcode-home-interaction-contract.json)）需要左侧栏以新建任务、搜索、自动化、插件市场、带空态文案的项目/任务列表以及底部账号簇为主对象。现有 Web 侧边栏是会话优先（字标、新建会话、工作区浏览器 seat、设置页脚）。为 Desktop 更换该外壳时，不得破坏 Web 组合路径，也不得强制再开一个侧边栏包。

## 决策

在 `@deepseek-ai/dsh-client-ui-sidebar` 中扩展呈现层 **DesktopRail**，由插件配置选择，并保留 **SidebarRoot** 作为默认 Web 外壳。

1. **配置标志，而非硬分叉。** `Config.desktopRail`（schemastery，默认 `false`）经 inject 成为侧边栏 slot 面的 `desktopRail`。`SidebarShell` 在 `DesktopRail` 与 `SidebarRoot` 之间选择。web-app 的 cordis 行保持关闭；Desktop 组合在 ui-sidebar entry 上设置 `config.desktopRail: true`（或由后续 desktop slot 注入同一布尔值）。
2. **相同子 seat。** 两种外壳都声明并渲染 `sidebar.workspaces`、`sidebar.settings` 与 `sidebar.footer.action`，owner props（`wide`、`expandSidebar`）一致。ui-workspace 与 ui-settings 的注册方式不变。
3. **纯导航模型。** `buildDesktopRailNavItems` / `buildDesktopRailSections` / `buildDesktopRailAccountItems` 为包内纯构建函数，id 与 `action` 名对齐首页交互约定。单测钉住顺序与文案键；除新建任务（`startSession`）外的处理器在路由落地前保持空操作。
4. **ui-layout 不改。** 栏几何、折叠宽度与 `SidebarOwnerProps` 仍由 layout 持有；DesktopRail 与 SidebarRoot 一样只消费 `collapsed`/`width`。

### 曾考虑的替代

- **就地替换 SidebarRoot** — 否决：Web 与 Desktop IA 分叉，Web 金样与折叠动效会吞进仅 Desktop 的外壳。
- **新建占用 `sidebar` 的 `ui-desktop-rail` 包** — 暂缓：除非它重新声明，否则会丢掉本包声明的 seat；在 ui-sidebar 内用配置门控外壳可保持单一声明所有者。
- **在组件内探测 `window.dshDesktop`** — 否决：呈现模式属于组合/配置，不属于纯 props 组件里的宿主嗅探。

## 后果

- Desktop 产品工作可启用该栏而不改动 Web 默认。
- 搜索 / 自动化 / 插件市场 / 账号控件在 Host 路由与 inject 回调落地前只是结构占位。
- 项目/任务空态文案由外壳持有为呈现锚点；当 tasks 区域被 seat 填满时，真实列表空态仍属 ui-workspace。

## 必要验证

- 包测：导航构建器、DesktopRail DOM 外壳、SidebarShell 分支、apply inject 的 `desktopRail`。
- 既有 SidebarRoot 折叠/快照套件在 `desktopRail: false` 下保持绿色。
