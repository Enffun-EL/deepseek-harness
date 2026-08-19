# Zcode-like Desktop build plan

Execution plan for the Zcode-like Agent IDE work on `feature/desktop-integration`. It coordinates **20+ parallel workstreams already launched** (scaffolds, docs, shell, packaging), states **merge order**, names **high-risk seams** (bilingual pairing hooks, desktop client profile mount), and freezes **P0 definition of done**.

**Authorities (do not fork product truth here):**

| Doc | Role |
| --- | --- |
| [zcode-home-interaction-contract.json](./zcode-home-interaction-contract.json) | Stable ids, routes, left-rail actions, empty-state copy, permission mode labels, `mvpP0` / `outOfScopeP0` |
| [zcode-parity-inventory.md](./zcode-parity-inventory.md) | Existing `packages/client/*` vs gap matrix |
| [desktop-web-profile-mount.md](./desktop-web-profile-mount.md) | How Desktop mounts client packages without breaking default `dsh web` |
| [Agent IDE IA note](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md) | Product one-liner, layer ownership, MVP cuts |
| [Left rail structure note](../../../.agents/notes/implemented/architecture/2026-08-20-desktop-left-rail-structure.md) | `ui-sidebar` `Config.desktopRail` decision |

Peer product “Zcode” is an **IA and workflow lens only** — not a visual/brand clone. Implementation stays Host + `packages/client/*` + Electron supervisor — never a second SPA inside `apps/desktop`, and never a reskin of peer pixels/CSS/assets. Full rule: [Agent IDE IA note — Borrow, do not clone](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md#borrow-do-not-clone-hard-design-rule).

---

## Goal and non-goals

### Goal

Ship a **local Agent IDE home in ~30 seconds** on Desktop: left rail that navigates, home empty state that starts work, open-folder via existing directory pickers, visible permission mode, and an offline-capable Host that still boots under the Electron supervisor. **Look and voice stay DSH** (`ui-theme`, product copy); structure may rhyme with peer IA.

### Non-goals (P0)

Contract `outOfScopeP0` plus:

- Full multi-window / multi-workspace management
- Deep plugin authoring IDE inside the market
- Mobile companion beyond a home entry affordance
- Billing checkout beyond upgrade entry points
- Team/org admin consoles
- Remote providers beyond the wizard **scaffold** (live SSH/WSL/Docker backends are P1+)
- Advanced automation builder beyond template shells
- Full settings app shell (P0 is flyout / existing modal sections)
- Air-gapped enterprise policy packs
- **Pixel / skin parity** with Zcode or any peer (icons, glow, marketing chrome, trademarked copy)
- Forking `ui-conversation` into a desktop-only chat stack
- Unpacking peer installers (`app.asar`, etc.) for assets or CSS

---

## Parallel workstreams (already launched)

Streams below are the **fan-out already in flight** on this branch (scaffolds + docs + desktop foundation). Status is **scaffold / foundation / wiring** — not “product done.” Owners may parallelize freely **within** a stream; cross-stream merges follow [Merge order](#merge-order).

### A — Product docs and contracts

| ID | Workstream | Primary paths | Status intent |
| --- | --- | --- | --- |
| A1 | Home interaction contract | `apps/desktop/docs/zcode-home-interaction-contract.json` | **Landed** — ids/actions are wiring anchors |
| A2 | Parity inventory | `apps/desktop/docs/zcode-parity-inventory.md` | **Landed** — gap list for later cuts |
| A3 | Agent IDE IA note | `.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.*` | **Landed** — product map |
| A4 | Profile mount plan | `apps/desktop/docs/desktop-web-profile-mount.md` | **Landed / refine** — default-web safety |
| A5 | This build plan | `apps/desktop/docs/zcode-build-plan.md` | **This file** |

### B — Desktop shell and offline Host

| ID | Workstream | Primary paths | Status intent |
| --- | --- | --- | --- |
| B1 | Electron main + Host supervisor | `apps/desktop/src/host/*`, `src/main.ts` | **Foundation** — spawn/ready/restart |
| B2 | Secure preload / IPC channels | `apps/desktop/src/shell/*`, `preload.ts` | **Foundation** — single-source channel names |
| B3 | First-run / loading / error pages | `apps/desktop/src/shell/pages.ts` | **Foundation** — shell UX |
| B4 | Offline Host runtime staging | `apps/desktop` host-dist / portable Node staging | **Foundation** — packaged boot without developer monorepo PATH hacks |
| B5 | electron-builder packaging | `apps/desktop` builder config | **Foundation** — installers follow Host readiness |
| B6 | Auto-update consent | `apps/desktop/src/update/*` | **Foundation** — main-process dialogs only |
| B7 | Desktop CI / host+electron smokes | `apps/desktop/tests`, package scripts | **Foundation** — gate regressions |
| B8 | Reserved accelerators (Ctrl+N / Ctrl+K) | `apps/desktop/src/shell/reserved-accelerators.ts` | **In progress** — must not steal Web palette/new-task |

### C — Client chrome scaffolds (presentation)

| ID | Workstream | Package | Status intent |
| --- | --- | --- | --- |
| C1 | Left rail structure | `ui-sidebar` (`Config.desktopRail`) | **Scaffold landed** — nav ids match contract; actions beyond New Task still placeholders |
| C2 | Home empty-state atoms | `ui-home` | **Scaffold landed** — pure atoms; **no** `./client` / cordis row yet |
| C3 | Permission mode labels | `ui-permission-presets` (+ Host preset copy where needed) | **Scaffold landed** — Zcode-like labels on existing preset ids |
| C4 | Task side rail atoms | `ui-task-side-rail` | **Scaffold landed** — Git/Goal/Progress presentation only |
| C5 | Remote workspace wizard UI | remote wizard package / workspace flow | **Scaffold landed** — four-step IA; backends later |
| C6 | Automation page atoms | `ui-automation` | **Scaffold landed** — no Host scheduler |
| C7 | Plugin market shell | `ui-plugin-market` | **Scaffold landed** — fixture catalog; not Loader inventory |
| C8 | Command palette | `ui-command-palette` | **Scaffold landed** — already on default web-app roster |

### D — Existing surfaces to reuse (not re-scaffold)

These are **not** greenfield streams; P0 wiring **composes** them:

| ID | Surface | Package(s) | P0 use |
| --- | --- | --- | --- |
| D1 | Conversation / composer / hero | `ui-conversation` | Mount home empty state; real composer body |
| D2 | Workspace list + picker | `ui-workspace` | Project/task lists; empty seats |
| D3 | Directory pickers | `ui-directory-picker-native`, `ui-directory-picker-browse` | **Open folder** |
| D4 | Model seat + models settings | `ui-model-selection`, `ui-settings-models` | Model missing banner / picker |
| D5 | Plan mode chip | `ui-plan` | Distinct from permission dropdown |
| D6 | Layout / overlays | `ui-layout`, `web`, `web-react` | Frame, collapse rail, palette host |
| D7 | Settings shell | `ui-settings`, `ui-settings-general` | Gear / flyout sections via existing modal |
| D8 | Slash commands | `ui-commands`, `ui-input-trigger` | Power path; palette does not replace `/` |

### E — Integration streams (must converge for P0)

| ID | Workstream | Depends on | Delivers |
| --- | --- | --- | --- |
| E1 | Desktop profile / patch mount | A4, C1–C3, C8, B1 | `desktopRail: true`, home owner mount, no default-web blast |
| E2 | Left-rail navigation wiring | C1, C6–C8, D6 | Rail actions navigate (routes or overlays) |
| E3 | Home empty state product mount | C2, D1, D2, D3, D4 | Hero shows greeting + empty copy + composer chrome |
| E4 | Open folder end-to-end | D3, D2, B1 | Picker → workspace adopt/create on Desktop |
| E5 | Permission mode visible on home/composer | C3, D1, Host permissions projection | Dropdown/chip visible with product labels |
| E6 | Offline Host boot verification | B4, B5, B7 | Packaged/offline runtime still prints readiness and loads UI |
| E7 | Accelerator + palette coexistence | B8, C8 | Ctrl+K / Ctrl+N reach client handlers, not dead Electron menu traps |

**Count:** A(5) + B(8) + C(8) + D(8 reuse) + E(7) ≫ 20 parallel tracks when counting launched scaffolds, foundation, reuse, and integration.

---

## Merge order

Merge **bottom-up**: pure docs and pure atoms first; composition and profile mount last. Never land E1 profile patches before the client half they name can load.

```text
Phase 0  Docs & contracts          A1–A5
            │
Phase 1  Desktop foundation        B1–B7  (supervisor, IPC, smokes, offline stage, packaging)
            │
Phase 2  Pure client scaffolds     C2, C4, C5, C6, C7   (atoms / fixture shells, no roster change)
            │
Phase 3  Shared web-safe client    C3, C8, C1(default off), D* unchanged behavior
            │         desktopRail remains false on dsh-web-app
            │
Phase 4  Product wiring            E2–E5, E7, partial E3
            │         conversation/sidebar/workspace code owners
            │
Phase 5  Desktop profile mount     E1 + E6
            │         desktopRail: true + home owner insert on Desktop DSH_HOME only
            │
Phase 6  P0 acceptance             checklist below + smokes
```

### Phase rules

| Phase | May merge when | Must not |
| --- | --- | --- |
| 0 | Docs only; no runtime behavior | Invent ids that disagree with the JSON contract |
| 1 | Desktop unit/smoke green; Host still boots | Couple main process to React trees |
| 2 | Package tests green; **no** `web-app` insert for atoms-only packages | Mount `ui-home` as a bare cordis row without `./client` |
| 3 | Default `dsh web` snapshots/smokes unchanged; `desktopRail` default `false` | Flip desktop chrome on for all Web users “to see it” |
| 4 | Handlers navigate or open real existing flows (picker, settings, startSession) | Leave rail buttons as silent no-ops and call P0 done |
| 5 | Profile/patch path per [desktop-web-profile-mount.md](./desktop-web-profile-mount.md); offline smoke green | Edit `packages/bundle/web-app/cordis.patch.yml` for desktop-only rows without product sign-off |
| 6 | All [P0 definition of done](#p0-definition-of-done) bullets pass on Desktop | Expand scope into automation backends / market install / full remote |

### Suggested git / PR stacking

1. **Docs stack** — contract, inventory, IA note, profile mount, this plan (independent, land first).
2. **Desktop foundation stack** — supervisor, preload, smokes, offline runtime, packaging, update consent.
3. **Client scaffold stack** — one PR per package when possible (`ui-home`, `ui-automation`, `ui-plugin-market`, `ui-task-side-rail`, remote wizard, permission labels, left rail, command palette). Prefer **package-local** merges so revert cost stays small.
4. **Integration stack** (serial after scaffolds):
   - Left-rail navigate + reserved accelerators
   - Home atoms composed into conversation hero (or thin home client owner)
   - Open folder path verification on Desktop
   - Desktop profile layer enabling `desktopRail` + home owner
   - Offline/packaged Host boot proof
5. **P0 freeze PR** — checklist evidence only (tests, smoke logs, short manual script); no new surfaces.

Conflict hotspots: `ui-sidebar`, `ui-conversation`, `packages/bundle/web-app/cordis.patch.yml`, `apps/desktop/src/host/launcher.ts`, bilingual triples under `.agents/notes/**`.

---

## Risk register

### R1 — Bilingual pairing hooks (high process risk)

**What:** Lefthook `pre-commit` / `pre-merge-commit` run `verify-translation-pairing` on staged records; installs configure the `dsh-translation-pairing` merge driver. Agent Notes and many docs are **paired** (`*.md` + `*.zh.md` + `*.i18n.yaml`).

**Failure modes:**

- Landing only one language → commit rejected or pair `out-of-sync`
- Merge of two valid pair confirmations without the driver → stuck `.i18n.yaml` conflicts
- Editing an implemented note’s English without re-recording → `doc-sync` / pairing gate red

**Mitigations:**

- For every paired path touched in a stream, update **both** languages and run `pnpm run verify-translation-pairing --write <pair>` before commit
- After merges that touch pairs: `pnpm run resolve-translation-pairing-conflicts` when the driver leaves unresolved records
- Prefer **not** pairing ephemeral desktop planning files under `apps/desktop/docs/` unless product asks for bilingual desktop docs; if a file is brought into the docs corpus later, complete the triple in the same PR
- Never disable Lefthook to “land the scaffold”

### R2 — Client profile mount (high product risk)

**What:** Desktop spawns `dsh web` and shares the **web** profile template + `dsh-web-app` browser roster unless a **later layer** adds rows. See [desktop-web-profile-mount.md](./desktop-web-profile-mount.md).

**Failure modes:**

- Inserting desktop-only plugins into `packages/bundle/web-app/cordis.patch.yml` → every browser user gets Desktop chrome
- Re-inserting `ui-command-palette` → double `shell.overlay` / locale registration
- `insert` of `ui-home` before `./client` + `dsh.client` exist → Host client scan / module resolution failure; **Desktop white screen**
- Partial `config` replace on `ui-sidebar` (missing keys) when setting `desktopRail: true` → broken sidebar load
- Writing desktop-only patches into a **shared developer** `$DSH_HOME/cordis.patch.yml` → CLI profiles pick up Desktop UI

**Mitigations (mandatory for E1):**

| Do | Do not |
| --- | --- |
| Prefer Desktop `userData` `DSH_HOME` profile layer or `--patch` | Patch home-level shared `DSH_HOME` for desktop-only UI |
| `insert` new ids only when packages export loadable `./client` | Mount pure atom libraries as cordis rows |
| Set `ui-sidebar` `config.desktopRail: true` only on Desktop composition; **restate full config** on override | Rely on `window` sniffing inside pure components |
| Keep `ui-command-palette` single-mount (already on web-app) | Duplicate palette id in a desktop patch |
| Compose `ui-home` via conversation hero **or** a thin client owner | Fork a second Electron SPA |

**Rollback:** Remove the Desktop profile/`--patch` layer; default web-app roster must still boot conversation + sidebar with `desktopRail: false`.

### R3 — Left-rail actions without routes (medium)

**What:** `DesktopRail` builders pin contract ids; handlers beyond `startSession` are placeholders.

**Failure mode:** P0 demo clicks Automation / Market / Search and nothing happens → product looks unfinished even if atoms exist.

**Mitigation:** E2 must bind each rail action to a real navigation target (layout page slot, overlay, or existing settings/palette API) before P0 sign-off. Empty **pages** may still be scaffolds; **navigation** must not be a no-op.

### R4 — Open folder path fragmentation (medium)

**What:** Native OS picker vs in-app browse picker; loopback vs remote trust fence; Desktop BrowserWindow focus.

**Failure mode:** Button visible but picker never opens under Electron, or selection does not create/adopt a workspace.

**Mitigation:** E4 explicitly tests Desktop with **existing** `ui-directory-picker-native` (preferred on Desktop) and confirms workspace list updates. Do not add a third picker in `apps/desktop` main.

### R5 — Permission mode visibility vs mechanism (medium)

**What:** Labels map onto existing preset machine ids; plan mode is a **separate** chip (`ui-plan`), not a fourth sandbox value.

**Failure mode:** Home shows pretty labels that do not bind to `permissions` projection / `/permission` write path; or plan is stuffed into the permission dropdown and breaks Host presets.

**Mitigation:** E5 reuses `ui-permission-presets` + composer seat; contract `permissionModes` labels stay presentation; Host ids remain source of truth.

### R6 — Offline Host runtime still boots (high release risk)

**What:** Packaged Desktop stages portable Node + Host layout (`host-dist`). Dev `pnpm desktop` from a full monorepo can mask missing staged artifacts.

**Failure mode:** Installer build boots Electron chrome then Host exit → first-run error; CI monorepo green, release red.

**Mitigation:** E6 keeps host readiness smoke + electron smoke on the **staged** layout, not only source `tsx` launch. P0 DoD requires offline/staged boot evidence.

### R7 — Accelerator collisions (medium)

**What:** Ctrl+K palette and Ctrl+N new task are contract triggers; Electron menus or reserved shortcuts can swallow them before the WebContents client sees them.

**Mitigation:** B8/E7 own a single reserved-accelerator policy aligned with the contract; verify in Desktop that client handlers still fire.

### R8 — Parallel scaffold merge conflicts (low–medium)

**What:** Many packages touch workspace `pnpm-lock`, knip, client catalogs, README model-experience gates.

**Mitigation:** Small per-package PRs; regenerate lock/catalogs in the integrating PR only; do not “fix” unrelated scaffold READMEs in the same commit as profile mount.

---

## P0 definition of done

P0 is **done** only when **all** of the following are true on **DSH Desktop** (Electron + supervised Host), not merely in package unit tests. Each bullet is binary.

### 1. Home empty state mounts in desktop web profile

- [ ] With Desktop composition (profile layer and/or hero owner), the blank / no-task landing shows the Zcode-like **home empty state** (greeting and empty project/task anchors from the contract, not only the legacy chat-first blank session chrome).
- [ ] Empty copy anchors match contract ids/intent: projects **尚未打开项目**, tasks **还没有任务** (or locale maps that preserve meaning).
- [ ] Default browser `dsh web` **without** the Desktop layer remains usable (no forced Desktop-only white screen; `desktopRail` default stays off on shipped web-app).
- [ ] `ui-home` is either composed by an owner with live callbacks **or** mounted via a loadable client half — **not** a dead cordis insert.

### 2. Left rail actions navigate

- [ ] Desktop runs with left rail chrome enabled (`desktopRail: true` on Desktop composition only).
- [ ] **新建任务** / New Task (and Ctrl+N when bound) starts a new task/session intent (`startSession` or successor).
- [ ] **搜索** / Search opens command palette or equivalent search surface (Ctrl+K path consistent with contract).
- [ ] **自动化** navigates to the automation surface (scaffold page allowed; route must open).
- [ ] **插件市场** navigates to the plugin market surface (fixture catalog allowed; route must open).
- [ ] **分组/项目** toggle switches list presentation when workspace browser supports it (or is visibly disabled with honest UX — not a silent control).
- [ ] No primary rail action is a silent no-op in the P0 build.

### 3. Open folder works via existing directory picker

- [ ] Home / composer **打开文件夹** (or workspace picker equivalent) invokes the **existing** directory picker stack (`ui-directory-picker-native` and/or browse) — no new Electron-only parallel chooser.
- [ ] Confirming a directory creates or adopts a workspace visible in the project/task list.
- [ ] Cancel leaves state unchanged; no stuck modal under Desktop focus.

### 4. Permission mode visible

- [ ] Home/composer shows a **permission mode** control with Zcode-like product labels (contract: 变更前确认 / 自动编辑 / 计划模式 / 完全访问 as presentation; plan may remain the separate plan chip if mechanism requires it — but the user can **see** collaboration/permission posture without opening Settings).
- [ ] Control reflects the live session (or new-session default) permissions projection; changing it uses the existing write path (`/permission` or settings mutate), not a decorative `<select>`.
- [ ] Full access still requires the existing risk acknowledgement where product already gates it.

### 5. Offline host runtime still boots

- [ ] Staged/offline Host layout used by Desktop packaging still starts under the supervisor and emits the readiness URL line within the configured ready timeout.
- [ ] Electron loads that origin and reaches client shell chrome (sidebar/home), not only the main-process error page.
- [ ] Host unexpected exit still follows restart policy without bricking the window permanently (existing supervisor behavior preserved).
- [ ] Evidence: automated host and/or electron smoke on the staged path, or a recorded release-candidate boot log attached to the P0 freeze PR.

### Cross-cutting P0 gates

- [ ] Contract `mvpP0` items not listed in the five headlines may ship as **honest scaffolds** (static automation templates, fixture market, remote wizard steps) **only if** entry navigation works; live backends are not required for P0.
- [ ] No desktop-only rows forced into default `dsh-web-app` without explicit shared-web intent.
- [ ] Pairing hooks green for every paired doc/note touched; no Lefthook bypass.
- [ ] Focused package tests for touched clients + `apps/desktop` unit/smokes required by the diff pass locally (full monorepo suite remains CI’s job).

---

## Day-to-day execution checklist

For each parallel stream owner:

1. Read the contract ids for your surface; do not rename `action` strings without updating the JSON and all builders.
2. Keep scaffolds **pure** until an integration PR owns side effects.
3. If you touch a bilingual triple, re-record pairing in the same commit.
4. If you need a cordis row, read [desktop-web-profile-mount.md](./desktop-web-profile-mount.md) and prefer Desktop-scoped layers.
5. Before claiming P0: run through the five DoD sections on a real Desktop launch (dev is necessary, staged/offline boot is mandatory for item 5).

---

## P1+ parking lot (explicitly after P0)

- Live remote workspace providers (SSH / WSL / Docker) behind the wizard
- Host automation scheduler + keep-awake policy
- Plugin market install/enable against Loader (distinct from settings inventory)
- Git domain package + live SCM in task side rail
- Files / project tree rail mode
- Full settings IA depth (MCP, hooks, usage, …)
- Mobile remote control
- Promoting desktop-only chrome into default web when product wants parity

---

## Document maintenance

- Update **status intent** rows when a stream merges from scaffold → wired.
- Keep P0 DoD bullets stable; move goalposts only by revising the JSON contract `mvpP0` in the same PR.
- When profile mount path is chosen (profile name vs `--patch` vs hero-only compose), record the choice in [desktop-web-profile-mount.md](./desktop-web-profile-mount.md) and leave a one-line pointer here under E1.
