"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

type SmokeState =
  | { kind: "running" }
  | { kind: "ok" }
  | { kind: "err"; message: string };

/**
 * One write + read under `boards/{boardId}/**` to confirm published rules
 * allow authenticated access (see PR 05 / BUILD_ROADMAP).
 * Remount with `key={userId}` when the signed-in user changes.
 */
export function FirestoreRulesSmoke({
  userId,
  boardId,
}: {
  userId: string;
  boardId: string;
}) {
  const [state, setState] = useState<SmokeState>({ kind: "running" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const auth = getFirebaseAuth();
      const u = auth.currentUser;
      if (!u || u.uid !== userId) {
        if (!cancelled) {
          setState({
            kind: "err",
            message: "Not signed in — refresh or sign in again.",
          });
        }
        return;
      }
      try {
        await u.getIdToken();
      } catch {
        if (!cancelled) {
          setState({
            kind: "err",
            message: "Could not refresh auth token.",
          });
        }
        return;
      }

      const db = getFirebaseDb();
      const ref = doc(
        db,
        "boards",
        boardId,
        "_pr05_smoke",
        userId,
      );
      try {
        await setDoc(
          ref,
          {
            checkedAt: serverTimestamp(),
            tag: "pr05-rules-smoke",
          },
          { merge: true },
        );
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (!snap.exists()) {
          setState({
            kind: "err",
            message: "Write succeeded but read returned no document.",
          });
          return;
        }
        setState({ kind: "ok" });
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Firestore request failed.";
        setState({ kind: "err", message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [boardId, userId]);

  if (state.kind === "running") {
    return (
      <p
        className="text-xs text-zinc-500 dark:text-zinc-500"
        aria-live="polite"
      >
        Checking Firestore rules…
      </p>
    );
  }

  if (state.kind === "ok") {
    return (
      <p
        className="text-xs text-emerald-700 dark:text-emerald-400/90"
        aria-live="polite"
      >
        Firestore: authenticated read/write OK (
        <span className="font-mono text-emerald-800 dark:text-emerald-500/90">
          boards/{boardId}/…
        </span>
        )
      </p>
    );
  }

  return (
    <p
      className="text-xs text-red-600 dark:text-red-400"
      role="alert"
    >
      Firestore smoke test failed: {state.message}
    </p>
  );
}
