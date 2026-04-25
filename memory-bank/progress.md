# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP + PR 22-23 complete**. **PR 24** optional. **PR 25-31** and **PR 35** (sharing) are done in code per **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)**. **Next up:** **PR 32** (templates) through **34**; **PR 35** stays on the roadmap for remaining **deploy / QA** tasks.

## Start here next session (new chat)

1. Read **`memory-bank/progress.md`** (this file) and **`memory-bank/activeContext.md`**.
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** -> **"Epic - Boards v2, tools & mobile (PR 25+)"** -> next build slice: **PR 32** (templates), then **33-34**. Revisit **PR 35** deploy/QA as needed.
3. Run **`npm run lint`** and **`npm run build`** before / after code changes.

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` ? **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### What to build next (priority order)

| Step | PR | Theme |
|------|-----|--------|
| **1** | **32-34** | Templates, AI template assistant, mobile - see roadmap |
| **-** | **35** | Sharing: deploy rules + two-account QA if not yet done |

### PR 24 (optional - only if submitting to Gauntlet)

- Demo script, video, social post, delivery checklist - see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md).

---

## Before each commit / PR

- `npm run lint`
- `npm run build`
- Update **`BUILD_ROADMAP.md`** checkboxes for the PR you finished.

---

## Done (shipped)

- **PR 23:** Submission pack - README, **`docs/ARCHITECTURE.md`** (mermaid), **`docs/AI_DEVELOPMENT_LOG.md`**, **`docs/AI_COST_ANALYSIS.md`**, **`docs/PRESEARCH_REFERENCE.md`**.
- **PR 25:** Multi-board save - dynamic **`/board/[boardId]`**, board metadata/index bootstrap, **`firestore.rules`** for owned boards, **`/api/ai`** board access, surfaces use runtime **`boardId`**.
- **PR 26:** Dashboard - **`/dashboard`** list/create/open; signed-in **`/`** -> dashboard.
- **PR 27:** Left tool rail - collapsible rail, mobile toggle, active tool + notices.
- **PR 28:** Pen / highlighter / eraser - **`freehand`** Firestore type, Konva polyline, **`setDoc`** per stroke, eraser deletes clicked stroke.
- **PR 29:** **Lasso** freehand closed path -> `onMarqueeSelect`. **Comments** `type: "comment"` pin + inline edit.
- **PR 30:** **Hyperlinks** `href` on supported objects + `type: "link"`; **`board-href`** validation; Cmd/Ctrl+click open.
- **PR 31:** Undo/redo history ? context-backed rail controls, keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z), snapshot-based board history; follow-up: request-token dedup (no repeat triggers) + safer debounced patch flush when docs are deleted during undo (`use-board-object-writes`).
- **PR 35 (code + rules):** Members + invites + join route + share panel + **`ensureBoardAccess`** for collaborators + AI for editors (see roadmap for remaining deploy/QA).
- **PR 22:** Vercel production, env vars, Firestore rules, smoke test.
- **PR 19-21:** AI route, token verify, tool execution, prompt/tooling updates.
- **PR 01-18:** Full MVP per roadmap (objects, shapes, cursors, presence, search, perf, QA, etc.).

## Not started (per roadmap)

- **PR 24** - demo/social (optional).
- **PR 32-34** - templates, AI template assistant, mobile - **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)**.

## Known issues / debt

- Orphan **connector** docs if endpoint deleted - see [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard `readText` permission; in-app buffer same tab only.
- `npm run dev` 404 on all routes: delete `.next`, restart dev.
