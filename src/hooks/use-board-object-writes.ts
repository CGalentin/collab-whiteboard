"use client";

import { useCallback, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

/** Single debounce for all partial `updateDoc` fields on an object (geometry, text, etc.). */
const OBJECT_PATCH_DEBOUNCE_MS = 400;

/**
 * Debounced, merged `updateDoc` for board objects (PR 13: per-field merge + LWW on same field).
 * Each object id has at most one pending payload; fields are shallow-merged before flush.
 */
export function useBoardObjectWrites(boardId: string, user: User) {
  const objectTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pendingObjectPatches = useRef<Map<string, Record<string, unknown>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = objectTimers.current;
    const pending = pendingObjectPatches.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      pending.clear();
    };
  }, []);

  const queueObjectPatch = useCallback(
    (objectId: string, patch: Record<string, unknown>) => {
      const merged = {
        ...(pendingObjectPatches.current.get(objectId) ?? {}),
        ...patch,
      };
      pendingObjectPatches.current.set(objectId, merged);

      const prevT = objectTimers.current.get(objectId);
      if (prevT) clearTimeout(prevT);
      const t = setTimeout(() => {
        objectTimers.current.delete(objectId);
        const payload = pendingObjectPatches.current.get(objectId);
        pendingObjectPatches.current.delete(objectId);
        if (!payload || Object.keys(payload).length === 0) return;
        void (async () => {
          try {
            await user.getIdToken();
            const db = getFirebaseDb();
            await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
              ...payload,
              updatedAt: serverTimestamp(),
            });
          } catch (e) {
            console.error("[objects] patch update failed", e);
          }
        })();
      }, OBJECT_PATCH_DEBOUNCE_MS);
      objectTimers.current.set(objectId, t);
    },
    [boardId, user],
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
      const prevT = objectTimers.current.get(objectId);
      if (prevT) clearTimeout(prevT);
      objectTimers.current.delete(objectId);

      const cur = pendingObjectPatches.current.get(objectId) ?? {};
      pendingObjectPatches.current.delete(objectId);
      const payload = { ...cur, text };

      await user.getIdToken();
      const db = getFirebaseDb();
      await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
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
