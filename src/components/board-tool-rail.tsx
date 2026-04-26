"use client";

import { useMemo } from "react";
import {
  type BoardRailToolId,
  useBoardTool,
} from "@/context/board-tool-context";

type ToolButton = {
  id: BoardRailToolId;
  label: string;
  icon: string;
  implemented: boolean;
};

const OTHER_RAIL_TOOLS: ToolButton[] = [
  { id: "draw", label: "Draw", icon: "Dr", implemented: false },
  { id: "pen", label: "Pen", icon: "Pn", implemented: true },
  { id: "highlighter", label: "Highlighter", icon: "Hi", implemented: true },
  { id: "eraser", label: "Eraser", icon: "Er", implemented: true },
  { id: "lasso", label: "Lasso", icon: "Ls", implemented: true },
  { id: "comments", label: "Comments", icon: "Cm", implemented: true },
  { id: "hyperlinks", label: "Hyperlinks", icon: "Ln", implemented: true },
];

type BoardToolRailProps = {
  className?: string;
};

export function BoardToolRail({ className }: BoardToolRailProps) {
  const {
    activeTool,
    setActiveTool,
    openTemplatesModal,
    templatesModalOpen,
    railExpanded,
    setRailExpanded,
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
    const width = railExpanded ? "lg:w-56" : "lg:w-16";
    return `flex shrink-0 flex-col rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 ${width}`;
  }, [railExpanded]);

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

  const toolButtonRow =
    "flex w-full min-h-[44px] touch-manipulation items-center gap-2 rounded-lg border px-2 py-2.5 text-left text-sm transition";

  const content = (shell: string) => (
    <div className={`${shell} ${className ?? ""}`}>
      <div className="flex min-h-[44px] items-center justify-between border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setRailExpanded((v) => !v)}
          className="hidden min-h-9 min-w-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:inline-flex"
          aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {railExpanded ? "<<" : ">>"}
        </button>
        <p
          className={`text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 ${
            railExpanded ? "" : "lg:hidden"
          }`}
        >
          Tools
        </p>
      </div>

      <div className="min-h-0 max-h-[min(50dvh,22rem)] flex-1 space-y-1 overflow-y-auto p-2 lg:max-h-none">
        <button
          type="button"
          onClick={openTemplates}
          className={`${toolButtonRow} ${
            templatesModalOpen
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          aria-label="Templates"
          title="Open template gallery"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-[11px] font-medium dark:border-zinc-600">
            Tp
          </span>
          <span className={`${railExpanded ? "" : "lg:hidden"}`}>Templates</span>
        </button>
        {OTHER_RAIL_TOOLS.map((button) => {
          const selected = activeTool === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => chooseTool(button)}
              className={`${toolButtonRow} ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              aria-label={button.label}
              title={button.label}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-[11px] font-medium dark:border-zinc-600">
                {button.icon}
              </span>
              <span className={`${railExpanded ? "" : "lg:hidden"}`}>
                {button.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={undoToolSelection}
            disabled={!canUndo}
            aria-label="Undo"
            className="min-h-11 min-w-0 touch-manipulation rounded-lg border border-zinc-300 bg-white px-2 py-2.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redoToolSelection}
            disabled={!canRedo}
            aria-label="Redo"
            className="min-h-11 min-w-0 touch-manipulation rounded-lg border border-zinc-300 bg-white px-2 py-2.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Redo
          </button>
        </div>

        {notice ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            {notice}
          </p>
        ) : (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
            Active tool: {activeTool ?? "none"}
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
          >
            Tools
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
