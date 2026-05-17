# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff (new chat)

1. **`memory-bank/progress.md`** + **this file**
2. **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** — section **“Where we left off”** under epic PR 36–54
3. Manual QA **one PR at a time**; check roadmap boxes only after your sign-off
4. **`npm run lint`** + **`npm run build`** before push

---

## Current focus

| Area | State |
|------|--------|
| **MVP + v2** | **PR 01–35** shipped (**PR 24** skipped) |
| **App cleanup** | **PR 36–39** code + partial QA; **PR 40–54** in repo, **checkboxes unchecked** for your review |
| **Next session** | Start **PR 40** (sign-up display name), then 41 → 54 in order |
| **Do not** | Batch-check PRs or ship without per-PR manual QA |

### Workflow

1. Open roadmap → find next unchecked PR (starts at **40**).
2. Hard-refresh board → run that PR’s **QA** bullets.
3. Check boxes in **BUILD_ROADMAP.md** when satisfied.
4. Repeat.

---

## PR 36–39 — agent work (re-verify when you have time)

| PR | What landed in code | Your QA |
|----|---------------------|---------|
| **37** | `releaseRailToolForEditing()` immediately on pen/comment/link (not after Firestore) | Re-verify |
| **38** | Lasso group select/move; multi-select color; `commitDragFromNode` drag fix | Re-verify |
| **39** | Line/freehand move; pen/highlighter/line **Color** before & after draw | Re-verify |
| **—** | Eraser **Tap** vs **Brush**; partial stroke erase (`board-eraser-geometry.ts`) | Not a numbered PR — test with eraser tool |

Key files: `board-stage.tsx`, `board-canvas.tsx`, `board-group-drag.ts`, `board-eraser-geometry.ts`, `board-lasso-geometry.ts`.

---

## PR 40–54 — awaiting your sign-off

All checkboxes **unchecked** in roadmap. Implementation exists from prior agent sessions; treat as **review + QA**, not greenfield build.

| PR | One-line reminder |
|----|-------------------|
| 40 | Sign-up display name → presence/cursors |
| 41 | Yellow sticky default; palette on shapes + pen |
| 42 | Pen/highlighter S/M/L width |
| 43 | Multi-select duplicate (+ frame children) |
| 44 | Delete board on dashboard |
| 45 | Comment pin; no link bar on comments |
| 46 | Collapsible link panel |
| 47 | One-way connector arrow |
| 48 | Text font size + families |
| 49 | Rotate 90° |
| 50 | Snap to grid (24px) |
| 51 | My boards / Shared with me |
| 52 | Mobile toolbar interim |
| 53 | Mobile color dropdown z-index |
| 54 | Custom toolbar PNGs (partial) |

---

## Open decisions

- **PR 54:** Remaining SVG icons when assets ready.
- **PR 35:** Two-account sharing QA; **`npm run deploy:rules`** when rules change.
- **PR 52:** Full mobile mockup blocked.
- **Eraser:** Styled connector lines may simplify to plain segments after partial brush erase.

## Blockers

- None.

## Commands

- Dev: `npm run dev` (delete `.next` if stale)
- Build: `npm run build`
- Lint: `npm run lint`
- Rules: `npm run deploy:rules`
