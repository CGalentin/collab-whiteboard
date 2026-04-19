"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { useAuth, useSignOut } from "@/components/auth-provider";
import { FirestoreRulesSmoke } from "@/components/firestore-rules-smoke";
import { BoardCanvas } from "@/components/board-canvas";
import { AiBoardPanel } from "@/components/ai-board-panel";
import { PresenceSidebar } from "@/components/presence-sidebar";
import { DEMO_BOARD_FIRESTORE_PATH, DEMO_BOARD_ID } from "@/lib/board";
import { ThemeToggle } from "@/components/theme-toggle";

function BoardContent() {
  const { user } = useAuth();
  const signOut = useSignOut();

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90">
            CollabBoard
          </p>
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500">Shared board</span>{" "}
            <span
              className="font-mono text-zinc-700 dark:text-zinc-300"
              title={DEMO_BOARD_FIRESTORE_PATH}
            >
              {DEMO_BOARD_ID}
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
            href="/"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Home
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
        className="flex shrink-0 items-center border-b border-zinc-200/80 bg-zinc-100/80 px-4 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/30 sm:px-6"
        aria-label="Firestore connectivity"
      >
        <FirestoreRulesSmoke key={user.uid} userId={user.uid} />
      </div>

      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-5">
        <BoardCanvas user={user} />

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <AiBoardPanel user={user} />
          <PresenceSidebar user={user} />
        </div>
      </main>
    </div>
  );
}

export default function BoardPage() {
  return (
    <RequireAuth>
      <BoardContent />
    </RequireAuth>
  );
}
