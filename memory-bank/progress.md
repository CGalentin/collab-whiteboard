# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

## Start here next session

1. Read **`memory-bank/progress.md`** (this file) and **`memory-bank/activeContext.md`**.
2. Open [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) → **PR 16 — `feat/search-mvp`** (toolbar search + client-side filter on stickies/text).
3. Run **`npm run lint`** and **`npm run build`** before / after changes.

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` · **Remote:** `https://github.com/CGalentin/collab-whiteboard`

---

## Before you commit (tonight)

- `npm run lint`
- `npm run build`
- Skim **`BUILD_ROADMAP.md`** checkboxes for PRs **14–15** (should be `[x]`).

---

## Done (recent)

- **PR 14:** Frames, standalone **text**, **connectors**, unified z-order layer, **Delete** / **Duplicate**, `clone-board-object`, etc.
- **PR 15:** **`board-clipboard.ts`** (`collabwb:v1:`), Copy/Paste toolbar, **Ctrl/Cmd+C·V**, internal clipboard fallback, paste **32px** offset + connector id remap.

## Earlier (PR 01–13)

- Pre-search, Firebase, auth, board shell, Konva pan/zoom, objects, stickies, shapes, selection/transformer, conflicts doc + merged patches — see **git history** and **BUILD_ROADMAP**.

## In progress

- None (next: **PR 16**)

## Not started

- AI route, submission artifacts

## Known issues / debt

- **Publish** `firestore.rules` if the DB is still in **test mode** or rules are stale
- Orphan **connector** docs when an endpoint is deleted (no GC yet)
- Clipboard **readText** may need user permission in some browsers; in-app buffer is **same tab only**
