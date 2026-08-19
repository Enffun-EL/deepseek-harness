# Zcode-like parity status

Snapshot of what sibling agents landed on `feature/desktop-integration` for the Zcode-like Agent IDE direction, what remains presentation-only, integration risks, and the next implementation PR order.

**Authorities (do not fork product truth here):**

| Doc | Role |
| --- | --- |
| [zcode-home-interaction-contract.json](./zcode-home-interaction-contract.json) | Stable ids, routes, rail actions, empty-state copy, `mvpP0` |
| [zcode-parity-inventory.md](./zcode-parity-inventory.md) | Pre-scaffold gap matrix vs existing client packages |
| [zcode-build-plan.md](./zcode-build-plan.md) | Merge order, P0 DoD, risk register |
| [desktop-web-profile-mount.md](./desktop-web-profile-mount.md) | How Desktop mounts client packages without breaking default `dsh web` |
| [Agent IDE IA note](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md) | Product one-liner, layer ownership, MVP cuts |

**Branch context (this pass):** `feature/desktop-integration` (local commits ahead of `origin/feature/desktop-integration`). Status is **scaffold / foundation / wiring** — not product-done. Peer “Zcode” remains an IA lens only.

---

## 1. What landed (paths)

### A — Product docs and contracts

| Path | What it is |
| --- | --- |
| `apps/desktop/docs/zcode-home-interaction-contract.json` | Implementer contract: routes, left-rail actions, home empty copy, permission mode labels, remote wizard steps, palette filters, `mvpP0` / `outOfScopeP0` |
| `apps/desktop/docs/zcode-parity-inventory.md` | README-level matrix of existing `packages/client/*` vs Zcode surfaces and gaps |
| `apps/desktop/docs/zcode-build-plan.md` | Parallel workstreams, merge phases, P0 definition of done, risk register |
| `apps/desktop/docs/desktop-web-profile-mount.md` | Layer order for desktop-only client rows; invalid bare `ui-home` insert; example `--patch` path |
| `apps/desktop/config/desktop-ui.cordis.patch.yml.example` | Inactive empty patch checklist (not auto-loaded) |
| `.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.{md,zh.md,i18n.yaml}` | Product IA map: shell vs Host vs client; MVP cuts |
| `.agents/notes/implemented/architecture/2026-08-20-desktop-left-rail-structure.*` | `ui-sidebar` `Config.desktopRail` decision |
| `.agents/notes/implemented/feature/2026-08-20-zcode-like-permission-mode-labels.*` | Product labels on existing preset machine ids |
| `.agents/notes/implemented/feature/2026-08-20-remote-workspace-wizard-ui-scaffold.*` | Remote wizard UI scaffold note |

### B — Desktop shell foundation (pre-existing + chrome stubs)

| Path | What it is |
| --- | --- |
| `apps/desktop/src/host/*`, `src/main.ts`, `src/preload.ts` | Electron supervisor, Host spawn/ready/restart, preload bridge |
| `apps/desktop/src/shell/*` | IPC channels, first-run/loading/error pages, reserved accelerators |
| `apps/desktop/src/shell/reserved-accelerators.ts` | **Landed:** Ctrl/Cmd+N and Ctrl/Cmd+K reserved for client (`createTask`, `openCommandPalette`) — shell must not steal them |
| `apps/desktop/src/shell/pages.ts`, `titlebar-options.ts` | Productized shell chrome copy stubs |
| `apps/desktop/src/update/*` | Auto-update consent (main-process) |
| `apps/desktop/tests/**` | Host/shell/update unit coverage |

### C — Client chrome scaffolds

| Package / path | npm / seat | Dual-face (`./client` + `dsh.client`)? | On default `dsh-web-app`? | Notes |
| --- | --- | --- | --- | --- |
| `packages/client/ui-home/` | `@deepseek-ai/dsh-client-ui-home` | **No** — pure atoms only | **No** | Greeting, model banner, project picker button, composer chrome, starters, templates, `HomeEmptyState` compose. Callbacks-only. **Working tree may still have untracked package metadata/README/CSS** next to committed `src/` — finish packaging before integrate. |
| `packages/client/ui-command-palette/` | `@deepseek-ai/dsh-client-ui-command-palette` | **Yes** | **Yes** (`cordis.patch.yml` + web-app dep) | `shell.overlay` Ctrl/Cmd+K host; filter tabs all/actions/tasks/files; static default actions |
| `packages/client/ui-automation/` | `@deepseek-ai/dsh-client-ui-automation` | **No** — pure atoms | **No** | Page shell, empty state, keep-awake (local React state), static idle template cards |
| `packages/client/ui-plugin-market/` | `@deepseek-ai/dsh-client-ui-plugin-market` | **Yes** (locale only) | **Yes** (dep + insert) | Fixture catalog + `PluginMarketShell`; client `apply` registers dictionaries **only** — no layout route/slot mount of the shell |
| `packages/client/ui-task-side-rail/` | `@deepseek-ai/dsh-client-ui-task-side-rail` | **No** — pure atoms | **No** | Git tools / Goal / Progress presentational stack |
| `packages/client/ui-sidebar/` (`DesktopRail*`, `desktop-rail-nav.ts`, `Config.desktopRail`) | existing package | Yes (pre-existing) | Yes; **`desktopRail` default `false`** | Nav ids/actions match contract; only `createTask` → `startSession` is live |
| `packages/client/ui-workspace/src/remote-wizard/` | inside `ui-workspace` | N/A (atoms under existing package) | Package yes; wizard **not** product-mounted | SSH/WSL/Docker step UI; callback finish/cancel; no transport |
| `packages/client/ui-permission-presets/` (label maps) | existing | Yes | Yes | Zcode-like labels: 变更前确认 / 自动编辑 / 完全访问 on `read-only` / `workspace-write` / `danger-full-access`; plan stays separate (`ui-plan`) |

### D — Web-app roster facts (relevant)

From `packages/bundle/web-app/cordis.patch.yml` + package deps:

- **Mounted:** `ui-command-palette`, `ui-plugin-market` (market = locale registration only).
- **Not mounted as rows:** `ui-home`, `ui-automation`, `ui-task-side-rail` (cannot be bare cordis rows until dual-face owners exist, or they are imported by an owner).
- **Not flipped:** `ui-sidebar` `config.desktopRail: true` (Desktop-only layer still required).

---

## 2. What is still fake / static

Honest scaffold status — UI may render in isolation or unit tests, but product paths are not end-to-end.

| Surface | Fake / static today | Real when… |
| --- | --- | --- |
| **Home empty state** | Atoms + compose only; not injected into `conversation.hero` / empty seats; no live workspace/model/permission/startSession wiring | Owner (`ui-conversation` or thin home client) mounts atoms with live callbacks; Desktop/default web policy decided |
| **Left rail (Desktop)** | Chrome exists behind `desktopRail: true`, but default composition leaves it **off**. Search / Automation / Plugin Market / account / phone remote are **silent no-ops** (`onNav` only handles `createTask`). Project/task section empties are placeholders, not `ui-workspace` browser | Desktop profile sets `desktopRail: true`; each action opens palette, route/overlay, or workspace list |
| **Command palette** | Overlay + hotkey + 4 static actions. `openSettings` is **no-op**. `openWorkspace` only `startSession()`. Tasks/files filter tabs have **no sources**. Does not consume full `ui-commands` directory | Shared open-settings/workspace APIs; command + session + file providers |
| **Plugin market** | Fixture JSON catalog; installed rows are placeholders; create-plugin CTA defaults to no-op; **shell not registered into any page/slot** despite web-app insert | Layout page or rail route mounts `PluginMarketShell`; Host catalog/install later (P1+) |
| **Automation page** | Static templates; keep-awake is local component state; create CTAs need owner callbacks; **no package client half / no route** | Page owner + Host scheduler (scheduler itself is P1+) |
| **Task side rail** | Pure props; no SCM, no goal projection bind, no details-column registration | Owner fills git/goal/progress from Host + mounts in details |
| **Remote wizard** | Four-step UI; subtitle admits no real connection; finish is owner callback only | Host workspace providers (SSH/WSL/Docker) + open from project selector |
| **Permission mode on home** | Product **labels** land on existing presets; home composer chrome can show a decorative select if owner passes static props — **not** automatically bound on blank hero | Composer seat uses `ui-permission-presets` write path + live projection |
| **Open folder** | Directory pickers already exist in tree; home “打开文件夹” button is prop-driven only until wired | Home/project selector → native/browse picker → workspace adopt/create |
| **Settings flyout (contract)** | Contract lists theme/zoom/language/usage/upgrade/connect flyout; product still uses existing settings **modal** sections | Optional later chrome; P0 can keep modal if Models/General reachable |
| **Phone remote / account** | Rail foot placeholders | Later phase |
| **Offline staged Host** | Foundation + smokes exist; release proof still required on **staged** layout (not only monorepo `tsx`) | E6 in build plan |

---

## 3. Hardest integration risks

Ordered by blast radius / likelihood of a white screen or false “P0 done.”

### R1 — Desktop profile mount vs default `dsh web` (highest product risk)

Desktop spawns shared `dsh web` + `dsh-web-app` roster. Editing `packages/bundle/web-app/cordis.patch.yml` for desktop-only chrome hits every browser user. Partial `config` replace on `ui-sidebar` when setting `desktopRail: true` can drop required keys. Inserting `ui-home` **before** `./client` + `dsh.client` exist fails client scan → Desktop white screen. Re-inserting `ui-command-palette` double-registers overlays.

**Mitigation:** Desktop-isolated `DSH_HOME` profile layer or `--patch` only; restate full sidebar config; Path D (compose atoms in owner) for home until dual-face exists. See [desktop-web-profile-mount.md](./desktop-web-profile-mount.md).

### R2 — Left-rail actions without routes (highest demo risk)

Nav builders pin contract ids, but handlers beyond `startSession` are empty. P0 demo clicks Automation / Market / Search and nothing happens even though packages exist.

**Mitigation:** Bind navigation before calling P0 done — palette open API, layout page slots, or honest disabled UX. Empty **pages** may stay scaffolds; **clicks** must not be silent.

### R3 — Atom packages mistaken for loadable plugins

`ui-home`, `ui-automation`, `ui-task-side-rail` are library faces. Mounting them as bare cordis rows is invalid. `ui-plugin-market` is dual-face but currently locale-only — presence on the roster ≠ visible page.

**Mitigation:** Either add thin `./client` owners that register slots, or import atoms from `ui-conversation` / layout owners.

### R4 — Open folder path under Electron

Native vs browse picker, loopback trust fence, BrowserWindow focus. Visible button that never opens a chooser, or selection that does not adopt a workspace, fails the 30-second test.

**Mitigation:** Reuse `ui-directory-picker-native` (preferred on Desktop) + existing workspace create/adopt; no third Electron-only chooser in `apps/desktop` main.

### R5 — Permission / plan vocabulary mismatch

Contract lists four presentation modes including 计划模式; Host ships three sandbox presets + separate plan chip. Stuffing plan into the permission dropdown breaks Host presets. Decorative home `<select>` that does not call `/permission` is a product lie.

**Mitigation:** Labels map onto machine ids; plan stays `ui-plan`; home binds the real seat.

### R6 — Accelerator collisions

Ctrl+N / Ctrl+K reserved in desktop shell stubs; Electron menus or future global shortcuts can still swallow chords if menus grow without `isReservedClientAccelerator`. Client palette and rail must actually listen.

**Mitigation:** Keep reserved list authoritative; verify in Desktop that WebContents handlers fire.

### R7 — Offline / staged Host boot vs monorepo green

Dev `pnpm desktop` from a full tree masks missing `host-dist` artifacts. Installer-shaped boot can fail Host readiness while CI unit tests pass.

**Mitigation:** Staged-path host + electron smokes as release gate (build plan E6 / P0 DoD item 5).

### R8 — Parallel scaffold merge / packaging incompleteness

Many packages touch lockfile, knip, client catalogs, README gates. `ui-home` may still have **untracked** `package.json` / README / CSS relative to HEAD — integrating a half-packaged workspace package breaks install and hygiene.

**Mitigation:** Finish package skeleton in the scaffold PR; one package per PR where possible; regenerate catalogs only in integrating PRs.

### R9 — Bilingual pairing hooks

Agent Notes are paired triples. Landing one language fails pre-commit / doc-sync. Prefer not pairing ephemeral `apps/desktop/docs/*` unless product asks; when touching notes, re-record both languages.

---

## 4. Next 5 implementation PRs (in order)

Bottom-up per [zcode-build-plan.md](./zcode-build-plan.md). Each PR should be independently revertable.

### PR1 — Finish `ui-home` package skeleton + conversation hero compose (atoms → live empty state)

**Scope:** Complete any missing `ui-home` package metadata/README/CSS in-tree; import atoms from `ui-conversation` (or a thin home client owner) into blank/new-session hero/empty seats; wire greeting daypart, empty project/task copy anchors, starter chips → composer fill, model-missing banner → settings models path, project picker → existing workspace/directory flows, permission + model seats via **existing** presets/selection (not decorative-only).

**Out:** Desktop `desktopRail: true`; automation/market routes; Host scheduler.

**Exit:** Blank session on Web shows Zcode-like empty state with at least one live action (open folder or start task). Default web behavior explicitly accepted or gated.

### PR2 — Left-rail navigation + command palette completion (no silent no-ops)

**Scope:** Desktop-oriented handlers in `DesktopRail`: Search → open palette; Automation / Plugin Market → real layout page or overlay hosts that mount `AutomationPage` / `PluginMarketShell` (scaffold content OK); project/group toggle bound to workspace browser presentation or honest disabled state; account/settings foot → existing settings open. Extend palette: shared `openSettings`, real open-workspace path, optional bridge from `ui-commands` directory; keep tasks/files filters honest (empty state or first real source).

**Depends on:** PR1 optional for home; palette already on web-app.

**Exit:** With `desktopRail: true` in a **dev-only or test** composition, every primary rail action does something visible.

### PR3 — Desktop profile mount (`desktopRail: true` + offline-safe Host layer)

**Scope:** Implement Path A or B from [desktop-web-profile-mount.md](./desktop-web-profile-mount.md): Desktop `userData` `DSH_HOME` profile patch and/or launcher `--patch`; full `ui-sidebar` config restatement with `desktopRail: true`; do **not** force desktop-only rows into shared `dsh-web-app` without product sign-off; verify default `dsh web` unchanged; accelerator coexistence smoke on Desktop.

**Depends on:** PR2 handlers exist so enabling the rail is not a no-op demo.

**Exit:** Packaged/dev Desktop boots Host, shows desktop rail, Ctrl+K/N reach client; CLI `dsh web` without Desktop `DSH_HOME` stays stock.

### PR4 — Open folder + permission visibility E2E on Desktop

**Scope:** Home/composer **打开文件夹** → `ui-directory-picker-native` (fallback browse) → workspace create/adopt appears in list; cancel safe under Electron focus. Permission control on home/composer reflects live projection and writes via existing path; full-access keeps risk acknowledgement; plan chip remains separate.

**Depends on:** PR1 compose + PR3 Desktop composition.

**Exit:** Cold Desktop path: pick folder, see project, see permission posture, send first prompt without Settings spelunking (models path still clear via banner/settings).

### PR5 — P0 freeze: staged offline Host boot + acceptance evidence

**Scope:** No new surfaces. Staged/offline Host readiness + electron smoke evidence; walk [zcode-build-plan.md P0 DoD](./zcode-build-plan.md#p0-definition-of-done); fix only blockers; update this status doc’s checkboxes / stream table; optional short manual script in freeze PR description.

**Depends on:** PR3–PR4.

**Exit:** All five P0 DoD headlines binary-true on Desktop; honest scaffolds allowed only where navigation works (automation/market/remote backends still static OK).

### Explicitly after these five (P1+ parking)

- Live remote providers behind the wizard
- Host automation scheduler + durable keep-awake
- Plugin market install vs Loader (not fixture)
- `ui-git` / files rail + live task side rail SCM
- Full settings IA depth; mobile remote

---

## 5. Quick scoreboard

| Area | Scaffold UI | Wired into composition | Product-live data |
| --- | --- | --- | --- |
| Docs / contract | ✅ | n/a | n/a |
| Desktop supervisor | ✅ foundation | ✅ | n/a |
| Reserved accelerators | ✅ policy | ⚠️ verify in real menu growth | n/a |
| Command palette | ✅ | ✅ overlay on web-app | ⚠️ static actions; stubs |
| Plugin market | ✅ fixture shell | ⚠️ locale only on web-app | ❌ fixture |
| Home atoms | ✅ | ❌ | ❌ |
| Desktop left rail | ✅ | ❌ default off + noop nav | ⚠️ New Task only when on |
| Automation atoms | ✅ | ❌ | ❌ |
| Task side rail atoms | ✅ | ❌ | ❌ |
| Remote wizard UI | ✅ | ❌ | ❌ |
| Permission labels | ✅ | ✅ on existing preset UI | ✅ machine ids unchanged |
| Offline staged boot proof | ⚠️ foundation | ⚠️ | needs freeze evidence |

---

## 6. Document maintenance

- Update §1–§2 when a scaffold gains a client half, roster row, or live handler.
- Keep §4 PR order stable unless the JSON contract `mvpP0` changes in the same PR.
- Do not treat this file as a second product contract — ids and copy anchors live in `zcode-home-interaction-contract.json`.
)
