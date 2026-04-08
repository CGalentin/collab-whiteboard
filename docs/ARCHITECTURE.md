# Architecture — CollabBoard (MVP draft)

*Refine this as you implement PR 03+.*

## High-level

```text
Next.js (Vercel)
  ├─ Browser: Firebase Auth + Firestore listeners/writes
  └─ /app/api/* : Gemini (server-only key) → optional Firestore writes
```

## Firestore path sketch (shared demo board)

Single demo board for MVP; one constant board id (e.g. `demo`).

| Path | Purpose |
|------|--------|
| `boards/{boardId}` | Board metadata doc: `title`, `createdAt`, optional `updatedAt`. |
| `boards/{boardId}/objects/{objectId}` | Canvas entities: sticky, shape, frame, text, connector fields in one doc per object. |
| `boards/{boardId}/cursors/{userId}` | Live cursor: `x`, `y`, `name`, `updatedAt` (throttle writes). |
| `boards/{boardId}/presence/{userId}` | Presence: `displayName`, `online`, `lastSeen` (heartbeat / onDisconnect pattern TBD). |

**MVP constant:** `boardId = "demo"` (or set `NEXT_PUBLIC_APP_DEMO_BOARD_ID` in env).

## Object document (example fields)

Unified `type` discriminator; adjust to match Konva + PRD.

- `type`: `"sticky"` \| `"rect"` \| `"circle"` \| `"line"` \| `"text"` \| `"frame"` \| `"connector"`
- `x`, `y`, `width`, `height`, `rotation`
- `fill`, `stroke`, `text`, `zIndex` (or `order`)
- `updatedAt` (server or client timestamp for LWW narrative)
- Connector: `fromObjectId`, `toObjectId` (or anchor points)

## Security rules (PR 03)

- Require `request.auth != null` for all `boards/{boardId}/**` paths.
- Optionally restrict `boardId` to `demo` until multi-board ships.

## Related

- [FIREBASE_CONSOLE_CHECKLIST.md](./FIREBASE_CONSOLE_CHECKLIST.md) — PR 02 console steps
- [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md) — stack decisions
