# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP + PR 22-23 complete**. **PR 24** optional. **PR 25-33**, **PR 34** (mobile), and **PR 35** (sharing) are done in code per **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)**; PR 32 optional thumbnails unchecked. **Next up:** **PR 24** (optional) or **PR 35** deploy/QA.

## Start here next session (new chat)

1. Read **`memory-bank/progress.md`** (this file) and **`memory-bank/activeContext.md`**.
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** for optional **PR 24** or **PR 35** deploy/QA. **PR 34** (mobile) is done.
3. Run **`npm run lint`** and **`npm run build`** before / after code changes.

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` ? **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### What to build next (priority order)

| Step | PR | Theme |
|------|-----|--------|
| **-** | **24** | Optional: demo / social (roadmap) |
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
- **PR 32:** Templates gallery ? modal from rail; **`board-templates.ts`** + **`board-templates-modal.tsx`**; undo checkpoint before apply; optional thumbnails still on roadmap.
- **PR 33:** Dashboard AI template ? **`dashboard-ai-template-section.tsx`**, **`maxToolCalls`** on **`/api/ai`**, **`ai-parse-api-response.ts`**.
- **PR 34:** Mobile / responsive: **`viewport`**, `overflow-x`, dashboard tap targets, board **bottom tool drawer** + **pinch zoom** on canvas, README. Files: `layout.tsx`, `globals.css`, `dashboard`, `board-tool-rail.tsx`, `board/[boardId]/page.tsx`, `board-stage.tsx`.
- **PR 35 (code + rules):** Members + invites + join route + share panel + **`ensureBoardAccess`** for collaborators + AI for editors (see roadmap for remaining deploy/QA).
- **PR 22:** Vercel production, env vars, Firestore rules, smoke test.
- **PR 19-21:** AI route, token verify, tool execution, prompt/tooling updates.
- **PR 01-18:** Full MVP per roadmap (objects, shapes, cursors, presence, search, perf, QA, etc.).

## Not started (per roadmap)

- **PR 24** - demo/social (optional).

## Known issues / debt

- Orphan **connector** docs if endpoint deleted - see [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard `readText` permission; in-app buffer same tab only.
- `npm run dev` 404 on all routes: delete `.next`, restart dev.
