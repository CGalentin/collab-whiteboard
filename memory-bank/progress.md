# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** **MVP (PR 01-23)** + **v2 / epic through PR 35** in code. **PR 24** (demo/social) **intentionally skipped**. **PR 32** optional template thumbnails still unchecked. **Live board UI** is summarized in [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) section **Board UI vs roadmap (May 2026)**.

## Start here next session (new chat)

1. Read **`memory-bank/progress.md`** and **`memory-bank/activeContext.md`** (and **`techContext.md`** if touching env or scripts).
2. Open **[BUILD_ROADMAP.md](../BUILD_ROADMAP.md)** for the canonical checklist and the **Board UI vs roadmap** table at the bottom.
3. Run **`npm run lint`** and **`npm run build`** before or after meaningful changes.

**Repo path (this machine):** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` - **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### What to build next (priority order)

| Step | PR | Theme |
|------|-----|--------|
| **1** | **35** | **Manual QA** if you use sharing: two accounts, invite + UID, cursors/objects (roadmap). **`npm run deploy:rules`** only when `firestore.rules` changes or first prod setup. |
| **2** | **32** / misc | Template thumbnails (PR 32), Firebase auth email templates, bugfixes |

### PR 24 - skipped (intentional)

- Demo script, recorded demo, social post, and Gauntlet delivery checklist from the roadmap are **not** being pursued. Written submission artifacts from **PR 23** remain. Roadmap checkboxes for PR 24 may stay unchecked on purpose.

---

## Before each commit / PR

- `npm run lint`
- `npm run build`
- Update **`BUILD_ROADMAP.md`** checkboxes for the PR you finished (or add notes under **Board UI vs roadmap** for incremental UX).

---

## Done (shipped)

- **PR 23:** Submission pack - README, **`docs/ARCHITECTURE.md`**, **`docs/AI_DEVELOPMENT_LOG.md`**, **`docs/AI_COST_ANALYSIS.md`**, **`docs/PRESEARCH_REFERENCE.md`**. (**PR 24** demo/social skipped afterward.)
- **PR 25:** Multi-board save - **`/board/[boardId]`**, metadata/index bootstrap, **`firestore.rules`**, **`/api/ai`** board access.
- **PR 26:** Dashboard - **`/dashboard`**; signed-in **`/`** redirects to dashboard.
- **PR 27:** Left tool rail + **`BoardToolProvider`**; evolved layout - see **Board UI vs roadmap** in BUILD_ROADMAP.
- **PR 28:** Pen / highlighter / eraser - **`freehand`**, Konva, **`board-canvas`**.
- **PR 29:** Lasso; **Comments** object type + placement (toolbar toggles `comments` mode).
- **PR 30:** Hyperlinks - **`board-href`**, link hotspot, toolbar link row.
- **PR 31:** Undo/redo - snapshot history, rail + keyboard shortcuts, **`use-board-object-writes`** edge cases.
- **PR 32:** Templates gallery - **`board-templates.ts`**, modal; optional thumbnails still open.
- **PR 33:** Dashboard AI template section, **`maxToolCalls`**, **`ai-parse-api-response.ts`**.
- **PR 34:** Mobile - bottom tool drawer, pinch zoom, viewport/README notes.
- **PR 35 (code + rules in repo):** Members, invites, join route, share panel, **`ensureBoardAccess`**, AI for editors.
- **Auth UX (post PR 04):** Extended **`/login`**, **`auth-client.ts`**, **`verify-email-gate`**.
- **Board UX (post-roadmap):** Top toolbar: Color, Shapes, Sticky, Comments, clipboard row; **`board-tool-glyphs.tsx`**; **`BoardCanvas`** owns **`BoardToolRail`** + **`board-canvas-rail-mid`**; no **Draw** on rail; no **Add frame** in UI; **`type: "polygon"`** for shapes.
- **Highlighter follows board palette (May 2026):** **`board-stage.tsx`** - `DrawingDraft` includes **`stroke`**; preview + committed **`freehand`** use it; **`onDrawMove`** preserves **`stroke`** while appending points; **`handleStageMouseDown`** deps include **`railPenStrokeColor`** / **`railHighlighterStrokeColor`**; **`railHighlighterStrokeColor`** from **`board-canvas`** **`shapeStyle.fill`**. **`releaseRailToolForEditing`** removed from the **Color** button only (**Shapes** still calls it when opening the shapes menu). Users can change swatch while pen/highlighter is active (**`board-canvas.tsx`**).
- **PR 22:** Vercel production, env, rules smoke.
- **PR 19-21:** AI route, tools, prompts.
- **PR 01-18:** Full MVP per roadmap.

## Skipped / declined (per roadmap)

- **PR 24** - demo video, social, extra delivery checklist (intentional skip).

## Known issues / debt

- Orphan **connector** docs if endpoint deleted - [docs/CONFLICTS.md](../docs/CONFLICTS.md).
- Clipboard `readText` permission; in-app buffer same tab only.
- `npm run dev` 404 on all routes: delete `.next`, restart dev.
