# @deepseek-ai/dsh-client-ui-home

[English](README.md) | 中文

面向 Zcode 风格 **HOME 空状态** 的纯 React 原子组件（无 cordis 插件本体）：`HomeGreeting`、`ModelStatusBanner`（缺模型引导）、`ProjectPickerButton`（仅 props 与回调）、`HomeComposerChrome`（权限模式选择 + 模型选择 + 提交占位）、`StarterPromptList` 与 `TemplateCardGrid`。`HomeEmptyState` 将上述原子纵向拼成演示布局；产品侧也可单独挂载各导出。所有文案经 props 或导出的 `zh`/`en` 词典（`homeString`）传入；本包不读取应用状态、不打开对话框、不发起 Remote 调用。

## 如何挂载（TODO）

本包 **尚未** 注册进 web-app 的 cordis 配置。在不破坏 monorepo 构建的前提下可按如下方式接入：

1. **导入原子**：从 `@deepseek-ai/dsh-client-ui-home` 导入（在消费者打包前可通过 tsconfig paths 指向源码）。
2. **推荐产品落点**：接入 [`ui-conversation`](../ui-conversation/README.md) 所拥有的空白「新会话」hero——当前为 `ConversationRoot` / `HeroShell` 以及 `conversation.hero.workspace`、`conversation.hero.agentPreset`。可用 `HomeEmptyState` 替换 hero 外壳，或在现有 composer 卡片周围安放单个原子。
3. **仅桌面路径**：若 HOME 必须留在共享 Web profile 之外，则从 `apps/desktop` 壳层挂载。
4. **文案**：调用 `homeString(locale, key)`；待增加 cordis 浏览器半部时，再将 `zh`/`en` 注册到未来的 `home` 命名空间。
5. **动作**：由持有方传入 `onConfigure` / `onClick` / `onPermissionModeChange` / `onModelChange` / `onSubmit` / `onSelect`（打开设置、目录选择、启动会话等）。本包从不拥有这些副作用。

## 模型体验

无。该包（package）在浏览器中渲染纯 React 原子组件；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **无 cordis `apply` / slot 注册** — 导出仅为库原子；web-app 的 `cordis.patch.yml` 与 `./client` 入口仍属后续工作。
- **无实时模型或权限数据** — 选项与选中值均为 props；host 投影仍归 `ui-model-selection` / `ui-permission-presets`。
- **Composer 正文为占位** — 真正的文本框与发送路径仍在 `ui-conversation` 的 `InputBar`。
