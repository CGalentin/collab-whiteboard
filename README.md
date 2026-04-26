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

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Client + build | Firebase web app config from Console |
| `GEMINI_API_KEY` | Server only (Vercel + `.env.local`) | Gemini on `POST /api/ai` — **never** `NEXT_PUBLIC_` |
| `GEMINI_MODEL` | Server only | Optional; defaults + fallbacks in `run-board-gemini.ts` |

Copy [`.env.example`](./.env.example) → `.env.local` locally. On **Vercel**, set the same names under **Settings → Environment Variables**, then **redeploy** after changes.

## Project docs

- [Memory bank](./memory-bank/README.md) — short context files for Cursor (`@memory-bank/...`)
- [Pre-search & checkpoints](./PRESEARCH_AND_TRACKING.md) — **Pre-Search reference** for submission
- [Pre-Search submission pointer](./docs/PRESEARCH_REFERENCE.md) — repo + where to find answers
- [Build roadmap (15m tasks)](./BUILD_ROADMAP.md)
- [Gauntlet best practices](./docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)
- [Architecture & Firestore paths](./docs/ARCHITECTURE.md) — includes **diagram** (FE ↔ API ↔ Firestore)
- [AI development log](./docs/AI_DEVELOPMENT_LOG.md) — how the board agent was built
- [AI cost analysis](./docs/AI_COST_ANALYSIS.md) — illustrative token / cost table
- [Performance notes (PR 17)](./docs/PERF_NOTES.md)
- [Manual QA matrix (PR 18)](./docs/MANUAL_QA_MATRIX.md)
- [Concurrent edits / LWW](./docs/CONFLICTS.md)
- [Firebase console checklist (PR 02)](./docs/FIREBASE_CONSOLE_CHECKLIST.md)

## Mobile and small screens (PR 34)

- The **board** is usable on narrow viewports: a **bottom tools bar** opens the same tool set as the desktop left rail, with safe-area padding for notched devices.
- On the **canvas**, use a **trackpad** or **mouse wheel** to zoom; on touch devices use a **two-finger pinch** to zoom the board (space + drag still pans on desktop).
- **Drawing precision** and tiny UI targets can be limited on very small screens; a tablet or larger is best for long sessions.

## Known issues (MVP)

- **Orphan connectors** if an endpoint object is deleted — cleanup TBD ([CONFLICTS.md](./docs/CONFLICTS.md)).
- **Clipboard**: system clipboard may require permission; same-tab fallback for copy/paste.
- **AI** uses your saved board id from the client; see [AI development log](./docs/AI_DEVELOPMENT_LOG.md) for tool coverage.
- **Local dev:** if every route returns **404**, delete the `.next` folder and restart `npm run dev` (corrupted Next cache).

## Firestore security rules

Rules live in [`firestore.rules`](./firestore.rules) (see [`firebase.json`](./firebase.json)). **Apply them** before sharing a public URL if you created the database in test mode:

1. **Firebase Console** → **Firestore Database** → **Rules** → paste the contents of `firestore.rules` → **Publish**, or  
2. **Firebase CLI (no global install):** `npm run firebase -- login` (once) → `npm run firebase -- use <projectId>` (writes `.firebaserc`) → `npm run deploy:rules`. Alternatively install globally: `npm install -g firebase-tools`, then `firebase login` → `firebase use <projectId>` → `firebase deploy --only firestore:rules`.

MVP behavior: only **authenticated** users can read/write `boards/{boardId}/**`; everything else is denied.

**Multiplayer cursors (PR 07–08):** each user writes `boards/{boardId}/cursors/{uid}` with **Konva world** `x`/`y` (same space as the pannable/zoomable stage after PR 08). Writes use a **~75ms trailing debounce** (PR 17) and a small **world-space epsilon**; leaving the board **deletes** that cursor doc.

**Board objects (PR 09–16):** canvas entities live in **`boards/{boardId}/objects/{objectId}`** (subcollection). Types include **`rect`**, **`circle`**, **`line`**, **`sticky`**, **`frame`**, **`text`**, and **`connector`**. Toolbar: **Search** (client-side substring on **sticky** + **`text`** only; matches get an amber outline, non-matches fade; no Algolia/server index), frame/text, **Connect**, **Duplicate**, **Copy**, **Paste**, **Delete**; **Del/Backspace** when not typing; **Ctrl/Cmd+C** and **Ctrl/Cmd+V** copy/paste a `collabwb:v1:` JSON payload (with in-app fallback if the clipboard API is blocked). **Esc** clears an active search query before clearing selection.

**Sticky notes (PR 10):** **Add sticky**, drag to move (debounced position writes), **double-click** for textarea edit (debounced text + flush on blur/Escape), **color swatches** when a sticky is selected (`fill` + `stroke` in Firestore).

**Shape colors (PR 11):** the **shape swatch** row sets fill/stroke for **new** rectangles and circles and stroke for **new** lines (same palette as sticky colors).

**Selection & transforms (PR 12):** **click** to select, **Shift+click** to toggle in the set, **drag** on empty board to **marquee** (axis-aligned bounds vs objects). **Transformer** resize/rotate (and drag) for **rect**, **circle**, and **sticky**; **line** is selectable only. Geometry writes are **debounced** (~400ms, merged; PR 17 **batched `writeBatch`** when the flush window includes multiple objects). **Esc** clears selection and the line tool. Selection is **local** to each browser.

**AI API (PR 19–20):** `POST /api/ai` with `Authorization: Bearer <Firebase ID token>` and JSON `{ "prompt": "…", "boardId": "demo", "boardContext": "…" }` (`boardContext` optional; UI sends **`buildBoardContextForAi()`**). Server uses **`GEMINI_API_KEY`**. Returns **`toolCalls`**; the **client** runs **`executeAiToolCallsClient`** so Firestore matches UI paths. **AI panel** on `/board`. Probe: `GET /api/ai`. Types: `src/lib/ai-api-types.ts`.

**Try `/api/ai` from the browser (dev):** set `GEMINI_API_KEY` in `.env.local`, restart `npm run dev`, sign in and open `/board`. In **DevTools → Console** run:
`const t = await window.__collabBoardGetIdToken(); const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ prompt: 'Say hello in one sentence.', boardId: 'demo' }) }); console.log(await r.json());`
(`__collabBoardGetIdToken` exists only in **development** builds.)

**Concurrent edits (PR 13):** object updates use **partial** Firestore `updateDoc` (top-level fields only). Different fields usually compose; the **same** field is **last-write-wins**. Details and a manual two-browser sticky test → **[docs/CONFLICTS.md](./docs/CONFLICTS.md)**.

## Deploy (Vercel)

1. Import the GitHub repo on [Vercel](https://vercel.com); production branch (e.g. `main`) auto-deploys.
2. Add **all** env vars from the table above for **Production** (and Preview if needed).
3. In **Firebase Console** → **Authentication** → **Authorized domains**, add your `*.vercel.app` (and custom domain) so sign-in works.
4. Publish **[`firestore.rules`](./firestore.rules)** to the **same** Firebase project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (Console or `npm run deploy:rules` with CLI + project).
5. Smoke test: `/` → `/login` → `/board` → AI panel on production URL.
