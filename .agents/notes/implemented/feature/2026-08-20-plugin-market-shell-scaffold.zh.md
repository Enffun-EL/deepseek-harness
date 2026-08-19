# Agent Note: 插件市场壳层脚手架

Status: implemented

[English](2026-08-20-plugin-market-shell-scaffold.md) | 中文

## 问题

Desktop Agent IDE 地图与 [Zcode home 交互契约](../../../apps/desktop/docs/zcode-home-interaction-contract.json) 要求提供 **插件市场** 路由（`/plugins`），包含已安装列表与分类浏览，并与设置中的插件清单区分。Host 安装/registry API 与左侧栏导航尚不存在。若从安装 RPC 或 AppFrame 路由所有权起步，会在发现体验落地前过早引入信任面与 Loader 变更缝。

## 决策

以**展示脚手架**交付 `@deepseek-ai/dsh-client-ui-plugin-market`：

1. **静态 fixture JSON** —— 已安装占位，以及 **开发者工具** 与 **效率工具** 分区（`src/client/fixtures/catalog.json`）。
2. **纯搜索过滤** —— `filterPluginMarketCatalog` / `matchesPluginMarketEntry` 覆盖 id、名称、摘要与分类；行为由包内测试保证。
3. **壳层 chrome** —— 搜索框、已安装行、分类分区，以及默认回调为空操作的 **创建插件** CTA。
4. **apply 仅注册 locale** —— 浏览器半注册 `pluginMarket` 命名空间；本切口不含 layout slot 或 Host Remote。

设置清单（[`ui-settings-plugin-inventory`](../../../packages/client/ui-settings-plugin-inventory/README.md)）仍是只读 Host Loader 部署真值。市场是后续发现/安装产品表面（[Agent IDE 地图](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)）。

## 备选方案

- **把插件清单扩展成市场** —— 清单是部署真值，须保持 Host 只读；市场 IA（浏览、安装、创建）会压垮该契约；否决。
- **立刻接线 `navigatePluginMarket` + AppFrame 路由** —— 左侧栏 chrome 仍在落地；在没有稳定 shell 孔位时挂全页路由会发明 layout 所有权；延后。
- **在脚手架里做真实安装/registry** —— 在任务循环主页清晰之前扩大信任与分发面；否决（与产品地图「市场属 Later」一致）。

## 后果

- 设计与 Desktop IA 可用 fixture 与 stub CTA 挂载 `PluginMarketShell`。
- 后续路由所有者挂载壳层并提供 `onCreatePlugin` / 实时目录 props；Host 安装仍在展示树之外。
- 导出纪律：`./client` 仅导出 `apply`/`inject` 与目录/壳层类型；过滤助手与壳层组件保留为包内，供同包测试使用。