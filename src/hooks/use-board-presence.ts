"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  isPresenceEntryOnline,
  presenceDisplayName,
  PRESENCE_HEARTBEAT_MS,
  type PresenceDocData,
} from "@/lib/presence";

export type OnlinePresenceRow = {
  uid: string;
  displayName: string;
};

function toRows(
  map: Map<string, PresenceDocData>,
  selfUid: string,
): OnlinePresenceRow[] {
  const rows: OnlinePresenceRow[] = [];
  map.forEach((data, uid) => {
    if (!isPresenceEntryOnline(data)) return;
    rows.push({
      uid,
      displayName: presenceDisplayName(data, uid),
    });
  });
  rows.sort((a, b) => {
    if (a.uid === selfUid) return -1;
    if (b.uid === selfUid) return 1;
    return a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    });
  });
  return rows;
}

/**
 * Heartbeat + graceful offline on unmount / page hide.
 * Writes `boards/{boardId}/presence/{uid}` per ARCHITECTURE.md.
 */
export function usePresencePublisher(user: User, boardId: string) {
  useEffect(() => {
    const db = getFirebaseDb();
    const ref = doc(db, "boards", boardId, "presence", user.uid);

    const pulse = async () => {
      try {
        await user.getIdToken();
        await setDoc(
          ref,
          {
            displayName:
              user.displayName?.trim() ||
              user.email?.split("@")[0]?.trim() ||
              "User",
            online: true,
            lastSeen: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        /* ignore transient auth/network errors */
      }
    };

    void pulse();
    const intervalId = window.setInterval(() => {
      void pulse();
    }, PRESENCE_HEARTBEAT_MS);

    const markOffline = () => {
      void (async () => {
        try {
          await user.getIdToken();
          await setDoc(
            ref,
            {
              online: false,
              lastSeen: serverTimestamp(),
            },
            { merge: true },
          );
        } catch {
          /* best effort */
        }
      })();
    };

    const onPageHide = () => {
      markOffline();
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(intervalId);
      markOffline();
    };
  }, [boardId, user]);
}

/**
 * Live subscription to `boards/{boardId}/presence`; derives who counts as online.
 */
export function usePresenceOnlineList(
  boardId: string,
  selfUid: string,
): OnlinePresenceRow[] {
  const [raw, setRaw] = useState<Map<string, PresenceDocData>>(() => new Map());
  const [, setTick] = useState(0);

  useEffect(() => {
    const db = getFirebaseDb();
    const col = collection(db, "boards", boardId, "presence");

    const unsub = onSnapshot(
      col,
      (snap) => {
        const map = new Map<string, PresenceDocData>();
        snap.forEach((d) => {
          map.set(d.id, d.data() as PresenceDocData);
        });
        setRaw(map);
      },
      (err) => {
        console.error("[presence] listen failed", err);
        setRaw(new Map());
      },
    );

    return () => unsub();
  }, [boardId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 5_000);
    return () => window.clearInterval(id);
  }, []);

  return toRows(raw, selfUid);
}
