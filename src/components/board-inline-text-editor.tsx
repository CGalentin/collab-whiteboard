"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

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
  /** Sticky uses emerald chrome; standalone text uses zinc; comment uses sky. */
  variant?: "sticky" | "text" | "comment";
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
      : variant === "comment"
        ? "border-sky-500/90"
        : "border-violet-500/90";

  // `BoardObjectText.fill` is **text** color in Konva, not box background — do not use it as textarea bg.
  const surfaceStyle: CSSProperties =
    variant === "text" || variant === "comment"
      ? { backgroundColor: "rgba(255,255,255,0.96)", color: "#18181b" }
      : { backgroundColor: box.fill };

  return (
    <textarea
      ref={taRef}
      className={`fixed z-[60] box-border resize-none rounded border-2 ${borderClass} p-2 text-sm leading-snug shadow-xl outline-none ${
        variant === "text" || variant === "comment" ? "" : "text-zinc-900"
      }`}
      style={{
        left,
        top,
        width,
        height,
        ...surfaceStyle,
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
