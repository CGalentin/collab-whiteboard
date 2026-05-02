"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { BoardToolGlyph } from "@/components/board-tool-glyphs";
import {
  type BoardRailToolId,
  useBoardTool,
} from "@/context/board-tool-context";

type ToolButton = {
  id: BoardRailToolId;
  label: string;
  implemented: boolean;
};

const OTHER_RAIL_TOOLS: ToolButton[] = [
  { id: "hand", label: "Hand (pan)", implemented: true },
  { id: "pen", label: "Pen", implemented: true },
  { id: "highlighter", label: "Highlighter", implemented: true },
  { id: "eraser", label: "Eraser", implemented: true },
  { id: "lasso", label: "Lasso", implemented: true },
  { id: "hyperlinks", label: "Hyperlinks", implemented: true },
];

type BoardToolRailProps = {
  className?: string;
  /** Creation tools (color, shapes, line, …) rendered under the main rail tools. */
  midRailSlot?: ReactNode;
};

const iconBtnBase =
  "flex h-11 w-full touch-manipulation items-center justify-center rounded-lg border text-zinc-700 transition dark:text-zinc-200";
const iconBtnIdle =
  "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";
const iconBtnOn =
  "border-brand-teal bg-emerald-50 text-brand-teal shadow-sm dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-200";

export function BoardToolRail({ className, midRailSlot }: BoardToolRailProps) {
  const {
    activeTool,
    setActiveTool,
    openTemplatesModal,
    templatesModalOpen,
    mobileOpen,
    setMobileOpen,
    notice,
    setNotice,
    historyCanUndo,
    historyCanRedo,
    requestUndo,
    requestRedo,
  } = useBoardTool();
  const canUndo = historyCanUndo;
  const canRedo = historyCanRedo;

  const desktopShellClass = useMemo(() => {
    return `flex w-14 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/55`;
  }, []);

  const mobileSheetShellClass =
    "flex w-full max-w-full flex-col rounded-t-2xl border border-b-0 border-t border-x border-zinc-200 bg-white/95 shadow-[0_-8px_28px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900/95";

  function isMobileLayout() {
    if (globalThis.matchMedia) {
      return globalThis.matchMedia("(max-width: 1023px)").matches;
    }
    return true;
  }

  function openTemplates() {
    setNotice(null);
    setActiveTool(null);
    openTemplatesModal();
    if (isMobileLayout()) setMobileOpen(false);
  }

  function chooseTool(button: ToolButton) {
    if (!button.implemented) {
      setNotice(`${button.label} is not implemented yet (see roadmap).`);
      return;
    }
    setNotice(null);
    setActiveTool(button.id);
    if (isMobileLayout()) setMobileOpen(false);
  }

  function undoToolSelection() {
    if (!canUndo) {
      setNotice("Undo history is empty.");
      return;
    }
    setNotice(null);
    requestUndo();
  }

  function redoToolSelection() {
    if (!canRedo) {
      setNotice("Redo history is empty.");
      return;
    }
    setNotice(null);
    requestRedo();
  }

  const content = (shell: string) => (
    <div className={`${shell} ${className ?? ""}`}>
      <div className="flex min-h-10 items-center justify-center border-b border-zinc-200 px-1 py-1 dark:border-zinc-800">
        <p className="sr-only">Board tools</p>
      </div>

      <div className="min-h-0 max-h-[min(50dvh,26rem)] flex-1 space-y-1 overflow-y-auto overflow-x-visible p-1.5 lg:max-h-none">
        <button
          type="button"
          onClick={openTemplates}
          className={`${iconBtnBase} ${
            templatesModalOpen ? iconBtnOn : iconBtnIdle
          }`}
          aria-label="Templates"
          title="Templates — open gallery"
        >
          <BoardToolGlyph id="templates" />
        </button>
        {OTHER_RAIL_TOOLS.map((button) => {
          const selected = activeTool === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => chooseTool(button)}
              className={`${iconBtnBase} ${selected ? iconBtnOn : iconBtnIdle}`}
              aria-label={button.label}
              title={button.label}
            >
              <BoardToolGlyph id={button.id} />
            </button>
          );
        })}
        {midRailSlot ? <div className="overflow-x-visible">{midRailSlot}</div> : null}
      </div>

      <div className="space-y-1 border-t border-zinc-200 p-1.5 dark:border-zinc-800">
        <div className="grid grid-cols-1 gap-1">
          <button
            type="button"
            onClick={undoToolSelection}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className={`${iconBtnBase} ${iconBtnIdle} disabled:opacity-40`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10L5 6l4-4M5 6h11a4 4 0 014 4v1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={redoToolSelection}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className={`${iconBtnBase} ${iconBtnIdle} disabled:opacity-40`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4-4-4-4M19 6H8a4 4 0 00-4 4v1" />
            </svg>
          </button>
        </div>

        {notice ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-1 text-[10px] leading-snug text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            {notice}
          </p>
        ) : (
          <p className="truncate text-center text-[10px] text-zinc-500 dark:text-zinc-500" title={activeTool ?? "none"}>
            {activeTool ? activeTool.replace(/-/g, " ") : "—"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{content(desktopShellClass)}</div>

      <div className="lg:hidden">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[55] min-h-0 min-w-0 border-0 bg-zinc-900/35 p-0"
            onClick={() => setMobileOpen(false)}
            aria-label="Close tools"
          />
        ) : null}

        {mobileOpen ? (
          <div
            id="board-tool-drawer"
            className="fixed left-0 right-0 z-[60] max-h-[50dvh] overflow-y-auto sm:left-2 sm:right-2"
            style={{
              bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
            }}
            role="dialog"
            aria-label="Board tools"
          >
            {content(mobileSheetShellClass)}
          </div>
        ) : null}

        <div
          className="fixed bottom-0 left-0 right-0 z-[60] flex min-h-14 items-stretch gap-1 border-t border-zinc-200/90 bg-white/95 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur dark:border-zinc-800/90 dark:bg-zinc-950/95"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex min-h-11 min-w-11 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-zinc-300/90 bg-zinc-50/90 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200"
            aria-expanded={mobileOpen}
            aria-controls="board-tool-drawer"
            title="Tools"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <span className="sr-only">Tools</span>
            <span className="text-sm text-zinc-400" aria-hidden>
              {mobileOpen ? "▾" : "▴"}
            </span>
          </button>
          <p className="flex min-w-0 max-w-[40%] items-center self-center truncate text-center text-xs text-zinc-500 sm:max-w-[50%] dark:text-zinc-500">
            {activeTool
              ? OTHER_RAIL_TOOLS.find((t) => t.id === activeTool)?.label ?? activeTool
              : "—"}
          </p>
        </div>
      </div>
    </>
  );
}
