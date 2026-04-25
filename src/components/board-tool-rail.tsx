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

const TOOL_BUTTONS: ToolButton[] = [
  { id: "templates", label: "Templates", icon: "Tp", implemented: false },
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

  const shellClass = useMemo(() => {
    const width = railExpanded ? "lg:w-56" : "lg:w-16";
    return `flex shrink-0 flex-col rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 ${width}`;
  }, [railExpanded]);

  function chooseTool(button: ToolButton) {
    if (!button.implemented) {
      setNotice(`${button.label} is not implemented yet (see roadmap).`);
      return;
    }
    setNotice(null);
    setActiveTool(button.id);
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

  const content = (
    <div className={`${shellClass} ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setRailExpanded((v) => !v)}
          className="hidden rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:inline-flex"
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

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {TOOL_BUTTONS.map((button) => {
          const selected = activeTool === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => chooseTool(button)}
              className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              aria-label={button.label}
              title={button.label}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-[11px] font-medium dark:border-zinc-600">
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
            className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redoToolSelection}
            disabled={!canRedo}
            aria-label="Redo"
            className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Redo
          </button>
        </div>

        {notice ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
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
      <div className="hidden lg:block">{content}</div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="mb-3 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Toggle tools panel"
        >
          {mobileOpen ? "Hide tools" : "Show tools"}
        </button>
        {mobileOpen ? content : null}
      </div>
    </>
  );
}
