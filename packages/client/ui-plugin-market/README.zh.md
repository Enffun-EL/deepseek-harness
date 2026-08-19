# @deepseek-ai/dsh-client-ui-plugin-market

[English](README.md) | 中文

面向 Desktop/Web 组合的 Zcode 风格**插件市场壳层**。本包在**静态 fixture 目录**之上提供纯展示面：搜索框、**已安装**占位行、**开发者工具**与**效率工具**分类浏览，以及默认回调为空操作的**创建插件**按钮。搜索过滤是作用于 fixture 的纯函数（`filterPluginMarketCatalog`），并由包内测试覆盖。

该表面**不是**设置里的插件清单。[`ui-settings-plugin-inventory`](../ui-settings-plugin-inventory/README.md) 仍是只读的 Host Loader 部署真值；市场是后续发现/安装体验的产品路径。本脚手架不调用 Host RPC、不变更 Loader，也尚未注册到 AppFrame 导航——浏览器半只注册 `pluginMarket` locale 命名空间，便于后续侧栏路由挂载 `PluginMarketShell` 时不必再造文案。

## 模型体验

无，因为本包仅为人类渲染静态 fixture 卡片，不触及 prompt、消息、schema、流或工具结果。

#### KV Cache effect

无；本包从不组装或发送 provider 请求。

## 已知限制与暂缓事项

- **仅 fixture 目录** —— 安装、启用/停用、远程 registry 与 Host inventory 合并均不在本壳层脚手架范围内。
- **尚无布局路由** —— 左侧栏 `navigatePluginMarket` 接线与正式的 AppFrame slot 声明，待 Desktop home chrome 拥有该路由后再做。
- **创建插件为空操作** —— CTA 仅为信息架构占位；创作流程有意延后。
