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
        try {
          await batch.commit();
        } catch (batchErr) {
          // If any doc was deleted just before flush (e.g. undo/redo snapshot apply),
          // retry each update individually and ignore missing-doc failures.
          for (const [objectId, payload] of chunk) {
            try {
              await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
                ...payload,
                updatedAt: serverTimestamp(),
              });
            } catch (singleErr) {
              const code =
                typeof singleErr === "object" &&
                singleErr !== null &&
                "code" in singleErr
                  ? String((singleErr as { code?: unknown }).code ?? "")
                  : "";
              if (!code.includes("not-found")) {
                console.error("[objects] patch update failed", singleErr);
              }
            }
          }
          if (
            !(
              typeof batchErr === "object" &&
              batchErr !== null &&
              "code" in batchErr &&
              String((batchErr as { code?: unknown }).code ?? "").includes(
                "not-found",
              )
            )
          ) {
            console.warn("[objects] batch patch fallback used", batchErr);
          }
        }
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

  const flushCommentBodyNow = useCallback(
    async (objectId: string, body: string) => {
      const cur = pendingObjectPatches.current.get(objectId) ?? {};
      pendingObjectPatches.current.delete(objectId);

      const payload = { ...cur, body };
      if (Object.keys(payload).length === 0) return;

      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] flush comment body failed", e);
      }
    },
    [boardId, user],
  );

  /** Immediate patch (e.g. drag end) — avoids debounce flicker on pen/highlighter strokes. */
  const flushObjectPatchNow = useCallback(
    async (objectId: string, patch: Record<string, unknown>) => {
      const cur = pendingObjectPatches.current.get(objectId) ?? {};
      pendingObjectPatches.current.delete(objectId);

      const payload = { ...cur, ...patch };
      if (Object.keys(payload).length === 0) return;

      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] flush object patch failed", e);
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

  /** Immediate fill/stroke (shapes, stickies) — same path as sticky recolor for reliable UI. */
  const setFillStrokeColors = useCallback(
    async (objectId: string, fill: string, stroke: string) => {
      const pending = pendingObjectPatches.current.get(objectId);
      if (pending) {
        delete pending.fill;
        delete pending.stroke;
        if (Object.keys(pending).length === 0) {
          pendingObjectPatches.current.delete(objectId);
        } else {
          pendingObjectPatches.current.set(objectId, pending);
        }
      }
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          fill,
          stroke,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] fill/stroke update failed", e);
      }
    },
    [boardId, user],
  );

  const setStrokeColor = useCallback(
    async (objectId: string, stroke: string) => {
      const pending = pendingObjectPatches.current.get(objectId);
      if (pending) {
        delete pending.stroke;
        if (Object.keys(pending).length === 0) {
          pendingObjectPatches.current.delete(objectId);
        } else {
          pendingObjectPatches.current.set(objectId, pending);
        }
      }
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        await updateDoc(doc(db, "boards", boardId, "objects", objectId), {
          stroke,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] stroke update failed", e);
      }
    },
    [boardId, user],
  );

  return {
    queueObjectPatch,
    queuePosition,
    queueText,
    flushTextNow,
    flushCommentBodyNow,
    flushObjectPatchNow,
    setStickyColors,
    setFillStrokeColors,
    setStrokeColor,
  };
}

export type BoardObjectWrites = ReturnType<typeof useBoardObjectWrites>;
