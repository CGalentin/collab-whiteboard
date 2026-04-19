# Product context

## Who

- **Solo** builder; audience = Gauntlet / class / portfolio; app is **deployed** (Vercel).

## Usage pattern

- **Workshops / collaboration** — short-lived boards.
- **PRD target:** 5+ concurrent users on a **board**; realtime cursors + presence.
- **MVP shipped:** shared **demo** board id for all users (simplest security story).
- **Next (PR 25+):** **multiple saved boards per user**, dashboard, tool rail, templates, mobile — see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md).

## Constraints (original MVP)

- Time/budget comfort caps; track AI spend — [docs/AI_COST_ANALYSIS.md](../docs/AI_COST_ANALYSIS.md).

## AI agent

- **Gemini** + function calling; client applies tools to Firestore.
- **PR 21:** six command areas + SWOT / retro / grid style prompts — [docs/AI_DEVELOPMENT_LOG.md](../docs/AI_DEVELOPMENT_LOG.md).

## Standards

- [Gauntlet best practices](../docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)
