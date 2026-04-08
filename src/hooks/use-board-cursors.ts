"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  cursorNameFromUser,
  CURSOR_WORLD_EPSILON,
  CURSOR_WRITE_DEBOUNCE_MS,
  isCursorFresh,
  type CursorDocData,
} from "@/lib/cursors";

export type RemoteCursor = {
  uid: string;
  x: number;
  y: number;
  name: string;
};

/**
 * Writes `boards/{boardId}/cursors/{uid}` with Konva **world** x,y (pan/zoom space).
 */
export function useLocalCursorWriter(
  boardId: string,
  user: User,
  containerEl: HTMLElement | null,
  toWorld: (e: PointerEvent) => { x: number; y: number } | null,
) {
  useEffect(() => {
    if (!containerEl) return;

    const db = getFirebaseDb();
    const cursorRef = doc(db, "boards", boardId, "cursors", user.uid);

    const latest = { x: 0, y: 0 };
    let lastWrittenX = Number.NaN;
    let lastWrittenY = Number.NaN;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const writeIfChanged = async () => {
      debounceTimer = null;
      const dx = latest.x - lastWrittenX;
      const dy = latest.y - lastWrittenY;
      if (
        Number.isFinite(lastWrittenX) &&
        Math.hypot(dx, dy) < CURSOR_WORLD_EPSILON
      ) {
        return;
      }
      lastWrittenX = latest.x;
      lastWrittenY = latest.y;
      try {
        await user.getIdToken();
        await setDoc(
          cursorRef,
          {
            x: latest.x,
            y: latest.y,
            name: cursorNameFromUser(user),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        /* ignore */
      }
    };

    const scheduleWrite = () => {
      if (debounceTimer != null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        void writeIfChanged();
      }, CURSOR_WRITE_DEBOUNCE_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      const w = toWorld(e);
      if (!w) return;
      latest.x = w.x;
      latest.y = w.y;
      scheduleWrite();
    };

    const flush = () => {
      if (debounceTimer != null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      void writeIfChanged();
    };

    containerEl.addEventListener("pointermove", onPointerMove, {
      capture: true,
    });
    containerEl.addEventListener("pointerleave", flush);

    return () => {
      containerEl.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      containerEl.removeEventListener("pointerleave", flush);
      if (debounceTimer != null) clearTimeout(debounceTimer);
      void (async () => {
        try {
          await user.getIdToken();
          await deleteDoc(cursorRef);
        } catch {
          /* best effort */
        }
      })();
    };
  }, [boardId, user, containerEl, toWorld]);
}

/**
 * Live peers on `boards/{boardId}/cursors` (excluding self). Refreshes staleness on a timer.
 */
export function useRemoteCursors(
  boardId: string,
  selfUid: string,
): RemoteCursor[] {
  const [raw, setRaw] = useState<Map<string, CursorDocData>>(() => new Map());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const db = getFirebaseDb();
    const col = collection(db, "boards", boardId, "cursors");

    const unsub = onSnapshot(
      col,
      (snap) => {
        const map = new Map<string, CursorDocData>();
        snap.forEach((d) => {
          map.set(d.id, d.data() as CursorDocData);
        });
        setRaw(map);
      },
      (err) => {
        console.error("[cursors] listen failed", err);
        setRaw(new Map());
      },
    );

    return () => unsub();
  }, [boardId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const rows: RemoteCursor[] = [];
    raw.forEach((data, uid) => {
      if (uid === selfUid) return;
      if (!isCursorFresh(data, nowMs)) return;
      const x = typeof data.x === "number" ? data.x : NaN;
      const y = typeof data.y === "number" ? data.y : NaN;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      rows.push({
        uid,
        x,
        y,
        name: data.name?.trim() || `User ${uid.slice(0, 6)}`,
      });
    });
    rows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return rows;
  }, [raw, selfUid, nowMs]);
}
