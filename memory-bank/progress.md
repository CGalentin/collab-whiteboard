# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP (PR 01?23)** + **v2 / epic through PR 35** in code. **PR 24** (demo/social) still optional. **PR 32** optional template thumbnails still unchecked. **Next:** see table below (PR 24, PR 35 deploy/QA, or your own priorities).

## Start here next session (new chat)

1. Read **`memory-bank/progress.md`** and **`memory-bank/activeContext.md`** (and **`techContext.md`** if touching env or scripts).
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** for the canonical checklist; focus on **PR 24** (optional) and any open **PR 35** checkboxes (rules deploy, QA) you have not run in this environment.
3. Run **`npm run lint`** and **`npm run build`** before or after meaningful changes.

**Repo path (this machine):** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` ? **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### What to build next (priority order)

| Step | PR | Theme |
|------|-----|--------|
| **1** | **24** | Optional: demo script, video, social, Gauntlet checklist (roadmap) |
| **2** | **35** | If you use **sharing** in prod: **`npm run deploy:rules`**, two-account invite/QA (roadmap) |
| **3** | **?** | Product polish: e.g. template thumbnails (PR 32), auth/email templates in Firebase, bugfixes |

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
- **Auth UX (post?PR 04):** Extended **`/login`**: forgot password, in-app password reset (`confirmPasswordReset`), **email verification** (`sendEmailVerification`, **`applyActionCode`** for links), **`RequireAuth`** + **`verify-email-gate`**, shared helpers in **`src/lib/auth-client.ts`**.
- **Board UX:** **Hand (pan)** tool (**`board-tool-context`**, **`board-tool-rail`**, **`board-stage`**) · **Shapes** popover + **`type: "polygon"`** (see **`board-polygon-kinds`**, **`board-canvas`**, **`board-shapes-menu`**).
- **PR 22:** Vercel production, env vars, Firestore rules, smoke test.
- **PR 19-21:** AI route, token verify, tool execution, prompt/tooling updates.
- **PR 01-18:** Full MVP per roadmap (objects, shapes, cursors, presence, search, perf, QA, etc.).

## Not started (per roadmap)

- **PR 24** - demo/social (optional).

## Known issues / debt

- Orphan **connector** docs if endpoint deleted - see [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard `readText` permission; in-app buffer same tab only.
- `npm run dev` 404 on all routes: delete `.next`, restart dev.
