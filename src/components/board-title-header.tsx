"use client";

import type { User } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { defaultBoardTitle, isDefaultBoardTitle } from "@/lib/board";
import { updateBoardTitleAsOwner } from "@/lib/boards-client";

type BoardTitleHeaderProps = {
  user: User;
  boardId: string;
  boardOwnerUid: string | null;
  boardTitle: string;
  ready: boolean;
};

function stripNameBoardSearch(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete("nameBoard");
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function BoardTitleHeader({
  user,
  boardId,
  boardOwnerUid,
  boardTitle,
  ready,
}: BoardTitleHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const nameModalLabelId = useId();

  const isOwner = Boolean(boardOwnerUid && boardOwnerUid === user.uid);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const didPrefillNameModal = useRef(false);

  const closeNameModal = useCallback(() => {
    setNameModalOpen(false);
    setNameError(null);
    didPrefillNameModal.current = false;
    const next = stripNameBoardSearch(pathname, searchParams.toString());
    router.replace(next);
  }, [router, pathname, searchParams]);

  useEffect(() => {
    if (!ready || !isOwner) return;
    if (searchParams.get("nameBoard") !== "1") {
      setNameModalOpen(false);
      didPrefillNameModal.current = false;
      return;
    }
    setNameModalOpen(true);
    if (!didPrefillNameModal.current) {
      didPrefillNameModal.current = true;
      setNameDraft(isDefaultBoardTitle(boardId, boardTitle) ? "" : boardTitle);
    }
  }, [ready, isOwner, searchParams, boardId, boardTitle]);

  async function commitTitle(next: string) {
    await updateBoardTitleAsOwner(user, boardId, next);
  }

  async function handleNameModalSave(e: React.FormEvent) {
    e.preventDefault();
    const t = nameDraft.trim();
    if (!t) {
      setNameError("Enter a name, or skip for now.");
      return;
    }
    setNameBusy(true);
    setNameError(null);
    try {
      await commitTitle(t);
      closeNameModal();
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save title.");
    } finally {
      setNameBusy(false);
    }
  }

  function handleNameModalSkip() {
    closeNameModal();
  }

  function startRename() {
    setRenameDraft(boardTitle);
    setRenameError(null);
    setEditing(true);
  }

  function cancelRename() {
    setEditing(false);
    setRenameError(null);
  }

  async function saveRename(e: React.FormEvent) {
    e.preventDefault();
    const t = renameDraft.trim();
    if (!t) {
      setRenameError("Title cannot be empty.");
      return;
    }
    setRenameBusy(true);
    setRenameError(null);
    try {
      await commitTitle(t);
      setEditing(false);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Could not save title.");
    } finally {
      setRenameBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-violet dark:text-accent-lavender">
          CollabBoard
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Loading board…</p>
      </div>
    );
  }

  return (
    <>
      {nameModalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[1px]"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) handleNameModalSkip();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={nameModalLabelId}
            className="w-full max-w-md rounded-2xl border border-brand-teal/20 bg-white p-5 shadow-xl ring-1 ring-accent-lavender/25 dark:border-white/10 dark:bg-zinc-900 dark:ring-accent-violet/20"
            onMouseDown={(ev) => ev.stopPropagation()}
          >
            <h2 id={nameModalLabelId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Name your board
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {isDefaultBoardTitle(boardId, boardTitle)
                ? `This board is still “${defaultBoardTitle(boardId)}”. Pick a name you’ll recognize on your dashboard.`
                : "Update the name shown on your dashboard."}
            </p>
            <form onSubmit={(ev) => void handleNameModalSave(ev)} className="mt-4 space-y-3">
              <label htmlFor="board-name-modal-input" className="sr-only">
                Board name
              </label>
              <input
                id="board-name-modal-input"
                type="text"
                value={nameDraft}
                onChange={(ev) => setNameDraft(ev.target.value)}
                maxLength={120}
                autoFocus
                placeholder="e.g. Sprint 24 planning"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
              {nameError ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {nameError}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleNameModalSkip}
                  disabled={nameBusy}
                  className="min-h-11 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={nameBusy || !nameDraft.trim()}
                  className="min-h-11 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {nameBusy ? "Saving…" : "Save name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-violet dark:text-accent-lavender">
          CollabBoard
        </p>

        {editing && isOwner ? (
          <form
            onSubmit={(ev) => void saveRename(ev)}
            className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
          >
            <label htmlFor="board-rename-input" className="sr-only">
              Board title
            </label>
            <input
              id="board-rename-input"
              type="text"
              value={renameDraft}
              onChange={(ev) => setRenameDraft(ev.target.value)}
              maxLength={120}
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base font-semibold text-zinc-900 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={cancelRename}
                disabled={renameBusy}
                className="min-h-10 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renameBusy || !renameDraft.trim()}
                className="min-h-10 rounded-lg bg-brand-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-teal-hover disabled:opacity-50"
              >
                {renameBusy ? "Saving…" : "Save"}
              </button>
            </div>
            {renameError ? (
              <p className="w-full text-sm text-red-600 dark:text-red-400 sm:order-last" role="alert">
                {renameError}
              </p>
            ) : null}
          </form>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 max-w-[min(100%,42rem)] truncate text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {boardTitle}
            </h1>
            {isOwner ? (
              <button
                type="button"
                onClick={startRename}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-teal/30 px-2.5 py-1 text-xs font-medium text-brand-teal transition hover:border-accent-violet/40 hover:text-accent-violet dark:border-teal-500/40 dark:text-teal-300 dark:hover:border-accent-lavender/50 dark:hover:text-accent-lavender"
                aria-label="Rename board"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Rename
              </button>
            ) : null}
          </div>
        )}

        <p className="mt-1 min-w-0 break-words text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-500 dark:text-zinc-500">User</span>{" "}
          <span className="text-zinc-800 dark:text-zinc-200">
            {user.email ?? user.displayName ?? user.uid}
          </span>
          {!isOwner ? (
            <span className="text-zinc-500 dark:text-zinc-500"> · Viewing as collaborator</span>
          ) : null}
        </p>
      </div>
    </>
  );
}
