# Agent Note: Task side-rail presentational atoms

Status: implemented

English | [中文](2026-08-20-task-side-rail-presentational-atoms.zh.md)

## Problem

The Desktop Agent IDE IA treats an active task as **timeline + Git tools + Goal / Progress** ([product map](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)). Composer already owns the GoalBar (`ui-goal`) and TodoDock (`ui-conversation`); the details column owns tool inspection (`DetailsPanel`). Nothing yet packages the denser Git / goal / checklist companion that a right-rail or details occupant can mount without pulling cordis, slots, or host remotes into pure presentation.

Folding that chrome into `ui-goal` or `ui-conversation` would either bloat the goal dock plugin with SCM props it does not own, or couple conversation skeleton internals to a product surface that is still unwired. A full `ui-git` + host capability is the real SCM product and is not ready.

## Decision

Ship **`@deepseek-ai/dsh-client-ui-task-side-rail`** as pure React atoms in the same posture as [`ui-attachment`](../../../../packages/client/ui-attachment/README.md): zero cordis apply on the browser path, label props only, no slot registration, no bundle `cordis.patch.yml` row until an owner mounts it.

The package exports:

| Export | Role |
| --- | --- |
| `GitToolsCard` | Branch name, staged / unstaged / untracked counts, commit callback |
| `GoalCard` | Read-only phase + objective; null for loading / absent / complete |
| `ProgressChecklist` | Expanded checklist + percent header/meter |
| `progressPercent` | Floored completed/total percent in `[0, 100]`; empty → `0` |
| `TaskSideRail` | Optional stack in fixed order Git → Goal → Progress |

Progress item status matches the host todo projection (`pending` / `in_progress` / `completed`) so owners can pass `todos` through without a mapping step. Goal visibility matches GoalBar (complete goals hide). Commit stays disabled without a callback, without changes, or when the owner sets `commitDisabled`.

The package is referenced from `tsconfig.client.json` and listed in `packages/client/README*`. It is **not** composed into the web-app bundle yet — a later owner plugin registers into details / a task-rail hole and bridges projections + SCM.

## Alternatives considered

### Extend `ui-goal` with side-rail cards

Rejected. GoalBar is a dock inject face over `remote.goals`. Git counts and checklist percent are unrelated domains; stuffing them into the goal package would invent a false ownership boundary and force SCM types onto every goal consumer.

### Register a slot occupant in this package immediately

Rejected for the scaffold cut. There is no host Git status projection and no dedicated task-rail hole yet. A dead slot entry that renders empty props would look like product surface while remaining unwired. Atoms first; owner plugin when data exists.

### Embed full IDE diff / stage UI in the card

Rejected for P0/P1 scope in the product map: Git tools stay status + commit helper density; deep diff stays tool cards and a future `ui-git` panel.

## Consequences

- Owners can compose task right-rail chrome in Storybook-style unit tests and future details occupants without waiting on SCM RPCs.
- `progressPercent` is the single pure helper for checklist ratio; specs pin empty, partial, floor, and full cases.
- Bundle composition, locale namespaces, and live Git wiring remain follow-up work; this package deliberately stays an importable atom library.
