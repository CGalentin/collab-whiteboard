"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  type Timestamp,
  where,
} from "firebase/firestore";
import { RequireAuth } from "@/components/require-auth";
import { useAuth, useSignOut } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFirebaseDb } from "@/lib/firebase";
import { DashboardAiTemplateSection } from "@/components/dashboard-ai-template-section";
import { ensureOwnedBoard } from "@/lib/boards-client";

type UserBoardRow = {
  boardId: string;
  title: string;
  updatedAtMs: number | null;
};

function toMs(value: unknown): number | null {
  if (!value) return null;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as Timestamp).toMillis === "function"
  ) {
    return (value as Timestamp).toMillis();
  }
  return null;
}

function sortRowsByUpdatedDesc(rows: UserBoardRow[]): UserBoardRow[] {
  return [...rows].sort((a, b) => {
    const am = a.updatedAtMs ?? 0;
    const bm = b.updatedAtMs ?? 0;
    return bm - am;
  });
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const signOut = useSignOut();
  const [rows, setRows] = useState<UserBoardRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    let secondaryUnsub: (() => void) | null = null;

    const parseRows = (snap: { docs: Array<{ id: string; data: () => unknown }> }) =>
      sortRowsByUpdatedDesc(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            boardId: d.id,
            title:
              typeof data.title === "string" && data.title.trim()
                ? data.title.trim()
                : `Board ${d.id.slice(0, 8)}`,
            updatedAtMs: toMs(data.updatedAt),
          };
        }),
      );

    const userIndexQuery = query(collection(db, "users", user.uid, "boards"));

    const primaryUnsub = onSnapshot(
      userIndexQuery,
      (snap) => {
        setRows(parseRows(snap));
        setLoadingRows(false);
        setError(null);
      },
      (e: unknown) => {
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";

        if (code !== "permission-denied") {
          console.error("[dashboard] user board index listen failed", e);
          setError("Could not load your boards.");
          setRows([]);
          setLoadingRows(false);
          return;
        }

        // Fallback for environments where `users/{uid}/boards/*` rules are not deployed yet.
        const byOwnerQuery = query(
          collection(db, "boards"),
          where("ownerUid", "==", user.uid),
        );
        secondaryUnsub = onSnapshot(
          byOwnerQuery,
          (snap) => {
            setRows(parseRows(snap));
            setLoadingRows(false);
            setError(null);
          },
          (fallbackErr) => {
            console.error("[dashboard] fallback board list listen failed", fallbackErr);
            setError("Could not load your boards.");
            setRows([]);
            setLoadingRows(false);
          },
        );
      },
    );

    return () => {
      primaryUnsub();
      if (secondaryUnsub) secondaryUnsub();
    };
  }, [user]);

  async function handleCreateBoard() {
    if (!user || creating) return;
    setCreating(true);
    setError(null);
    const boardId = crypto.randomUUID();
    try {
      await ensureOwnedBoard(user, boardId);
      router.push(`/board/${boardId}`);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code: string }).code)
          : "";
      if (code === "permission-denied") {
        setError("Permission denied creating board. Re-deploy Firestore rules and refresh.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to create board.");
      }
    } finally {
      setCreating(false);
    }
  }

  function formatWhen(ms: number | null): string {
    if (!ms) return "Recently";
    return new Date(ms).toLocaleString();
  }

  if (!user) return null;

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-zinc-50 px-4 py-5 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 sm:py-6">
      <header className="mx-auto flex w-full max-w-5xl flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90">
            CollabBoard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your boards</h1>
          <p className="mt-1 break-words text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.email ?? user.displayName ?? user.uid}
          </p>
        </div>
        <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:justify-start">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex min-h-11 min-w-11 items-center justify-center touch-manipulation rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Landing
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto mt-5 w-full max-w-5xl">
        <DashboardAiTemplateSection user={user} />
      </div>

      <section className="mx-auto mt-5 w-full min-w-0 max-w-5xl">
        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-3">
          <p className="min-w-0 text-sm text-zinc-600 dark:text-zinc-400">
            Create a board or reopen an existing one.
          </p>
          <button
            type="button"
            onClick={() => void handleCreateBoard()}
            disabled={creating}
            className="min-h-11 w-full touch-manipulation rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
          >
            {creating ? "Creating…" : "Create board"}
          </button>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {loadingRows ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            Loading boards…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No boards yet. Click <span className="font-medium">Create board</span> to start.
          </div>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <li key={row.boardId}>
                <Link
                  href={`/board/${row.boardId}`}
                  className="flex min-h-[4.5rem] touch-manipulation flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50/80 transition hover:border-emerald-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 active:dark:bg-zinc-900/80 dark:hover:border-emerald-900/60"
                >
                  <div>
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {row.title}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-500">
                      {row.boardId}
                    </p>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
                    Updated {formatWhen(row.updatedAtMs)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
