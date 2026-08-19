# @deepseek-ai/dsh-client-ui-home

English | [中文](README.zh.md)

Pure React atoms for a Zcode-like **HOME empty state** (zero cordis plugin body): `HomeGreeting`, `ModelStatusBanner` (missing-model CTA), `ProjectPickerButton` (props + callbacks only), `HomeComposerChrome` (permission mode select + model select + submit placeholder), `StarterPromptList`, and `TemplateCardGrid`. `HomeEmptyState` stacks those atoms for demos; product owners may mount each export independently. Every string arrives through props or the exported `zh`/`en` maps (`homeString`); nothing here reads application state, opens dialogs, or talks to remotes.

## How to mount (TODO)

This package is **not** registered in the web-app cordis profile yet. Wire it without breaking the monorepo build as follows:

1. **Import atoms** from `@deepseek-ai/dsh-client-ui-home` (source path via tsconfig until a consumer bundles it).
2. **Preferred product seat:** compose into the blank New Session hero owned by [`ui-conversation`](../ui-conversation/README.md) — today `ConversationRoot` / `HeroShell` plus `conversation.hero.workspace` and `conversation.hero.agentPreset`. Either replace the hero chrome with `HomeEmptyState` or place individual atoms around the existing composer card.
3. **Desktop-only path:** mount from `apps/desktop` shell chrome if HOME must stay out of the shared Web profile.
4. **Locale:** call `homeString(locale, key)` or register the `zh`/`en` maps under a future `home` namespace when a cordis client half is added.
5. **Actions:** pass `onConfigure` / `onClick` / `onPermissionModeChange` / `onModelChange` / `onSubmit` / `onSelect` from the owner (settings open, directory picker, session start). This package never owns those side effects.

## Model Experience

None, as the package renders pure React atoms in the browser; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No cordis `apply` / slot registration** — exports are library atoms only; web-app `cordis.patch.yml` and a `./client` entry remain future work.
- **No live model or permission data** — options and selection are props; host projections stay in `ui-model-selection` / `ui-permission-presets`.
- **Composer body is a placeholder** — the real textarea and send path remain in `ui-conversation` `InputBar`.
