"use client";

import type { BoardObjectSticky } from "@/lib/board-object";
import { BoardInlineTextEditor } from "@/components/board-inline-text-editor";

type StickyTextEditorProps = {
  open: boolean;
  sticky: BoardObjectSticky;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  flushOnClose: () => void;
  stageContainer: HTMLElement | null;
  scale: number;
  stagePos: { x: number; y: number };
};

export function StickyTextEditor(props: StickyTextEditorProps) {
  const { sticky, ...rest } = props;
  const box = {
    id: sticky.id,
    x: sticky.x,
    y: sticky.y,
    width: sticky.width,
    height: sticky.height,
    fill: sticky.fill,
  };
  return <BoardInlineTextEditor box={box} variant="sticky" {...rest} />;
}
