"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { RequireAuth } from "@/components/require-auth";
import { useAuth, useSignOut } from "@/components/auth-provider";
import { FirestoreRulesSmoke } from "@/components/firestore-rules-smoke";
import { BoardCanvas } from "@/components/board-canvas";
import { AiBoardPanel } from "@/components/ai-board-panel";
import { PresenceSidebar } from "@/components/presence-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { BoardToolRail } from "@/components/board-tool-rail";
import { BoardToolProvider } from "@/context/board-tool-context";
import { BoardSharePanel } from "@/components/board-share-panel";
import { assertBoardId, boardFirestorePath } from "@/lib/board";
import { ensureBoardAccess } from "@/lib/boards-client";
import { getFirebaseDb } from "@/lib/firebase";

function BoardContent() {
  const params = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const signOut = useSignOut();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardOwnerUid, setBoardOwnerUid] = useState<string | null>(null);

  const boardIdRaw = params.boardId ?? "";
  let boardId = "";
  let invalidBoardMessage: string | null = null;
  try {
    boardId = assertBoardId(boardIdRaw);
  } catch (e) {
    invalidBoardMessage =
      e instanceof Error ? e.message : "Invalid board id.";
  }

  useEffect(() => {
    if (invalidBoardMessage) return;
    let cancelled = false;

    void (async () => {
      try {
        if (!cancelled) {
          setReady(false);
          setError(null);
        }
        if (!user) return;
        await user.getIdToken();
        await ensureBoardAccess(user, boardId);
        const boardSnap = await getDoc(doc(getFirebaseDb(), "boards", boardId));
        if (!cancelled && boardSnap.exists()) {
          const d = boardSnap.data() as Record<string, unknown>;
          const ou =
            typeof d.ownerUid === "string" ? d.ownerUid : null;
          if (ou) setBoardOwnerUid(ou);
        }
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to open board.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, invalidBoardMessage, user]);

  if (!user) {
    return null;
  }

  if (invalidBoardMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-sm">{invalidBoardMessage}</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90">
            CollabBoard
          </p>
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500">Board</span>{" "}
            <span
              className="font-mono text-zinc-700 dark:text-zinc-300"
              title={boardFirestorePath(boardId)}
            >
              {boardId}
            </span>
            {" · "}
            <span className="text-zinc-500">
              {user.email ?? user.displayName ?? user.uid}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div
        className="flex shrink-0 flex-col gap-2 border-b border-zinc-200/80 bg-zinc-100/80 px-4 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/30 sm:px-6"
        aria-label="Firestore connectivity"
      >
        <div className="flex flex-wrap items-start gap-3">
          {ready && boardOwnerUid ? (
            <BoardSharePanel user={user} boardId={boardId} ownerUid={boardOwnerUid} />
          ) : null}
          <div className="min-w-0 flex-1">
            {ready ? (
              <FirestoreRulesSmoke
                key={`${user.uid}:${boardId}`}
                userId={user.uid}
                boardId={boardId}
              />
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Preparing board access…
              </p>
            )}
          </div>
        </div>
      </div>

      {!ready ? (
        <main className="flex min-h-0 flex-1 items-center justify-center p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {error ?? "Loading board…"}
          </p>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-5">
          <BoardToolProvider>
            <BoardToolRail />
            <BoardCanvas user={user} boardId={boardId} />
          </BoardToolProvider>

          <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
            <AiBoardPanel user={user} boardId={boardId} />
            <PresenceSidebar user={user} boardId={boardId} />
          </div>
        </main>
      )}
    </div>
  );
}

export default function BoardByIdPage() {
  return (
    <RequireAuth>
      <BoardContent />
    </RequireAuth>
  );
}
