# Product context

## Who

- **Solo** builder; audience = Gauntlet / class / portfolio; app is **deployed** (Vercel).

## Usage pattern

- **Workshops / collaboration** — short-lived boards.
- **PRD target:** 5+ concurrent users on a **board**; realtime cursors + presence.
- **MVP shipped:** shared demo era (single board id) — superseded by **per-user boards** (**PR 25–26**).
- **Now (v2):** **multiple saved boards**, **dashboard**, **tool rail**, **drawing**, **lasso + comments**, **hyperlinks (PR 30)**, **undo/redo (PR 31)**, **board sharing (PR 35)** per [BUILD_ROADMAP.md](../BUILD_ROADMAP.md). Next epic slices: **PR 32+** (templates, mobile).

## Constraints (original MVP)

- Time/budget comfort caps; track AI spend — [docs/AI_COST_ANALYSIS.md](../docs/AI_COST_ANALYSIS.md).

## AI agent

- **Gemini** + function calling; client applies tools to Firestore.
- **PR 21:** six command areas + SWOT / retro / grid style prompts — [docs/AI_DEVELOPMENT_LOG.md](../docs/AI_DEVELOPMENT_LOG.md).

## Standards

- [Gauntlet best practices](../docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md)
