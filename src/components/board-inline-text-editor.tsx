"use client";

import { useLayoutEffect, useRef } from "react";

/** World-space box for an HTML textarea overlay on the Konva stage. */
export type BoardInlineTextBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

type BoardInlineTextEditorProps = {
  open: boolean;
  box: BoardInlineTextBox;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  flushOnClose: () => void;
  stageContainer: HTMLElement | null;
  scale: number;
  stagePos: { x: number; y: number };
  /** Sticky uses emerald chrome; standalone text uses zinc. */
  variant?: "sticky" | "text";
};

/**
 * HTML textarea aligned to object bounds in viewport space (Konva world → screen).
 */
export function BoardInlineTextEditor({
  open,
  box,
  draft,
  onDraftChange,
  onClose,
  flushOnClose,
  stageContainer,
  scale,
  stagePos,
  variant = "sticky",
}: BoardInlineTextEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (open) {
      taRef.current?.focus();
      taRef.current?.select();
    }
  }, [open]);

  if (!open || !stageContainer) return null;

  const r = stageContainer.getBoundingClientRect();
  const left = r.left + box.x * scale + stagePos.x;
  const top = r.top + box.y * scale + stagePos.y;
  const width = box.width * scale;
  const height = box.height * scale;

  const borderClass =
    variant === "sticky"
      ? "border-emerald-500/90"
      : "border-violet-500/90";

  return (
    <textarea
      ref={taRef}
      className={`fixed z-[60] box-border resize-none rounded border-2 ${borderClass} p-2 text-sm leading-snug text-zinc-900 shadow-xl outline-none`}
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: box.fill,
      }}
      value={draft}
      onChange={(e) => onDraftChange(e.target.value)}
      onBlur={() => {
        flushOnClose();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          flushOnClose();
          onClose();
        }
      }}
    />
  );
}
