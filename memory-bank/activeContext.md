# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff (new chat)

1. **`memory-bank/progress.md`** + **this file**
2. **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** — epic **PR 25+** (**PR 24** demo/social skipped) + **Board UI vs roadmap** (live layout at bottom of file)
3. Code under **`src/`** as needed

---

## Current focus

| Area | State |
|------|--------|
| **MVP** | Shipped through **PR 23**; production deploy **PR 22** done |
| **PR 24** | **Skipped** (demo script, video, social, Gauntlet delivery checklist) — intentional; **PR 23** submission docs remain the written deliverable |
| **v2 + epic** | **PR 25–35** in code: multi-board, dashboard, tool rail, drawing, lasso, links, undo, templates, AI on dashboard, **mobile (PR 34)**, **sharing (PR 35)** |
| **Next** | **PR 35** two-account **manual QA** if you rely on sharing · **PR 32** optional template thumbnails · **`npm run deploy:rules`** when `firestore.rules` changes (prod may already match) |

**PR 35** — sharing code + rules file in repo; validate **invite + collaborator** flows in your environment.

### Recent product updates (not every item is a roadmap PR)

| Topic | Where |
|--------|--------|
| **Auth** | **`/login`**: forgot password, reset in-app, email verification after signup, **`applyActionCode`** for verify links; **`RequireAuth`** + **`verify-email-gate`**. Helpers: **`src/lib/auth-client.ts`**. **Firebase console:** email/password on, **authorized domains** for action links. |
| **Board chrome** | **`board-canvas.tsx`**: top toolbar — Search, AI, Help, **Color** + **Shapes** dropdowns, **Sticky** (add), **Comments** (toggle mode), link row, **Copy / Paste / Delete / Clear**; line hint. **`board-tool-rail.tsx`** + **`board-canvas-rail-mid.tsx`** inside **`BoardCanvas`**: Templates, drawing tools, Hand, Lasso, Links; mid — Line, Text, Connect, Duplicate. Shared SVGs: **`board-tool-glyphs.tsx`**. **Draw** removed from rail; **Add frame** removed from UI (frames via templates / AI). |
| **Shapes** | **`board-shapes-menu.tsx`**, **`type: "polygon"`**, **`board-polygon-kinds`** |
| **Mobile** | Bottom tool drawer, pinch zoom; README “Mobile and small screens” |

---

## PR 25 — implemented files

| Area | Paths / notes |
|------|---------------|
| Board id | **`src/lib/board.ts`** — board id validation + Firestore path helpers |
| Board bootstrap | **`src/lib/boards-client.ts`** — ensure `boards/{boardId}` + `users/{uid}/boards/{boardId}` docs |
| Routes | **`src/app/board/page.tsx`** redirect + **`src/app/board/[boardId]/page.tsx`** dynamic board |
| Board surfaces | **`board-canvas`** (includes **`BoardToolRail`**), **`presence-sidebar`**, **`ai-board-panel`** |
| API | **`src/app/api/ai/route.ts`** — **owner or editor** member may run tools (not viewer) |
| Rules | **`firestore.rules`** — see file; deploy with **`npm run deploy:rules`** |

### PR 27–31 — key paths

| Area | Paths |
|------|--------|
| Tool state | **`src/context/board-tool-context.tsx`**, **`src/components/board-tool-rail.tsx`**, **`src/components/board-tool-glyphs.tsx`**, provider on **`src/app/board/[boardId]/page.tsx`** |
| Drawing (PR 28) | **`board-object.ts`** (`freehand`), **`board-stage.tsx`**, **`board-canvas.tsx`** |
| Lasso (PR 29) | **`board-lasso-geometry.ts`**, **`board-stage`**, **`board-canvas`** |
| Comments (PR 29) | **`comment-pin-shape.tsx`**, **`type: "comment"`**; placement mode from **top toolbar** (context `activeTool === "comments"`) |
| Hyperlinks (PR 30) | **`board-href.ts`**, **`link-hotspot-shape.tsx`**, rail **Hyperlinks**, toolbar link row |
| Undo/Redo (PR 31) | **`board-tool-context.tsx`**, **`board-tool-rail.tsx`**, **`board-canvas.tsx`**, **`board-stage.tsx`**, **`use-board-object-writes.ts`** |
| Templates (PR 32) | **`board-templates.ts`**, **`board-templates-modal.tsx`**, **`board-tool-context.tsx`** |
| AI dashboard (PR 33) | **`dashboard-ai-template-section.tsx`**, **`ai-parse-api-response.ts`** |

---

## AI feature — key files (`boardId` is dynamic; executor knows `freehand`)

| Piece | Path |
|--------|------|
| API | `src/app/api/ai/route.ts` |
| Token verify | `src/lib/verify-firebase-id-token.ts` |
| System prompt | `src/lib/ai-board-system-prompt.ts` |
| Gemini | `src/lib/run-board-gemini.ts` |
| Tools | `src/lib/ai-board-tools.ts` |
| Executor | `src/lib/ai-execute-tools-client.ts` |
| Board snapshot | `src/lib/board-context-for-ai.ts` |
| UI | `src/components/ai-board-panel.tsx` |
| Types | `src/lib/ai-api-types.ts` |

---

## Submission docs (if needed)

| Doc | Path |
|-----|------|
| Architecture | [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) |
| AI dev log | [`docs/AI_DEVELOPMENT_LOG.md`](../docs/AI_DEVELOPMENT_LOG.md) |
| AI cost | [`docs/AI_COST_ANALYSIS.md`](../docs/AI_COST_ANALYSIS.md) |
| Pre-Search | [`docs/PRESEARCH_REFERENCE.md`](../docs/PRESEARCH_REFERENCE.md) · [`PRESEARCH_AND_TRACKING.md`](../PRESEARCH_AND_TRACKING.md) |

---

## Open decisions

- **PR 32+:** Optional template **thumbnails**; mobile toolbar polish.
- **PR 35:** Two-account **QA** when using sharing; **rules deploy** only when `firestore.rules` changes.
- **Auth:** Firebase **authorized domains** + **email templates** must match deployed URL.
- **Clipboard:** same-tab fallback; [docs/CONFLICTS.md](../docs/CONFLICTS.md).

## Blockers

- None.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Rules: `npm run deploy:rules` (Firebase CLI + project)
