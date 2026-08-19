# @deepseek-ai/dsh-client-ui-command-palette

[English](README.md) | 中文

全局命令面板脚手架（Zcode Ctrl+K）：注册到 `shell.overlay` 的宿主，支持开合、搜索查询、筛选页签（`全部`／`操作`／`任务`／`文件` → `all`／`actions`／`tasks`／`files`）、快捷键提示芯片，以及四条静态默认 shell 操作（新建任务、打开工作区、设置、切换侧边栏）。会话内 `/` 命令发现仍归 [ui-commands](../ui-commands/README.md)；本包是应用级操作面。产品锚点：[Zcode home 交互约定](../../../apps/desktop/docs/zcode-home-interaction-contract.json) 与 [对等能力清单](../../../apps/desktop/docs/zcode-parity-inventory.md)。

`filterCommandPaletteItems` 是纯函数：按条目 kind 与不区分大小写的多 token 查询（标题、描述、关键词）过滤。宿主将 Ctrl/Cmd+K 绑定为打开或关闭，Escape 关闭；方向键与 Enter 在过滤结果中导航。默认操作动词由 apply 注入：`startSession` 与 `toggleSidebar` 调用既有 runtime／layout 服务；打开工作区目前回退为 `startSession()`（工作区选择器仍在空白会话 hero）；打开设置在 settings 暴露共享 open API 之前为 no-op。任务与文件目录源未在本脚手架中接线。

`/client` 导出插件本体（`apply`／`inject`）以及条目／过滤／注入类型。宿主组件、默认目录与过滤辅助函数保留为包内实现，供同包测试直接引用。

## 模型体验

无；命令面板是客户端导航与 shell 操作面，此处没有任何内容进入模型请求。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **在来源接入前，任务与文件页签为空**——筛选页签已就位；当前仅交付静态 `action` 行。
- **打开工作区／设置为脚手架桩**——工作区选择器与设置可见性仍由各自包持有，尚无共享 open 服务。
- **不依赖 Electron**——命令面板是纯浏览器客户端插件；桌面打包加载同一套 web 客户端树。
