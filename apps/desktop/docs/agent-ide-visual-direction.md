# DSH Desktop Agent IDE — visual direction

Zcode-class products set a **dark Agent IDE** expectation. DSH borrows that **mood and hierarchy**, not peer pixels, logos, or marketing chrome.

## Mood (what users should feel)

| Trait | Direction |
| --- | --- |
| Atmosphere | Calm night studio: deep charcoal base, soft elevation, low glare |
| Hierarchy | Left rail quieter than stage; stage centers the empty-state job |
| Focus | One large composer card; secondary chips/cards recede |
| Accent | **DeepSeek blue** (`--dsw-static-deepseek-*`), not peer purple/magenta |
| Type | Existing product sans; greeting large but not billboard-shouty |
| Motion | Prefer opacity/elevation; avoid flashy glow loops |

## Surfaces

1. **Stage (home)** — near-base fill, optional soft radial wash (brand blue at low alpha), no trademark geometry.
2. **Rail** — slightly elevated or inset vs stage; icon+label nav; empty sections as quiet captions.
3. **Composer card** — highest elevation on home: thicker radius, hairline border, inner toolbar.
4. **Template / starter rows** — same family as composer, lower contrast.
5. **Banners** — warn/info using existing state tokens, not neon outlines.

## Tokens

Prefer **alias tokens** already owned by `ui-theme` (`--dsw-alias-*`, `--dsw-specific-sidebar-*`).

Desktop-only polish may add **component CSS** under client packages (`ui-home`, `ui-sidebar` DesktopRail) that:

- composes those aliases
- may introduce **local** `--dsh-ide-*` variables scoped to the component root

Do **not** fork a second global palette that drifts from light/dark product themes.

## Allowed inspiration vs forbidden clone

| Allowed | Forbidden |
| --- | --- |
| Dark rail + bright stage contrast | Copying Zcode logo / “Z” watermark art |
| Large centered greeting | Peer catchphrase copy as default strings |
| Rounded floating composer | Extracting peer CSS/assets from installers |
| Soft card grid under composer | Pixel-matching spacing sheets from screenshots |
| Deep blue CTA | Purple glow skin marketed as “Zcode theme” |

## Acceptance

- Dark preference: home empty state reads as an IDE home within 3 seconds (rail + greeting + composer).
- Light preference: same structure, no broken contrast (aliases must work both ways).
- No peer brand assets in repo.
- Reviewers can reject PRs whose primary goal is screenshot pixel-match.

## Related

- [IA note — borrow, do not clone](../../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-zcode-like-agent-ide.md#borrow-do-not-clone-hard-design-rule)
- [Build plan](./zcode-build-plan.md)
- `packages/client/ui-theme` design tokens
