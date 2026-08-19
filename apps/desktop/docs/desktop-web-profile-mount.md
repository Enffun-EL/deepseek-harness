# Desktop web profile mount plan

Reference for mounting desktop-oriented client packages on the shared Web Host without changing the default browser profile that `dsh web` and CLI users boot.

Related product notes: [zcode-parity-inventory.md](./zcode-parity-inventory.md), [zcode-home-interaction-contract.json](./zcode-home-interaction-contract.json). Package contracts: [`ui-home`](../../../packages/client/ui-home/README.md), [`ui-command-palette`](../../../packages/client/ui-command-palette/README.md). Composition rules: [architecture.md](../../../docs/architecture.md), [publish tutorial](../../../docs/user/develop/basic/publish.md).

## What Desktop boots today

`@deepseek-ai/dsh-desktop` does not own a separate Cordis tree. The Electron main process spawns local Host as `dsh web --host 127.0.0.1 --port 0` (see `apps/desktop/src/host/launcher.ts`) under a desktop-isolated `DSH_HOME`, then loads the readiness URL in a sandboxed `BrowserWindow`.

That means Desktop and CLI Web share:

1. Profile template `web` → bundles `@deepseek-ai/dsh-base` then `@deepseek-ai/dsh-web-app`.
2. Browser plugin roster in [`packages/bundle/web-app/cordis.patch.yml`](../../../packages/bundle/web-app/cordis.patch.yml).
3. Built SPA / client module graph served by `web-runtime` + `modules`.

Desktop-only product chrome that must not land in every browser deployment therefore cannot be edited into the default web-app bundle until product accepts that blast radius. Prefer a **later patch layer** (profile user layer, home layer, `--patch`, or a future desktop-only bundle) over editing the shipped web-app insert list.

## Layer order (do not break default web)

Effective config over the empty profile root:

| Order | Layer | Who owns it | Safe for desktop-only UI? |
| --- | --- | --- | --- |
| 1 | Bundle patches in `dsh.profile.bundles` order | Shipped packages | Only if the change is intended for **all** Web users |
| 2 | `$DSH_HOME/profiles/<name>/cordis.patch.yml` | That profile only | Yes — Desktop can use a dedicated profile or a Desktop-written web profile layer |
| 3 | `$DSH_HOME/cordis.patch.yml` | Every profile on the machine | Usually no for product UI (affects headless/custom too) |
| 4 | Each `dsh … --patch <path>` | One invocation | Yes for experiments; Desktop would need to pass the flag when spawning Host |

Rules that protect default web:

- **Do not** add desktop-only rows to `packages/bundle/web-app/cordis.patch.yml` until the package is a deliberate shared Web surface (as `ui-command-palette` already is).
- **Do not** put desktop-only inserts in home-level `$DSH_HOME/cordis.patch.yml` on developer machines that also run CLI profiles.
- A patch that targets an existing row by `id` **replaces that row's entire `config`**. Restate every required key; never ship a partial override.
- Prefer **`insert` of new ids** for additive client plugins. New ids cannot collide with shipped web-app rows.
- Client packages need a dual-face entry the Host can serve (`dsh.client` + `./client` export, like command palette). Pure React atom libraries (`ui-home` today) are **not** mountable as bare cordis rows until a thin client owner exists.

## Current roster facts

### Already on default web (`dsh-web-app`)

These rows already sit in the browser plugin insert block of `packages/bundle/web-app/cordis.patch.yml`. Desktop inherits them with no extra patch:

```yaml
- id: ui-command-palette
  name: '@deepseek-ai/dsh-client-ui-command-palette'
```

Also present and relevant to HOME / shell chrome: `ui-layout`, `ui-sidebar`, `ui-conversation`, `ui-workspace`, `ui-commands`, `ui-input-trigger`, `ui-model-selection`, `ui-permission`, `ui-agent-preset`, `ui-plugin-market`, and the rest of the shipped client roster in that file.

Do **not** re-insert `ui-command-palette` under a second id. A second mount would double-register `shell.overlay` / locale namespaces and fail load or produce duplicate UI.

### Not on default web yet

| Package | npm name | Mount blocker today | Intended product seat |
| --- | --- | --- | --- |
| `ui-home` | `@deepseek-ai/dsh-client-ui-home` | Library atoms only — no `./client` apply, no `dsh.client` manifest | Blank New Session hero owned by `ui-conversation` (`conversation.hero.*`), or a future client owner that injects those slots |
| Future desktop settings / update chrome | *(none)* | No client package yet | `settings.section` from a desktop client plugin, or Electron main-only dialogs (updates already use main-process consent) |
| Future `ui-git` / files rail | *(none)* | New packages | New sidebar/layout slots; never overload `ui-tool` |

## How to mount without breaking default web

### Path A — Desktop-only profile user layer (recommended for product)

1. Give Desktop its own Host profile name (for example `desktop`) **or** keep `web` but write only into the Desktop `DSH_HOME` profile directory (Electron `userData/…/dsh-home/profiles/web/cordis.patch.yml`). CLI developers using a different `DSH_HOME` never see those rows.
2. Install any out-of-tree client packages into that profile (`dsh plugin --profile <name> add …`) so Node resolution and the client module scanner can find them.
3. Append **insert-only** rows to that profile's `cordis.patch.yml` (exact rows in the next section).
4. Keep launcher argv as `web` **or** switch launcher to `--profile desktop` once the profile template exists; either way, default monorepo `dsh web` without that `DSH_HOME` stays on the shipped bundle list only.

### Path B — Invocation `--patch` (experiments / CI)

```sh
dsh web --host 127.0.0.1 --port 0 --patch /path/to/desktop-ui.cordis.patch.yml
```

Desktop would pass the same `--patch` after `web` in `resolveHostLaunch` only when explicitly productized. The inactive example under [`apps/desktop/config/`](../config/desktop-ui.cordis.patch.yml.example) is for copy-paste into a real overlay; the `.example` suffix is never auto-loaded.

### Path C — Promote into `dsh-web-app` (shared Web + Desktop)

Use only when the surface is intentional for browser users:

1. Add workspace dependency on `@deepseek-ai/dsh-web-app`.
2. Insert the client row next to peers in `packages/bundle/web-app/cordis.patch.yml`.
3. Ensure `dsh.client` + bundled `./client` export + client catalog / knip entries.
4. Run Web smoke / snapshots that cover the new chrome.

`ui-command-palette` already followed Path C. `ui-home` should **not** follow Path C until a cordis client half owns slot registration and props wiring.

### Path D — Compose atoms inside an existing owner (no new cordis row)

For `ui-home` atoms, the lowest-risk shared-web change is a code change in `ui-conversation` (or a small new client package that only fills declared hero holes) that imports `@deepseek-ai/dsh-client-ui-home` and passes live callbacks. That still affects default web if merged into the conversation package; gate behind composition only if the owner package itself is desktop-only.

## Exact cordis patch rows to add later

Copy these into a **later** layer (profile / `--patch` / future desktop bundle). They are planning stubs: enable only when the named package exports a loadable client plugin.

### 1. Global command palette — already shipped; reference only

Present in `dsh-web-app` today. Shown here so desktop patches do not duplicate it:

```yaml
# ALREADY IN packages/bundle/web-app/cordis.patch.yml — do not re-insert.
# - id: ui-command-palette
#   name: '@deepseek-ai/dsh-client-ui-command-palette'
```

Optional later **config** override (only if the package grows a `Config` schema; restating full config is mandatory when overriding):

```yaml
# Example shape only — not valid until ui-command-palette defines config fields.
# - id: ui-command-palette
#   name: '@deepseek-ai/dsh-client-ui-command-palette'
#   config:
#     # restate every key the row needs
```

### 2. HOME empty state — deferred client owner

`@deepseek-ai/dsh-client-ui-home` is atoms-only. When a client half lands (proposed package name stable as the same npm name with `./client`, or a thin `@deepseek-ai/dsh-client-ui-home-shell`), insert **one** of the following.

**Preferred — additive client row** (after `ui-conversation` / `ui-workspace` so hero holes exist):

```yaml
- insert:
    - id: ui-home
      name: '@deepseek-ai/dsh-client-ui-home'
```

If the owner is a separate shell package:

```yaml
- insert:
    - id: ui-home
      name: '@deepseek-ai/dsh-client-ui-home-shell'
```

Placement guidance relative to the web-app browser roster:

- Insert **after** `ui-conversation` and `ui-workspace` (hero holes and workspace picker).
- Insert **after** `ui-layout` (frame / overlay hosts).
- Keep **before** session-scoped chrome that assumes an active transcript if the HOME plugin only targets blank hero.
- Do not disable `ui-conversation`; HOME should fill or wrap hero slots, not replace the conversation domain row.

**Not valid today** (will fail module resolution or client scan):

```yaml
# INVALID until ./client + dsh.client exist on ui-home
- insert:
    - id: ui-home
      name: '@deepseek-ai/dsh-client-ui-home'
```

### 3. Desktop-only settings / shell bridges (future)

When a desktop client bridge package exists (illustrative ids):

```yaml
- insert:
    - id: ui-desktop-settings
      name: '@deepseek-ai/dsh-client-ui-desktop-settings'
    - id: ui-desktop-shell-bridge
      name: '@deepseek-ai/dsh-client-ui-desktop-shell-bridge'
```

Main-process features (auto-update consent, first-run welcome strip) stay in `apps/desktop` and must not be fake cordis rows.

### 4. Future parity packages (from inventory)

Only after packages and host remotes exist:

```yaml
- insert:
    - id: ui-git
      name: '@deepseek-ai/dsh-client-ui-git'
    - id: ui-files
      name: '@deepseek-ai/dsh-client-ui-files'
```

### 5. Full desktop overlay sketch (inactive checklist)

Concatenate only the rows that are actually shippable. Command palette omitted because web-app already mounts it:

```yaml
# apps/desktop/config/desktop-ui.cordis.patch.yml  (real file, not .example)
# Applied via profile cordis.patch.yml merge or: dsh web --patch <this-file>
- insert:
    # Requires ui-home client half (or shell package) — blocked today.
    - id: ui-home
      name: '@deepseek-ai/dsh-client-ui-home'
    # Uncomment when packages exist:
    # - id: ui-desktop-settings
    #   name: '@deepseek-ai/dsh-client-ui-desktop-settings'
    # - id: ui-git
    #   name: '@deepseek-ai/dsh-client-ui-git'
    # - id: ui-files
    #   name: '@deepseek-ai/dsh-client-ui-files'
```

An annotated, non-active copy lives at [`apps/desktop/config/desktop-ui.cordis.patch.yml.example`](../config/desktop-ui.cordis.patch.yml.example). Nothing in Desktop or web-app loads `*.example` patches.

## Dependency and packaging checklist

When enabling a new client row for Desktop Host:

1. **Workspace / profile dependency** — profile `package.json` or web-app `dependencies` must list the package; bare `name:` rows resolve through the profile install graph.
2. **Client dual-face** — `package.json` `"dsh": { "client": { … } }` and export `./client` (see command palette).
3. **Bundle graph** — client entry built so `modules` can serve `/plugins/<id>/client.js`.
4. **Id stability** — keep `id: ui-*` aligned with web-app peers; never recycle an id with a different package name.
5. **Verify** — `dsh --profile <name> --dump-config` shows the new layer; Host boot must not warn on unresolved client entries; Web/Desktop smoke still loads conversation + sidebar.

## Explicit non-goals

- Forking a second SPA for Electron.
- Mounting pure atom packages as cordis plugins without a client `apply`.
- Using home-level patches on a shared developer `DSH_HOME` for desktop-only UI.
- Replacing `ui-commands` (session `/` menu) with the global palette; both remain.

## Summary

| Goal | Mechanism | Touches default `dsh web`? |
| --- | --- | --- |
| Global Ctrl+K palette | Already in `dsh-web-app` | Already shared |
| Zcode HOME atoms | Import from owner code, or future `insert` `ui-home` on a desktop profile / `--patch` | Only if promoted into web-app or conversation |
| Desktop settings / git / files | Future insert rows on desktop-scoped layer | No, until deliberately promoted |
| Experiment overlay | `desktop-ui.cordis.patch.yml.example` → real patch + `--patch` or profile layer | No |
