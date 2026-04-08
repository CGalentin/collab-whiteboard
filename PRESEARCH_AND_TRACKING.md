# CollabBoard — Pre-Search & Project Checkpoints

Use this file to stay on track: complete **Pre-Search** before writing code, then work through **Build** and **Submission** checkpoints in order. Check items off as you finish them.

---

## How to use

1. Answer the **Pre-Search** questions below (2–6 sentences each unless a number is asked). Where unsure, note your **assumption** and **what would change your mind**.
2. Fill the **Decision summary** section once Phases 1–3 are done.
3. Follow **Build checkpoints** in order—the PRD treats multiplayer sync as the riskiest path.
4. Keep this file or your answers exportable for the **Pre-Search** portion of your final submission.

**See also:**

- [Gauntlet Fullstack Best Practices Playbook](docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md) — engineering standards and delivery checklist while you build.
- [Build roadmap (15-minute tasks, PR-sized)](BUILD_ROADMAP.md) — coding and setup checklist grouped for small PRs.

---

## PRD snapshot (reference)

| Area | Requirement |
|------|-------------|
| **Hard MVP** | Infinite pan/zoom; sticky notes; ≥1 shape; create/move/edit; real-time sync (2+ users); cursors + names; presence; auth; deployed & public |
| **Conflict handling** | Simultaneous edits handled; last-write-wins acceptable if **documented** |
| **Persistence** | Board survives refresh and all users leaving |
| **AI agent** | 6+ command types; tool schema per PRD; shared realtime updates; multi-user AI commands |
| **Submission** | GitHub, demo video, Pre-Search doc, AI dev log, cost analysis, deploy link, social post |

**Recommended build order (PRD):** cursors → object sync → conflicts → persistence → board features → basic AI → complex AI.

---

## Master checklist — project phases

### Phase 0 — Pre-Search (before code)

- [x] **0.1** Phase 1 constraints answered (questions 1–5)
- [x] **0.2** Phase 2 architecture answered (questions 6–11)
- [x] **0.3** Phase 3 refinement answered (questions 12–16)
- [x] **0.4** Decision summary written (stack table + conflict model + top 3 risks) — *refine after first implementation pass*
- [x] **0.5** Save AI conversation or this doc as Pre-Search reference for submission — *repo: this file + exported chats as needed for submission*

### Phase 1 — Build: multiplayer core

- [x] **1.1** Repo scaffold + chosen stack initialized
- [ ] **1.2** Auth working (sign-in flow end-to-end)
- [ ] **1.3** Two+ browsers: **multiplayer cursors** with name labels
- [ ] **1.4** **Object sync**: create sticky → appears for all users
- [ ] **1.5** **Conflict handling** implemented + documented (e.g. LWW on which field/version)
- [ ] **1.6** **Persistence**: refresh mid-edit + all users leave → state restored

### Phase 2 — Build: board features (PRD table)

- [ ] **2.1** Infinite board + smooth pan/zoom
- [ ] **2.2** Sticky notes: text, colors, edit
- [ ] **2.3** Shapes: rectangle, circle, line (solid colors)
- [ ] **2.4** Connectors (lines/arrows between objects)
- [ ] **2.5** Standalone text elements
- [ ] **2.6** Frames (group/organize)
- [ ] **2.7** Transforms: move, resize, rotate
- [ ] **2.8** Selection: single, shift multi-select, drag marquee
- [ ] **2.9** Operations: delete, duplicate, copy/paste

### Phase 3 — Build: realtime quality

- [ ] **3.1** Manual test: 2 users, different browsers, simultaneous edit
- [ ] **3.2** Manual test: rapid create/move (performance sanity)
- [ ] **3.3** Manual test: network throttle + disconnect/reconnect
- [ ] **3.4** Manual test: 5+ concurrent users (degradation check)

### Phase 4 — AI board agent

- [ ] **4.1** Tool schema implemented (minimum from PRD)
- [ ] **4.2** ≥6 distinct command categories demonstrated (creation, manipulation, layout, complex)
- [ ] **4.3** AI mutations visible to **all** users in realtime
- [ ] **4.4** Two users issue AI commands close together — no corrupt state / strategy documented
- [ ] **4.5** Spot-check: SWOT, grid arrange, multi-step template flows

### Phase 5 — Ship & submit

- [x] **5.1** Production deploy; URL public and stable — *Vercel; refine when board ships*
- [x] **5.2** README: setup guide + architecture overview — *expand with full architecture when PR 03+ lands*
- [ ] **5.3** Demo video (3–5 min): collab + AI + architecture
- [ ] **5.4** AI Development Log (1 page per PRD template)
- [ ] **5.5** AI Cost Analysis: dev spend + 100 / 1K / 10K / 100K user projections
- [ ] **5.6** Social post (X or LinkedIn) with features/demo; tag @GauntletAI

---

## Pre-Search — Phase 1: Define your constraints

### 1. Scale and load profile

- [x] Answered: simultaneous users (demo vs. 6-month picture) — *see notes; optional: pick exact cap (e.g. 8, 10)*
- [x] Answered: traffic pattern (steady vs. spiky)
- [ ] Answered: cold-start tolerance if using serverless — *TBD when stack is chosen*
- [x] Answered: large single boards vs. many small boards

**Your notes:**

- **Concurrent users (MVP):** At least **several** people on one board at once; treat **5+** as the PRD floor until you pick an explicit cap (e.g. 8 or 10 for demos).
- **Traffic pattern:** Lots of **short-lived workshops** (many boards/sessions created and used briefly, not one board running 24/7).
- **Cold start:** **Not decided yet** — revisit after hosting/backend choice (serverless vs always-on). *Reminder:* cold start is extra delay on the first request after idle, common on serverless; often acceptable for **AI-only** routes if sync stays warm.
- **Board shape:** **Many boards**, each with **multiple objects** (not a single global mega-board only). Implies solid **per-board persistence**, **listing/routing** (how users open a board), and performance targets **per board** (PRD still mentions 500+ objects as a stress target on a board).

---

### 2. Budget and cost ceiling

- [x] Answered: max monthly spend (hosting + AI) during the project — *qualitative; add a soft $ cap when you do Cost Analysis*
- [x] Answered: fixed vs. pay-as-you-go preference
- [x] Answered: where you trade money for time

**Your notes:**

- **Spend posture:** Keep MVP cost **low**; not planning to spend a lot while validating the project.
- **Existing accounts:** **Firebase** and **Vercel** — natural fit for **free/low tiers + usage-based** billing rather than a fixed VPS bill. Frontend on Vercel + Firebase (Auth, Firestore/Realtime DB, Hosting if used) stays within typical student/MVP budgets if you watch **reads/writes**, **bandwidth**, and **AI API** usage.
- **Fixed vs. pay-as-you-go:** Lean **pay-as-you-go on free tiers**, with costs scaling only if usage grows — aligns with “don’t spend a lot” for MVP.
- **Money vs. time:** Using **managed** Firebase + Vercel trades a bit of **vendor coupling** for **less ops work** (good for shipping fast on a budget). Revisit if Firestore/sync costs spike with many workshops.
- **Optional for submission:** Pick a **placeholder monthly cap** for your Cost Analysis doc (e.g. “aim under $X/month for dev”) — you can refine after first bill.

---

### 3. Time to ship

- [x] Answered: deadline and hours per week
- [x] Answered: MVP stability vs. long-term architecture priority
- [x] Answered: iterate after launch vs. freeze

**Your notes:**

- **Timeline:** Target a **working MVP within ~1 week**, with about **20 hours** available before the deadline.
- **Priority order:** **Ship a stable MVP first** (meets PRD gates: sync, auth, deploy, core board + AI baseline). **Refine and “perfect” architecture after** the MVP is working — i.e. deliberate **two-phase** plan: fast vertical slice, then hardening/cleanup.
- **Implication for stack:** Prefer **boring, documented paths** (e.g. Firebase + Vercel you already use) over experimental layers; avoid blocking the week-one cut on ideal abstractions. Document **known debt** to revisit post-MVP.

---

### 4. Compliance and regulatory

- [x] Answered: sensitive data on boards or beyond auth
- [x] Answered: GDPR / SOC 2 / residency — in scope or explicit assumptions
- [x] Answered: institutional / school constraints on vendors

**Your notes:**

- **Sensitive data:** **No** — not planning to store HIPAA-level or other regulated content; treat boards as **non-sensitive / demo** scope.
- **Overseas / GDPR / SOC 2 / residency:** **Not in scope** for this MVP — **not building for overseas users**; no special EU or enterprise compliance requirements assumed.
- **Institutional constraints:** **No banned tools** — free to use Firebase, Vercel, and other vendors per pre-search.

---

### 5. Team and skills

- [x] Answered: solo vs. team + ownership split
- [x] Answered: languages/frameworks you already know
- [x] Answered: willingness to learn a dedicated realtime stack

**Your notes:**

- **Team:** **Solo** — you own frontend, backend integration, and AI wiring.
- **Comfortable stack:** **JavaScript**, **TypeScript**, **React**, **Firebase** (strong alignment with low-cost MVP on Firebase + Vercel).
- **Learning posture for MVP:** **Stay inside familiar tools** for now; avoid optional new realtime frameworks unless a clear blocker appears. *Post-MVP:* can revisit Yjs/Liveblocks/PartyKit-style layers if Firebase patterns feel limiting.

---

## Pre-Search — Phase 2: Architecture discovery

### 6. Hosting and deployment

- [x] Answered: target host (Vercel, Firebase, Render, Fly.io, other)
- [x] Answered: serverless vs. always-on for realtime
- [x] Answered: CI/CD now vs. manual deploy for MVP
- [x] Answered: scaling picture (~10 users on one board)

**Your notes:**

- **Deploy split:** **React app on Vercel**; **Firebase** for **Auth**, **database**, and **realtime** (Firestore as main persistence + live sync path).
- **Realtime / process model:** Core sync runs through **Firebase’s managed services** (client SDK ↔ Firestore listeners) — not a DIY always-on WebSocket server. **AI routes** on Vercel may run as **serverless functions** (cold starts TBD in §1); board sync stays “warm” via client connections to Firebase.
- **CI/CD vs manual:** **Chosen for MVP:** **Git push → Vercel deploy** (connect repo to Vercel so commits to the linked branch auto-build and deploy). *Reminder:* **CI/CD** = automated pipeline on push; **manual** = CLI/dashboard deploy only. You want **automatic deploys on commit** for the frontend.
- **Scale / region:** **~5–10 users** on one board is fine for Firestore/Vercel free tiers for a demo. **Default Firebase region** (e.g. single region or project default) is **OK for this MVP**; optimize multi-region only if you later have real latency requirements.

---

### 7. Authentication and authorization

- [x] Answered: auth methods (email, magic link, OAuth, etc.)
- [x] Answered: multi-tenant boards vs. shared demo
- [x] Answered: roles (viewer/editor) vs. everyone edits

**Your notes:**

- **Auth methods:** **Email/password** and **Google** sign-in via **Firebase Auth** (one-click Google provider).
- **Tenancy / boards:** **Shared demo board** is **enough for MVP** — no requirement (yet) for per-user private board lists; can add multi-tenant “my boards” post-MVP.
- **Roles:** **Everyone who can access the board can edit** — no viewer vs. editor split for v1; keeps Firestore rules simpler for the week-one cut.

---

### 8. Database and data layer

- [x] Answered: source of truth for board state
- [x] Answered: full-text search needed for MVP?
- [x] Answered: read/write ratio expectation
- [x] Answered: persistence strategy (debounce, intervals, etc.)

**Your notes:**

- **Source of truth:** **Firestore** remains the system of record; exact **document layout** (single doc vs. `boards/{id}/objects` subcollection, etc.) **decided during implementation** — pick what keeps listeners and security rules simplest for realtime edits.
- **Full-text search:** **In scope for MVP.** *Implementation note:* Firestore has **no built-in full-text search**; options include **Algolia/Typesense**, the **Firebase Extensions** search pattern, or a **simple client-side filter** over loaded stickies if board size stays small. Choose the smallest path that still satisfies “search stickies” for the demo.
- **Read/write profile:** Collaboration implies **mostly writes** while a session is live; reads spike on join/refresh — design listeners and queries to avoid unnecessary full-board refetches.
- **Persistence:** Persist **on every meaningful change**, with **debouncing/batching** in the client (and optional `writeBatch`/transactions) to avoid hammering quotas and to merge rapid drags into fewer writes.

---

### 9. Backend and API architecture

- [x] Answered: monolith vs. BaaS-heavy
- [x] Answered: REST / GraphQL / tRPC / SDK-first
- [x] Answered: AI calls — server-side only and key handling
- [x] Answered: queues for AI in MVP?

**Your notes:**

- **Backend shape (MVP default):** **BaaS-heavy** — React talks to **Firebase** (Auth + Firestore) via the **client SDK** for board state and collaboration. **Vercel API routes** (or serverless handlers) for **AI** and any logic that must not run in the browser.
- **API style:** **SDK-first** to Firebase; **simple HTTP/REST** from client → Vercel for AI (`fetch('/api/...')`). No requirement for GraphQL/tRPC on week one.
- **AI + secrets:** **Server-side only** — LLM API keys live in **Vercel environment variables**, never exposed in the client bundle. Client sends natural language (and optional session/board id); server calls the model and either returns structured actions or writes to Firestore per your tool-calling design.
- **Queues:** **None for MVP** — direct LLM invocation per request; mitigate spikes with **UI debouncing**, disabling double-submit, and **rate limits** if needed. Revisit queues post-MVP if usage grows.

---

### 10. Frontend framework and rendering

- [x] Answered: React / Vue / Svelte (or other)
- [x] Answered: canvas library (Konva, Fabric, Pixi, raw)
- [x] Answered: SPA acceptable?
- [x] Answered: PWA/offline in or out of MVP

**Your notes:**

- **Framework:** **React** + **TypeScript**, deployed on **Vercel**.
- **Canvas:** **Konva** (typically **`react-konva`**) for 2D board rendering, hit-testing, transforms, and performance with many shapes.
- **SPA:** **Yes** — single-page app is fine; **no SSR/SEO requirement** for an authenticated whiteboard.
- **PWA / offline (what it means):** A **PWA** can be **installed** (home screen icon), sometimes works **offline** using a **service worker** that caches the app shell and assets. **True offline collaboration** with Firestore usually needs extra design (persistence cache, conflict rules, “queued writes”) and is **easy to underestimate**. *MVP stance:* **Out of scope for week one** — require network for sync; you can add a light **installable** PWA later without full offline editing. *Change this if you explicitly want offline as a demo requirement.*

---

### 11. Third-party integrations

- [x] Answered: LLM vendor + function/tool calling approach
- [x] Answered: rate limits and per-session token budget
- [x] Answered: vendor lock-in tolerance for sync

**Your notes:**

- **LLM choice:** **Gemini (Google AI)** is **viable** for MVP. The **Gemini API** supports **function calling** / structured tool use so you can map natural language → board operations (`createStickyNote`, etc.), similar in spirit to OpenAI/Anthropic. Quality and latency depend on **model tier** (e.g. Flash vs Pro); for deterministic tool JSON, **validate** model outputs and **retry** on parse errors regardless of vendor. *Pick based on:* existing Google account/billing, **free tier** limits, and docs you find easiest — not “only OpenAI is good enough” for this assignment.
- **Dev spend ceiling (MVP):** Aim to spend **no more than ~$20** to get the MVP running (AI API + any paid hosting overages). **Track usage** in Google AI Studio / Cloud console; use **cheaper/faster** models for iteration, **shorter system prompts**, and **caching** where possible. **Post-MVP / assignment “at scale” costs** documented separately in the Cost Analysis section.
- **Vendor lock-in (sync):** **Accepted** — **Firebase** as realtime/persistence backbone for speed and familiarity; portability is a post-MVP concern.

---

## Pre-Search — Phase 3: Post-stack refinement

### 12. Security

- [x] Answered: API keys never in client — how enforced
- [x] Answered: stack-specific pitfalls (rules, RLS, CORS, WS auth)
- [x] Answered: dependency strategy (lockfile, automation)

**Your notes:**

- **Secrets:** **Gemini / any LLM keys** and other secrets live only in **Vercel environment variables** and **local `.env.local`** (gitignored). Never import them into React client code; AI only via **server routes**.
- **Firebase:** **Firestore security rules** require **authenticated** users for board paths; tighten read/write to the **shared demo board** (or `boards/{id}` pattern) so anonymous clients cannot scribble on production. Watch **CORS** only if you add extra origins; Firebase SDK handles typical cases. **No custom WebSocket auth** if sync stays on Firestore client SDK.
- **Dependencies:** Commit **lockfile** (`package-lock.json` / `pnpm-lock.yaml`); run **`npm audit`** (or equivalent) periodically; add **Dependabot** on GitHub when convenient.

---

### 13. File structure and organization

- [x] Answered: monorepo vs. multiple repos
- [x] Answered: feature-based vs. layer-based folders

**Your notes:**

- **Repos:** **Single repo** — one GitHub project; Vercel deploys the app root (or `apps/web` later if you split; not required for MVP).
- **Layout (pragmatic hybrid):** **Layer-based** base — e.g. `src/components/`, `src/hooks/`, `src/lib/` (Firebase, AI client helpers), `src/features/board/` for larger board-specific UI if it grows. **Vercel serverless:** `api/` at project root *or* `src/pages/api` depending on framework (e.g. Next.js). Keep **board/sync hooks** colocated or under `src/lib/sync` for clarity.

---

### 14. Naming and code style

- [x] Answered: TypeScript strict mode
- [x] Answered: ESLint / Prettier level
- [x] Answered: naming conventions for team

**Your notes:**

- **TypeScript:** Enable **`strict`** (or as strict as the starter allows without blocking ship); fix `any` in hot paths when possible.
- **Lint/format:** **ESLint + Prettier** with the **default** React/TS recommendations from your scaffold (Vite/Next template). No extra ceremony for MVP.
- **Naming:** **PascalCase** components, **camelCase** functions/variables/hooks (`useBoardState`), **UPPER_SNAKE** for true constants; files match team convention from template (`Component.tsx` or `component.tsx` — pick one and stay consistent).

---

### 15. Testing strategy

- [x] Answered: automation beyond required manual multi-browser tests
- [x] Answered: unit vs. E2E scope
- [x] Answered: realistic coverage target for deadline

**Your notes:**

- **Manual (required by PRD):** Two browsers, throttle network, refresh mid-session, 5+ users — keep a **short checklist** in README or this doc.
- **Automation (MVP):** **Optional / time permitting** — **Playwright** smoke test (login + open board) if scaffold is quick; otherwise defer to **post-MVP**.
- **Unit:** Target **pure helpers** only if cheap (geometry, tool-call parsing); skip heavy coverage goals for week one.
- **Coverage target:** **No numeric target** for MVP; prioritize **green manual scenarios** over %.

---

### 16. Tooling and developer experience

- [x] Answered: Cursor rules, skills, MCPs planned
- [x] Answered: debugging workflow (DevTools, WS, logs)
- [x] Answered: CLIs standardized (Supabase, Firebase, etc.)

**Your notes:**

- **Editor / AI:** **Cursor** for implementation; add **`.cursor/rules`** or project notes when repeating patterns (Firestore listeners, Konva perf). Use **skills** you already have for rules/settings when relevant.
- **Debugging:** **Chrome DevTools** (Network, Console, React DevTools); **Firebase console** for Auth users and Firestore data; **`console.log` gated** or removed for noisy paths before demo. Realtime is via **Firestore listeners** (not raw WS) — use **Firestore usage** tab if writes spike.
- **CLIs:** **Firebase CLI** for emulators/rules deploy if you use them; **Vercel CLI** optional if not using Git-only deploy. **No Supabase** in this stack.

---

## Decision summary (fill after Pre-Search)

*Target: ~1 page for submission. Below is a first draft from Pre-Search — refine after implementation.*

### Chosen stack

| Layer | Choice | One-line rationale |
|-------|--------|--------------------|
| Hosting / deploy | **Vercel** (Git push → auto deploy) + **Firebase** project | Familiar accounts, low MVP cost, fast iteration. |
| Auth | **Firebase Auth** — email/password + Google | Matches Firebase data layer; PRD auth gate. |
| Database / realtime | **Firestore** (layout TBD in code) | Single source of truth, listeners for realtime sync. |
| Backend / APIs | **BaaS-first** (client SDK) + **Vercel serverless** for AI | Keys stay server-side; minimal custom backend for week one. |
| Frontend + canvas | **React**, **TypeScript**, **Konva** (`react-konva`), **SPA** | Matches your skills; Konva fits 2D board + many objects. |
| AI (model + integration) | **Gemini API** + **function/tool calling** from Vercel route | Viable tools; cap MVP spend (~$20 dev); no client keys. |

### Conflict resolution model

- **Strategy:** **Last-write-wins (LWW)** at the **field or document** level — acceptable per PRD; document precisely once implemented (e.g. concurrent `update()` on same sticky: last commit wins).
- **Applied at:** Per **object** (or nested map entry) in Firestore; optional **`updatedAt`** server timestamp or client ordering — **finalize in code** (prefer **FieldValue.serverTimestamp()** on writes where used for ordering).
- **What users might see:** Rare **overwrites** if two users edit the **same** property simultaneously; cursor presence still shows both users.

### Top 3 risks and mitigations

1. **Risk:** **Realtime sync bugs** (missed updates, jank, rule misconfig). **Mitigation:** Build **cursors → objects → persistence** in order; test **two browsers + throttle** continuously; tighten **Firestore rules** early for auth-only board paths.
2. **Risk:** **Firestore write costs / hot loops** (drag → too many writes). **Mitigation:** **Debounce/batch** position updates; throttle cursor broadcasts if needed; watch quota in Firebase console.
3. **Risk:** **AI cost or flaky tool JSON** over budget or errors. **Mitigation:** **Cheaper Gemini model** for dev; short prompts; **validate** tool payloads; **~$20** ceiling with usage tracking; disable double-submit in UI.

---

## Performance targets (PRD) — verify before final demo

| Metric | Target | Your result / notes |
|--------|--------|---------------------|
| Pan/zoom / manipulation | ~60 FPS | |
| Object sync latency | <100 ms | |
| Cursor sync latency | <50 ms | |
| Object count | 500+ without major degradation | |
| Concurrent users | 5+ without major degradation | |
| AI simple command latency | <2 s | |

---

## PRD testing scenarios (check when validated)

- [ ] Two users editing simultaneously in different browsers
- [ ] One user refreshes mid-edit — state persists correctly
- [ ] Rapid create/move of stickies and shapes — sync keeps up
- [ ] Throttled network + disconnect — recovery is graceful
- [ ] Five or more concurrent users — acceptable performance
