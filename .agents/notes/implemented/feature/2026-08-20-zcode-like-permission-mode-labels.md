# Agent Note: Zcode-like permission mode labels

Status: implemented

English | [中文](2026-08-20-zcode-like-permission-mode-labels.zh.md)

## Problem

Desktop product IA targets Zcode-like permission vocabulary — 变更前确认 / 自动编辑 / 计划模式 / 完全访问 — while DSH already owns stable machine presets (`read-only`, `workspace-write`, `danger-full-access`) plus a separate plan-mode collaboration control. User-visible chrome still title-cased machine names (`Read Only`, `Workspace Write`) or mixed English product copy into Chinese confirmation strings, so the composer, settings row, and `/permission` popup did not match the intended product language.

## Decision

Keep host preset machine values and the permission-presets table unchanged. Map only presentation:

| Machine value | English label | Chinese label |
|---|---|---|
| `read-only` | Ask before edits | 变更前确认 |
| `workspace-write` | Auto edit | 自动编辑 |
| `danger-full-access` | Full access | 完全访问 |

Plan mode stays off the permission preset axis: `dsh-plan-mode` / `ui-plan` continue to own entry, exit, and the composer chip; Chinese a11y copy uses 计划模式 without inventing a fourth preset id.

Own the conventional label tables and `displayPermissionPreset` / `translatePermissionPreset` helpers in `ui-permission-presets` presentation. Settings options store host `name` only and resolve product labels at render through locale keys so language switches stay live. Composer `PermissionSelect` keeps a twin set of `access.preset.*` keys under the conversation namespace (same pattern as the existing Full-access risk copy duplication across optional bundles).

## Alternatives considered

- **Rename host presets or add Zcode ids** — rejected: breaks durable logs, settings documents, slash commands, and every consumer of sandbox/approval knobs.
- **Fold plan mode into the permission select** — rejected: plan mode is soft guidance with its own log events and exit review; sandbox/approval must remain independent.
- **Single shared locale package dependency from ui-conversation into ui-permission-presets** — deferred: the optional-bundle load order already duplicates access confirmation copy; label keys follow that existing split.

## Consequences

- Product-user-visible strings and web snapshots that pin access-mode chrome must use the new labels; machine command lines stay `/permission <preset>`.
- Custom host-configured preset names outside the three conventional ids still title-case or pass through.
- Full-access risk confirmation copy localizes the product name (完全访问 in zh) while English keeps "Full access".
