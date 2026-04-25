"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

/**
 * Opens a board the user may access as **owner** or **member** (editor/viewer).
 * - Owners: create/update `boards/{boardId}` + index under `users/{uid}/boards/{boardId}`.
 * - Members: sync `users/{uid}/boards/{boardId}` from board metadata (first open after invite/owner add).
 */
export async function ensureBoardAccess(user: User, boardId: string) {
  const db = getFirebaseDb();
  const memberRef = doc(db, "boards", boardId, "members", user.uid);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    const data = memberSnap.data() as Record<string, unknown>;
    const role = data.role;
    if (role !== "editor" && role !== "viewer") {
      throw new Error("Invalid membership on this board.");
    }
    const boardRef = doc(db, "boards", boardId);
    const boardSnap = await getDoc(boardRef);
    if (!boardSnap.exists()) {
      throw new Error("Board missing.");
    }
    const boardData = boardSnap.data() as Record<string, unknown>;
    const ownerUid =
      typeof boardData.ownerUid === "string" ? boardData.ownerUid : "";
    if (!ownerUid) {
      throw new Error("Board metadata is invalid.");
    }
    const titleRaw = boardData.title;
    const title =
      typeof titleRaw === "string" && titleRaw.trim()
        ? titleRaw.trim()
        : `Board ${boardId.slice(0, 8)}`;
    const boardIndexRef = doc(db, "users", user.uid, "boards", boardId);
    const now = serverTimestamp();
    await setDoc(
      boardIndexRef,
      {
        boardId,
        ownerUid,
        title,
        access: "shared",
        role,
        updatedAt: now,
      },
      { merge: true },
    );
    return;
  }

  const boardRef = doc(db, "boards", boardId);
  const boardIndexRef = doc(db, "users", user.uid, "boards", boardId);
  const now = serverTimestamp();
  const titleFallback = `Board ${boardId.slice(0, 8)}`;
  const boardTitleForIndex = titleFallback;

  try {
    await updateDoc(boardRef, { updatedAt: now });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code !== "permission-denied" && code !== "not-found") {
      throw e;
    }

    try {
      await setDoc(boardRef, {
        title: titleFallback,
        ownerUid: user.uid,
        createdAt: now,
        updatedAt: now,
      });
    } catch (createErr) {
      const createCode =
        createErr && typeof createErr === "object" && "code" in createErr
          ? String((createErr as { code: string }).code)
          : "";
      if (createCode === "permission-denied") {
        throw new Error(
          "You do not have access to this board. Ask the owner for an invite link or to add you as a collaborator.",
        );
      }
      throw createErr;
    }
  }

  await setDoc(
    boardIndexRef,
    {
      boardId,
      ownerUid: user.uid,
      title: boardTitleForIndex,
      access: "owned",
      updatedAt: now,
      createdAt: now,
    },
    { merge: true },
  );
}

/**
 * @deprecated Prefer {@link ensureBoardAccess} — kept for call sites that create/list owned boards.
 */
export async function ensureOwnedBoard(user: User, boardId: string) {
  return ensureBoardAccess(user, boardId);
}
