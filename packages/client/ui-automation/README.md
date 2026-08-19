# @deepseek-ai/dsh-client-ui-automation

English | [中文](README.zh.md)

Pure React atoms for the Zcode-like **Automation** page (zero cordis plugin body): page shell with empty state, **Create scheduled task** / **Create idle task** CTAs, a **Keep awake** toggle held in local React state only, and static **idle template** cards (Git weekly summary, CI flaky report, docs sync). Owners resolve every string through their own locale path (or the exported `zh` / `en` maps) and pass actions via callbacks. Nothing here reads session state, opens RPCs, or schedules Host work.

This package is a **presentation scaffold**. It is not mounted into the web-app composition yet; a later shell owner (sidebar route or layout page slot) imports `AutomationPage` and supplies handlers. Product IA for the surface lives in the [Zcode home interaction contract](../../../apps/desktop/docs/zcode-home-interaction-contract.json) (`automation` route and sections) and the [Desktop Agent IDE note](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md).

## Surface

| Export | Role |
| --- | --- |
| `AutomationPage` | Composed page: header, CTAs, keep-awake, empty state, template grid |
| `AutomationEmptyState` | Dashed empty copy when no automations exist |
| `KeepAwakeToggle` | Accessible `role="switch"`; owner or page-local boolean only |
| `IdleTemplateGrid` | Card grid over resolved template items |
| `IDLE_TEMPLATE_DEFINITIONS` / `resolveIdleTemplates` | Static catalog + locale materialization |
| `zh` / `en` / `automationString` | Dictionary helpers for owners without a locale plugin yet |

`hasAutomations` defaults to `false` so the empty state shows in the scaffold. Flip it when a Host list exists. CTA and template buttons disable when their `onClick` / `onSelect` handlers are omitted, so a read-only mount stays honest.

Keep-awake is **local UI state**: uncontrolled mode uses `useState` inside `AutomationPage` (`defaultChecked`); controlled mode passes `checked` + `onChange`. Neither path calls OS power APIs or Host settings.

## Future Host job scheduling (`dsh` jobs)

Do **not** implement scheduling in this package. When Host automation exists, wire it from a thin client owner (plugin or route shell), not by growing these atoms into a store:

1. **List / empty** — Host projection or RPC of scheduled + idle automations replaces `hasAutomations` and any future list section; empty state stays the zero case.
2. **Create scheduled / idle** — CTAs open a create flow that calls Host APIs (likely adjacent to session **jobs** / background-run seams and any future cron or idle-trigger registry). Prefer commands or remotes already owned by jobs/goal/workflow packages over a parallel client scheduler.
3. **Templates** — static cards become “create from template” payloads (prompt + trigger kind + default cadence). Catalog may move Host-side later; until then `IDLE_TEMPLATE_DEFINITIONS` is the product order of record.
4. **Keep awake** — promote local state to a Host- or desktop-shell preference only when a real power/idle policy exists (`apps/desktop` or Host settings). Until then the toggle is a UX placeholder and must not claim the machine stays awake.
5. **Live runs** — in-flight automation visibility continues to seed from [`ui-jobs`](../ui-jobs/README.md) (session job mirror); do not duplicate the job registry in this page.

See the package Agent Note for the decision boundary and rejected alternatives.

## Model Experience

None, as the package renders pure React atoms in the browser; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No Host wiring** — create handlers, template select, and keep-awake do not persist or schedule.
- **No automation list UI** — only empty state + templates; a filled list is a follow-up once Host data exists.
- **Not composed into web-app** — no `cordis.patch.yml` row and no sidebar route registration in this change.
- **Keep-awake is cosmetic** — local React state only; does not inhibit system sleep.
