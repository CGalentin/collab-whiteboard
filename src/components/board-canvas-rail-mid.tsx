"use client";

import { BoardToolGlyph } from "@/components/board-tool-glyphs";

const railBtn =
  "flex h-11 w-full touch-manipulation items-center justify-center rounded-lg border text-zinc-700 transition dark:text-zinc-200";
const railBtnIdle =
  "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";
const railBtnActive =
  "border-brand-teal bg-emerald-50 text-brand-teal shadow-sm dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-200";

type BoardCanvasRailMidProps = {
  onAddText: () => void;
  addingTextObj: boolean;
  onToggleLine: () => void;
  lineToolActive: boolean;
  onConnect: () => void;
  linkingConnector: boolean;
  canConnect: boolean;
  onDuplicate: () => void;
  duplicatingSelection: boolean;
  canActOnSelection: boolean;
};

export function BoardCanvasRailMid(props: BoardCanvasRailMidProps) {
  const {
    onAddText,
    addingTextObj,
    onToggleLine,
    lineToolActive,
    onConnect,
    linkingConnector,
    canConnect,
    onDuplicate,
    duplicatingSelection,
    canActOnSelection,
  } = props;

  return (
    <div className="space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <p className="sr-only">Create objects</p>

      <button
        type="button"
        onClick={onToggleLine}
        className={`${railBtn} ${lineToolActive ? railBtnActive : railBtnIdle}`}
        title="Line tool — click twice on the canvas. Esc cancels."
        aria-label="Line tool"
      >
        <BoardToolGlyph id="line" />
      </button>

      <button
        type="button"
        onClick={onAddText}
        disabled={addingTextObj}
        className={`${railBtn} ${railBtnIdle} disabled:opacity-50`}
        title="Add text box"
        aria-label="Add text box"
      >
        <BoardToolGlyph id="text" />
      </button>

      <button
        type="button"
        onClick={onConnect}
        disabled={linkingConnector || !canConnect}
        className={`${railBtn} ${railBtnIdle} disabled:opacity-40`}
        title="Connect two selected objects"
        aria-label="Connect selection"
      >
        <BoardToolGlyph id="connect" />
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        disabled={duplicatingSelection || !canActOnSelection}
        className={`${railBtn} ${railBtnIdle} disabled:opacity-40`}
        title="Duplicate selection"
        aria-label="Duplicate selection"
      >
        <BoardToolGlyph id="duplicate" />
      </button>
    </div>
  );
}
