# Active context

*Update this file when your focus changes (each session or each PR).*

## Current focus

- **Done:** Pre-search captured; **Phase 1.1** — Next.js + TS + Tailwind + ESLint/Prettier scaffold in repo root (`npm run dev` / `build` OK).
- **Next:** **Firebase console** (project, Auth providers, Firestore) → **`src/lib/firebase.ts`** + **rules** → **auth UI** (see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) PR 02–04).

## Open decisions (revisit in code)

- Exact **Firestore paths** (`boards/demo` vs `boards/{id}/objects/...`) — sketch in `docs/ARCHITECTURE.md` when chosen.
- **Cold start** tolerance for Vercel AI routes — acceptable for AI-only if sync stays on Firebase client.

## Blockers

- None recorded.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Env template: copy [.env.example](../.env.example) → `.env.local`
