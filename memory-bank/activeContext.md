# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff (new chat)

1. **`memory-bank/progress.md`** + **this file**
2. **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** — **“Where we left off”** (PR 36–54 epic)
3. Manual QA **one PR at a time**; check roadmap boxes only after your sign-off
4. **`npm run lint`** + **`npm run build`** before commit/push

---

## Current focus

| Area | State |
|------|--------|
| **MVP + v2** | **PR 01–35** shipped (**PR 24** skipped) |
| **App cleanup** | **PR 36–53 signed off**; **PR 54** partial (toolbar PNGs) |
| **Next session** | **PR 54** (upload remaining toolbar icons) |
| **Do not** | Batch-check PRs or ship without per-PR manual QA |

### Workflow

1. Open roadmap → next unchecked PR (**54**).
2. Hard-refresh board → run that PR’s **QA** bullets.
3. Check boxes in **BUILD_ROADMAP.md** when satisfied.
4. Repeat.

---

## Signed off — app cleanup (PR 36–53)

| PR | Notes |
|----|--------|
| **40** | Sign-up display name; presence/cursors; board header name |
| **41** | Yellow sticky default; palette recolor; pen ink; custom + mobile color picker |
| **42** | Pen/highlighter S/M/L stroke width; cross-browser sync |
| **43** | Multi-select duplicate; frame + children; connector remap |
| **44** | Owner delete on dashboard; shared boards = leave only |
| **45** | Comment pin 52px hit pad; link row hidden for `type === "comment"`; Konva tap handlers |
| **46** | Collapsible link panel — collapsed by default; Apply collapses |
| **47** | One-way connector arrow; connect tool hint + endpoint filter |
| **48** | Text font size presets; 9 named font families in `board-font-presets.ts` |
| **49** | Rotate 90° toolbar; polygon = box transform only (`docs/CONFLICTS.md`) |
| **50** | Snap to grid 24px; `snapBoxToGrid()` on transform end |
| **51** | Dashboard **My boards** / **Shared with me** sections |
| **52** | Mobile left collapsible tool menu (interim); auto-collapse; overlays top toolbar |
| **53** | Mobile Color dropdown — fixed panel, z-70, scrollable, 40px swatches |

**Also signed off in roadmap (36–39):** hand pan, tool→select (one-shot tools only), lasso group drag, line/freehand move+color — optional re-verify if regressions appear.

**Note:** Pen, highlighter, eraser, and hand **stay active** after use (no auto-return to Select).

Key files: `board-tool-rail.tsx`, `board-canvas.tsx`, `board-palette-strip.tsx`, `board-stage.tsx`.

---

## This session — code landed (unnumbered / extra UX)

| Topic | Files |
|-------|--------|
| **Persistent draw tools** | `board-canvas.tsx` — pen/highlighter/eraser/hand skip `releaseRailToolForEditing` |
| **Mobile menu z-index** | `board-tool-rail.tsx` — drawer z-85 overlays top toolbar |
| **Dashboard user info** | `dashboard/page.tsx` — name + email in header |
| **Board user name** | `board-title-header.tsx` — larger display name |
| **Mobile left tool menu** | `board-tool-rail.tsx` — slide-out panel, edge tab, auto-close |
| **Collapsible search** | `board-canvas.tsx` — magnifier icon; expand on tap |
| **Mobile comments** | `board-stage.tsx` — auto-open editor; tap selected pin to edit |

---

## PR 54 — awaiting sign-off

| PR | One-line reminder |
|----|-------------------|
| **54** | Custom toolbar PNGs (partial in `public/icons/`); SVG fallbacks remain |

---

## PR 36–39 — optional re-verify

Hand pan, lasso group, line/freehand color, eraser tap vs brush.

---

## Open decisions

- **PR 52:** Full mobile mockup layout still **blocked**; interim left menu shipped instead of bottom bar.
- **PR 54:** Remaining SVG icons when assets ready.
- **PR 35:** Two-account sharing QA; **`npm run deploy:rules`** when rules change.
- **PR 37:** Roadmap still lists pen→Select; **behavior changed** — persistent draw tools only.
- **Board delete:** Owner delete does not remove collaborators’ `users/{uid}/boards` index or orphan subcollections.

## Blockers

- None.

## Commands

- Dev: `npm run dev` (delete `.next` if stale)
- Build: `npm run build`
- Lint: `npm run lint`
- Rules: `npm run deploy:rules`
