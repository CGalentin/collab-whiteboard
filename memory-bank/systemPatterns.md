# System patterns

## Start here next session

Follow **[`progress.md`](./progress.md)** (“Start here next session”) and **[`activeContext.md`](./activeContext.md)**.

---

## High-level architecture

```text
Browser (Next.js React)
  ├── Firebase Auth (client SDK)
  ├── Firestore listeners + writes (boards/{boardId}/objects|cursors|presence)
  └── fetch → POST /api/ai (Vercel) → Gemini (server key) → toolCalls → client executes → Firestore
```

**Today:** Runtime **`boardId`** from **`/board/[boardId]`** (validated in **`src/lib/board.ts`**); Firestore **`boards/{boardId}/objects|cursors|presence`**. **PR 35:** owners + **members** (editor/viewer roles); **`ensureBoardAccess`**; rules in **`firestore.rules`**. See [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) epic.

## Separation of concerns

- **UI / Konva:** rendering, interaction, debounced writes. **Rail pen/highlighter:** `BoardStage` keeps a short-lived **`DrawingDraft`** with **`points` + `stroke`**; stroke comes from props (**`railHighlighterStrokeColor`** / **`railPenStrokeColor`**) so the parent palette drives preview and **`freehand`** **`setDoc`** (not a fixed highlighter yellow).
- **Firestore:** source of truth — [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
- **API routes:** **`/api/ai`** only for Gemini; key never exposed.

## Realtime & conflicts

- Per-field **`updateDoc`**; **same-field LWW** — [docs/CONFLICTS.md](../docs/CONFLICTS.md) (includes AI two-user note).
- **Debounced** patches, batched **`writeBatch`** where applicable — [docs/PERF_NOTES.md](../docs/PERF_NOTES.md). **`cancelPendingWrites()`** before undo/redo snapshot apply.
- **Drag optimistic UI:** `board-stage.tsx` applies local position patches during drag; **remote `updatedAt` wins** when another client edits the same object (fixes Chrome stuck on Edge updates).
- **Objects listener:** `use-board-objects.ts` retries `onSnapshot` on error.
- **AI:** [docs/AI_DEVELOPMENT_LOG.md](../docs/AI_DEVELOPMENT_LOG.md); tools run on client after API returns.

## Board editing UX

- **Keyboard** (canvas focus, not in inputs): Ctrl/Cmd+A select all, X cut, C copy, V paste, Z undo, Y / Shift+Z redo — `board-canvas.tsx`, `board-shortcuts.ts`.
- **Context menu:** right-click canvas — `board-context-menu.tsx`.
- **Undo/redo:** snapshot stack in `board-canvas.tsx`; rail buttons via `BoardToolProvider` request tokens.

## Security

- **`firestore.rules`:** board **metadata** owner-only; **objects / cursors / presence** for **owner + editor** members; **viewers** read-only; **invites** + **members** subpaths — see repo **`firestore.rules`** (deploy after changes: **`npm run deploy:rules`**).
- Secrets: **Vercel env** + **`.env.local`** only.

## Conventions

- TypeScript strict; `@/*` → `src/*`.
- Small PRs; order per [BUILD_ROADMAP.md](../BUILD_ROADMAP.md). Epic **PR 25+** is implemented in repo; **Board UI vs roadmap** in that file describes current **`board-canvas`** toolbar vs **`board-tool-rail`** / **`board-canvas-rail-mid`**. **PR 24** skipped (intentional). Ongoing: **PR 35** sharing QA, **PR 32** optional thumbnails, **`npm run deploy:rules`** when `firestore.rules` edits ship.
