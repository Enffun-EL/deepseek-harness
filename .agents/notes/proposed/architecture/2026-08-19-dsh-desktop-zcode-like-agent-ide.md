# Agent Note: DSH Desktop as a Zcode-like Agent IDE

Status: proposed

English | [中文](2026-08-19-dsh-desktop-zcode-like-agent-ide.zh.md)

## Problem

The [Desktop Electron shell (MVP-A)](2026-08-19-dsh-desktop-electron-mvp.md) delivers an installable window over the existing `dsh web` Host and `packages/client/*` UI. That is necessary and insufficient as a product story: users still meet a **chat-first Web layout**, not a **local Agent IDE** whose primary objects are task, workspace, permission mode, and model.

Peer products (IA observed from product screenshots only — not reverse-engineered source) train the expectation in under half a minute: left-rail task navigation, a home empty state that starts work without hunting menus, a task timeline with Git and Goal/Progress, remote workspace entry (SSH / WSL / Docker), explicit permission modes, a command palette, and a deep settings IA. Without a deliberate product map, Desktop work drifts into shell polish and chat chrome while those entry surfaces stay fragmented or absent.

This note is the product and package map for that Agent IDE direction. It does not replace the Electron supervisor decision; it constrains what the supervised UI must become and what stays out of the first cuts.

## Proposal

### One-sentence product

**DSH Desktop is a local Agent IDE whose unit of work is a task bound to a workspace, a permission mode, and a model** — not a chat wrapper around an opaque agent.

### Relationship to MVP-A shell

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Desktop shell** (`apps/desktop`) | Electron window, Host spawn/ready/stop/restart, `DSH_HOME` under `userData`, single-instance focus, later installers/auto-update | Agent loop, tools, sessions, permission policy, business UI components |
| **Host** (`dsh web` + core packages) | Session log, agent loop, tools, sandbox × approval, projections, settings/credentials, workspace materialization, remote workspace backends when shipped | Pixel layout, React trees, left-rail chrome |
| **Client UI** (`packages/client/*`) | AppFrame, sidebar, conversation/home, settings, composer controls, task/goal/plan surfaces | Process lifecycle, OS window, installer |

Business UI remains plugin-composed under `packages/client/*`. The shell stays a supervisor ([shell note](2026-08-19-dsh-desktop-electron-mvp.md)). Product “feels like Zcode home” work is almost entirely Host + client composition and slot content, not a second UI stack in Electron.

### Information architecture (target)

IA below is the product target derived from peer screenshots. Names in parentheses are DSH vocabulary when it already exists.

#### Left rail

- **New Task** — start a blank task/session intent (today: New Session via `ui-sidebar` + runtime session intent).
- **Search** — find tasks/sessions and content (today: workspace browser search in `ui-workspace`).
- **Automation** — scheduled or event-driven agent runs (not shipped; see cuts).
- **Plugin Market** — discover/install plugins and extensions (not shipped; settings plugin inventory is read-only deployment truth, not a market).
- **Project / task lists** — workspaces and their sessions/tasks (`ui-workspace` in `sidebar.workspaces`).
- **Account** — identity / sign-in affordance at the rail foot or settings entry (minimal local-first stub in early cuts).

Collapsed rail keeps the primary actions as icon controls on the existing 56px layout rail (`ui-layout` + `ui-sidebar`).

#### Home empty state

When no task is selected (or a blank New Task page is active):

- Greeting and short product orientation.
- Optional model / capability banner (credential or route readiness — compose with `ui-settings-models` onboarding and `ui-model-selection` routable state).
- **Project / workspace picker** (`conversation.hero.workspace` via `ui-workspace`).
- **Composer** with **permission mode** + **model** seats (`ui-conversation` Access/`PermissionSelect`, `ui-permission-presets`, `conversation.input.model` / `ui-model-selection`).
- Starter prompts (localized prompt chips that fill the composer; client-only until a Host template API exists).
- Template cards (task templates / recipes; later — do not block MVP-P0).

Home is the same conversation shell in “no session / blank session” posture, not a separate marketing mini-app. Empty-state content fills `conversation.empty` and hero slots rather than forking AppFrame.

#### Task view

An active task/session shows:

- **Timeline** — chat/tool transcript (`ui-conversation` + `ui-tool`); optional Trajectory tab (`ui-trajectory`) for event-ledger power users.
- **Git tools** — status, diff, commit/PR helpers as Host tools + tool cards (extend tool presentation; no embedded full IDE diff editor in P0).
- **Goal / Progress** — durable goal strip and todo/plan progress (`ui-goal`, todo dock in `ui-conversation`, `ui-plan` chip when plan mode is on).

Details column (`ui-layout` `details`) remains the place for tool inspection and dense side content; it must not be required to understand “what is the agent doing?” in the main timeline.

#### Remote workspace wizard

First-class entry to attach a workspace that is not only “pick a local folder”:

- **SSH** remote project root.
- **WSL** distro path (Windows).
- **Docker** / dev-container style workspace.

P0 keeps **local directory** pickers (`ui-directory-picker-native` / browse). Remote modes are a Host workspace-provider problem plus wizard UI in the workspace add flow; they are not Electron-main hacks that bypass Host workspace identity.

#### Permission modes

Peer products expose modes such as **ask-before-edit**, **auto-edit**, **plan**, and **full-access**. DSH already separates mechanism knobs from product labels:

| Peer label (IA) | DSH mapping (shipped or planned) |
| --- | --- |
| ask-before-edit | Default safe preset direction: confining sandbox + approval `ask` (today’s `workspace-write` bundle is the closest shipped preset) |
| auto-edit | Workspace-scoped writes with reduced prompting (new or renamed preset bundle; still not ambient full disk) |
| plan | **Plan mode** (`dsh-plan-mode` + `ui-plan`) — design/read-heavy loop, not a sandbox alias |
| full-access | `danger-full-access` with explicit risk acknowledgement (`ui-permission-presets` / composer modal) |

Composer and Settings must show **human labels and one-line consequences**, not only kebab-case preset keys. Plan is a mode chip beside permission, not a fourth sandbox value stuffed into `PresetSpec` without a design pass.

#### Command palette

**Ctrl+K** (and platform equivalent) opens a palette over commands, tasks/sessions, workspaces, and settings navigation.

Build on `ui-commands` + `ui-input-trigger` slash discovery rather than a one-off Electron menu. Palette is global chrome; `/` remains in-composer. Exact shortcut binding and focus restore are client shell work in `ui-layout` / conversation chrome.

#### Settings IA

Target settings navigation (feature packages self-register sections/rows; shell stays dumb per [settings composition](2026-07-25-client-settings-locale-theme.md)):

| Section | Primary owner packages (existing unless noted) |
| --- | --- |
| General | `ui-settings-general` + general items (permission default, language, busy-Enter, open config file, …) |
| Appearance | `ui-theme` |
| Models | `ui-settings-models` |
| Browser | future feature package (browser tool policy / allowlists) |
| Memory | future (memory provider preferences) |
| Subagents | surface near `ui-subagent` / agent composition; may start as Agent presets adjacency (`ui-agent-preset`) |
| Plugins | `ui-settings-plugins` + `ui-settings-plugin-inventory` |
| MCP | Host MCP config + new settings section/cards |
| Skills | skill discovery preferences; invoke path stays `ui-skill` |
| Commands | command visibility / custom command entry (extends command domain) |
| Hooks | hooks bridge configuration |
| Index | codebase index / retrieval preferences when Host index exists |
| Usage | token/cost usage views (projections already feed stats; dedicated page later) |

Missing sections are empty slots, not fake pages. Do not invent a second settings tree inside `apps/desktop`.

#### Automation and idle tasks

- **Automation**: cron- or event-triggered tasks with their own list entry in the rail.
- **Idle tasks**: background/idle agents visible without owning the main timeline focus (`ui-jobs` is the seed for background job visibility; full automation product is later).

#### Mobile remote control (later phase)

QR pairing and bot-channel remote control of a running Desktop Host are **explicitly later**. They must not shape P0 navigation or security claims. When designed, Host remains authority; mobile is a remote client, not a second agent loop.

### Mapping to existing `packages/client/*`

| Product surface | Package(s) | Gap vs target IA |
| --- | --- | --- |
| AppFrame / columns / rail width | `ui-layout` | Home empty composition polish; palette host chrome |
| Left rail chrome, New Task | `ui-sidebar` | Rename/copy toward Task; Automation / Market entries |
| Workspace + task list + search | `ui-workspace` | Remote wizard; task-oriented copy; starter density |
| Home / transcript / composer shell | `ui-conversation` | Starter prompts; template cards; Git timeline density |
| Model seat | `ui-model-selection` | Banner integration on home |
| Permission seat | `ui-permission-presets` (+ Host `dsh-permission-presets`) | Peer-style labels; auto-edit preset design |
| Plan chip | `ui-plan` | Keep distinct from permission |
| Goal / progress | `ui-goal` + todo dock | Progress narrative packaging |
| Command / slash | `ui-commands`, `ui-input-trigger` | Ctrl+K palette |
| Skills | `ui-skill` | Settings section later |
| Subagents | `ui-subagent` | Settings IA entry |
| Settings shell | `ui-settings`, `ui-settings-general` | Section inventory growth |
| Models settings / onboarding | `ui-settings-models` | Home banner reuse |
| Plugins settings | `ui-settings-plugins`, `ui-settings-plugin-inventory` | Market is separate product |
| Agent presets | `ui-agent-preset` | Automation adjacency later |
| Trajectory | `ui-trajectory` | Power tab, not default home |
| Jobs | `ui-jobs` | Idle/automation visibility seed |
| Directory pick | `ui-directory-picker-native` / `browse` | Local only until remote providers |
| Theme / locale | `ui-theme`, `locale` | Appearance / General rows |
| Web kernel | `web`, `web-react`, `runtime`, `modules`, `connection` | Composition only |

New product behavior lands as slot contributions and Host projections/commands, not as a `packages/client/ui-zcode` fork of the tree.

### MVP cuts (ruthless)

#### MVP-P0 — “Agent IDE home in 30 seconds”

Must ship together on Desktop (shell may already exist):

1. **Installable/local Desktop entry** that opens Host + client ([shell](2026-08-19-dsh-desktop-electron-mvp.md) + packaging as available).
2. **Left rail**: New Task, workspace/task list, search, Settings entry; collapse to icon rail.
3. **Home empty state**: greeting, workspace picker, composer with **permission** + **model**, at least three starter prompts.
4. **Task timeline** with streaming chat/tool cards and visible **Goal or todo progress** when present.
5. **Permission** safe default + **full-access** gated by acknowledgement; **plan mode** reachable from composer/command.
6. **Local workspace** add/pick only (native or browse).
7. **Models** path clear on first run (onboarding or Settings → Models) so the home composer is routable.
8. **Slash commands** for power users; Ctrl+K may be thin if `/` and settings search cover the demo path — prefer shipping palette shell if cost stays in client chrome.

#### MVP-P1 — deepen the IDE loop

- Peer-faithful **permission labels** and an **auto-edit** preset story aligned with sandbox × approval.
- **Git** toolcards and a lightweight status entry from the task header or details.
- **Command palette** (Ctrl+K) over commands, sessions, and settings sections.
- Settings sections filled for **MCP**, richer **Plugins**, and **Usage** read-only.
- **Subagent** catalog discoverability from task header (already seeded) + settings pointer.
- Remote workspace **WSL** (Windows) before general SSH if engineering cost forces an order.

#### Later

- SSH + Docker remote workspace wizard completeness.
- Automation rail + idle-task product.
- Plugin **Market** (discovery/install), distinct from deployment inventory.
- Memory / Browser / Hooks / Index settings depth.
- Mobile remote control (QR / bots).
- Full IDE editor, multi-tenant cloud control plane, VS Code extension host.

### Desktop shell vs Host vs client (recap)

```text
┌─────────────────────────────────────────────┐
│ apps/desktop (Electron main)                │
│  window · tray/focus · Host supervisor      │
│  userData DSH_HOME · update consent later   │
└─────────────────┬───────────────────────────┘
                  │ spawn loopback Host
┌─────────────────▼───────────────────────────┐
│ Host (dsh web / Cordis)                     │
│  sessions · tools · sandbox × approval      │
│  projections · settings · workspaces        │
└─────────────────┬───────────────────────────┘
                  │ RPC + event stream
┌─────────────────▼───────────────────────────┐
│ packages/client/* (Agent IDE UI)            │
│  layout · rail · home · task · settings     │
└─────────────────────────────────────────────┘
```

**Rule:** if a change is visible in the Agent IDE IA and is not window lifecycle, it belongs in Host and/or `packages/client/*`. If a change is process death, ports, or installers, it belongs in `apps/desktop`.

## Alternatives considered

### Stay a chat wrapper; only ship the Electron window

Rejected as the product end state. A supervised `dsh web` without home/rail/permission/model task semantics loses the peer “30-second understand” test and undersells Host capabilities already in-tree (workspaces, presets, plan, goal, skills).

### Rebuild UI inside Electron main/renderer as a separate design system

Rejected. Doubles maintenance against `packages/client/*` and breaks the [GUI layering](../../implemented/architecture/2026-07-19-gui-layering-and-rpc-protocol.md) direction. Desktop is a shell; the IDE is the client composition.

### Copy peer preset names into sandbox mode enums

Rejected. Sandbox mode and approval policy remain mechanism knobs; plan mode is a separate loop mode. Product labels map onto presets + plan, they do not collapse four peer words into one enum.

### Make Plugin Market and Automation P0

Rejected. They expand trust, distribution, and scheduling surface area before the core task loop is obvious. Inventory and jobs stay the honest P0/P1 seeds.

### Lead with remote workspaces before local home polish

Rejected. Local folder + clear permission/model path is the desktop default story; remote wizards are high value but fail the 30-second test if home is still a blank chat.

## Acceptance criteria

### Feels like Zcode home in 30 seconds

A new user on Desktop, cold start, without CLI knowledge:

1. Sees a **named desktop app** window (not a raw terminal) within normal local startup time.
2. Within **30 seconds of first paint**, can identify: **how to start a task**, **where projects/tasks live**, **where to pick the model**, and **how dangerous the current permission mode is**.
3. Can bind a **local workspace**, send a first prompt, and see a **timeline** of agent work without opening Settings.
4. Can switch **permission mode** and **model** from the composer without slash-only discovery.
5. Can open **Settings** and find **Models** and **General** without documentation.
6. Never needs to be told “this is just Chromium over `dsh web`” to complete the above — implementation may remain that stack, product IA must not read as an unfinished chat debug surface.

### Engineering acceptance (P0)

- No business UI packages introduced under `apps/desktop`.
- Home/rail/composer work lands as changes under `packages/client/*` (+ Host only where projections/commands/presets require it).
- Sandbox × approval and plan-mode semantics remain Host-authoritative; client shows labels and triggers existing commands/RPCs.
- This note stays linked from Desktop product planning; shell-only notes do not silently redefine the product as chat-only.

## Risks

- **Preset vocabulary mismatch** — peer labels suggest four modes; DSH ships two default presets + plan. Mitigate with copy and a deliberate P1 preset table change, not ad-hoc client lies.
- **Scope creep into editor/cloud** — “IDE” here means agent task IDE, not VS Code replacement. Keep the Later list hard.
- **Remote workspace security** — SSH/Docker credentials and filesystem authority must stay Host-mediated; shell must not hold a parallel trust model.
- **Dual IA during transition** — Session vs Task naming will drift in copy before APIs rename; prefer UI copy first, durable API renames in a dedicated change.
- **Palette vs slash duplication** — two discovery surfaces can rot; palette should call the same command directory as `ui-commands`.
