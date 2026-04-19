# Manual QA matrix (PR 18)

Use this checklist before demos or releases. **Two browsers** (or one normal + one incognito) signed in as **different users** on the same demo board (`/board`). See [ARCHITECTURE.md](./ARCHITECTURE.md) for Firestore paths.

| Session | Tester | Date | Browser A | Browser B | Pass / notes |
|---------|--------|------|-----------|-----------|--------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

*Aim for **5+** distinct sessions over time (different machines, networks, or incognito profiles). Record anomalies in the last column or in GitHub issues.*

---

## 1. Two browsers — simultaneous editing

Perform with **Browser A** and **Browser B** both on `/board` (same board id).

### Stickies

- [ ] **A** adds a sticky; **B** sees it within a few seconds.
- [ ] **B** edits sticky text (double-click); **A** sees updated text after sync.
- [ ] **A** changes sticky color (swatches); **B** sees new colors.
- [ ] **A** drags a sticky; **B** sees new position (debounced writes; may lag slightly).

### Shapes & other objects

- [ ] **A** adds rectangle / circle / line; **B** sees them.
- [ ] **B** selects and transforms (resize/rotate) a rect or circle; **A** sees geometry update.
- [ ] **A** adds a **frame** and a **text** object; **B** sees them; text edit syncs like stickies.
- [ ] **A** selects two objects and **Connect**; **B** sees connector; moving an endpoint updates the arrow.

### Presence & cursors

- [ ] **Presence** sidebar lists both users (or “online” semantics per implementation).
- [ ] **Remote cursors**: **A** moves pointer on canvas; **B** sees **A**’s cursor (and vice versa), excluding self.

### Selection & clipboard (sanity)

- [ ] Selection is **local** (marquee/transformer in one browser does not mirror selection to the other).
- [ ] **Copy / Paste** and **Duplicate** behave as designed in one browser without corrupting the other’s view.

**Notes:**

---

## 2. Refresh mid-edit → state restores

- [ ] **A** creates or edits several objects (sticky text, moved shape). **Without** closing the tab, **refresh** `/board`.
- [ ] After reload, objects match what was persisted (allow ~400ms debounce for last geometry/text patches).
- [ ] **B** still sees consistent state if **A** refreshed (no duplicate ghost objects from bad client state).

**Notes:**

---

## 3. Rapid create / move (~2 minutes)

- [ ] For **~2 minutes**, in one or both browsers: add objects, drag, transform, edit text quickly.
- [ ] No **obvious desync** (objects disappearing, stuck half-updated, or wildly wrong positions).
- [ ] Firestore rules smoke line in header stays **OK** (or explain if auth token refresh needed).

**Notes:**

---

## 4. Slow network & reconnect

### Chrome DevTools throttling

1. Open **DevTools** → **Network** → **Throttling**: **Slow 3G** (or **Fast 3G**).
2. Repeat a short subset of §1 (add sticky, drag, edit text).
3. [ ] UI remains usable; eventual consistency acceptable; no hard crashes.

### Offline / reconnect

1. **Airplane mode** or disable Wi‑Fi briefly, or use **Offline** in Network tab.
2. [ ] Note behavior: errors in console, Firestore listener recovery when back online.
3. [ ] After reconnect, board state **converges** (refresh if needed); document any **critical** bug to fix before ship.

**Notes:**

---

## 5. Pass criteria (summary)

| Area | Pass |
|------|------|
| Multiplayer object sync | ☐ |
| Presence / cursors | ☐ |
| Refresh restores Firestore truth | ☐ |
| Stress editing (2 min) acceptable | ☐ |
| Degraded network not a total failure | ☐ |

**Sign-off:** Name / date: _________________________

---

## Related

- [CONFLICTS.md](./CONFLICTS.md) — concurrent edits, LWW.
- [PERF_NOTES.md](./PERF_NOTES.md) — large boards, FPS expectations.
