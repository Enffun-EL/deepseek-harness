# Agent Note: 对齐 Zcode 的权限模式文案

Status: implemented

[English](2026-08-20-zcode-like-permission-mode-labels.md) | 中文

## 问题

桌面产品信息架构要对齐 Zcode 式权限用语——变更前确认 / 自动编辑 / 计划模式 / 完全访问——而 DSH 已有稳定的机器预设（`read-only`、`workspace-write`、`danger-full-access`）以及独立的 plan mode 协作控件。用户可见界面仍把机器名 Title Case 化（`Read Only`、`Workspace Write`），或在中文确认文案里夹杂英文产品名，导致 composer、设置行与 `/permission` 弹出层与目标产品语言不一致。

## 决策

保持 host 预设机器值与 permission-presets 表不变，只改呈现层映射：

| 机器值 | 英文标签 | 中文标签 |
|---|---|---|
| `read-only` | Ask before edits | 变更前确认 |
| `workspace-write` | Auto edit | 自动编辑 |
| `danger-full-access` | Full access | 完全访问 |

计划模式仍不进入权限预设轴：`dsh-plan-mode` / `ui-plan` 继续拥有进入、退出与 composer chip；中文无障碍文案使用「计划模式」，不发明第四个预设 id。

约定标签表与 `displayPermissionPreset` / `translatePermissionPreset` 助手归 `ui-permission-presets` 的 presentation 所有。Settings 选项只存 host `name`，在渲染时经 locale 键解析产品标签，以便语言切换即时生效。Composer 的 `PermissionSelect` 在 conversation 命名空间下保留孪生的 `access.preset.*` 键（与可选包之间既有 Full access 风险文案分叉同一模式）。

## 考虑过的替代方案

- **重命名 host 预设或新增 Zcode id** — 否决：会破坏持久日志、settings 文档、斜杠命令以及所有沙箱/审批旋钮消费方。
- **把 plan mode 并入权限选择器** — 否决：plan mode 是带独立日志事件与退出审阅的软引导；沙箱与审批必须保持独立。
- **让 ui-conversation 依赖 ui-permission-presets 共享 locale** — 暂缓：可选包加载顺序本就复制了 access 确认文案；标签键沿用该既有拆分。

## 后果

- 钉死访问模式 chrome 的产品用户可见字符串与 web 快照须改用新标签；机器命令行仍为 `/permission <preset>`。
- 三个约定 id 之外的自定义 host 预设名仍走 Title Case 或原样透传。
- Full access 风险确认文案本地化产品名（中文为「完全访问」），英文保持 "Full access"。
