"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { useAuth, useSignOut } from "@/components/auth-provider";
import { FirestoreRulesSmoke } from "@/components/firestore-rules-smoke";
import { BoardCanvas } from "@/components/board-canvas";
import { PresenceSidebar } from "@/components/presence-sidebar";
import { DEMO_BOARD_FIRESTORE_PATH, DEMO_BOARD_ID } from "@/lib/board";

function BoardContent() {
  const { user } = useAuth();
  const signOut = useSignOut();

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">
            CollabBoard
          </p>
          <p className="truncate text-sm text-zinc-400">
            <span className="text-zinc-500">Shared board</span>{" "}
            <span
              className="font-mono text-zinc-300"
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
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div
        className="flex shrink-0 items-center border-b border-zinc-800/80 bg-zinc-900/30 px-4 py-2 sm:px-6"
        aria-label="Firestore connectivity"
      >
        <FirestoreRulesSmoke key={user.uid} userId={user.uid} />
      </div>

      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-5">
        <BoardCanvas user={user} />

        <PresenceSidebar user={user} />
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
