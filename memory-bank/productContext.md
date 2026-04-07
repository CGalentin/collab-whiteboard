# Product context

## Who

- **Solo** builder; demo audience = Gauntlet / class / public deploy.

## Usage pattern

- **Many boards**, **short-lived workshops** (not one 24/7 war room).
- **5+ concurrent users** on a board (PRD target); optional higher cap later.
- **Shared demo board** for MVP (not full multi-tenant “my boards” yet).
- **Everyone who can open the board can edit** (no viewer role v1).

## Constraints

- **~20 hours** toward first working MVP; **~$20** AI/hosting comfort cap for getting MVP up; track spend for assignment cost doc.
- Prefer **familiar stack** (React/TS/Firebase); **perfect architecture** after MVP works.

## AI agent expectations

- **Gemini** + **function/tool calling**; tools write/read **Firestore** like the UI.
- **6+** distinct command categories; **multi-step** templates (SWOT, grids, retros).
- All users see AI changes in **real time** (same listeners as human edits).

## Standards

- [Gauntlet best practices](../docs/GAUNTLET_FULLSTACK_BEST_PRACTICES.md) — small PRs, explicit errors, DoD for features.
