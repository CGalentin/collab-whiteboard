"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { getFirebaseDb } from "@/lib/firebase";
import { isValidBoardId } from "@/lib/board";

function JoinContent() {
  const params = useParams<{ inviteId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("Joining…");

  const inviteId = params.inviteId ?? "";

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    void (async () => {
      if (!isValidBoardId(inviteId)) {
        if (!cancelled) setStatus("Invalid invite link.");
        return;
      }
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        const invRef = doc(db, "boardInvites", inviteId);
        const invSnap = await getDoc(invRef);
        if (!invSnap.exists()) {
          if (!cancelled) setStatus("This invite is invalid or was revoked.");
          return;
        }
        const inv = invSnap.data() as Record<string, unknown>;
        const boardId =
          typeof inv.boardId === "string" && inv.boardId.trim()
            ? inv.boardId.trim()
            : "";
        if (!boardId || !isValidBoardId(boardId)) {
          if (!cancelled) setStatus("Invite data is invalid.");
          return;
        }

        const memberRef = doc(db, "boards", boardId, "members", user.uid);
        const existingMember = await getDoc(memberRef);
        if (!existingMember.exists()) {
          await setDoc(memberRef, {
            role: "editor",
            inviteId,
            joinedAt: serverTimestamp(),
          });
        }

        const boardSnap = await getDoc(doc(db, "boards", boardId));
        const title =
          boardSnap.exists() &&
          typeof (boardSnap.data() as Record<string, unknown>).title === "string"
            ? String((boardSnap.data() as Record<string, unknown>).title).trim()
            : `Board ${boardId.slice(0, 8)}`;
        const ownerUid =
          boardSnap.exists() &&
          typeof (boardSnap.data() as Record<string, unknown>).ownerUid === "string"
            ? String((boardSnap.data() as Record<string, unknown>).ownerUid)
            : "";

        await setDoc(
          doc(db, "users", user.uid, "boards", boardId),
          {
            boardId,
            ownerUid,
            title: title || `Board ${boardId.slice(0, 8)}`,
            access: "shared",
            role: "editor",
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        if (!cancelled) {
          setStatus("Success — opening board…");
          router.replace(`/board/${boardId}`);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus(
            e instanceof Error ? e.message : "Could not accept this invite.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteId, router, user]);

  if (!user) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <p className="text-sm">{status}</p>
    </main>
  );
}

export default function JoinInvitePage() {
  return (
    <RequireAuth>
      <JoinContent />
    </RequireAuth>
  );
}
