# Agent Note: Plugin market shell scaffold

Status: implemented

English | [中文](2026-08-20-plugin-market-shell-scaffold.zh.md)

## Problem

The Desktop Agent IDE map and [Zcode home interaction contract](../../../apps/desktop/docs/zcode-home-interaction-contract.json) call for a **Plugin Market** route (`/plugins`) with installed list and category browse, distinct from Settings plugin inventory. Host install/registry APIs and left-rail navigation do not exist yet. Starting from install RPCs or AppFrame route ownership would force premature trust and Loader mutation seams before discovery UX is real.

## Decision

Ship `@deepseek-ai/dsh-client-ui-plugin-market` as a **presentation scaffold**:

1. **Static fixture JSON** — installed placeholders plus **developer tools** and **productivity** sections (`src/client/fixtures/catalog.json`).
2. **Pure search filter** — `filterPluginMarketCatalog` / `matchesPluginMarketEntry` over id, name, summary, and category; package tests own the behavior.
3. **Shell chrome** — search box, installed row, category sections, and a **Create plugin** CTA whose default callback is a no-op.
4. **Locale only in apply** — browser half registers the `pluginMarket` namespace; no layout slot or Host Remote in this cut.

Settings inventory ([`ui-settings-plugin-inventory`](../../../packages/client/ui-settings-plugin-inventory/README.md)) remains the read-only Host Loader deployment truth. Market is the later discovery/install product surface ([Agent IDE map](../../proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md)).

## Alternatives considered

- **Extend plugin inventory into a market** — inventory is deployment truth and must stay Host-read-only; market IA (browse, install, create) would overload that contract; rejected.
- **Wire `navigatePluginMarket` + AppFrame route now** — left-rail chrome is still landing; mounting a full-page route without a stable shell hole would invent layout ownership; deferred.
- **Real install/registry in the scaffold** — expands trust and distribution surface before the task loop home is obvious; rejected (same cut as the product map's "Market is Later").

## Consequences

- Designers and Desktop IA can mount `PluginMarketShell` with the fixture and a stub CTA.
- A later route owner mounts the shell and supplies `onCreatePlugin` / live catalog props; Host install stays outside the presentational tree.
- Export discipline: `./client` ships `apply`/`inject` and catalog/shell types only; filter helpers and the shell component stay package-internal for same-package tests.