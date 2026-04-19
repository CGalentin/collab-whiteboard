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

- [x] Create **GitHub** repo and clone locally into this folder (or move existing files in).
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

- [x] Create **Firebase project** in console (name + default region note). → [Checklist](./docs/FIREBASE_CONSOLE_CHECKLIST.md)
- [x] Enable **Firestore** (start in **test mode** only if you’ll lock rules before any public deploy).
- [x] Enable **Authentication** → **Email/Password** provider.
- [x] Enable **Authentication** → **Google** provider (support email, OAuth consent basics).
- [x] Register a **Web app** in Firebase; copy config object for **`.env.local`** (see [.env.example](./.env.example)).
- [x] Sketch **Firestore paths** in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (`boards/{boardId}/objects`, `cursors`, `presence`).
- [ ] Install **Firebase CLI** (optional this session); `firebase login` if you’ll deploy rules from repo later.

---

## PR 03 — `feat/firebase-client`

*App talks to Firebase safely from the client.*

- [x] Add **`lib/firebase.ts`** (or `src/lib/firebase.ts`): initialize app from `NEXT_PUBLIC_*` env vars.
- [x] Wire env vars in **`.env.local`** (never commit); confirm app still builds (`NEXT_PUBLIC_*` required at build for client).
- [x] Add **`firestore.rules`**: require `request.auth != null` for board paths you’ll use (tighten to specific `boardId` when known).
- [x] Deploy rules **or** use **Firestore emulator** locally—document which in README.
- [x] Add **`firebase.json`** pointing at rules file (if using CLI deploy).

---

## PR 04 — `feat/auth-flow`

*Signed-in users only for the board (aligns with PRD).*

- [x] Create **login** route/page: minimal layout + email/password fields + “Sign in with Google”.
- [x] Implement **email sign-up / sign-in** with Firebase Auth (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword`).
- [x] Implement **Google** `signInWithPopup` (or redirect) and handle errors in UI.
- [x] Add **auth state listener** (`onAuthStateChanged`): loading → signed-in vs signed-out.
- [x] **Protect** board route: redirect unauthenticated users to login.
- [x] Add **sign out** button and test full loop.

---

## PR 05 — `feat/board-route-shell`

*Placeholder board page behind auth.*

- [x] Add **`/board`** (or `/board/[id]` later) protected route with empty canvas area + header (user email / sign out).
- [x] Add **“shared demo board”** constant ID in code matching Firestore path from architecture note.
- [x] Verify only **authenticated** reads/writes succeed against Firestore (rules smoke test).

---

## PR 06 — `feat/presence-list`

*Who’s online (PRD presence).*

- [x] Choose **presence model** (e.g. `boards/{id}/presence/{uid}` with `displayName`, `lastSeen`, `online`).
- [x] On board mount: **write** presence doc; on unload/tab close: **update** offline or use `onDisconnect` if using RTDB—*if staying on Firestore only*, use heartbeat + `lastSeen` threshold (~30s).
- [x] **Listen** to presence collection; derive “online” list in UI.
- [x] Render **sidebar or header** list: display name (fallback email) for each online user.

---

## PR 07 — `feat/multiplayer-cursors`

*Other users’ pointers + names (PRD order: cursors early).*

- [x] Add Firestore path for **cursors** (e.g. `boards/{id}/cursors/{uid}`: `x`, `y`, `name`, `updatedAt`).
- [x] On `pointermove` on board container: **throttle** (~50ms) and **write** cursor doc (avoid writes when coords unchanged).
- [x] **Subscribe** to cursors query; render **remote** cursors (exclude self) as DOM overlay or Konva layer.
- [x] Show **name label** next to each remote cursor.
- [x] **Debounce/throttle** writes enough to stay under quotas; document rate in README if non-obvious.

---

## PR 08 — `feat/konva-stage-pan-zoom`

*Infinite-feel board base (before heavy object sync).*

- [x] Install **`konva`** + **`react-konva`**.
- [x] Create **`BoardStage`**: full-viewport `Stage` + `Layer`.
- [x] Implement **wheel zoom** toward cursor (scale + position math).
- [x] Implement **pan** (e.g. middle-mouse or space+drag or stage drag).
- [x] Keep **stage state** (scale, position) in React state; optional: persist view per user later (skip for MVP if time tight).

---

## PR 09 — `feat/object-model-firestore`

*Single source of truth for board objects.*

- [x] Define **TypeScript types** for `BoardObject` (id, type, x, y, width, height, rotation, style, text…).
- [x] Choose storage: **subcollection** `boards/{id}/objects/{objectId}` *or* one doc with map—document choice in `docs/ARCHITECTURE.md`.
- [x] Implement **read**: `onSnapshot` → normalized state in React (or small store).
- [x] Implement **create** (local only first): add one **test rectangle** to Firestore from a button.
- [x] Confirm **second browser** sees the new object (first real sync win).

---

## PR 10 — `feat/sticky-notes-mvp`

*PRD: stickies with text + color.*

- [x] Add toolbar control **“Add sticky”** → creates Firestore object `type: 'sticky'`.
- [x] Render stickies as **Konva Group** (rect + text) from snapshot state.
- [x] **Inline edit**: click/double-click to edit text → **debounced** `updateDoc` on change.
- [x] **Color**: preset swatches → update Firestore `fill` / `color` field.
- [x] **Move sticky**: drag on canvas → update `x`,`y` with **debounce** (LWW on those fields).

---

## PR 11 — `feat/shapes-mvp`

*PRD: at least rectangle, circle, line.*

- [x] Toolbar: add **rectangle** tool → write object with `type: 'rect'`.
- [x] Toolbar: add **circle** / **ellipse** tool.
- [x] Toolbar: add **line** tool (two-point or drag-to-define).
- [x] Render each type in Konva from shared object list.
- [x] **Solid fill/stroke** colors consistent with sticky color model.

---

## PR 12 — `feat/transforms-selection`

*Move / resize / rotate (PRD).*

- [x] **Select** object on click; show **Transformer** (Konva) for selected node.
- [x] On transform end: **write** width/height/scale/rotation/x/y to Firestore (debounced).
- [x] **Multi-select** (shift-click): extend selection set; optional multi-transform if time allows.
- [x] **Marquee** drag-select (rect intersection with object bounds).
- [x] Verify **two users** selecting different objects doesn’t break (local selection vs remote updates).

---

## PR 13 — `feat/conflicts-lww-doc`

*PRD: simultaneous edits + documented LWW.*

- [x] Pick **LWW granularity** (per-field vs whole object); add `updatedAt` / `version` if needed.
- [x] Ensure writes **merge** safe fields without stomping unrelated properties (`updateDoc` with dot paths if applicable).
- [x] Add **`docs/CONFLICTS.md`** (short): what users see under concurrent drag/edit.
- [x] **Stress test** 5 min: two browsers edit **same** sticky—confirm acceptable behavior.

---

## PR 14 — `feat/frames-text-connectors`

*PRD extended board features (slice per sub-bullet).*

- [x] **Frames**: object type `frame` + title; render behind children or as labeled rect; optional “children ids” list.
- [x] **Standalone text**: `type: 'text'` without sticky chrome.
- [x] **Connectors**: `type: 'connector'` with `fromId`/`toId` (or anchor points); draw `Line`/`Arrow`; update on object move (listen to positions).
- [x] **Delete** selected object(s) → Firestore delete.
- [x] **Duplicate** selection → clone with new ids.

---

## PR 15 — `feat/clipboard-ops`

*Duplicate / copy-paste (PRD).*

- [x] **Duplicate** button for selection (already started in PR 14—finish if split).
- [x] **Copy** serializes selected objects to clipboard (structured JSON) or internal buffer.
- [x] **Paste** creates new ids + offset position + writes to Firestore.
- [x] Keyboard shortcuts **Ctrl+C / Ctrl+V** (prevent default where needed).

---

## PR 16 — `feat/search-mvp`

*Pre-search: full-text-ish search (pick smallest approach).*

- [x] Add **search input** in toolbar.
- [x] **Client-side filter** stickies/text objects by substring (good enough for small boards).
- [x] Optional stretch: **highlight** matching objects on canvas.
- [x] Document limitation in README if no Algolia/extension.

---

## PR 17 — `chore/perf-pass`

*PRD targets: pan/zoom smoothness, many objects.*

- [x] **Batch** / debounce rapid Firestore writes (move/drag).
- [x] Memoize Konva nodes or split layers if **>100** objects feels slow.
- [x] Quick **500-object** test (scripted or duplicate) — note FPS in `docs/PERF_NOTES.md`.
- [x] Throttle cursor writes further if needed.

---

## PR 18 — `test/manual-qa-matrix`

*PRD testing scenarios.*

- [x] **Two browsers** simultaneous edit checklist (stickies + shapes).
- [x] **Refresh** mid-edit → state restores.
- [x] **Rapid** create/move for 2 minutes — no obvious desync.
- [x] **Chrome DevTools throttle** + disconnect Wi‑Fi → reconnect behavior noted; fix critical bugs.
- [x] **5+** sessions (ask friends / incognito windows) — record observations.

---

## PR 19 — `feat/ai-api-route`

*Server-side Gemini (keys not in client).*

- [x] Add Vercel **`/app/api/ai`** (or `api/ai.ts`) route; read **`GEMINI_API_KEY`** from env only on server.
- [x] Parse JSON body: `{ prompt, boardId }` (auth: verify Firebase **ID token** in header if possible).
- [x] Call **Gemini** with tool/function definitions matching your board ops (stub tools first).
- [x] Return structured **tool calls** or error JSON; map to consistent error shape for UI.

---

## PR 20 — `feat/ai-tool-execution`

*PRD minimum tool schema + Firestore writes from AI.*

- [x] Implement server or client **executor** that applies `createStickyNote`, `createShape`, `moveObject`, etc., to Firestore (same paths as UI).
- [x] **getBoardState**: read objects (limit size / summarize if huge) for model context.
- [x] Wire UI: **AI panel** input → POST `/api/ai` → execute returned tools → all users see via existing listeners.
- [x] **Loading / error** UI on AI panel (Gauntlet DoD).

---

## PR 21 — `feat/ai-command-breadth`

*6+ command categories + complex templates.*

- [x] Tune **system prompt** for creation / manipulation / layout / complex templates.
- [x] Verify natural phrases: **SWOT**, **grid arrange**, **retrospective columns** (multi-step).
- [x] Add **debounce** / disable button while request in flight (no queue, per pre-search).
- [x] Test **two users** sending AI commands close together—document behavior + LWW.

---

## PR 22 — `chore/vercel-production`

*Public deploy.*

- [x] Connect **GitHub → Vercel**; production branch **auto-deploy**.
- [x] Set **all env vars** on Vercel (Firebase public + server secrets).
- [x] Deploy **Firestore rules** to production project; remove unsafe test rules.
- [x] Smoke test **production URL** login + board + AI once.

---

## PR 23 — `docs/submission-pack`

*Assignment deliverables.*

- [x] **README**: setup, env, scripts, architecture **1-pager** link, known issues.
- [x] **`docs/ARCHITECTURE.md`**: diagram (boxes/arrows) FE ↔ API ↔ Firestore.
- [x] **AI Development Log** (PRD template) — 1 page.
- [x] **AI Cost Analysis**: dev spend + 100 / 1K / 10K / 100K table + assumptions.
- [x] Record **Pre-Search** reference (this repo + exported chat if required).

---

## PR 24 — `chore/demo-and-social`

*Final polish (optional if not submitting yet).*

- [ ] **Demo script** outline (3–5 min): collab, AI, architecture.
- [ ] Record **demo video**; upload unlisted if needed.
- [ ] **Social post** draft + screenshot; tag **@GauntletAI**.
- [ ] Final **Gauntlet delivery checklist** pass ([playbook §8](docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)).

---

## Epic — Boards v2, tools & mobile (PR 25+)

*Post-MVP product work. Same rules as above: **~15 min** tasks, **small PRs**, branch names `feat/…` / `chore/…`. **Priority:** **save / multi-board first**, then **left tool rail**, then **mobile**.*

### PR 25 — `feat/multi-board-save` *(priority: save first)*

*Per-user boards in Firestore; real `boardId` instead of only `demo`.*

- [ ] Add **`boards/{boardId}`** metadata docs: `title`, `ownerUid`, `createdAt`, `updatedAt` (and indexes as needed).
- [ ] Add **user → board** index (e.g. `users/{uid}/boards/{boardId}` **or** query `boards` where `ownerUid == uid`).
- [ ] Introduce **`/board/[boardId]`** route; move canvas from fixed demo id to **dynamic** `boardId` from the URL.
- [ ] Centralize **`boardId`** in hooks/context (replace stray `DEMO_BOARD_ID` usages for runtime paths).
- [ ] Tighten **`firestore.rules`**: authenticated users may read/write only **boards they own** (document membership rule); keep deny-default elsewhere.
- [ ] Update **`POST /api/ai`**: allow `boardId` when the **token uid owns** that board (same rule as Firestore), not only demo.
- [ ] Smoke: create board doc → open `/board/{id}` → object sync + AI still work.

### PR 26 — `feat/dashboard-your-boards`

*Dashboard / home: list, create, open — “Your boards” like the reference.*

- [ ] Add **`/`** or **`/dashboard`** (choose one as canonical) **after login**: list user’s boards (title, last opened optional).
- [ ] **Create board** → new `boardId` + metadata + navigate to **`/board/[boardId]`**.
- [ ] **Open** existing board from list; optional **rename** / **delete** with confirm.
- [ ] **Auth redirect**: logged-out users → `/login`; logged-in root → dashboard (adjust current `/` marketing vs dashboard split).
- [ ] Document new paths in **`docs/ARCHITECTURE.md`** (short delta).

### PR 27 — `feat/toolbar-sidebar-shell`

*Left vertical tool rail — structure first; wire tools in later PRs.*

- [ ] Add **collapsible left sidebar** on the board page with icon buttons: **Templates**, **Draw**, **Pen**, **Highlighter**, **Eraser**, **Lasso**, **Comments**, **Hyperlinks**, **Undo**, **Redo** (labels + `aria-label`s).
- [ ] **Tool state** in React (active tool enum); **no-op or toast** for tools not implemented yet — avoid silent failures.
- [ ] Reserve space so the **Konva stage** reflows when sidebar opens/closes (desktop); prep for **drawer** on small screens (see PR 32).
- [ ] **Undo / Redo** buttons wired to a **history stub** (stack in later PR) so UI is stable.

### PR 28 — `feat/drawing-tools-pen-eraser`

*Freehand drawing: pen, highlighter, eraser (Konva line or custom layer).*

- [ ] **Drawing layer** above/below object layer; persist strokes as **`line`** or new `freehand` type (decide in `board-object.ts`).
- [ ] **Pen** + **Highlighter** (width + opacity + stroke color); **Eraser** removes intersecting strokes (or mask — document tradeoff).
- [ ] Integrate with **`useBoardObjectWrites`** (debounced / batched) per existing perf patterns.
- [ ] Manual QA: two browsers see drawing sync.

### PR 29 — `feat/lasso-comments`

- [ ] **Lasso**: freehand closed path → select contained objects (intersection test); integrate with existing selection model.
- [ ] **Comments** MVP: pin to canvas (e.g. small marker + thread or linked sticky) — smallest shippable; document in **CONFLICTS** if LWW on text.

### PR 30 — `feat/hyperlinks`

- [ ] **Hyperlinks**: attach **URL** to shape/sticky/text or standalone link hotspot; open in new tab; validate URL client-side.
- [ ] Firestore fields + render hit-target on canvas.

### PR 31 — `feat/undo-redo-history`

- [ ] **Undo / Redo** for board edits (objects + drawing): command stack or snapshot strategy; cap depth for memory.
- [ ] Keyboard shortcuts **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**; sync with sidebar buttons.

### PR 32 — `feat/templates-gallery`

*Predefined layouts + Templates entry point (deterministic first).*

- [ ] **Templates** button opens **modal / panel** with gallery cards (e.g. Kanban, SWOT, Retro, blank).
- [ ] **Apply template**: seed objects via shared **`applyTemplate(boardId, templateId)`** (batch writes; no Gemini required for v1).
- [ ] Optional thumbnails (static SVG/PNG or simplified preview).

### PR 33 — `feat/ai-template-assistant-dashboard`

*Top-of-dashboard AI block (reference: “Generate template”) — optional after templates work without AI.*

- [ ] Large prompt + **quick chips** (Sprint, Retro, SWOT, Journey map) prefilling prompt.
- [ ] **Generate** calls **`/api/ai`** for **new or empty** board; enforce **max tool calls** / board bounds.
- [ ] Loading / error UX consistent with **`AiBoardPanel`**.

### PR 34 — `feat/mobile-responsive-board`

*Mobile-friendly UI — last in epic so layout doesn’t fight new toolbars.*

- [ ] **Responsive** dashboard: stack cards; touch-friendly tap targets (min ~44px).
- [ ] **Board page**: bottom **toolbar** or **drawer** for tools on narrow viewports; pinch/zoom/pan tested on iOS/Android browsers.
- [ ] **Viewport meta** + reduce overflow-x; smoke on real devices or DevTools device mode.
- [ ] Note limitations in **README** (e.g. drawing precision on small screens).

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
| **25+** | **Multi-board save, dashboard, tool rail, drawing, templates, AI templates, mobile** |

---

*Total tasks ≈ 120 × ~15 min ≈ 30 h ceiling—tight for a 20 h week; **cut** PRs 14–16 or defer search/post-MVP if needed. Ship **cursors → objects → persistence → deploy** before polishing frames/connectors.*

*Epic PR 25+:* ship **PR 25 → 26** before deep tool work; **mobile (PR 34)** after toolbars are stable.*
