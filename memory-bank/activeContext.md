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
| **PR 24** | **Optional** (demo video, social) unless submitting |
| **Latest done (v2)** | **PR 25–33** (core) + **PR 35** (sharing). **PR 33:** **`DashboardAiTemplateSection`** on **`/dashboard`**, chips + new-board **`/api/ai`** + client **`executeAiToolCallsClient`**, **`maxToolCalls`** in API + **`runBoardGemini`**. |
| **Next** | **PR 24** (optional) or follow-up polish — **PR 34** (mobile) is implemented in repo |

**PR 35** remains in the roadmap: implementation is in repo; see roadmap for **deploy rules** + **manual QA** checkboxes (ongoing as needed).


---

## PR 25 — implemented files

| Area | Paths / notes |
|------|---------------|
| Board id | **`src/lib/board.ts`** — board id validation + Firestore path helpers |
| Board bootstrap | **`src/lib/boards-client.ts`** — ensure `boards/{boardId}` + `users/{uid}/boards/{boardId}` docs |
| Routes | **`src/app/board/page.tsx`** redirect to `/board/{uid}` + **`src/app/board/[boardId]/page.tsx`** dynamic board |
| Board surfaces | **`board-canvas`**, **`presence-sidebar`**, **`ai-board-panel`**, **`firestore-rules-smoke`** now take runtime `boardId` |
| API | **`src/app/api/ai/route.ts`** — **owner or editor** member may run tools (not viewer) |
| Rules | **`firestore.rules`** — owner on board metadata; **owner + editor** on `objects` / cursors / presence; viewers read-only; invites + members — see **`firestore.rules`** |

### PR 27–31 — key paths

| Area | Paths |
|------|--------|
| Tool state | **`src/context/board-tool-context.tsx`**, **`src/components/board-tool-rail.tsx`**, provider on **`src/app/board/[boardId]/page.tsx`** |
| Drawing (PR 28) | **`src/lib/board-object.ts`** (`type: "freehand"`), **`src/components/board-stage.tsx`**, **`src/components/board-canvas.tsx`** (`railDrawMode`, eraser + line), **`src/components/board-object-shapes.tsx`** |
| Lasso (PR 29) | **`src/lib/board-lasso-geometry.ts`**, lasso state + draft in **`board-stage`**, **`board-canvas`** (`lassoActive`) |
| Comments (PR 29) | **`src/components/comment-pin-shape.tsx`**, **`type: "comment"`** in **`board-object.ts`**, inline edit / **`flushCommentBodyNow`** in writes hook |
| Hyperlinks (PR 30) | **`src/lib/board-href.ts`**, optional **`href`** on supported types + **`link`** in **`board-object.ts`**, **`link-hotspot-shape.tsx`**, rail **Hyperlinks** = place hotspot on empty board, toolbar **Link** when one object selected |
| Undo/Redo (PR 31) | **`src/context/board-tool-context.tsx`** (history control tokens + canUndo/canRedo), **`src/components/board-tool-rail.tsx`**, **`src/components/board-canvas.tsx`** (snapshot history + shortcuts; `lastHandled*TokenRef` so undo/redo is not re-triggered on context churn), **`src/components/board-stage.tsx`** (checkpoint hooks for drawing/comment/link create), **`src/hooks/use-board-object-writes.ts`** (per-doc update fallback; ignore not-found for stale debounced patches after delete) |
| Templates (PR 32) | **`src/lib/board-templates.ts`** (catalog + batch `applyTemplate`), **`src/components/board-templates-modal.tsx`**, context **`templatesModalOpen`** / **`openTemplatesModal`** / **`closeTemplatesModal`** in **`board-tool-context.tsx`**, rail **Templates** opens modal |
| AI dashboard template (PR 33) | **`src/components/dashboard-ai-template-section.tsx`**, **`/dashboard`**; **`/api/ai`** accepts **`maxToolCalls`**; shared **`parseAiResponse`** in **`src/lib/ai-parse-api-response.ts`** |
| Geometry / AI / clipboard | **`src/lib/board-geometry.ts`**, **`src/lib/clone-board-object.ts`**, **`src/lib/board-clipboard.ts`**, **`src/lib/board-context-for-ai.ts`**, **`src/lib/ai-execute-tools-client.ts`** (`moveObject` for freehand) |

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

- **PR 32+:** Templates drawer, mobile toolbar (PR 34) — refine over current mobile “Show tools” toggle.
- **PR 35:** Invite/join polish after functional sharing; **deploy rules** + two-account QA per roadmap.
- **Clipboard:** same-tab fallback; see [docs/CONFLICTS.md](../docs/CONFLICTS.md).

## Blockers

- None.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Rules: `npm run deploy:rules` (Firebase CLI + project)
