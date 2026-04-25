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

- **UI / Konva:** rendering, interaction, debounced writes.
- **Firestore:** source of truth — [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
- **API routes:** **`/api/ai`** only for Gemini; key never exposed.

## Realtime & conflicts

- Per-field **`updateDoc`**; **same-field LWW** — [docs/CONFLICTS.md](../docs/CONFLICTS.md) (includes AI two-user note).
- **Debounced** patches, batched **`writeBatch`** where applicable — [docs/PERF_NOTES.md](../docs/PERF_NOTES.md). **New object creates** (e.g. **`freehand`** strokes) use **`setDoc`** per stroke (same as other one-shot creates); merged edits still use **`useBoardObjectWrites`**.
- **AI:** [docs/AI_DEVELOPMENT_LOG.md](../docs/AI_DEVELOPMENT_LOG.md); tools run on client after API returns.

## Security

- **`firestore.rules`:** board **metadata** owner-only; **objects / cursors / presence** for **owner + editor** members; **viewers** read-only; **invites** + **members** subpaths — see repo **`firestore.rules`** (deploy after changes: **`npm run deploy:rules`**).
- Secrets: **Vercel env** + **`.env.local`** only.

## Conventions

- TypeScript strict; `@/*` → `src/*`.
- Small PRs; order per [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) — epic **PR 25+**; shipped through **31** (undo/redo) and **35** (sharing) per repo; next **32+**. See roadmap for **PR 35** deploy/QA.
