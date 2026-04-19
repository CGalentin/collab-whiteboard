# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

**Status:** Done through **PR 21** · Next milestone **PR 22** (Vercel production).

## Start here next session

1. Read **`memory-bank/progress.md`** (this file) and **`memory-bank/activeContext.md`**.
2. Open [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) → **PR 22 — `chore/vercel-production`**.
3. Run **`npm run lint`** and **`npm run build`** before / after changes.

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` · **Remote:** `https://github.com/CGalentin/collab-whiteboard`

### PR 22 (next) — checklist

- Connect **GitHub → Vercel**; enable **auto-deploy** for the production branch.
- Set **all env vars** on Vercel (`NEXT_PUBLIC_FIREBASE_*`, **`GEMINI_API_KEY`**, optional **`GEMINI_MODEL`**).
- Deploy **Firestore rules** to the production Firebase project; avoid leaving test-only rules public.
- **Smoke test** production URL: login, board, AI panel.

---

## Before each commit / PR

- `npm run lint`
- `npm run build`
- Update **`BUILD_ROADMAP.md`** checkboxes for the PR you finished.

---

## Done (recent)

- **PR 21:** **`ai-board-system-prompt.ts`** — system prompt for creation / manipulation / layout / templates (SWOT, retro, grid); **`ai-board-tools`** expanded; **`createStickyNote`** optional **`fill`** (hex) in executor; AI panel **`aria-busy`**; **`docs/CONFLICTS.md`** two-user AI + LWW.
- **PR 20:** **`ai-execute-tools-client.ts`**, **`board-context-for-ai.ts`**, **`AiBoardPanel`** on `/board`; `boardContext` on API; client runs tool calls after Gemini. Follow-up: **`run-board-gemini`** (model fallbacks, quota/404 handling); **`ai-board-panel`** fetch/JSON parsing and reply/error area.
- **PR 19:** **`POST /api/ai`** — `GEMINI_API_KEY`, Firebase ID token verification (`verify-firebase-id-token` — JWT + securetoken certs), Gemini + tools (`ai-board-tools.ts`), shared JSON types (`ai-api-types.ts`).
- **PR 18:** **`docs/MANUAL_QA_MATRIX.md`** — two-browser checklist, refresh, 2m stress, DevTools throttle/offline, 5+ session table + sign-off.
- **PR 17:** Batched **`writeBatch`** object patches (`use-board-object-writes`), **React.memo** on canvas shapes (data-only compare), cursor debounce **75ms**, **`docs/PERF_NOTES.md`**.
- **PR 16:** Toolbar **search** (`getTextSearchMatchIds` in **`board-search.ts`**), client substring on **sticky** + **`text`**, dim non-matches / amber ring on matches, README + ARCHITECTURE.
- **PR 14:** Frames, standalone **text**, **connectors**, unified z-order layer, **Delete** / **Duplicate**, `clone-board-object`, etc.
- **PR 15:** **`board-clipboard.ts`** (`collabwb:v1:`), Copy/Paste toolbar, **Ctrl/Cmd+C·V**, internal clipboard fallback, paste **32px** offset + connector id remap.

## Earlier (PR 01–13)

- Pre-search, Firebase, auth, board shell, Konva pan/zoom, objects, stickies, shapes, selection/transformer, conflicts doc + merged patches — see **git history** and **BUILD_ROADMAP**.

## In progress

- None (next: **PR 22**)

## Not started

- **PR 23+** — submission pack (README polish, architecture diagram, AI log, cost analysis, etc.)

## Known issues / debt

- **Publish** `firestore.rules` if the DB is still in **test mode** or rules are stale (required before real public deploy).
- Orphan **connector** docs when an endpoint is deleted (no GC yet).
- Clipboard **readText** may need user permission in some browsers; in-app buffer is **same tab only**.
- If **`npm run dev`** serves **404 for every route**, delete the **`.next`** folder and restart dev (corrupted dev cache).
