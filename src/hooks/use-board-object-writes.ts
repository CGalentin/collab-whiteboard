"use client";

import { useCallback, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import {
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

/** Trailing debounce for merged patches; one timer batches all pending object ids (PR 17). */
const OBJECT_PATCH_DEBOUNCE_MS = 400;

/** Firestore batch limit is 500 ops; stay under for safety. */
const BATCH_CHUNK_SIZE = 400;

/**
 * Debounced, merged `updateDoc` for board objects (PR 13: per-field merge + LWW on same field).
 * PR 17: **single** debounce timer + **`writeBatch`** so rapid edits across multiple objects
 * share fewer round-trips when the flush window fires together.
 */
export function useBoardObjectWrites(boardId: string, user: User) {
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingObjectPatches = useRef<Map<string, Record<string, unknown>>>(
    new Map(),
  );

  useEffect(() => {
    const pending = pendingObjectPatches.current;
    return () => {
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      pending.clear();
    };
  }, []);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const commitPendingBatch = useCallback(async () => {
    const pending = pendingObjectPatches.current;
    if (pending.size === 0) return;

    const entries = [...pending.entries()].filter(
      ([, payload]) => payload && Object.keys(payload).length > 0,
    );
    pending.clear();

    if (entries.length === 0) return;

    try {
      await user.getIdToken();
      const db = getFirebaseDb();

      for (let i = 0; i < entries.length; i += BATCH_CHUNK_SIZE) {
        const chunk = entries.slice(i, i + BATCH_CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const [objectId, payload] of chunk) {
          batch.update(doc(db, "boards", boardId, "objects", objectId), {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    } catch (e) {
      console.error("[objects] batch patch update failed", e);
    }
  }, [boardId, user]);

  const scheduleFlush = useCallback(() => {
    clearFlushTimer();
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void commitPendingBatch();
    }, OBJECT_PATCH_DEBOUNCE_MS);
  }, [clearFlushTimer, commitPendingBatch]);

  const queueObjectPatch = useCallback(
    (objectId: string, patch: Record<string, unknown>) => {
      const merged = {
        ...(pendingObjectPatches.current.get(objectId) ?? {}),
        ...patch,
      };
      pendingObjectPatches.current.set(objectId, merged);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const queuePosition = useCallback(
    (objectId: string, x: number, y: number) => {
      queueObjectPatch(objectId, { x, y });
    },
    [queueObjectPatch],
  );

  const queueText = useCallback(
    (objectId: string, text: string) => {
      queueObjectPatch(objectId, { text });
    },
    [queueObjectPatch],
  );

  const flushTextNow = useCallback(
    async (objectId: string, text: string) => {
      const cur = pendingObjectPatches.current.get(objectId) ?? {};
      pendingObjectPatches.current.delete(objectId);

      const payload = { ...cur, text };
      if (Object.keys(payload).length === 0) return;

      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] flush text failed", e);
      }
    },
    [boardId, user],
  );

  const setStickyColors = useCallback(
    async (objectId: string, fill: string, stroke: string) => {
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          fill,
          stroke,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] sticky colors update failed", e);
      }
    },
    [boardId, user],
  );

  return {
    queueObjectPatch,
    queuePosition,
    queueText,
    flushTextNow,
    setStickyColors,
  };
}

export type BoardObjectWrites = ReturnType<typeof useBoardObjectWrites>;
