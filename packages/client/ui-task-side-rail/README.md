# @deepseek-ai/dsh-client-ui-task-side-rail

English | [中文](README.zh.md)

Pure React task side-rail atoms (zero cordis): `GitToolsCard`, `GoalCard`, `ProgressChecklist`, and the `TaskSideRail` composition that stacks them for the task view's details / right-rail posture. Every string arrives through label props resolved by the owning plugin's own locale namespace, and nothing here reads application state, registers slots, or issues RPCs. Owners (a future details occupant or task chrome plugin) bridge projections and SCM status into these props.

This package is the presentational half of the Agent IDE **Git tools + Goal / Progress** side content called out in the Desktop product IA. It deliberately does not replace the composer-docked [`ui-goal`](../ui-goal/README.md) GoalBar or the conversation TodoDock: those stay the in-flow strips; this rail is the denser companion for the details column once a host wires it.

## Cards

- **`GitToolsCard`** — branch name, staged / unstaged / untracked counts, and a commit button whose callback the owner supplies. The control stays disabled when there is no callback, no changes, or `commitDisabled` is set.
- **`GoalCard`** — read-only phase label + objective for an active / paused / blocked goal. Loading, absent, and complete goals render nothing (parity with GoalBar visibility).
- **`ProgressChecklist`** — expanded checklist with a percent header and meter. Status vocabulary matches the host todo projection (`pending` / `in_progress` / `completed`). Empty lists render nothing.
- **`progressPercent`** — pure helper: floored completed/total percent in `[0, 100]`; empty list is `0`.
- **`TaskSideRail`** — landmark stack in fixed order Git → Goal → Progress; each seat is optional via omitted props.

## Model Experience

None, as the package renders pure React atoms in the browser; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No slot registration** — a consumer plugin must mount these atoms into `conversation.details` (or a dedicated task-rail hole) and own locale / SCM / projection wiring.
- **No live Git domain** — counts and branch are plain props; host git capability and `ui-git` ownership remain separate work.
- **Goal card is read-only** — mutations stay on the GoalBar inject face until a side-rail owner reuses those verbs.
