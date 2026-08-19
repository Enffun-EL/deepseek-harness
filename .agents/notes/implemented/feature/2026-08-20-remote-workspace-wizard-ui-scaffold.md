# Agent Note: Remote workspace wizard UI scaffold

Status: implemented

English | [中文](2026-08-20-remote-workspace-wizard-ui-scaffold.zh.md)

## Problem

The Desktop Agent IDE map calls for remote workspace entry (SSH / WSL / Docker) beside local directory pickers, but Host remote providers and wired add-flow composition do not exist yet. Starting from a full `ui-remote-workspace` package or slot registration would force premature Loader, locale, and Host seams before any transport contract is real.

## Decision

Scaffold a **presentational** remote workspace wizard inside `@deepseek-ai/dsh-client-ui-workspace` at `src/remote-wizard/`:

1. **Kind cards** — SSH, WSL, Docker on step 1.
2. **Step indicator** — steps 1..4 (kind → connection → path → review).
3. **Callbacks only** — `onCancel` / `onFinish(draft)` (plus optional step/draft observers). No SSH, WSL, or Docker I/O.
4. **Pure navigation** — `steps.ts` owns advance/back clamps and per-step completeness gates; unit tests cover those functions. The React shell stays mountable for presentation tests without plugin apply.

The module stays package-internal (same-package test imports). It is **not** exported from `./client` and is **not** registered into a slot until a later Host-backed composition lands. A separate `ui-remote-workspace` package was deferred: the architecture map already places the remote wizard gap on `ui-workspace`, and a second package would only duplicate Loader boilerplate for pure UI.

## Alternatives considered

- **New `ui-remote-workspace` package now** — cleaner long-term home if remote flows grow large, but premature without Host providers, slot ownership, or locale namespace demand; rejected for this scaffold.
- **Wire into WorkspacePickFlow / directory-flow holes immediately** — would either fake transport or break the local-only picker contract; rejected until Host remote materialization exists.
- **Client steppers with real SSH probes** — violates Host-mediated workspace identity and the browser trust boundary; rejected.

## Consequences

- Designers and Desktop IA work can mount the shell with stubs; product copy defaults ship in Chinese on the component until locale registration.
- Adding Host-backed finish must stay outside this module (owner callback or a later driver), never inside the presentational tree.
- Export discipline still applies: widening `./client` for this scaffold requires an explicit product decision.
