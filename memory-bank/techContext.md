# Tech context

## Start here next session

| Step | Action |
|------|--------|
| 1 | `npm install firebase` |
| 2 | Add **`src/lib/firebase.ts`** (init app, auth, Firestore from `NEXT_PUBLIC_*`) |
| 3 | Add **`firestore.rules`** + **`firebase.json`**; deploy or paste rules in Console |
| 4 | `npm run build` · verify **`.env.local`** still local-only |

Details: [progress.md](./progress.md) → **Start here next session** · Roadmap: [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) **PR 03**.

---

## Stack

| Layer | Choice |
|--------|--------|
| App | **Next.js 16** App Router, **React 19**, **TypeScript** |
| Styling | **Tailwind CSS v4** |
| Canvas | **Konva** + **react-konva** (add when starting board UI) |
| Auth + data | **Firebase Auth** (email + Google), **Firestore** |
| Hosting | **Vercel** (Git → auto deploy) |
| AI | **Google Gemini API** via **Route Handler** / server route; **function calling** |

## Repo

- **Package name:** `collab-whiteboard` (npm naming)
- **Entry:** `src/app/`; shared code → `src/lib/`

## Environment variables

**Local:** [`.env.local`](../.env.local) (gitignored) — already has **six** `NEXT_PUBLIC_FIREBASE_*` values for **collab-board**.

Template: [.env.example](../.env.example)

- `NEXT_PUBLIC_FIREBASE_*` — client Firebase config (**done** for local dev)
- `GEMINI_API_KEY` — **server only** (add when first AI route exists; set on Vercel too)

## Scripts

- `npm run dev` — local dev
- `npm run build` / `npm run start` — production
- `npm run lint` / `npm run format`

## CLIs (optional)

- **Firebase CLI** — rules deploy / emulators
- **Vercel CLI** — optional if not using dashboard-only deploy
