# Zcode-like shell parity inventory

Inventory of existing `packages/client/*` capabilities relevant to a Zcode-like desktop agent shell.

**Sources (this pass only):** each package's `README.md` and `package.json` `description`. No full source-tree audit. Where READMEs do not establish an API or product surface, the cell says **unknown — needs code read**.

**Scope note:** There is no client package whose README describes a Git/SCM panel, a global command palette (as distinct from composer `/` triggers), or a mobile shell. Desktop app packaging lives under `apps/desktop`; client UI is the shared Web plugin tree loaded by the shell.

**Effort key:** **S** = wire/compose existing slots; **M** = extend an existing package or add a thin owner; **L** = new product surface + host/wire work.

---

## Surface matrix

| Surface | Existing package(s) | What already works | Gap vs Zcode | Proposed owner package | Effort |
| --- | --- | --- | --- | --- | --- |
| **Home** | `ui-conversation`, `ui-workspace`, `ui-sidebar`, `ui-layout`, `ui-agent-preset`, `web` | Blank **New Session** hero with workspace picker seat (`conversation.hero.workspace`); empty-state composer card opens workspace flow; staged agent-preset chip on new-session screen; three-column AppFrame with conversation + details; boot gate via `web` two-stage shell. | No product “Home/dashboard” (recent projects, pinned tasks, tips, multi-workspace landing) beyond blank session + sidebar lists. Desktop first-run chrome beyond Web onboarding is **unknown — needs code read** of `apps/desktop`. | Keep home chrome in `ui-conversation` + `ui-workspace`; desktop-only welcome chrome in `apps/desktop` or new `ui-desktop-home` if it must stay out of Web. | M |
| **Left rail** | `ui-sidebar`, `ui-workspace`, `ui-layout`, `ui-settings-general` (settings seat) | Collapsible sidebar → 56px rail; wordmark; New Session; workspace/session browser (group/flat, search, reorder, archive, fork, rename, status dots including pending interaction); bottom-pinned Settings trigger; layout-owned collapse animation. | No multi-mode rail (Files / Git / Search / Agents tabs). Session “completed/unread” is local viewing state only (not host-durable). Pending interaction not rolled up on collapsed workspace headers. No Session delete/unarchive UI. | Shell chrome: `ui-sidebar` + `ui-layout`. Browser rows: `ui-workspace`. New rail modes → new packages (e.g. `ui-files`, `ui-git`) registering into layout/sidebar slots. | M–L |
| **Composer** | `ui-conversation`, `ui-input-trigger`, `ui-commands`, `ui-attachment`, `ui-model-selection`, `ui-plan`, `ui-permission-presets`, `ui-skill`, `ui-subagent`, `ui-user-questions`, `ui-goal` | Textarea + queue/steer/stop; image paste/drop rail; `/` and `@` trigger menu; command source + popupSelect decorations; skill `/name` source; model/effort seat; plan chip; permission chip path; todo/goal/queue docks; approval and question composer takeovers (incl. plan-review intent); context meter; busy-Enter preference. | No rich multi-modal beyond images (audio/video **absent in READMEs**). No sent-message edit. Queue edit text-only. Approvals are allow-once/reject only (no durable grant UI). Details panel entry from chat is unimplemented (`openDetails` uncalled per README). | Domain stays `ui-conversation`; feature seats stay in their packages. Desktop-native file attach may need host bridge — **unknown — needs code read**. | M |
| **Task timeline** | `ui-conversation`, `ui-tool`, `ui-trajectory`, `ui-workflow-run`, `ui-subagent`, `ui-jobs`, `ui-deliverables`, `ui-message-feedback` | Ordered chat flow (user/assistant/think/context/tool/retry); keyed tool cards (shell, read, diff, search, web, todo, question, skill, code-dispatch, generic); Trajectory view with timing overview; workflow-run nodes; subagent header catalog; header jobs list; produced-files turn tail; like/dislike feedback strip. | No single “task board” across sessions. Trajectory has no deep links; in-flight timing blank. Jobs list is read-only (no cancel/output UI). Workflow node omits logs/controls. Details/tool inspector not reachable from chat. | Timeline/chat: `ui-conversation` + `ui-tool`. Cross-session task board: **new** (e.g. `ui-tasks`) on host job/goal projections — none described today. | L |
| **Git panel** | *(none in `packages/client`)* | Tool cards can render **diff/read** results from agent tools (`ui-tool` / `ui-primitives` DiffBlock/ReadBlock). Deliverables list mutated paths per turn. Host `openFile` callback path exists for paths. | No source-control panel: branch, status, stage/commit/push, PR, blame, history browser, or conflict UI. No client package claims git domain RPCs. | **New** `ui-git` (client) + host git capability/remote; reuse DiffBlock atoms from `ui-primitives`. Do not overload `ui-tool`. | L |
| **Goal / Progress** | `ui-goal`, `ui-conversation` (TodoDock), `ui-plan`, `ui-jobs`, `ui-workflow-run` | GoalBar dock (edit/pause/resume/clear via `ctx.remote.goals`); TodoPanel from `todos` projection; plan-mode chip + plan-review composer; background jobs popover; workflow phase/member status. | Goal strip is durable-phase only (cannot show active-but-disarmed vs armed). No multi-goal portfolio or progress chart across sessions. Jobs not cancellable from UI. Todo lines single-line ellipsis only. | Keep `ui-goal` + conversation docks; portfolio/progress chrome → extend `ui-goal` or new `ui-progress` once host exposes multi-goal APIs (**unknown — needs host README/code**). | M |
| **Settings** | `ui-settings`, `ui-settings-general`, `ui-settings-models`, `ui-settings-plugins`, `ui-settings-plugin-inventory`, `ui-theme`, `ui-locale` (via locale pkg), `ui-permission-presets`, `ui-agent-preset`, `schema-form` | Modal settings shell from sidebar; General + feature sections; Models + credentials onboarding; Plugins config tabs + read-only loader inventory; theme/appearance; language; permission default; agent-preset management; revision-fenced settings scope; loopback “open configuration file”. | Remote/non-loopback: durable settings unavailable (in-memory / inert). Plugin inventory snapshot-only, no mutate. Agent-preset YAML not edited in-browser (copy + open on disk). Desktop-specific settings (autostart, update channel, tray) **not described in client READMEs** — likely `apps/desktop` only (**unknown — needs code read**). | Prefer existing settings section slots; desktop-only rows as new `settings.section` from desktop client plugin or `apps/desktop` bridge package. | S–M |
| **Plugins** | `ui-settings-plugins`, `ui-settings-plugin-inventory`, `ui-agent-preset`, `modules`, `hmr` (dev) | Host-plane plugin config cards (bash, agent-loop, web-search-deepseek shipped); feature tabs via `settings.plugins.tab`; loader inventory list/search; agent presets as composition units; client module graph + dev HMR. | No marketplace/install UX. No enable/disable loader controls from inventory. Preset-mounted plugins not in host-plane settings. External plugin browser bundles must reproduce client build — high friction. | Config: `ui-settings-plugins`. Inventory: `ui-settings-plugin-inventory`. Install/marketplace: **new** package + host APIs (none in client READMEs). | L |
| **Automation** | `ui-workflow-run`, `ui-jobs`, `ui-goal`, `ui-commands`, `ui-skill` | Durable workflow-run chat nodes; session job registry mirror; goal continuation strip; slash commands and skills as user automation entry points. | No cron/scheduler UI, hook editor, or ACP-facing automation console in client packages. Job cancel/stream output deferred. Workflow limited to top-level `dsh-tool-workflow` runs. | Workflow presentation: `ui-workflow-run`. Scheduler/hooks UI: **new** after host automation remotes exist (**unknown — needs host/acp docs**). | L |
| **Command palette** | `ui-commands`, `ui-input-trigger`, `ui-skill`, `ui-model-selection`, `ui-permission-presets` | Composer-scoped `/` fuzzy command directory; `+` launcher opens command source only; popupSelect for `/model`, `/permission`, etc.; skills as `/name` tokens; `@` subagent labels (display text only). | No global (app-wide) command palette (Ctrl/Cmd+K) over navigation, settings, git, files. No unified action registry beyond session command.list + input triggers. | Global palette: **new** `ui-command-palette` composing `commandUi` + layout navigation actions. Keep session slash path in `ui-commands`. | M |
| **Remote workspace** | `connection`, `runtime`, `ui-workspace`, `ui-directory-picker-browse`, `ui-directory-picker-native`, `ui-settings` | Dual-stream reconnecting client; loopback vs remote trust fence; workspace list/create/adopt; **browse** directory dialog works without OS chooser (remote-capable per README); **native** OS chooser loopback/desktop-oriented; remote settings stay memory-mode; privileged settings/credentials/preset authoring loopback-pinned. | No auth layer for non-loopback (`dsh web --host 0.0.0.0` unsupported until auth). Remote cannot use durable settings or several host desktop actions. SSH/devcontainer/codespace workspace types not described. Multi-host switcher not described. | Transport: `connection` + `runtime`. Picking: prefer `ui-directory-picker-browse` for remote. Auth + multi-host: host + **new** client surfaces. | L |
| **Mobile** | *(none)* | Responsive concession chain in `ui-layout` (details shrink/auto-close; sidebar → rail). Touch-oriented attachment remove affordance on coarse pointers (`ui-attachment`). | No mobile app package, no mobile navigation pattern, no PWA install UX claimed by client packages (`apps/web` may ship a webmanifest — **unknown — needs apps/web read**, out of client package READMEs). Narrow-window acceptance walkthrough deferred in `web` README. | Do not invent mobile packages until product scope exists; short-term harden `ui-layout` narrow breakpoints only. | L |

---

## Cross-cutting foundation (not a Zcode “surface”, but required)

| Area | Packages | Role for a Zcode-like shell |
| --- | --- | --- |
| Boot / module graph | `web`, `modules`, `web-react`, `hmr` | Two-stage boot, lazy client bundles, React slot renderer, dev reload. |
| Object layer | `runtime`, `ui-slots` | Sessions, workspaces, projections, slot registry. |
| Wire | `connection` | HTTP unary + WS mux/host streams, loopback trust fence. |
| Design system | `ui-theme`, `ui-primitives`, `ui-attachment`, `locale` | Tokens, atoms, i18n zh/en. |
| Forms | `schema-form` | Settings draft/validate path model. |

---

## Package index (description only)

| Directory | npm name | package.json description |
| --- | --- | --- |
| `connection` | `@deepseek-ai/dsh-client-connection` | Wire consumer layer: HTTP-up/WebSocket-down client, ConnectionController dual streams with reconnect, and fixture api |
| `hmr` | `@deepseek-ai/dsh-client-hmr` | Dev-only hot-reload driver for script-loaded client entries |
| `locale` | `@deepseek-ai/dsh-client-locale` | Locale plugin: Host-backed zh/en preference, browser-derived fallback, locale snapshots, and typed namespace dictionaries |
| `modules` | `@deepseek-ai/dsh-client-modules` | Client module system (boot graph + lazy-CJS loader seam) |
| `runtime` | `@deepseek-ai/dsh-client-runtime` | Client core services: SlotRegistry, SessionRuntime (scope tree + object layer) |
| `schema-form` | `@deepseek-ai/dsh-client-schema-form` | Schema/draft model layer for settings editors |
| `ui-agent-preset` | `@deepseek-ai/dsh-client-ui-agent-preset` | Agent-preset surfaces: default for later sessions, this session's seat, and composition editor |
| `ui-attachment` | `@deepseek-ai/dsh-client-ui-attachment` | Pure React attachment atoms: draft-image rail, message gallery, lightbox |
| `ui-commands` | `@deepseek-ai/dsh-client-ui-commands` | Client command surface: directory cache, `/` source, three command UI kinds, popupSelect registry |
| `ui-conversation` | `@deepseek-ai/dsh-client-ui-conversation` | Conversation domain: skeleton, chat flow, composer, details host |
| `ui-deliverables` | `@deepseek-ai/dsh-client-ui-deliverables` | Produced-files turn tail and clickable final-response file references |
| `ui-directory-picker-browse` | `@deepseek-ai/dsh-client-ui-directory-picker-browse` | In-app directory browsing surface for workspace directory-flow |
| `ui-directory-picker-native` | `@deepseek-ai/dsh-client-ui-directory-picker-native` | Renderless native OS directory-flow occupant |
| `ui-goal` | `@deepseek-ai/dsh-client-ui-goal` | Session goal surface: GoalBar docked above the composer |
| `ui-input-trigger` | `@deepseek-ai/dsh-client-ui-input-trigger` | `/` and `@` detection, candidate menu, pick routing |
| `ui-jobs` | `@deepseek-ai/dsh-client-ui-jobs` | Session-header background-job list from session/jobs frames |
| `ui-layout` | `@deepseek-ai/dsh-client-ui-layout` | Three-column AppFrame, `ctx.layout` viewing-state service |
| `ui-message-feedback` | `@deepseek-ai/dsh-client-ui-message-feedback` | Per-message Like/Dislike + note on assistant action strip |
| `ui-model-selection` | `@deepseek-ai/dsh-client-ui-model-selection` | `/model` popupSelect and composer model seat |
| `ui-permission-presets` | `@deepseek-ai/dsh-client-ui-permission-presets` | Permission default in General settings + `/permission` popup |
| `ui-plan` | `@deepseek-ai/dsh-client-ui-plan` | Plan-mode composer control over plan projection |
| `ui-primitives` | `@deepseek-ai/dsh-client-ui-primitives` | Pure React atoms: controls, icons, markdown, terminal/diff/read/search/web blocks |
| `ui-settings` | `@deepseek-ai/dsh-client-ui-settings` | Settings domain base: scope service + slot-type contract |
| `ui-settings-general` | `@deepseek-ai/dsh-client-ui-settings-general` | Settings shell, General section, onboarding chrome |
| `ui-settings-models` | `@deepseek-ai/dsh-client-ui-settings-models` | Models settings + product-onboarding dialogs |
| `ui-settings-plugin-inventory` | `@deepseek-ai/dsh-client-ui-settings-plugin-inventory` | Read-only Cordis Loader inventory tab |
| `ui-settings-plugins` | `@deepseek-ai/dsh-client-ui-settings-plugins` | Plugins settings section + configurable host-plane plugin cards |
| `ui-sidebar` | `@deepseek-ai/dsh-client-ui-sidebar` | Sidebar shell: wordmark, New Session, collapse, settings seat |
| `ui-skill` | `@deepseek-ai/dsh-client-ui-skill` | Skill `/` source + skill tool row |
| `ui-slots` | `@deepseek-ai/dsh-client-ui-slots` | Slot registry pure core (React-free, cordis-free) |
| `ui-subagent` | `@deepseek-ai/dsh-client-ui-subagent` | Subagent catalog, continuation composer rules, `@` source |
| `ui-theme` | `@deepseek-ai/dsh-client-ui-theme` | ThemeRuntime, tokens, Appearance settings row |
| `ui-tool` | `@deepseek-ai/dsh-client-ui-tool` | Tool call-tree renderer + keyed per-tool presentation slot |
| `ui-trajectory` | `@deepseek-ai/dsh-client-ui-trajectory` | Trajectory event ledger + timing overview |
| `ui-user-questions` | `@deepseek-ai/dsh-client-ui-user-questions` | ask_user_question composer takeover (+ plan-review intent) |
| `ui-workflow-run` | `@deepseek-ai/dsh-client-ui-workflow-run` | Durable workflow-run Conversation Node |
| `ui-workspace` | `@deepseek-ai/dsh-client-ui-workspace` | Workspace browser/picker into sidebar and hero slots |
| `web` | `@deepseek-ai/dsh-client-web` | Web shell kernel / two-stage boot |
| `web-react` | `@deepseek-ai/dsh-client-web-react` | Shell-side React glue for slots and session providers |

---

## Top gaps (priority signal)

1. **Git / source-control panel** — no client package; only tool-result diff cards.
2. **Global command palette** — session `/` menu only; no app-wide action palette.
3. **Files / project tree rail** — sidebar is session/workspace list, not a workspace file explorer.
4. **Remote auth + durable remote settings** — connection fence is reachability, not auth; settings RPCs loopback-only.
5. **Job control** — jobs UI is read-only; cancel/output phases explicitly deferred.
6. **Chat details / tool inspector entry** — details host exists but no assembled entry point from chat.
7. **Durable approval grants** — approval UI is allow-once/reject only.
8. **Plugin install / marketplace / loader mutation** — inventory read-only; config is host-plane cards only.
9. **Automation scheduling UI** — workflows/jobs/goals exist; no cron/hooks console in client READMEs.
10. **Mobile / small-surface shell** — layout concessions only; no mobile product package.

---

## Method limits

- Zcode product behavior is used only as a **comparison lens**; this file does not claim a formal Zcode spec in-repo.
- Host-side capabilities (git binary integration, ACP, desktop Electron bridges) were **not** inventoried unless a client README named them.
- Effort ratings are planning hints, not commitments.
)
