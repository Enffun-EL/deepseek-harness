# @deepseek-ai/dsh-client-ui-plugin-market

English | [中文](README.zh.md)

Zcode-like **plugin market shell** for Desktop/Web composition. The package ships a pure presentation surface over a **static fixture catalog**: a search box, an **Installed** row of placeholders, browse sections for **developer tools** and **productivity**, and a **Create plugin** CTA whose default callback is a no-op. Search filtering is a pure function over the fixture (`filterPluginMarketCatalog`) and is covered by package tests.

This surface is **not** the Settings plugin inventory. [`ui-settings-plugin-inventory`](../ui-settings-plugin-inventory/README.md) remains the read-only Host Loader deployment truth; the market is the later product path for discovery/install UX. The scaffold does not call Host RPCs, does not mutate the Loader, and does not yet register into AppFrame navigation — the browser half registers the `pluginMarket` locale namespace so a future rail route can mount `PluginMarketShell` without inventing copy.

## Model Experience

None, as this package renders static fixture cards for a human and touches no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **Fixture catalog only** — install, enable/disable, remote registry, and Host inventory merge are out of scope for the shell scaffold.
- **No layout route yet** — left-rail `navigatePluginMarket` wiring and a declared AppFrame slot land in a follow-up once Desktop home chrome owns the route.
- **Create plugin is a no-op** — the CTA exists for IA parity; authoring flow is deliberately deferred.
