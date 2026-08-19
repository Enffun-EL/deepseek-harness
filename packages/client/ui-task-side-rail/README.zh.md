# @deepseek-ai/dsh-client-ui-task-side-rail

[English](README.md) | 中文

纯 React 任务侧栏原子（零 cordis）：`GitToolsCard`、`GoalCard`、`ProgressChecklist`，以及把它们叠成任务视图详情栏 / 右侧栏姿态的 `TaskSideRail` 组合件。所有文案都通过 label props 由归属插件自己的 locale 命名空间解析后传入；此处不读应用状态、不注册 slot、不发 RPC。归属方（未来的详情栏占用者或任务 chrome 插件）把投影与 SCM 状态桥接到这些 props。

本包是 Desktop 产品 IA 中 **Git 工具 + Goal / Progress** 侧栏内容的展示半部。它有意不取代 composer 停靠的 [`ui-goal`](../ui-goal/README.md) GoalBar，也不取代会话 TodoDock：后者仍是流程内条带；本侧栏是宿主接线后详情栏里更密的伴侣视图。

## 卡片

- **`GitToolsCard`** — 分支名、已暂存 / 未暂存 / 未跟踪计数，以及归属方提供回调的提交按钮。无回调、无变更或 `commitDisabled` 时控件保持禁用。
- **`GoalCard`** — 进行中 / 已暂停 / 受阻目标的只读阶段标签与目标正文。加载中、缺席与已完成目标不渲染（与 GoalBar 可见性对齐）。
- **`ProgressChecklist`** — 带百分比标题与进度条的展开清单。状态词表与宿主 todo 投影一致（`pending` / `in_progress` / `completed`）。空列表不渲染。
- **`progressPercent`** — 纯函数：已完成/总数向下取整为 `[0, 100]` 的整数百分比；空列表为 `0`。
- **`TaskSideRail`** — 固定顺序 Git → Goal → Progress 的 landmark 堆叠；通过省略 props 可选每个席位。

## 模型体验

无，因为本包只在浏览器中渲染纯 React 原子；此处不会进入任何模型请求。

#### KV Cache effect

无；本包既不组装也不发送 provider 请求。

## 已知限制与延后工作

- **不注册 slot** — 消费插件须把这些原子挂到 `conversation.details`（或专用任务侧栏孔位），并自管 locale / SCM / 投影接线。
- **无实时 Git 域** — 计数与分支是普通 props；宿主 git 能力与 `ui-git` 归属仍是独立工作。
- **Goal 卡片只读** — 变更动词仍留在 GoalBar 的 inject 面，直到侧栏归属方复用那些动词。
