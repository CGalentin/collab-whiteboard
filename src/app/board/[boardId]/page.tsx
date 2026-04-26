"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
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

const BOARD_ASIDE_EXPANDED_KEY = "collab-board-aside-expanded";

function BoardContent() {
  const params = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const signOut = useSignOut();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardOwnerUid, setBoardOwnerUid] = useState<string | null>(null);
  const [asideExpanded, setAsideExpanded] = useState(true);

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(BOARD_ASIDE_EXPANDED_KEY) === "0") {
        queueMicrotask(() => {
          setAsideExpanded(false);
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setAsideExpandedPersist = useCallback((next: boolean) => {
    setAsideExpanded(next);
    try {
      localStorage.setItem(BOARD_ASIDE_EXPANDED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

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

  const focusAiAssistant = useCallback(() => {
    setAsideExpandedPersist(true);
    requestAnimationFrame(() => {
      document.getElementById("board-ai-assistant")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      requestAnimationFrame(() => {
        document.getElementById("ai-prompt")?.focus();
      });
    });
  }, [setAsideExpandedPersist]);

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
      <header className="flex w-full min-w-0 max-w-full shrink-0 flex-col items-stretch justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90">
            CollabBoard
          </p>
          <p className="min-w-0 break-words text-sm text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500">Board</span>{" "}
            <span
              className="font-mono text-sm text-zinc-700 dark:text-zinc-300"
              title={boardFirestorePath(boardId)}
            >
              {boardId}
            </span>{" "}
            <span className="text-zinc-500">·</span>{" "}
            <span>
              {user.email ?? user.displayName ?? user.uid}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 self-stretch sm:gap-3 sm:self-center">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 min-w-11 items-center touch-manipulation justify-center rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-11 min-w-11 touch-manipulation rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
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
            <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col gap-3 max-lg:pb-[calc(3.5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] lg:order-1 lg:pb-0 lg:flex-row lg:gap-4">
              <BoardToolRail />
              <BoardCanvas
                user={user}
                boardId={boardId}
                onRequestAiAssistant={focusAiAssistant}
              />
            </div>
          </BoardToolProvider>

          <aside
            id="board-page-aside"
            className={`order-1 flex shrink-0 flex-col gap-3 lg:order-2 ${
              asideExpanded ? "w-full lg:w-80" : "w-full lg:w-12"
            }`}
          >
            {asideExpanded ? (
              <>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50/90 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Assistant & presence
                  </span>
                  <button
                    type="button"
                    onClick={() => setAsideExpandedPersist(false)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    aria-expanded="true"
                    aria-controls="board-page-aside"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                    Hide
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div id="board-ai-assistant" className="scroll-mt-24">
                    <AiBoardPanel user={user} boardId={boardId} />
                  </div>
                  <PresenceSidebar user={user} boardId={boardId} />
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAsideExpandedPersist(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 lg:flex lg:min-h-[min(50vh,360px)] lg:w-full lg:flex-col lg:gap-3 lg:px-1.5 lg:py-4 lg:text-xs"
                aria-expanded="false"
                aria-controls="board-page-aside"
              >
                <svg
                  className="h-4 w-4 shrink-0 lg:order-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
                <span className="lg:hidden">Show assistant & presence</span>
                <span
                  className="hidden select-none text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 lg:block"
                  style={{ writingMode: "vertical-rl" }}
                >
                  AI · People
                </span>
              </button>
            )}
          </aside>
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
