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
| **App cleanup** | **PR 36–52 interim signed off**; **PR 53–54** pending QA |
| **Next session** | **PR 53** (mobile color picker re-QA), then **PR 54** (toolbar PNGs) |
| **Do not** | Batch-check PRs or ship without per-PR manual QA |

### Workflow

1. Open roadmap → next unchecked PR (**53**).
2. Hard-refresh board → run that PR’s **QA** bullets.
3. Check boxes in **BUILD_ROADMAP.md** when satisfied.
4. Repeat.

---

## Signed off — app cleanup (PR 36–52 interim)

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
| **52** | Mobile left collapsible tool menu (interim); auto-collapse on selection |

**Also signed off in roadmap (36–39):** hand pan, tool→select, lasso group drag, line/freehand move+color — optional re-verify if regressions appear.

Key files: `board-tool-rail.tsx`, `board-canvas.tsx`, `board-stage.tsx`, `board-canvas-rail-mid.tsx`, `boards-client.ts`, `dashboard/page.tsx`.

---

## This session — code landed (unnumbered / extra UX)

| Topic | Files |
|-------|--------|
| **Mobile left tool menu** | `board-tool-rail.tsx` — slide-out panel, edge tab, auto-close |
| **Mobile mid-rail close** | `board-canvas-rail-mid.tsx` — closes menu after line/text/connect/duplicate |
| **Board page padding** | `board/[boardId]/page.tsx` — removed bottom bar inset |
| **Collapsible search** | `board-canvas.tsx` — magnifier icon; expand on tap; Esc/outside close |
| **Mobile comments** | `board-stage.tsx` — auto-open editor after pin; tap selected pin to edit |
| **Undo/redo fix** | `use-board-object-writes.ts` (`cancelPendingWrites`); `board-canvas.tsx` history mutex |
| **Keyboard shortcuts** | Ctrl/Cmd+A X C V Z Y on board; `board-shortcuts.ts` |
| **Right-click menu** | `board-context-menu.tsx` — cut/copy/paste/duplicate/delete/select all/undo/redo |
| **Cross-browser sync** | `board-stage.tsx` — optimistic drag patches yield to remote `updatedAt` |
| **Listener retry** | `use-board-objects.ts` — resubscribe on snapshot error |

---

## PR 53–54 — awaiting sign-off

| PR | One-line reminder |
|----|-------------------|
| **53** | Mobile color dropdown touch/z-index — partially fixed in PR 41; re-QA on phone |
| **54** | Custom toolbar PNGs (partial in `public/icons/`) |

---

## PR 36–39 — optional re-verify

Hand pan, select-after-tool, lasso group, line/freehand color, eraser tap vs brush.

---

## Open decisions

- **PR 52:** Full mobile mockup layout still **blocked**; interim left menu shipped instead of bottom bar.
- **PR 54:** Remaining SVG icons when assets ready.
- **PR 35:** Two-account sharing QA; **`npm run deploy:rules`** when rules change.
- **Board delete:** Owner delete does not remove collaborators’ `users/{uid}/boards` index or orphan subcollections (cursors/presence/members).

## Blockers

- None.

## Commands

- Dev: `npm run dev` (delete `.next` if stale)
- Build: `npm run build`
- Lint: `npm run lint`
- Rules: `npm run deploy:rules`
