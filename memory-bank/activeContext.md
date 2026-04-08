# Active context

*Update this file when your focus changes (each session or each PR).*

## Session handoff

At the start of a work session, read **[`progress.md`](./progress.md)** and this file, then **[`BUILD_ROADMAP.md`](../BUILD_ROADMAP.md)** (and code as needed). That keeps continuity across chats.

## Current focus

- **Done through PR 15** — Shapes, stickies, frames, text, connectors, selection/transform, delete/duplicate, clipboard copy/paste (**`collabwb:v1:`** + **Ctrl/Cmd+C·V**).
- **Next:** **PR 16** — Toolbar **search** input; **client-side** filter on **sticky** + **`text`** objects (substring); optional canvas highlight; README limits if no Algolia.

## Open decisions (revisit in code)

- **Firestore paths:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — `boards/{DEMO_BOARD_ID}/objects|cursors|presence`
- **Clipboard:** cross-origin / permission quirks; internal buffer is same-tab only

## Blockers

- None recorded.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Rules deploy: `npm run deploy:rules` (or global `firebase deploy --only firestore:rules`)
