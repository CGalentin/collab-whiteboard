# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP + PR 22–23 complete** (deploy + submission docs). **PR 24** optional. **Next: epic PR 25+** — start with **`feat/multi-board-save`**.

## Start here next session (new chat)

1. Read **`memory-bank/progress.md`** (this file) and **`memory-bank/activeContext.md`**.
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** → section **“Epic — Boards v2, tools & mobile (PR 25+)”** — first unchecked PR is **PR 25**.
3. Run **`npm run lint`** and **`npm run build`** before / after code changes.

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` · **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### What to build next (priority order)

| Step | PR | Theme |
|------|-----|--------|
| **1** | **25** | Multi-board **save**: `boards/{boardId}` metadata, owner index, `/board/[boardId]`, Firestore rules, `/api/ai` scoped to owned boards |
| **2** | **26** | **Dashboard** — “Your boards”, create / open |
| **3** | **27–34** | Left **tool rail**, drawing, lasso, comments, hyperlinks, undo/redo, **templates**, AI template assistant, **mobile** — see roadmap |

### PR 24 (optional — only if submitting to Gauntlet)

- Demo script, video, social post, delivery checklist — see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md).

---

## Before each commit / PR

- `npm run lint`
- `npm run build`
- Update **`BUILD_ROADMAP.md`** checkboxes for the PR you finished.

---

## Done (shipped)

- **PR 23:** Submission pack — README, **`docs/ARCHITECTURE.md`** (mermaid), **`docs/AI_DEVELOPMENT_LOG.md`**, **`docs/AI_COST_ANALYSIS.md`**, **`docs/PRESEARCH_REFERENCE.md`**.
- **PR 22:** Vercel production, env vars, Firestore rules, smoke test.
- **PR 21:** **`ai-board-system-prompt.ts`**, **`ai-board-tools`**, sticky **`fill`**, AI panel **`aria-busy`**, **`docs/CONFLICTS.md`** AI + two users.
- **PR 19–20:** **`POST /api/ai`**, **`verify-firebase-id-token`**, **`executeAiToolCallsClient`**, **`AiBoardPanel`**.
- **PR 01–18:** Full MVP per roadmap (objects, shapes, cursors, presence, search, perf, QA, etc.).

## Earlier detail

- See **git history** and **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** checkboxes.

## In progress

- None.

## Not started (intentional)

- **PR 24** — demo/social (optional).
- **PR 25–34** — Boards v2 epic — **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** (save first, then dashboard, tools, templates, mobile).

## Known issues / debt

- **Single `demo` board id** in code today — **PR 25** replaces with real **`boardId`** per board.
- Orphan **connector** docs if endpoint deleted — see [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard **readText** permission; in-app buffer **same tab only**.
- **`npm run dev`** → **404 on all routes**: delete **`.next`**, restart dev.
