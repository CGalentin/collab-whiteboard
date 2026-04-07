# Tech context

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

See [.env.example](../.env.example):

- `NEXT_PUBLIC_FIREBASE_*` — client Firebase config
- `GEMINI_API_KEY` — **server only** (no `NEXT_PUBLIC_` prefix)

## Scripts

- `npm run dev` — local dev
- `npm run build` / `npm run start` — production
- `npm run lint` / `npm run format`

## CLIs (optional)

- **Firebase CLI** — rules deploy / emulators
- **Vercel CLI** — optional if not using dashboard-only deploy
