# AI development log — CollabBoard

One-page summary of how the board AI was built and evolved (Gauntlet submission).

## Goal

Natural-language control of the shared demo board: **Gemini** proposes **tool calls** on the server; the **browser** executes them against **Firestore** so all collaborators see changes in real time (same listeners as manual edits).

## Architecture choice

| Decision | Rationale |
|----------|-----------|
| **Server holds `GEMINI_API_KEY`** | Key never ships to the client; `POST /api/ai` only. |
| **Firebase ID token on every request** | `Authorization: Bearer <token>`; verified with JWT + securetoken certs (`verify-firebase-id-token.ts`). |
| **Client-side tool execution** | API returns `toolCalls`; `executeAiToolCallsClient` uses the signed-in user’s Firestore rules—same paths as the UI. |
| **Model fallbacks** | Some model ids return 404 per key/region; `run-board-gemini.ts` tries an ordered list. |

## Iterations (high level)

1. **PR 19** — Route handler, JSON contract (`ai-api-types.ts`), stub tool declarations, Gemini + function calling.
2. **PR 20** — `buildBoardContextForAi`, client executor (`createStickyNote`, `createRectShape`, `moveObject`), `AiBoardPanel` on `/board`.
3. **Hardening** — Clearer errors (empty Gemini response, quota/404), Firebase token verification fix, prompt clear-on-success UX.
4. **PR 21** — `ai-board-system-prompt.ts` (creation, manipulation, layout, templates: SWOT / retro / grid), richer tool descriptions, optional sticky `fill` (hex).

## Demo phrases to try

- “Add a yellow sticky that says …”
- “Create a SWOT board” / “three retrospective columns”
- “Move the sticky with id … to x=400, y=200” (use ids from board context)

## Open limitations (MVP)

- Single shared **demo** `boardId` enforced on the API.
- Tool set is **sticky / rect / move**; frames, connectors, and text are not AI tools yet.
- No request queue: one AI request at a time in the panel.

## Related code

| Area | Path |
|------|------|
| API | `src/app/api/ai/route.ts` |
| Gemini | `src/lib/run-board-gemini.ts` |
| System prompt | `src/lib/ai-board-system-prompt.ts` |
| Tools | `src/lib/ai-board-tools.ts` |
| Executor | `src/lib/ai-execute-tools-client.ts` |
| UI | `src/components/ai-board-panel.tsx` |
