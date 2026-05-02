"use client";

import type { User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { ensureOwnedBoard } from "@/lib/boards-client";
import {
  applyTemplate,
  BOARD_TEMPLATE_CATALOG,
  type BoardTemplateId,
} from "@/lib/board-templates";

type DashboardTemplatesGalleryProps = {
  user: User;
};

/**
 * Dashboard entry point for deterministic templates (new board + {@link applyTemplate}).
 * Board title is set from the template name for a clearer list until richer naming ships.
 */
export function DashboardTemplatesGallery({ user }: DashboardTemplatesGalleryProps) {
  const router = useRouter();
  const [applying, setApplying] = useState<BoardTemplateId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createFromTemplate(templateId: BoardTemplateId, displayTitle: string) {
    setError(null);
    setApplying(templateId);
    const boardId = crypto.randomUUID();
    try {
      await ensureOwnedBoard(user, boardId);
      await applyTemplate(user, boardId, templateId);
      const db = getFirebaseDb();
      const now = serverTimestamp();
      await updateDoc(doc(db, "boards", boardId), { title: displayTitle, updatedAt: now });
      await updateDoc(doc(db, "users", user.uid, "boards", boardId), {
        title: displayTitle,
        updatedAt: now,
      });
      router.push(`/board/${boardId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create board from template.");
    } finally {
      setApplying(null);
    }
  }

  return (
    <section
      className="rounded-2xl border border-brand-teal/15 bg-white/90 p-4 shadow-sm ring-1 ring-accent-lavender/20 dark:border-white/10 dark:bg-zinc-900/70 dark:ring-accent-violet/15 sm:p-6"
      aria-labelledby="dashboard-templates-heading"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="dashboard-templates-heading"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Template gallery
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Start a <span className="font-medium text-brand-teal dark:text-teal-300">new board</span> with a preset
            layout. You can edit everything on the canvas after it opens.
          </p>
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-5 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {BOARD_TEMPLATE_CATALOG.map((entry) => {
          const busy = applying !== null;
          const isThis = applying === entry.id;
          return (
            <li key={entry.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createFromTemplate(entry.id, entry.title)}
                className="flex h-full min-h-[7.5rem] w-full touch-manipulation flex-col rounded-xl border border-zinc-200/90 bg-gradient-to-br from-white to-emerald-50/40 p-4 text-left transition hover:border-brand-teal/50 hover:shadow-md hover:ring-1 hover:ring-accent-lavender/30 disabled:opacity-50 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950/80 dark:hover:border-accent-violet/40 dark:hover:ring-accent-violet/20"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {isThis ? "Creating…" : entry.title}
                </span>
                <span className="mt-2 flex-1 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  {entry.description}
                </span>
                <span className="mt-3 text-xs font-medium text-accent-violet dark:text-accent-lavender">
                  {isThis ? "Please wait" : "Use template →"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
