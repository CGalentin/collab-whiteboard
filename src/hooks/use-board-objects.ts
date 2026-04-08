"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  parseBoardObject,
  sortBoardObjects,
  type BoardObject,
} from "@/lib/board-object";

/**
 * Live list from `boards/{boardId}/objects`, sorted for paint order.
 */
export function useBoardObjects(boardId: string): BoardObject[] {
  const [list, setList] = useState<BoardObject[]>([]);

  useEffect(() => {
    const db = getFirebaseDb();
    const col = collection(db, "boards", boardId, "objects");

    const unsub = onSnapshot(
      col,
      (snap) => {
        const next: BoardObject[] = [];
        snap.forEach((docSnap) => {
          const parsed = parseBoardObject(docSnap.id, docSnap.data() as Record<string, unknown>);
          if (parsed) next.push(parsed);
        });
        next.sort(sortBoardObjects);
        setList(next);
      },
      (err) => {
        console.error("[objects] listen failed", err);
        setList([]);
      },
    );

    return () => unsub();
  }, [boardId]);

  return list;
}
