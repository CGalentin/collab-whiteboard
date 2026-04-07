# System patterns

## High-level architecture

```text
Browser (Next.js React)
  ├── Firebase Auth (client SDK)
  ├── Firestore listeners + writes (board, cursors, presence, objects)
  └── fetch → /app/api/... (Vercel) → Gemini (server-only key) → tool execution → Firestore
```

## Separation of concerns

- **UI / Konva:** rendering, local interaction, debounced writes.
- **Firestore:** source of truth for **objects**, **cursors**, **presence** (exact paths TBD).
- **API routes:** **AI only** (and any future server-only logic); **never** expose `GEMINI_API_KEY` to the client.

## Realtime & conflicts

- **Last-write-wins (LWW)** on concurrent edits; document field-level behavior in `docs/CONFLICTS.md` once implemented.
- Prefer **`updatedAt`** / server timestamps for ordering where it matters.
- **Debounce** drag/move and cursor writes to protect quotas and latency.

## Security

- **Firestore rules:** authenticated users only; narrow to board paths when structure is fixed.
- Secrets only in **Vercel env** + local **`.env.local`** (gitignored).

## Conventions

- TypeScript **strict**; ESLint + Prettier; import alias `@/*` → `src/*`.
- Small PRs; feature work follows [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) PR order where possible.
