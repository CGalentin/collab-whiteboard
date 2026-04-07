# Project brief — CollabBoard

## Goal

Ship a **production-style MVP**: real-time collaborative whiteboard + **AI board agent** (natural language → board operations), following the Gauntlet CollabBoard PRD.

## Hard MVP gates (must pass)

- Infinite board with **pan/zoom**
- **Sticky notes** (editable text)
- At least one **shape** (rect / circle / line)
- **Create, move, edit** objects
- **Real-time sync** for 2+ users
- **Multiplayer cursors** with **name labels**
- **Presence** (who’s online)
- **User authentication**
- **Deployed**, publicly accessible

## Build order (PRD)

1. Cursors → 2. Object sync → 3. Conflicts (LWW, documented) → 4. Persistence → 5. Board features → 6. Basic AI → 7. Complex AI

## Non-goals (MVP)

- Full **PWA / offline** editing (post-MVP)
- GDPR / enterprise compliance (demo scope)
- AI **job queues** (direct API calls + UI debounce for v1)

## References

- Full checklist: [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md)
- Task breakdown: [BUILD_ROADMAP.md](../BUILD_ROADMAP.md)
