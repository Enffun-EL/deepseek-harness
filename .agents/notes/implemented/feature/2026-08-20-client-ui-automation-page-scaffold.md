# Agent Note: Client Automation page scaffold (`ui-automation`)

Status: implemented

English | [中文](2026-08-20-client-ui-automation-page-scaffold.zh.md)

## Problem

Desktop product IA names an **Automation** route (`/automation`) with scheduled and idle sections plus a keep-awake control ([interaction contract](../../../../apps/desktop/docs/zcode-home-interaction-contract.json); [Agent IDE note](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)). Existing client packages cover workflow-run chat nodes, session job mirrors, and goals, but none own the Automation **page** empty state, create CTAs, or idle template cards. Without a pure UI package boundary, the first implementation risks either burying presentation in `apps/desktop` or inventing Host scheduling before the jobs/cron seam exists.

## Decision

Ship `@deepseek-ai/dsh-client-ui-automation` as **pure React atoms** (same shape as `ui-attachment`):

- `AutomationPage` composes empty state, create scheduled/idle CTAs, keep-awake toggle, and idle template grid.
- Idle templates are static data: Git weekly summary, CI flaky report, docs sync (`IDLE_TEMPLATE_DEFINITIONS`).
- Keep-awake is **local React state only** (controlled or uncontrolled); no OS power API and no Host settings write.
- No cordis `apply`, no `dsh.client` web-app row, no RPC — owners mount later and pass callbacks.
- Package README documents the future **Host `dsh` jobs / scheduling** integration path without implementing it.

## Alternatives considered

### Implement Host cron + idle triggers in the same change

Rejected. Scheduling needs Host authority, durable registration, and model-visible job semantics; folding that into a first UI scaffold blocks the page and couples presentation to an unfinished seam.

### Put the page under `apps/desktop` renderer

Rejected. Business UI stays in `packages/client/*` ([Agent IDE note](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)); the Electron shell must not grow a second design system.

### Extend `ui-jobs` into the Automation page

Rejected. `ui-jobs` is a session-header mirror of live `jobsBySession` records. Automation is a product list/create surface (scheduled + idle templates) that will outlive a single session’s job snapshot. Reuse jobs for **in-flight** visibility later; do not overload the header popover.

### Full cordis plugin + sidebar route in P0 scaffold

Rejected for this change. Route ownership and slot declaration belong to layout/sidebar composition once navigation exists; pure atoms let Home/Desktop work proceed without false Host claims.

## Consequences

- New package: `packages/client/ui-automation` with component specs and invariant companion.
- `tsconfig.client.json` + `tsconfig.base.json` paths register the package for the client program; web-app bundle composition remains a follow-up.
- Create/template handlers and real keep-awake policy stay explicit TODOs at the owner layer.
- When Host automation ships, prefer remotes/commands adjacent to jobs/goal/workflow; keep this package props-in / callbacks-out.

## Verification

- Package component specs: empty state, both CTAs, local keep-awake toggle, three template cards and selection ids.
- Invariant companion registers under the package name.
- Focused `vitest` on `packages/client/ui-automation` (jsdom).