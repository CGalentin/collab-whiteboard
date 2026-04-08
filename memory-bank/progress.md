# Progress

*Snapshot log; align with [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) and [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) checkboxes.*

## Start here next session

1. Open [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) → **PR 03 — `feat/firebase-client`** (first unchecked implementation line is **`src/lib/firebase.ts`**).
2. In Cursor, `@` mention: **`memory-bank/progress.md`**, **`docs/ARCHITECTURE.md`**, **`.env.example`** (and **`.env.local`** locally — never paste secrets into chat).
3. Run **`npm install firebase`** once.
4. Implement in order:
   - **`src/lib/firebase.ts`** — `initializeApp`, `getAuth`, `getFirestore`; read `process.env.NEXT_PUBLIC_FIREBASE_*`; export `auth`, `db` (guard missing env in dev with clear error).
   - **`firestore.rules`** — `request.auth != null` for `boards/{boardId}/{document=**}` (see [systemPatterns.md](./systemPatterns.md)).
   - **`firebase.json`** — point `firestore.rules` at that file (for future `firebase deploy` **or** copy-paste rules into Firebase Console).
   - **README** — one paragraph: where rules live + “paste in Console if no CLI.”
5. **`npm run build`** must stay green; restart **`npm run dev`** after edits.
6. Check off PR 03 items in [BUILD_ROADMAP.md](../BUILD_ROADMAP.md); then start **PR 04** (auth pages).

**Repo:** `C:\Users\GauntletAI\Desktop\GauntletAI\CollabWhiteBoard` · **Remote:** `https://github.com/CGalentin/collab-whiteboard`

---

## Done

- Pre-search Phases 0–3 + decision summary; **0.5** reference = this repo + chats as needed
- Docs: pre-search tracker, build roadmap, Gauntlet playbook, memory bank, **ARCHITECTURE**, **FIREBASE_CONSOLE_CHECKLIST**
- **PR 01:** Next.js + TS + Tailwind + ESLint + Prettier; GitHub **`CGalentin/collab-whiteboard`**; `.env.example`; README; CollabBoard **home** (not stock Next template)
- **PR 02:** Firebase project **collab-board**, Firestore, Email + Google Auth, web app, **`.env.local`** filled; optional **Firebase CLI** skipped
- **PR 03 (partial):** Env vars wired; **`firebase.ts` / rules / `firebase.json`** not in repo yet
- **Ship (partial):** Vercel production deploy live; README has setup (expand architecture after PR 03)

## In progress

- **PR 03** — `src/lib/firebase.ts`, `firestore.rules`, README note for rules deploy

## Not started

- Auth UI (PR 04) through Konva, sync, cursors, AI, full submission pack (video, cost doc, social)

## Known issues / debt

- Firestore rules in repo + deployed/pasted before wide public use if DB was in test mode
- Rotate/restrict Firebase web API key if exposed in old chats
