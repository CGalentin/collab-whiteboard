# Performance notes (PR 17)

## Firestore object writes

- **Debounced merged patches** (~400ms trailing) with a **single** timer for the whole board.
- When the timer fires, pending updates for **all** objects are committed in one or more **`writeBatch`** chunks (400 updates per batch, under Firestore’s 500-op limit).
- **Transforms / drags** still merge `{ x, y, width, … }` into the same pending map; closing a text editor uses an immediate `updateDoc` for that object (unchanged).

## Cursor writes

- **`CURSOR_WRITE_DEBOUNCE_MS`** (see `src/lib/cursors.ts`) — trailing debounce plus **world-space epsilon** so tiny jitter does not write.
- PR 17 raised debounce slightly to cut write rate during fast pointer movement; if remote cursors feel laggy, lower it.

## Konva / React

- **Layers:** `objects`, `connectors`, `selection-ui` (transformer + marquee), and **non-interactive** remote cursors are already split.
- **Memoized** row components (`StickyNoteShape`, `TextObjectShape`, `FrameShape`, `BoardObjectShape`) use **data-only** equality so unstable inline handlers do not force redraws when snapshot data for that object is unchanged.

## Manual stress checks (not automated)

| Check | How | Rough expectation |
|-------|-----|-------------------|
| **Many objects** | Duplicate / paste until **~500** items (mix of rects + stickies). Pan and zoom. | Usable on a modern laptop; jank may appear with very large selections. |
| **FPS** | Chrome **Performance** panel → **Frames** while panning/zooming an empty area vs. heavy board. | Empty pan/zoom: stay near display refresh; heavy board: expect some frame cost from Konva + React. |

Results vary by device and GPU. Record your machine and browser when filing perf issues.

## Future ideas (not implemented)

- Structural sharing in `useBoardObjects` to preserve object references when Firestore data is unchanged.
- Virtualized rendering / viewport culling for huge boards.
