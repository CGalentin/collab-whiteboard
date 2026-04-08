# System patterns

## Start here next session

Pick up **PR 03** before any UI: add **`src/lib/firebase.ts`** + **`firestore.rules`** so the app can talk to Firebase safely. Full ordered steps → [progress.md](./progress.md) section **“Start here next session”**.

---

## High-level architecture

```text
Browser (Next.js React)
  ├── Firebase Auth (client SDK)
  ├── Firestore listeners + writes (board, cursors, presence, objects)
  └── fetch → /app/api/... (Vercel) → Gemini (server-only key) → tool execution → Firestore
```

## Separation of concerns

- **UI / Konva:** rendering, local interaction, debounced writes.
- **Firestore:** source of truth for **objects**, **cursors**, **presence** — paths in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md): `boards/{boardId}/objects|presence|cursors` (MVP `boardId = demo`).
- **API routes:** **AI only** (and any future server-only logic); **never** expose `GEMINI_API_KEY` to the client.

## Realtime & conflicts

- **Last-write-wins (LWW)** on concurrent edits; document field-level behavior in `docs/CONFLICTS.md` once implemented.
- Prefer **`updatedAt`** / server timestamps for ordering where it matters.
- **Debounce** drag/move and cursor writes to protect quotas and latency.

## Security

- **Firestore rules:** `request.auth != null` for all `boards/{boardId}/**` (tighten to `boardId == "demo"` later if desired). Rules file not in repo yet — **PR 03**.
- Secrets only in **Vercel env** + local **`.env.local`** (gitignored).

## Conventions

- TypeScript **strict**; ESLint + Prettier; import alias `@/*` → `src/*`.
- Small PRs; feature work follows [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) PR order where possible.
