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

**Today:** MVP uses a **constant demo `boardId`** (`src/lib/board.ts`). **PR 25+** moves to **per-user boards** and **`/board/[boardId]`** — see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) epic.

## Separation of concerns

- **UI / Konva:** rendering, interaction, debounced writes.
- **Firestore:** source of truth — [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
- **API routes:** **`/api/ai`** only for Gemini; key never exposed.

## Realtime & conflicts

- Per-field **`updateDoc`**; **same-field LWW** — [docs/CONFLICTS.md](../docs/CONFLICTS.md) (includes AI two-user note).
- **Debounced** patches, batched **`writeBatch`** where applicable — [docs/PERF_NOTES.md](../docs/PERF_NOTES.md).
- **AI:** [docs/AI_DEVELOPMENT_LOG.md](../docs/AI_DEVELOPMENT_LOG.md); tools run on client after API returns.

## Security

- **`firestore.rules`:** today **`request.auth != null`** under `boards/{boardId}/**`. **PR 25** tightens to **board owner** (and later sharing).
- Secrets: **Vercel env** + **`.env.local`** only.

## Conventions

- TypeScript strict; `@/*` → `src/*`.
- Small PRs; order per [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) — **PR 25** next.
