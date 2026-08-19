# Agent Note: Task side-rail presentational atoms

Status: implemented

[English](2026-08-20-task-side-rail-presentational-atoms.md) | 中文

## Problem

Desktop Agent IDE 信息架构把活跃任务视为 **时间线 + Git 工具 + Goal / Progress**（[产品地图](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)）。Composer 已拥有 GoalBar（`ui-goal`）与 TodoDock（`ui-conversation`）；详情栏拥有工具检视（`DetailsPanel`）。尚无组件把更密的 Git / 目标 / 清单伴侣打包成右侧栏或详情栏占用者可挂载的形态，同时又不把 cordis、slot 或宿主 remote 拉进纯展示层。

若把该 chrome 折进 `ui-goal` 或 `ui-conversation`，要么用它并不拥有的 SCM props 撑胀 goal dock 插件，要么把会话骨架内部耦合到仍未接线的产品面。完整的 `ui-git` + 宿主能力才是真正的 SCM 产品，目前尚未就绪。

## Decision

以与 [`ui-attachment`](../../../../packages/client/ui-attachment/README.md) 相同的姿态交付 **`@deepseek-ai/dsh-client-ui-task-side-rail`** 纯 React 原子：浏览器路径零 cordis apply、仅 label props、不注册 slot；在有归属方挂载之前不写 bundle 的 `cordis.patch.yml` 行。

包导出：

| 导出 | 职责 |
| --- | --- |
| `GitToolsCard` | 分支名、已暂存 / 未暂存 / 未跟踪计数、提交回调 |
| `GoalCard` | 只读阶段 + 目标正文；加载中 / 缺席 / 已完成时为 null |
| `ProgressChecklist` | 展开清单 + 百分比标题/进度条 |
| `progressPercent` | 已完成/总数向下取整为 `[0, 100]`；空列表 → `0` |
| `TaskSideRail` | 固定顺序 Git → Goal → Progress 的可选堆叠 |

进度项状态与宿主 todo 投影一致（`pending` / `in_progress` / `completed`），归属方可直接传入 `todos` 而无需映射。目标可见性与 GoalBar 对齐（已完成目标隐藏）。无回调、无变更或归属方设置 `commitDisabled` 时提交保持禁用。

包已列入 `tsconfig.client.json` 与 `packages/client/README*`。**尚未**编入 web-app bundle —— 后续归属插件再注册到详情栏 / 任务侧栏孔位，并桥接投影与 SCM。

## Alternatives considered

### 在 `ui-goal` 中扩展侧栏卡片

否决。GoalBar 是挂在 `remote.goals` 上的 dock inject 面。Git 计数与清单百分比是无关域；塞进 goal 包会制造虚假归属边界，并迫使每个 goal 消费者依赖 SCM 类型。

### 在本包立即注册 slot 占用者

否决于脚手架这一刀。尚无宿主 Git 状态投影，也无专用任务侧栏孔位。渲染空 props 的死 slot 条目会看起来像产品面却仍未接线。先原子；有数据后再写归属插件。

### 在卡片中嵌入完整 IDE diff / 暂存 UI

否决于产品地图的 P0/P1 范围：Git 工具保持状态 + 提交助手密度；深层 diff 仍属工具卡片与未来的 `ui-git` 面板。

## Consequences

- 归属方可在类 Storybook 的单测与未来的详情栏占用者中组合任务右侧栏 chrome，而无需等待 SCM RPC。
- `progressPercent` 是清单比例的唯一纯辅助函数；规格钉住空、部分、取整与全满情形。
- Bundle 组合、locale 命名空间与实时 Git 接线仍是后续工作；本包有意保持为可导入的原子库。
