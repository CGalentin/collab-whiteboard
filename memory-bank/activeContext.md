# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff (new chat)

1. **`memory-bank/progress.md`** + **this file**
2. **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** — epic **PR 25+** (scroll past PR 24)
3. Code under **`src/`** as needed

---

## Current focus

| Area | State |
|------|--------|
| **MVP** | Shipped through **PR 23**; production deploy **PR 22** done |
| **PR 24** | **Skipped / optional** (demo video, social) unless submitting |
| **Next** | **PR 25** — **`feat/multi-board-save`** — first epic task: per-user boards, dynamic `/board/[boardId]`, rules, AI route ownership check |

Full epic (**PR 25–34**): save → dashboard → **left tool rail** (templates, pen, highlighter, eraser, lasso, comments, hyperlinks, undo/redo) → template gallery → AI template assistant → **mobile**. See **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)**.

---

## PR 25 — files likely to touch (preview)

| Area | Paths / notes |
|------|----------------|
| Board id | Today: **`src/lib/board.ts`** (`DEMO_BOARD_ID`) — evolve to URL param |
| Routes | **`src/app/board/`** → add **`[boardId]`** dynamic segment |
| Hooks | **`use-board-objects`**, presence, cursors — pass **`boardId`** |
| API | **`src/app/api/ai/route.ts`** — allow `boardId` if user **owns** board |
| Rules | **`firestore.rules`** — owner-based access for `boards/{boardId}/**` |
| Docs | **`docs/ARCHITECTURE.md`** — delta after data model change |

---

## AI feature — key files (unchanged until PR 25 refactors `boardId`)

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

- **PR 25:** How to index user boards (`users/{uid}/boards/...` vs query) — pick one in implementation.
- **Clipboard:** same-tab fallback; see [docs/CONFLICTS.md](../docs/CONFLICTS.md).

## Blockers

- None.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Rules: `npm run deploy:rules` (Firebase CLI + project)
