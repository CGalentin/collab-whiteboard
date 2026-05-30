# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP (PR 01–23)** + **v2 (PR 25–35)** shipped. **PR 24** skipped. **App cleanup:** **PR 36–52 interim signed off**; continue **PR 53 → 54** one-by-one QA.

## Start here next session

1. Read **`memory-bank/progress.md`** and **`memory-bank/activeContext.md`**
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** → **“Where we left off”**
3. Begin **PR 53** — mobile color picker re-QA on phone; check boxes only when signed off
4. Continue **PR 54** (toolbar PNGs)
5. **`npm run lint`** + **`npm run build`** before commit/push

**Remote:** `https://github.com/CGalentin/collab-whiteboard`

### Optional (when time allows)

| Item | Notes |
|------|--------|
| Re-verify **PR 36–39** | Hand pan, select-after-tool, lasso group, line color/move, eraser brush |
| **PR 35** | Two-account sharing QA; `npm run deploy:rules` |
| **PR 52** | Full mobile mockup layout when design ready (interim left menu shipped) |
| **PR 54** | Upload remaining toolbar PNGs |

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

## App cleanup (PR 36–54)

### Signed off (roadmap checked)

| PR | Summary |
|----|---------|
| 36–39 | Hand pan, tool→select, lasso group drag, line/freehand move+color |
| 40 | Sign-up `displayName`; header shows name |
| 41 | Yellow sticky; palette recolor; pen **ink** from palette; custom + mobile color picker |
| 42 | Pen/highlighter stroke width S/M/L; preview + Firestore sync |
| 43 | Multi-select duplicate (+ frame children, connector remap) |
| 44 | Owner delete board on dashboard; shared = leave only |
| 45 | Comment pin hit target; link row hidden for comments |
| 46 | Collapsible link panel |
| 47 | One-way connector arrow; connect tool UX |
| 48 | Text font size + 9 named font families |
| 49 | Rotate 90° toolbar |
| 50 | Snap-to-grid 24px; full box snap on resize |
| 51 | Dashboard My boards / Shared with me |
| 52 | Mobile left collapsible tool menu (interim; full mockup still blocked) |

### In repo — QA pending (53–54)

| PR | Summary |
|----|---------|
| 53 | Mobile color picker z-index/touch (re-QA; much fixed in PR 41) |
| 54 | Partial custom icons in `public/icons/` |

### Session work (May 2026 — latest)

| Topic | Notes |
|-------|--------|
| **PR 45–51 QA** | User signed off comment pin, link panel, connectors, fonts, rotate, snap, dashboard sections |
| **PR 52 interim** | Left slide-out tool menu on mobile; auto-collapse; removed bottom bar padding |
| **Mobile comments** | Auto-open editor after pin; tap selected pin to edit; larger touch textarea |
| **Collapsible search** | Toolbar search collapsed to magnifier; expand/collapse on tap |
| **PR 42–44 QA** | Pen width, duplicate batch, dashboard delete |
| **Undo/redo** | Cancel pending writes before history apply; serialize undo/redo |
| **Edit shortcuts** | Ctrl/Cmd+A X C V Z Y + canvas right-click menu |
| **Cross-browser sync** | Stale optimistic drag patches no longer block Edge→Chrome updates |
| **Objects listener** | Auto-retry on Firestore snapshot error |
| Eraser brush | Full-path erase, smaller brush; mobile pointer events |
| Custom color `ink` | Pen/line use picked color via `paletteChoiceToStyle().ink` |
| Mobile color UI | Fixed dropdown, `z-70`, 40px swatches, native color input |

---

## Known issues / debt

- Orphan **connector** docs if endpoint deleted — [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- **Owner board delete** may leave collaborators’ dashboard index entries; cursors/presence/members subcollections not batch-deleted.
- Clipboard `readText` permission; in-app buffer same-tab only.
- `npm run dev` stale bundle: delete `.next`, restart.
- Partial brush erase on styled connector lines may drop arrow/elbow styling on fragments.
- **PR 52:** Full mobile toolbar mockup not implemented; interim left menu replaces prior bottom bar approach.
