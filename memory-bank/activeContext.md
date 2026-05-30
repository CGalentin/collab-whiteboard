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
| **App cleanup** | **PR 36–44 signed off**; **PR 45–54** in repo, **checkboxes unchecked** |
| **Next session** | **PR 45** (comment pin + link decouple), then 46 → 54 |
| **Do not** | Batch-check PRs or ship without per-PR manual QA |

### Workflow

1. Open roadmap → next unchecked PR (**45**).
2. Hard-refresh board → run that PR’s **QA** bullets.
3. Check boxes in **BUILD_ROADMAP.md** when satisfied.
4. Repeat.

---

## Signed off — app cleanup (PR 36–44)

| PR | Notes |
|----|--------|
| **40** | Sign-up display name; presence/cursors; board header name |
| **41** | Yellow sticky default; palette recolor; pen ink; custom + mobile color picker |
| **42** | Pen/highlighter S/M/L stroke width; cross-browser sync |
| **43** | Multi-select duplicate; frame + children; connector remap |
| **44** | Owner delete on dashboard; shared boards = leave only |

**Also signed off in roadmap (36–39):** hand pan, tool→select, lasso group drag, line/freehand move+color — optional re-verify if regressions appear.

Key files: `board-canvas.tsx`, `board-stage.tsx`, `boards-client.ts` (`deleteOwnedBoard`), `dashboard/page.tsx`.

---

## This session — code landed (unnumbered PRs)

| Topic | Files |
|-------|--------|
| **Undo/redo fix** | `use-board-object-writes.ts` (`cancelPendingWrites`); `board-canvas.tsx` history mutex |
| **Keyboard shortcuts** | Ctrl/Cmd+A X C V Z Y on board; `board-shortcuts.ts` |
| **Right-click menu** | `board-context-menu.tsx` — cut/copy/paste/duplicate/delete/select all/undo/redo |
| **Cross-browser sync** | `board-stage.tsx` — optimistic drag patches yield to remote `updatedAt` |
| **Listener retry** | `use-board-objects.ts` — resubscribe on snapshot error |

---

## PR 45–54 — awaiting sign-off

Implementation exists from prior sessions; treat as **review + QA**, not greenfield build.

| PR | One-line reminder |
|----|-------------------|
| **45** | Comment pin hit target; no link bar on comments |
| **46** | Collapsible link panel |
| **47** | One-way connector arrow |
| **48** | Text font size + families |
| **49** | Rotate 90° |
| **50** | Snap to grid (24px) |
| **51** | My boards / Shared with me — **may already match dashboard UI; quick verify** |
| **52** | Mobile toolbar interim |
| **53** | Mobile color dropdown (partially fixed in PR 41 — re-QA) |
| **54** | Custom toolbar PNGs (partial) |

---

## PR 36–39 — optional re-verify

Hand pan, select-after-tool, lasso group, line/freehand color, eraser tap vs brush.

---

## Open decisions

- **PR 54:** Remaining SVG icons when assets ready.
- **PR 35:** Two-account sharing QA; **`npm run deploy:rules`** when rules change.
- **PR 52:** Full mobile mockup blocked.
- **Board delete:** Owner delete does not remove collaborators’ `users/{uid}/boards` index or orphan subcollections (cursors/presence/members).

## Blockers

- None.

## Commands

- Dev: `npm run dev` (delete `.next` if stale)
- Build: `npm run build`
- Lint: `npm run lint`
- Rules: `npm run deploy:rules`
