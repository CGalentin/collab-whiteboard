"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "firebase/auth";
import { useBoardTool } from "@/context/board-tool-context";
import {
  applyTemplate,
  BOARD_TEMPLATE_CATALOG,
  type BoardTemplateId,
} from "@/lib/board-templates";

type BoardTemplatesModalProps = {
  user: User;
  boardId: string;
  open: boolean;
  onClose: () => void;
  /** Run immediately before Firestore writes so undo can restore prior board. */
  onBeforeApply: () => void;
};

/**
 * Subscribes to tool context and portals the template modal. Must render under `BoardToolProvider`
 * (same as `BoardToolRail`); using `useBoardTool()` here avoids a nullable optional context in `board-canvas`.
 */
export function BoardCanvasTemplatesModalPortal({
  user,
  boardId,
  onBeforeApply,
}: {
  user: User;
  boardId: string;
  onBeforeApply: () => void;
}) {
  const { templatesModalOpen, closeTemplatesModal } = useBoardTool();
  if (typeof document === "undefined") return null;
  return createPortal(
    <BoardTemplatesModal
      user={user}
      boardId={boardId}
      open={templatesModalOpen}
      onClose={closeTemplatesModal}
      onBeforeApply={onBeforeApply}
    />,
    document.body,
  );
}

export function BoardTemplatesModal({
  user,
  boardId,
  open,
  onClose,
  onBeforeApply,
}: BoardTemplatesModalProps) {
  const [applying, setApplying] = useState<BoardTemplateId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setApplying(null);
      setError(null);
      return;
    }
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const handleApply = useCallback(
    async (templateId: BoardTemplateId) => {
      setError(null);
      setApplying(templateId);
      try {
        onBeforeApply();
        await applyTemplate(user, boardId, templateId);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not apply template.");
      } finally {
        setApplying(null);
      }
    },
    [user, boardId, onBeforeApply, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-templates-title"
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="board-templates-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Templates
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Adds layout objects to this board. You can undo afterward.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Close templates"
          >
            Close
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
          {BOARD_TEMPLATE_CATALOG.map((entry) => {
            const busy = applying !== null;
            const isThis = applying === entry.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleApply(entry.id)}
                  className="flex h-full w-full flex-col rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-left transition hover:border-emerald-400/80 hover:bg-emerald-50/50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {isThis ? "Applying…" : entry.title}
                  </span>
                  <span className="mt-1 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                    {entry.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
