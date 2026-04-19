# Tech context

## Start here next session

Follow **[`progress.md`](./progress.md)** → **“Start here next session”** and **[`activeContext.md`](./activeContext.md)**. Next feature slice: **PR 22** (`chore/vercel-production`) in [`BUILD_ROADMAP.md`](../BUILD_ROADMAP.md).

---

## Stack

| Layer | Choice |
|--------|--------|
| App | **Next.js 16** App Router, **React 19**, **TypeScript** |
| Styling | **Tailwind CSS v4** |
| Canvas | **Konva** + **react-konva** (`BoardStage` on `/board`) |
| Auth + data | **Firebase Auth** (email + Google), **Firestore** |
| Hosting | **Vercel** (Git → auto deploy) |
| AI | **Google Gemini API** via **Route Handler** / server route; **function calling** |

## Repo

- **Package name:** `collab-whiteboard` (npm naming)
- **Entry:** `src/app/`; shared code → `src/lib/`

## Environment variables

**Local:** [`.env.local`](../.env.local) (gitignored) — **six** `NEXT_PUBLIC_FIREBASE_*` values for **collab-board**.

Template: [.env.example](../.env.example)

- `NEXT_PUBLIC_FIREBASE_*` — client Firebase config
- `GEMINI_API_KEY` — **server only** (when first AI route exists; set on Vercel too)

## Scripts

- `npm run dev` — local dev
- `npm run build` / `npm run start` — production
- `npm run lint` / `npm run format`

## CLIs (optional)

- **Firebase CLI** — rules deploy / emulators
- **Vercel CLI** — optional if not using dashboard-only deploy
