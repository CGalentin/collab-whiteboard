# Concurrent edits — what to expect (MVP)

This app uses **Firestore** `boards/{boardId}/objects/{objectId}` with **partial `updateDoc` writes**. There is **no** operational-transform or CRDT layer on the client.

## Granularity: per field, last write wins (LWW)

- Each write sends only the **top-level fields** that changed (for example `x`, `y`, `text`, `width`, `fill`).
- Firestore **merges** those fields into the document. Unmentioned fields are left as-is on the server.
- If two clients update **different** fields on the same object (e.g. one moves, one changes color), both updates typically **compose**: you end up with the new position **and** the new colors, modulo ordering (see below).

If two clients update the **same** field on the same object close together, **whichever `updateDoc` commits last wins** for that field. There is no version vector or “reject stale write” logic in the client yet.

## `updatedAt`

Every object patch from `useBoardObjectWrites` sets **`updatedAt`** to a **server timestamp**. That is useful for debugging, support, and future conflict policies. The UI does **not** use `updatedAt` to merge or roll back edits today.

## Typical scenarios

### Two users drag the same sticky

Both send debounced `{ x, y }` updates. Positions will **jump** as snapshots arrive; the last committed drag tends to dominate. Users should avoid editing the **same** object at the same time if they need pixel-perfect shared placement.

### Two users type in the same sticky (rare / awkward)

Both debounce `text` into `updateDoc`. The **last flushed `text` value overwrites** the other. There is no character-level merge.

**Manual stress check (PR 13):** open the same board in two browsers, select the same sticky, type in both. Confirm behavior is acceptable for MVP (usually: last save wins; expect lost keystrokes if both type simultaneously).

### One user moves, another changes color

`queueObjectPatch` / `queuePosition` may carry `{ x, y }` while `setStickyColors` sends `{ fill, stroke }` immediately. Those are **different fields**, so both usually survive. A pending debounced patch that **only** contains position will not wipe color.

### New objects (`setDoc`)

Creating an object writes the **full** initial document. That does not race with `updateDoc` on **other** docs. Do not `setDoc` over an existing id (the app uses random UUIDs).

### Connectors

A **`connector`** references `fromId` and `toId`. If either object is **deleted**, the client **stops drawing** the arrow until the doc is removed or IDs fixed—orphan connector docs may remain in Firestore (cleanup TBD).

## Code entry point

- [`src/hooks/use-board-object-writes.ts`](../src/hooks/use-board-object-writes.ts) — merged debounced patches per object id, `flushTextNow` merges pending fields with final `text`.

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Firestore paths and object shape
- [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) — PR 13 scope
