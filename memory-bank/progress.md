# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP (PR 01–23)** + **v2 (PR 25–35)** shipped. **PR 24** skipped. **App cleanup PR 36–54:** code largely in repo; **manual QA in progress** — **PR 40–54 unchecked** in roadmap for one-by-one review.

## Start here next session

1. Read **`memory-bank/progress.md`** and **`memory-bank/activeContext.md`**
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** → **“Where we left off”** (PR 36–54 epic)
3. Begin **PR 40** — test sign-up display name QA; check boxes only when signed off
4. Continue **PR 41 → 54** in order (one PR per session or per sitting)
5. **`npm run lint`** + **`npm run build`** before commit/push

**Remote:** `https://github.com/CGalentin/collab-whiteboard`

### Optional (after PR 40–54 QA)

| Item | Notes |
|------|--------|
| Re-verify **PR 36–39** | Hand pan, select-after-tool, lasso group, line color/move, eraser brush |
| **PR 35** | Two-account sharing QA; `npm run deploy:rules` |
| **PR 54** | Upload remaining toolbar PNGs |
| **PR 52** | Full mobile layout when mockup ready |

### PR 24 — skipped

Demo/social/Gauntlet delivery checklist not pursued.

---

## Before each commit / push

- `npm run lint`
- `npm run build`
- Update **BUILD_ROADMAP.md** checkboxes only for PRs you personally signed off

---

## Shipped (earlier milestones)

- **PR 01–23:** MVP (submission pack, AI, deploy).
- **PR 25–35:** Multi-board, dashboard, tools, templates, mobile, sharing.
- **PR 24:** Skipped.

---

## App cleanup (PR 36–54) — implementation in repo

*Roadmap checkboxes: **PR 36–39** still marked done in roadmap; **PR 40–54 unchecked** pending your QA.*

### In repo (not all user-signed-off)

| PR | Summary |
|----|---------|
| 36 | Hand tool → viewport pan only |
| 37 | Tools return to Select after one-shot actions |
| 38 | Lasso hit test; multi-select group drag |
| 39 | Line/freehand drag; stroke colors |
| 40 | Sign-up `displayName` |
| 41 | Object colors; yellow sticky; pen from palette |
| 42 | Pen/highlighter stroke width S/M/L |
| 43 | Multi-select duplicate |
| 44 | Owner delete board on dashboard |
| 45 | Comment pin + link decouple |
| 46 | Collapsible link panel |
| 47 | Connector one-way arrow |
| 48 | Text font size + families |
| 49 | Rotate 90° |
| 50 | Snap-to-grid 24px |
| 51 | My boards / Shared with me |
| 52 | Mobile toolbar interim |
| 53 | Mobile color picker z-index |
| 54 | Partial custom icons in `public/icons/` |

### May 2026 session work (agent — include in PR 36–39 re-test)

| Topic | Notes |
|-------|--------|
| Group drag | Live preview + `commitDragFromNode`; fixed sticky/rect jump on drag end |
| Multi-select color | `applyPaletteChoice` applies to all selected |
| Pen/highlighter/line color | Color menu keeps pen/highlighter active; stroke vs fill |
| Eraser | Tap (delete object) + Brush (partial erase via `computeEraserBrushChanges`) |

---

## Known issues / debt

- Orphan **connector** docs if endpoint deleted — [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard `readText` permission; in-app buffer same-tab only.
- `npm run dev` stale bundle: delete `.next`, restart.
- Partial brush erase on styled connector lines may drop arrow/elbow styling on fragments.
- Review **`git status`** before push (may include uncommitted session changes).
