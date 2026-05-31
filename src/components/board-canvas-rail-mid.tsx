"use client";

import { BoardToolGlyph } from "@/components/board-tool-glyphs";
import { useBoardTool } from "@/context/board-tool-context";

const railBtn =
  "flex min-h-11 w-full touch-manipulation items-center justify-start gap-2.5 rounded-lg border px-2.5 text-zinc-700 transition dark:text-zinc-200";
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
  snapToGridEnabled: boolean;
  onToggleSnap: () => void;
  onRotate90: () => void;
};

function RailLabel({ children }: { children: string }) {
  return (
    <span className="truncate text-left text-xs font-medium">{children}</span>
  );
}

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
    snapToGridEnabled,
    onToggleSnap,
    onRotate90,
  } = props;
  const { setMobileOpen } = useBoardTool();

  const closeMobileAfter = (fn: () => void) => () => {
    fn();
    if (
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <p className="sr-only">Create objects</p>

        <button
          type="button"
          onClick={closeMobileAfter(onToggleLine)}
          className={`${railBtn} ${lineToolActive ? railBtnActive : railBtnIdle}`}
          title="Line tool — click twice on the canvas. Esc cancels."
          aria-label="Line tool"
        >
          <BoardToolGlyph id="line" className="h-5 w-5 shrink-0" />
          <RailLabel>Line</RailLabel>
        </button>

        <button
          type="button"
          onClick={closeMobileAfter(onAddText)}
          disabled={addingTextObj}
          className={`${railBtn} ${railBtnIdle} disabled:opacity-50`}
          title="Add text box"
          aria-label="Add text box"
        >
          <BoardToolGlyph id="text" className="h-5 w-5 shrink-0" />
          <RailLabel>Text</RailLabel>
        </button>

        <button
          type="button"
          onClick={closeMobileAfter(onConnect)}
          disabled={linkingConnector || !canConnect}
          className={`${railBtn} ${railBtnIdle} disabled:opacity-40`}
          title="Connect — arrow from first selected shape to second (Shift+click both, then click here)"
          aria-label="Connect selection — arrow from first selected to second"
        >
          <BoardToolGlyph id="connect" className="h-5 w-5 shrink-0" />
          <RailLabel>Connect</RailLabel>
        </button>

        <button
          type="button"
          onClick={closeMobileAfter(onDuplicate)}
          disabled={duplicatingSelection || !canActOnSelection}
          className={`${railBtn} ${railBtnIdle} disabled:opacity-40`}
          title="Duplicate selection"
          aria-label="Duplicate selection"
        >
          <BoardToolGlyph id="duplicate" className="h-5 w-5 shrink-0" />
          <RailLabel>Duplicate</RailLabel>
        </button>
      </div>

      <div className="space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <p className="sr-only">Transform</p>

        <button
          type="button"
          onClick={onToggleSnap}
          className={`${railBtn} ${snapToGridEnabled ? railBtnActive : railBtnIdle}`}
          title="Snap objects to 24px grid when moving"
          aria-label="Snap to grid"
          aria-pressed={snapToGridEnabled}
        >
          <BoardToolGlyph id="snap-grid" className="h-5 w-5 shrink-0" />
          <RailLabel>Snap</RailLabel>
        </button>

        <button
          type="button"
          onClick={closeMobileAfter(onRotate90)}
          disabled={!canActOnSelection}
          className={`${railBtn} ${railBtnIdle} disabled:opacity-40`}
          title="Rotate selection 90°"
          aria-label="Rotate selection 90 degrees"
        >
          <BoardToolGlyph id="rotate-90" className="h-5 w-5 shrink-0" />
          <RailLabel>Rotate 90°</RailLabel>
        </button>
      </div>
    </>
  );
}
