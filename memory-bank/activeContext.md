# Active context

*Update this file when your focus changes (each session or each PR).*

## Current focus

- **Done through PR 02:** Firebase console + **`.env.local`**; GitHub + Vercel deploy; checklist updates.
- **Next session:** Read **[progress.md → Start here next session](./progress.md)** first — then **PR 03** (`firebase` package, **`src/lib/firebase.ts`**, **`firestore.rules`**, **`firebase.json`**, README rules note).

## Open decisions (revisit in code)

- **Firestore paths:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — `boards/{boardId}/objects|cursors|presence`; `boardId = demo` for MVP.
- **Cold start** for Vercel AI routes — revisit when `/api` exists.

## Blockers

- None recorded.

## Commands

- Dev: `npm run dev` (one terminal; if “another server running,” stop Node for this folder or clear `.next\dev`)
- Build: `npm run build`
- Env: [`.env.local`](../.env.local) (gitignored)
