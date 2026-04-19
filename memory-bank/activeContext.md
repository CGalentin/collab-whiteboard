# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff

At the start of a work session, read **[`progress.md`](./progress.md)** and this file, then **[`BUILD_ROADMAP.md`](../BUILD_ROADMAP.md)** (and code as needed). That keeps continuity across chats.

## Current focus

- **Shipped:** **PR 21** — `buildBoardSystemInstruction` in **`ai-board-system-prompt.ts`** (six command areas + SWOT / retro / grid); richer **`ai-board-tools`**; optional sticky **`fill`**; AI panel loading/accessibility; **CONFLICTS.md** note on two users + AI.
- **Next:** **PR 22** — **`chore/vercel-production`**: Vercel + GitHub, env vars (Firebase + **`GEMINI_API_KEY`**), production Firestore rules, smoke test.

### AI feature — key files

| Piece | Path |
|--------|------|
| API route | `src/app/api/ai/route.ts` — `GEMINI_API_KEY`; **`Authorization: Bearer`** Firebase ID token |
| Token verify | `src/lib/verify-firebase-id-token.ts` — Firebase ID JWT (securetoken x509 + `jsonwebtoken`) |
| System prompt | `src/lib/ai-board-system-prompt.ts` |
| Gemini call | `src/lib/run-board-gemini.ts` — model fallbacks; optional **`GEMINI_MODEL`** in `.env.local` |
| Tool defs | `src/lib/ai-board-tools.ts` |
| Client executor | `src/lib/ai-execute-tools-client.ts` |
| Board snapshot | `src/lib/board-context-for-ai.ts` |
| UI | `src/components/ai-board-panel.tsx` |
| Types | `src/lib/ai-api-types.ts` |

## Open decisions (revisit in code)

- **Firestore paths:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — `boards/{DEMO_BOARD_ID}/objects|cursors|presence`
- **Clipboard:** cross-origin / permission quirks; internal buffer is same-tab only

## Blockers

- None recorded.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Rules deploy: `npm run deploy:rules` (or global `firebase deploy --only firestore:rules`)
