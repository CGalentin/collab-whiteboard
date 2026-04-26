"use client";

import { useEffect, useRef } from "react";
import { POLYGON_KINDS, type PolygonKind } from "@/lib/board-polygon-kinds";

type BoardShapesMenuProps = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  onPickRect: () => void;
  onPickCircle: () => void;
  onPickPolygon: (kind: PolygonKind) => void;
};

/**
 * Shapes popover: classic rect/circle plus preset polygon kinds.
 */
export function BoardShapesMenu({
  open,
  onClose,
  busy,
  onPickRect,
  onPickCircle,
  onPickPolygon,
}: BoardShapesMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", onDoc),
      0,
    );
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-[60] mt-1.5 w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-zinc-200 bg-white/98 p-2.5 text-left shadow-lg dark:border-zinc-600 dark:bg-zinc-900/98"
      role="dialog"
      aria-label="Choose a shape"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        Basic
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => onPickRect()}
          className="rounded-lg border border-zinc-200 bg-emerald-50/90 px-2 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
        >
          Rectangle
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onPickCircle()}
          className="rounded-lg border border-zinc-200 bg-teal-50/90 px-2 py-2 text-xs font-medium text-teal-900 hover:bg-teal-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/60"
        >
          Ellipse
        </button>
      </div>
      <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        More shapes
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2">
        {POLYGON_KINDS.map((item) => (
          <button
            key={item.kind}
            type="button"
            disabled={busy}
            onClick={() => onPickPolygon(item.kind)}
            className="rounded-lg border border-zinc-200 bg-zinc-50/90 px-2 py-1.5 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800/90"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
