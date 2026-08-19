# Agent Note: Zcode-like Desktop left rail as optional ui-sidebar chrome

Status: implemented

English | [中文](2026-08-20-desktop-left-rail-structure.zh.md)

## Problem

Desktop product IA ([Zcode-like Agent IDE map](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md), [home interaction contract](../../../../apps/desktop/docs/zcode-home-interaction-contract.json)) needs a left rail whose primary objects are New Task, Search, Automation, Plugin Market, project/task lists with empty copy, and a bottom account cluster. The shipped web sidebar is chat-first (wordmark, New Session, workspace browser seat, settings foot). Replacing that chrome for Desktop must not break the web composition path or force a second sidebar package.

## Decision

Extend `@deepseek-ai/dsh-client-ui-sidebar` with a presentational **DesktopRail** layout selected by plugin config, leaving **SidebarRoot** as the default web shell.

1. **Config flag, not a hard fork.** `Config.desktopRail` (schemastery, default `false`) is injected as `desktopRail` on the sidebar slot face. `SidebarShell` chooses `DesktopRail` or `SidebarRoot`. Web-app cordis rows stay flag-off; Desktop compositions set `config.desktopRail: true` on the ui-sidebar entry (or a later desktop slot that injects the same boolean).
2. **Same child seats.** Both shells declare and render `sidebar.workspaces`, `sidebar.settings`, and `sidebar.footer.action` with the same owner props (`wide`, `expandSidebar`). ui-workspace and ui-settings keep registering unchanged.
3. **Pure nav model.** `buildDesktopRailNavItems` / `buildDesktopRailSections` / `buildDesktopRailAccountItems` are package-internal pure builders whose ids and `action` names match the home interaction contract. Unit tests pin order and labels keys; handlers beyond New Task (`startSession`) stay no-ops until routes exist.
4. **ui-layout unchanged.** Column geometry, collapse width, and `SidebarOwnerProps` remain layout-owned; DesktopRail only consumes `collapsed`/`width` like SidebarRoot.

### Alternatives considered

- **Replace SidebarRoot in place** — rejected: web and Desktop IA diverge; web goldens and collapse motion would absorb Desktop-only chrome.
- **New `ui-desktop-rail` package occupying `sidebar`** — deferred: would drop the seats this package declares unless it re-declared them; config-gated chrome inside ui-sidebar keeps one declaration owner.
- **Detect `window.dshDesktop` inside the component** — rejected: presentation mode is composition/config, not ambient host sniffing in pure props components.

## Consequences

- Desktop product work can enable the rail without touching web defaults.
- Search / Automation / Plugin Market / account controls are structural placeholders until Host routes and inject callbacks land.
- Empty project/task copy is shell-owned presentational anchors; live list emptiness still belongs to ui-workspace when that seat fills the tasks region.

## Required verification

- Package tests: nav builders, DesktopRail DOM chrome, SidebarShell branch, apply inject `desktopRail`.
- Existing SidebarRoot collapse/snapshot suites remain green with `desktopRail: false`.
