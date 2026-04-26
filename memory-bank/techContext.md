# Tech context

## Start here next session

Read **[`progress.md`](./progress.md)** and **[`activeContext.md`](./activeContext.md)**. Roadmap: optional **PR 24**; **PR 35** **rules deploy** + **QA** if not done; **PR 32** optional template thumbnails. Features such as **mobile (PR 34)**, **auth flows** on **`/login`**, and **Hand / Shapes** on the board are in the codebase — see **activeContext** “Recent product updates.”

---

## Stack

| Layer | Choice |
|--------|--------|
| App | **Next.js 16** App Router, **React 19**, **TypeScript** |
| Styling | **Tailwind CSS v4** |
| Canvas | **Konva** + **react-konva** (`BoardStage` on `/board`) |
| Auth + data | **Firebase Auth** (email + Google), **Firestore** |
| Hosting | **Vercel** (Git → auto deploy) |
| AI | **Google Gemini API** via **`POST /api/ai`**; **`GEMINI_API_KEY`** server-only |

## Repo

- **Package:** `collab-whiteboard`
- **App:** `src/app/` · shared **`src/lib/`**

## Environment variables

Template: **[`.env.example`](../.env.example)** · local secrets: **`.env.local`** (gitignored)

| Variable | Scope |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` (6) | Client + build |
| `GEMINI_API_KEY` | Server only — Vercel + `.env.local` |
| `GEMINI_MODEL` | Optional server override |

Redeploy Vercel after changing env. **Never** prefix Gemini key with `NEXT_PUBLIC_`.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm run format`
- `npm run deploy:rules` — Firestore rules ([`firestore.rules`](../firestore.rules))

## CLIs (optional)

- **Firebase CLI** — rules, emulators
- **Vercel CLI** — deploy from terminal
