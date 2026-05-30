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
  "flex min-h-11 w-full touch-manipulation items-center rounded-lg border text-zinc-700 transition dark:text-zinc-200";
const iconBtnIdle =
  "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";
const iconBtnOn =
  "border-brand-teal bg-emerald-50 text-brand-teal shadow-sm dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-200";

function isMobileLayout() {
  if (globalThis.matchMedia) {
    return globalThis.matchMedia("(max-width: 1023px)").matches;
  }
  return true;
}

export function BoardToolRail({ className, midRailSlot }: BoardToolRailProps) {
  const {
    activeTool,
    setActiveTool,
    openTemplatesModal,
    closeTemplatesModal,
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

  const closeMobileIfNeeded = () => {
    if (isMobileLayout()) setMobileOpen(false);
  };

  const desktopShellClass = useMemo(() => {
    return `flex w-14 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/55`;
  }, []);

  const mobilePanelShellClass =
    "flex h-full min-h-0 w-full flex-col border-r border-zinc-200 bg-white/98 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/98";

  const activeToolLabel =
    activeTool === null
      ? "Select"
      : (OTHER_RAIL_TOOLS.find((t) => t.id === activeTool)?.label ??
        activeTool.replace(/-/g, " "));

  function openTemplates() {
    setNotice(null);
    setActiveTool(null);
    openTemplatesModal();
    closeMobileIfNeeded();
  }

  function chooseTool(button: ToolButton) {
    if (!button.implemented) {
      setNotice(`${button.label} is not implemented yet (see roadmap).`);
      return;
    }
    setNotice(null);
    if (activeTool === button.id) {
      setActiveTool(null);
    } else {
      setActiveTool(button.id);
    }
    closeMobileIfNeeded();
  }

  function chooseSelectMode() {
    setNotice(null);
    closeTemplatesModal();
    setActiveTool(null);
    closeMobileIfNeeded();
  }

  function undoToolSelection() {
    if (!canUndo) {
      setNotice("Undo history is empty.");
      return;
    }
    setNotice(null);
    requestUndo();
    closeMobileIfNeeded();
  }

  function redoToolSelection() {
    if (!canRedo) {
      setNotice("Redo history is empty.");
      return;
    }
    setNotice(null);
    requestRedo();
    closeMobileIfNeeded();
  }

  const renderToolButton = (
    button: ToolButton | { id: "templates" | "select"; label: string },
    selected: boolean,
    onClick: () => void,
    glyphId: Parameters<typeof BoardToolGlyph>[0]["id"],
    mobileLabeled = false,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`${iconBtnBase} ${selected ? iconBtnOn : iconBtnIdle} ${
        mobileLabeled ? "justify-start gap-2.5 px-2.5" : "justify-center"
      }`}
      aria-label={button.label}
      title={button.label}
    >
      <BoardToolGlyph id={glyphId} className="h-5 w-5 shrink-0" />
      {mobileLabeled ? (
        <span className="truncate text-left text-xs font-medium">{button.label}</span>
      ) : null}
    </button>
  );

  const content = (shell: string, mobileLabeled = false) => (
    <div className={`${shell} ${className ?? ""}`}>
      <div className="flex min-h-10 shrink-0 items-center justify-center border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {mobileLabeled ? "Tools" : <span className="sr-only">Board tools</span>}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-visible p-1.5">
        {renderToolButton(
          { id: "templates", label: "Templates" },
          templatesModalOpen,
          openTemplates,
          "templates",
          mobileLabeled,
        )}
        {renderToolButton(
          { id: "select", label: "Select" },
          activeTool === null && !templatesModalOpen,
          chooseSelectMode,
          "select",
          mobileLabeled,
        )}
        {OTHER_RAIL_TOOLS.map((button) => (
          <span key={button.id}>
            {renderToolButton(
              button,
              activeTool === button.id,
              () => chooseTool(button),
              button.id,
              mobileLabeled,
            )}
          </span>
        ))}
        {midRailSlot ? (
          <div className="overflow-x-visible border-t border-zinc-200 pt-2 dark:border-zinc-800">
            {midRailSlot}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 space-y-1 border-t border-zinc-200 p-1.5 dark:border-zinc-800">
        <div className="grid grid-cols-1 gap-1">
          <button
            type="button"
            onClick={undoToolSelection}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className={`${iconBtnBase} justify-center ${iconBtnIdle} disabled:opacity-40`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 10L5 6l4-4M5 6h11a4 4 0 014 4v1"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={redoToolSelection}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className={`${iconBtnBase} justify-center ${iconBtnIdle} disabled:opacity-40`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4-4-4-4M19 6H8a4 4 0 00-4 4v1"
              />
            </svg>
          </button>
        </div>

        {notice ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-1 text-[10px] leading-snug text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            {notice}
          </p>
        ) : (
          <p
            className="truncate text-center text-[10px] text-zinc-500 dark:text-zinc-500"
            title={activeTool ?? "select"}
          >
            {activeToolLabel}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{content(desktopShellClass, false)}</div>

      <div className="lg:hidden">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[80] min-h-0 min-w-0 border-0 bg-zinc-900/40 p-0"
            onClick={() => setMobileOpen(false)}
            aria-label="Close tools menu"
          />
        ) : null}

        <div
          id="board-tool-drawer"
          className={`fixed left-0 top-0 z-[85] flex h-[100dvh] max-w-[min(13.5rem,78vw)] flex-col transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
          role="dialog"
          aria-label="Board tools"
          aria-hidden={!mobileOpen}
        >
          {content(mobilePanelShellClass, true)}
        </div>

        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="fixed left-0 top-1/2 z-[58] flex min-h-[3.25rem] min-w-[2.75rem] -translate-y-1/2 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-r-xl border border-l-0 border-zinc-200/90 bg-white/95 py-2 pl-1 pr-1.5 shadow-md dark:border-zinc-700 dark:bg-zinc-900/95"
            aria-expanded={false}
            aria-controls="board-tool-drawer"
            title={`Tools — ${activeToolLabel}`}
          >
            <svg
              className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <span className="max-w-[2.25rem] truncate text-[9px] font-semibold leading-tight text-zinc-500 dark:text-zinc-400">
              {activeToolLabel.split(" ")[0]}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="fixed left-[min(13.5rem,78vw)] top-1/2 z-[86] flex h-10 w-8 -translate-y-1/2 touch-manipulation items-center justify-center rounded-r-lg border border-l-0 border-zinc-200 bg-white/95 text-zinc-600 shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            aria-label="Close tools menu"
            title="Close tools"
          >
            ‹
          </button>
        )}
      </div>
    </>
  );
}
