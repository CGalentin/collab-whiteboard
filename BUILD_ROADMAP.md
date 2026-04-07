# CollabBoard — Build roadmap (15-minute tasks)

Check items as you go. Each task is sized for **~15 minutes** of focused work; if one runs long, split it and keep moving.

**Conventions**

- **PR groups** below are **review-sized** slices—open one PR per group when possible (small PRs, Gauntlet playbook).
- **Branch name** suggestions: `chore/…`, `feat/…`, `fix/…`.
- **Stack (from pre-search):** React + TypeScript, Vercel, Firebase (Auth + Firestore), Konva, Gemini on Vercel API routes.

**See also:** [PRESEARCH_AND_TRACKING.md](PRESEARCH_AND_TRACKING.md) · [Gauntlet best practices](docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)

---

## PR 01 — `chore/repo-and-scaffold`

*Repo hygiene + runnable app (no Firebase yet OK).*

- [ ] Create **GitHub** repo and clone locally into this folder (or move existing files in).
- [x] Add / verify **`.gitignore`** (`node_modules`, `.env.local`, `.vercel`, `dist`, `.next`, OS junk).
- [x] Scaffold **Next.js App Router + TypeScript** (recommended for Vercel `/app/api/*`) *or* Vite + plan for `api/` routes—pick one and stick to it.
- [x] Run **`npm run dev`** and confirm the starter page loads.
- [x] Run **`npm run build`** and fix any build errors.
- [x] Add **Prettier** (+ optional ESLint integration); add `format` script; format the repo once.
- [x] Add **`.env.example`** listing `NEXT_PUBLIC_FIREBASE_*` vars and server-only `GEMINI_API_KEY` (or your chosen secret names).
- [x] Add **`README.md` stub**: project name, how to run dev, where env vars go.

---

## PR 02 — `chore/firebase-console`

*Firebase project ready for web app (no UI wiring yet).*

- [ ] Create **Firebase project** in console (name + default region note).
- [ ] Enable **Firestore** (start in **test mode** only if you’ll lock rules before any public deploy).
- [ ] Enable **Authentication** → **Email/Password** provider.
- [ ] Enable **Authentication** → **Google** provider (support email, OAuth consent basics).
- [ ] Register a **Web app** in Firebase; copy config object for env vars.
- [ ] Sketch **Firestore paths** on paper or in `docs/ARCHITECTURE.md` (e.g. `boards/demo`, `cursors`, `objects`).
- [ ] Install **Firebase CLI** (optional this session); `firebase login` if you’ll deploy rules from repo later.

---

## PR 03 — `feat/firebase-client`

*App talks to Firebase safely from the client.*

- [ ] Add **`lib/firebase.ts`** (or `src/lib/firebase.ts`): initialize app from `NEXT_PUBLIC_*` env vars.
- [ ] Wire env vars in **`.env.local`** (never commit); confirm app still builds (`NEXT_PUBLIC_*` required at build for client).
- [ ] Add **`firestore.rules`**: require `request.auth != null` for board paths you’ll use (tighten to specific `boardId` when known).
- [ ] Deploy rules **or** use **Firestore emulator** locally—document which in README.
- [ ] Add **`firebase.json`** pointing at rules file (if using CLI deploy).

---

## PR 04 — `feat/auth-flow`

*Signed-in users only for the board (aligns with PRD).*

- [ ] Create **login** route/page: minimal layout + email/password fields + “Sign in with Google”.
- [ ] Implement **email sign-up / sign-in** with Firebase Auth (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword`).
- [ ] Implement **Google** `signInWithPopup` (or redirect) and handle errors in UI.
- [ ] Add **auth state listener** (`onAuthStateChanged`): loading → signed-in vs signed-out.
- [ ] **Protect** board route: redirect unauthenticated users to login.
- [ ] Add **sign out** button and test full loop.

---

## PR 05 — `feat/board-route-shell`

*Placeholder board page behind auth.*

- [ ] Add **`/board`** (or `/board/[id]` later) protected route with empty canvas area + header (user email / sign out).
- [ ] Add **“shared demo board”** constant ID in code matching Firestore path from architecture note.
- [ ] Verify only **authenticated** reads/writes succeed against Firestore (rules smoke test).

---

## PR 06 — `feat/presence-list`

*Who’s online (PRD presence).*

- [ ] Choose **presence model** (e.g. `boards/{id}/presence/{uid}` with `displayName`, `lastSeen`, `online`).
- [ ] On board mount: **write** presence doc; on unload/tab close: **update** offline or use `onDisconnect` if using RTDB—*if staying on Firestore only*, use heartbeat + `lastSeen` threshold (~30s).
- [ ] **Listen** to presence collection; derive “online” list in UI.
- [ ] Render **sidebar or header** list: display name (fallback email) for each online user.

---

## PR 07 — `feat/multiplayer-cursors`

*Other users’ pointers + names (PRD order: cursors early).*

- [ ] Add Firestore path for **cursors** (e.g. `boards/{id}/cursors/{uid}`: `x`, `y`, `name`, `updatedAt`).
- [ ] On `pointermove` on board container: **throttle** (~50ms) and **write** cursor doc (avoid writes when coords unchanged).
- [ ] **Subscribe** to cursors query; render **remote** cursors (exclude self) as DOM overlay or Konva layer.
- [ ] Show **name label** next to each remote cursor.
- [ ] **Debounce/throttle** writes enough to stay under quotas; document rate in README if non-obvious.

---

## PR 08 — `feat/konva-stage-pan-zoom`

*Infinite-feel board base (before heavy object sync).*

- [ ] Install **`konva`** + **`react-konva`**.
- [ ] Create **`BoardStage`**: full-viewport `Stage` + `Layer`.
- [ ] Implement **wheel zoom** toward cursor (scale + position math).
- [ ] Implement **pan** (e.g. middle-mouse or space+drag or stage drag).
- [ ] Keep **stage state** (scale, position) in React state; optional: persist view per user later (skip for MVP if time tight).

---

## PR 09 — `feat/object-model-firestore`

*Single source of truth for board objects.*

- [ ] Define **TypeScript types** for `BoardObject` (id, type, x, y, width, height, rotation, style, text…).
- [ ] Choose storage: **subcollection** `boards/{id}/objects/{objectId}` *or* one doc with map—document choice in `docs/ARCHITECTURE.md`.
- [ ] Implement **read**: `onSnapshot` → normalized state in React (or small store).
- [ ] Implement **create** (local only first): add one **test rectangle** to Firestore from a button.
- [ ] Confirm **second browser** sees the new object (first real sync win).

---

## PR 10 — `feat/sticky-notes-mvp`

*PRD: stickies with text + color.*

- [ ] Add toolbar control **“Add sticky”** → creates Firestore object `type: 'sticky'`.
- [ ] Render stickies as **Konva Group** (rect + text) from snapshot state.
- [ ] **Inline edit**: click/double-click to edit text → **debounced** `updateDoc` on change.
- [ ] **Color**: preset swatches → update Firestore `fill` / `color` field.
- [ ] **Move sticky**: drag on canvas → update `x`,`y` with **debounce** (LWW on those fields).

---

## PR 11 — `feat/shapes-mvp`

*PRD: at least rectangle, circle, line.*

- [ ] Toolbar: add **rectangle** tool → write object with `type: 'rect'`.
- [ ] Toolbar: add **circle** / **ellipse** tool.
- [ ] Toolbar: add **line** tool (two-point or drag-to-define).
- [ ] Render each type in Konva from shared object list.
- [ ] **Solid fill/stroke** colors consistent with sticky color model.

---

## PR 12 — `feat/transforms-selection`

*Move / resize / rotate (PRD).*

- [ ] **Select** object on click; show **Transformer** (Konva) for selected node.
- [ ] On transform end: **write** width/height/scale/rotation/x/y to Firestore (debounced).
- [ ] **Multi-select** (shift-click): extend selection set; optional multi-transform if time allows.
- [ ] **Marquee** drag-select (rect intersection with object bounds).
- [ ] Verify **two users** selecting different objects doesn’t break (local selection vs remote updates).

---

## PR 13 — `feat/conflicts-lww-doc`

*PRD: simultaneous edits + documented LWW.*

- [ ] Pick **LWW granularity** (per-field vs whole object); add `updatedAt` / `version` if needed.
- [ ] Ensure writes **merge** safe fields without stomping unrelated properties (`updateDoc` with dot paths if applicable).
- [ ] Add **`docs/CONFLICTS.md`** (short): what users see under concurrent drag/edit.
- [ ] **Stress test** 5 min: two browsers edit **same** sticky—confirm acceptable behavior.

---

## PR 14 — `feat/frames-text-connectors`

*PRD extended board features (slice per sub-bullet).*

- [ ] **Frames**: object type `frame` + title; render behind children or as labeled rect; optional “children ids” list.
- [ ] **Standalone text**: `type: 'text'` without sticky chrome.
- [ ] **Connectors**: `type: 'connector'` with `fromId`/`toId` (or anchor points); draw `Line`/`Arrow`; update on object move (listen to positions).
- [ ] **Delete** selected object(s) → Firestore delete.
- [ ] **Duplicate** selection → clone with new ids.

---

## PR 15 — `feat/clipboard-ops`

*Duplicate / copy-paste (PRD).*

- [ ] **Duplicate** button for selection (already started in PR 14—finish if split).
- [ ] **Copy** serializes selected objects to clipboard (structured JSON) or internal buffer.
- [ ] **Paste** creates new ids + offset position + writes to Firestore.
- [ ] Keyboard shortcuts **Ctrl+C / Ctrl+V** (prevent default where needed).

---

## PR 16 — `feat/search-mvp`

*Pre-search: full-text-ish search (pick smallest approach).*

- [ ] Add **search input** in toolbar.
- [ ] **Client-side filter** stickies/text objects by substring (good enough for small boards).
- [ ] Optional stretch: **highlight** matching objects on canvas.
- [ ] Document limitation in README if no Algolia/extension.

---

## PR 17 — `chore/perf-pass`

*PRD targets: pan/zoom smoothness, many objects.*

- [ ] **Batch** / debounce rapid Firestore writes (move/drag).
- [ ] Memoize Konva nodes or split layers if **>100** objects feels slow.
- [ ] Quick **500-object** test (scripted or duplicate) — note FPS in `docs/PERF_NOTES.md`.
- [ ] Throttle cursor writes further if needed.

---

## PR 18 — `test/manual-qa-matrix`

*PRD testing scenarios.*

- [ ] **Two browsers** simultaneous edit checklist (stickies + shapes).
- [ ] **Refresh** mid-edit → state restores.
- [ ] **Rapid** create/move for 2 minutes — no obvious desync.
- [ ] **Chrome DevTools throttle** + disconnect Wi‑Fi → reconnect behavior noted; fix critical bugs.
- [ ] **5+** sessions (ask friends / incognito windows) — record observations.

---

## PR 19 — `feat/ai-api-route`

*Server-side Gemini (keys not in client).*

- [ ] Add Vercel **`/app/api/ai`** (or `api/ai.ts`) route; read **`GEMINI_API_KEY`** from env only on server.
- [ ] Parse JSON body: `{ prompt, boardId }` (auth: verify Firebase **ID token** in header if possible).
- [ ] Call **Gemini** with tool/function definitions matching your board ops (stub tools first).
- [ ] Return structured **tool calls** or error JSON; map to consistent error shape for UI.

---

## PR 20 — `feat/ai-tool-execution`

*PRD minimum tool schema + Firestore writes from AI.*

- [ ] Implement server or client **executor** that applies `createStickyNote`, `createShape`, `moveObject`, etc., to Firestore (same paths as UI).
- [ ] **getBoardState**: read objects (limit size / summarize if huge) for model context.
- [ ] Wire UI: **AI panel** input → POST `/api/ai` → execute returned tools → all users see via existing listeners.
- [ ] **Loading / error** UI on AI panel (Gauntlet DoD).

---

## PR 21 — `feat/ai-command-breadth`

*6+ command categories + complex templates.*

- [ ] Tune **system prompt** for creation / manipulation / layout / complex templates.
- [ ] Verify natural phrases: **SWOT**, **grid arrange**, **retrospective columns** (multi-step).
- [ ] Add **debounce** / disable button while request in flight (no queue, per pre-search).
- [ ] Test **two users** sending AI commands close together—document behavior + LWW.

---

## PR 22 — `chore/vercel-production`

*Public deploy.*

- [ ] Connect **GitHub → Vercel**; production branch **auto-deploy**.
- [ ] Set **all env vars** on Vercel (Firebase public + server secrets).
- [ ] Deploy **Firestore rules** to production project; remove unsafe test rules.
- [ ] Smoke test **production URL** login + board + AI once.

---

## PR 23 — `docs/submission-pack`

*Assignment deliverables.*

- [ ] **README**: setup, env, scripts, architecture **1-pager** link, known issues.
- [ ] **`docs/ARCHITECTURE.md`**: diagram (boxes/arrows) FE ↔ API ↔ Firestore.
- [ ] **AI Development Log** (PRD template) — 1 page.
- [ ] **AI Cost Analysis**: dev spend + 100 / 1K / 10K / 100K table + assumptions.
- [ ] Record **Pre-Search** reference (this repo + exported chat if required).

---

## PR 24 — `chore/demo-and-social`

*Final polish.*

- [ ] **Demo script** outline (3–5 min): collab, AI, architecture.
- [ ] Record **demo video**; upload unlisted if needed.
- [ ] **Social post** draft + screenshot; tag **@GauntletAI**.
- [ ] Final **Gauntlet delivery checklist** pass ([playbook §8](docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)).

---

## Progress snapshot (optional)

| PR range | Theme |
|----------|--------|
| 01–05 | Repo, Firebase, auth, board shell |
| 06–08 | Presence, cursors, Konva pan/zoom |
| 09–13 | Objects, stickies, shapes, transforms, LWW |
| 14–18 | Frames/connectors/ops/search/perf/QA |
| 19–21 | AI agent |
| 22–24 | Deploy + submission + demo |

---

*Total tasks ≈ 120 × ~15 min ≈ 30 h ceiling—tight for a 20 h week; **cut** PRs 14–16 or defer search/post-MVP if needed. Ship **cursors → objects → persistence → deploy** before polishing frames/connectors.*
