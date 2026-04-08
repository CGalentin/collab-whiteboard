# CollabBoard

Real-time collaborative whiteboard (Gauntlet CollabBoard PRD): **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, deployed on **Vercel**, with **Firebase** (Auth + Firestore) and **Gemini** for the board agent—see [PRESEARCH_AND_TRACKING.md](./PRESEARCH_AND_TRACKING.md).

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template and fill in values (Firebase + Gemini when you add them):

   ```bash
   copy .env.example .env.local
   ```

   On macOS/Linux: `cp .env.example .env.local`

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description                |
| -------------- | -------------------------- |
| `npm run dev`  | Development server         |
| `npm run build`| Production build           |
| `npm run start`| Start production server    |
| `npm run lint` | ESLint                     |
| `npm run format` | Prettier (write)         |

## Project docs

- [Memory bank](./memory-bank/README.md) — short context files for Cursor (`@memory-bank/...`)
- [Pre-search & checkpoints](./PRESEARCH_AND_TRACKING.md)
- [Build roadmap (15m tasks)](./BUILD_ROADMAP.md)
- [Gauntlet best practices](./docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)
- [Architecture & Firestore paths](./docs/ARCHITECTURE.md)
- [Firebase console checklist (PR 02)](./docs/FIREBASE_CONSOLE_CHECKLIST.md)

## Deploy

Connect the GitHub repo to [Vercel](https://vercel.com) and set the same env vars as `.env.example` (use **server-only** storage for `GEMINI_API_KEY`).
