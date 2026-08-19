# Agent Note: Desktop Host supervisor hardening

Status: implemented

English | [中文](2026-08-19-desktop-host-supervisor-hardening.zh.md)

## Problem

MVP-A desktop shell started `dsh web` once and stopped the child on quit. A Host crash after readiness left a dead window; readiness timeout was a fixed constant; stop relied on a single PID signal (orphans possible on Windows); and crash dialogs had no bounded recent log tail.

## Decision

`apps/desktop` hardens Host supervision without moving business UI into Electron:

1. **Post-ready restart** — `main.ts` listens for unexpected Host exit after readiness, applies pure policy in `host-restart-policy.ts` (default max 5 attempts, 1s → exponential ×2, cap 30s), shows a status page during backoff, respawns via `startHost`, and reloads the BrowserWindow on the new URL. Intentional quit does not restart. A successful ready clears the failure streak.
2. **Configurable ready timeout** — `host-ready-timeout.ts` reads `DSH_DESKTOP_HOST_READY_MS` (positive ms); invalid/absent values use 120_000.
3. **Bounded log ring** — `host-log-ring.ts` keeps a fixed-capacity line ring (default 400) for crash dialogs and readiness error tails; supervisors no longer grow an unbounded output string.
4. **Stronger stop** — `host-supervisor.ts` still uses SIGTERM then SIGKILL cross-platform; on Windows it also runs `taskkill /T` (then `/F`) so grandchild trees do not orphan.

Pure policy, ring, and timeout helpers are unit-tested under `apps/desktop/tests`.

## Alternatives considered

- **No restart (manual relaunch only)** — simpler, but a transient Host crash forces a full app restart; rejected for desktop reliability expectations.
- **Unlimited restart** — can mask a permanent Host failure and thrash the machine; rejected in favor of a capped streak.
- **File-backed rotating logs in the shell** — useful later for support bundles; deferred; in-memory ring is enough for crash dialogs and avoids filesystem coupling in MVP.

## Consequences

- Desktop recovers from post-ready Host crashes within the attempt budget; exhausted budget surfaces a dialog with the ring tail.
- Operators can lengthen slow-start readiness waits without rebuilding.
- Windows stop is more aggressive (tree kill); mis-attributed PIDs remain a residual risk if Electron ever shares process groups unexpectedly — the Host is spawned non-detached as a direct child.
- Policy defaults live as module constants for tests; product knobs beyond ready timeout stay code defaults until a settings surface exists.
