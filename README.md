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

## Firestore security rules

Rules live in [`firestore.rules`](./firestore.rules) (see [`firebase.json`](./firebase.json)). **Apply them** before sharing a public URL if you created the database in test mode:

1. **Firebase Console** → **Firestore Database** → **Rules** → paste the contents of `firestore.rules` → **Publish**, or  
2. **Firebase CLI (no global install):** `npm run firebase -- login` (once) → `npm run firebase -- use <projectId>` (writes `.firebaserc`) → `npm run deploy:rules`. Alternatively install globally: `npm install -g firebase-tools`, then `firebase login` → `firebase use <projectId>` → `firebase deploy --only firestore:rules`.

MVP behavior: only **authenticated** users can read/write `boards/{boardId}/**`; everything else is denied.

**Multiplayer cursors (PR 07–08):** each user writes `boards/{boardId}/cursors/{uid}` with **Konva world** `x`/`y` (same space as the pannable/zoomable stage after PR 08). Writes use a **~50ms trailing debounce** and a small **world-space epsilon**; leaving the board **deletes** that cursor doc.

**Board objects (PR 09–15):** canvas entities live in **`boards/{boardId}/objects/{objectId}`** (subcollection). Types include **`rect`**, **`circle`**, **`line`**, **`sticky`**, **`frame`**, **`text`**, and **`connector`**. Toolbar: frame/text, **Connect**, **Duplicate**, **Copy**, **Paste**, **Delete**; **Del/Backspace** when not typing; **Ctrl/Cmd+C** and **Ctrl/Cmd+V** copy/paste a `collabwb:v1:` JSON payload (with in-app fallback if the clipboard API is blocked).

**Sticky notes (PR 10):** **Add sticky**, drag to move (debounced position writes), **double-click** for textarea edit (debounced text + flush on blur/Escape), **color swatches** when a sticky is selected (`fill` + `stroke` in Firestore).

**Shape colors (PR 11):** the **shape swatch** row sets fill/stroke for **new** rectangles and circles and stroke for **new** lines (same palette as sticky colors).

**Selection & transforms (PR 12):** **click** to select, **Shift+click** to toggle in the set, **drag** on empty board to **marquee** (axis-aligned bounds vs objects). **Transformer** resize/rotate (and drag) for **rect**, **circle**, and **sticky**; **line** is selectable only. Geometry writes are **debounced** (~400ms, merged per object). **Esc** clears selection and the line tool. Selection is **local** to each browser.

**Concurrent edits (PR 13):** object updates use **partial** Firestore `updateDoc` (top-level fields only). Different fields usually compose; the **same** field is **last-write-wins**. Details and a manual two-browser sticky test → **[docs/CONFLICTS.md](./docs/CONFLICTS.md)**.

## Deploy

Connect the GitHub repo to [Vercel](https://vercel.com) and set the same `NEXT_PUBLIC_FIREBASE_*` vars as `.env.local` (use **server-only** storage for `GEMINI_API_KEY`).
