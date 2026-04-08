# System patterns

## Start here next session

Follow [progress.md](./progress.md) **“Start here next session”** (read **`activeContext.md`** too).

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

- **Per-field** `updateDoc` merges; **same-field LWW** when two clients race. See **[docs/CONFLICTS.md](../docs/CONFLICTS.md)**.
- **`updatedAt`** is set server-side on object patches (not used for client merge yet).
- **Debounce** object patches (~400ms merged per id), drag/move, and cursor writes for quotas and latency.
- **Clipboard (PR 15):** `collabwb:v1:` JSON in **`src/lib/board-clipboard.ts`**; **`board-canvas`** Copy/Paste + shortcuts; internal ref fallback.

## Security

- **Firestore rules:** `request.auth != null` for all `boards/{boardId}/**` (tighten to `boardId == "demo"` later if desired). Source: **[`firestore.rules`](../firestore.rules)**.
- Secrets only in **Vercel env** + local **`.env.local`** (gitignored).

## Conventions

- TypeScript **strict**; ESLint + Prettier; import alias `@/*` → `src/*`.
- Small PRs; feature work follows [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) PR order where possible.
