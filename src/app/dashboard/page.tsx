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
import { DashboardTemplatesGallery } from "@/components/dashboard-templates-gallery";
import { deleteOwnedBoard, ensureOwnedBoard } from "@/lib/boards-client";

type UserBoardRow = {
  boardId: string;
  title: string;
  updatedAtMs: number | null;
  /** From `users/{uid}/boards/*` — groundwork for future private vs shared folders */
  access: "owned" | "shared";
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

function parseAccess(raw: unknown): "owned" | "shared" {
  return raw === "shared" ? "shared" : "owned";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownedRows = rows.filter((r) => r.access === "owned");
  const sharedRows = rows.filter((r) => r.access === "shared");

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
            access: parseAccess(data.access),
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
      router.push(`/board/${boardId}?nameBoard=1`);
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

  async function handleDeleteBoard(row: UserBoardRow) {
    if (row.access !== "owned" || !user) return;
    const ok = window.confirm(
      `Delete "${row.title}"? All objects on this board will be removed. This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(row.boardId);
    setError(null);
    try {
      await deleteOwnedBoard(user, row.boardId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete board.");
    } finally {
      setDeletingId(null);
    }
  }

  function renderBoardGrid(list: UserBoardRow[], showDelete: boolean) {
    if (list.length === 0) {
      return (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
          {showDelete ? "No boards here yet." : "No shared boards yet."}
        </p>
      );
    }
    return (
      <ul className="mt-3 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((row) => (
          <li key={row.boardId} className="relative">
            <Link
              href={`/board/${row.boardId}`}
              className="flex min-h-[4.5rem] touch-manipulation flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-sm transition hover:border-brand-teal/45 hover:shadow-md hover:ring-1 hover:ring-accent-lavender/25 active:bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/70 active:dark:bg-zinc-900/80 dark:hover:border-accent-violet/35 dark:hover:ring-accent-violet/15"
            >
              <div className="min-w-0 flex-1 pr-8">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
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
            {showDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleDeleteBoard(row);
                }}
                disabled={deletingId === row.boardId}
                className="absolute right-3 top-3 rounded-lg border border-red-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
                title="Delete board"
              >
                {deletingId === row.boardId ? "…" : "Delete"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gradient-to-b from-emerald-50/70 via-white to-zinc-50 px-4 py-5 font-sans text-zinc-900 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-zinc-950 dark:text-zinc-100 sm:px-6 sm:py-6">
      <header className="mx-auto flex w-full max-w-5xl flex-col items-stretch justify-between gap-4 border-b border-brand-teal/10 pb-5 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-violet dark:text-accent-lavender">
            CollabBoard
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Dashboard</p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:justify-start">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex min-h-11 min-w-11 items-center justify-center touch-manipulation rounded-lg border border-brand-teal/25 bg-white px-4 py-2.5 text-sm font-medium text-brand-teal transition hover:border-accent-violet/40 hover:text-accent-violet dark:border-teal-500/30 dark:bg-zinc-900 dark:text-teal-200 dark:hover:border-accent-lavender/40 dark:hover:text-accent-lavender"
          >
            Landing
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-10">
        <DashboardTemplatesGallery user={user} />

        <section className="min-w-0" aria-labelledby="your-boards-heading">
          <h1
            id="your-boards-heading"
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
          >
            Your boards
          </h1>
          <p className="mt-2 break-words text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.displayName ?? user.email ?? user.uid}
          </p>

          <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-3">
            <p className="min-w-0 text-sm text-zinc-600 dark:text-zinc-400">
              Create an empty board or pick a template above.
            </p>
            <button
              type="button"
              onClick={() => void handleCreateBoard()}
              disabled={creating}
              className="min-h-11 w-full touch-manipulation rounded-full bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-hover disabled:opacity-50 sm:w-auto"
            >
              {creating ? "Creating…" : "Create empty board"}
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {loadingRows ? (
            <div className="mt-4 rounded-2xl border border-brand-teal/15 bg-white/90 p-5 text-sm text-zinc-600 shadow-sm ring-1 ring-accent-lavender/15 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400">
              Loading boards…
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-brand-teal/15 bg-white/90 p-5 text-sm text-zinc-600 shadow-sm ring-1 ring-accent-lavender/15 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400">
              No boards yet. Use a <span className="font-medium text-brand-teal dark:text-teal-300">template</span>{" "}
              above or click <span className="font-medium">Create empty board</span>.
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  My boards
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  Boards you own — you can delete them from here.
                </p>
                {renderBoardGrid(ownedRows, true)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Shared with me
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  Boards others invited you to — use Leave on the board page to remove from your list.
                </p>
                {renderBoardGrid(sharedRows, false)}
              </div>
            </div>
          )}
        </section>

        <div className="pb-6">
          <DashboardAiTemplateSection user={user} />
        </div>
      </div>
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
