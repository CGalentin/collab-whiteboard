"use client";

import { memo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectSticky } from "@/lib/board-object";
import { DEFAULT_BOARD_FONT_FAMILY } from "@/lib/board-font-presets";

import { SEARCH_HIT_STROKE, type TextSearchVisual } from "@/lib/board-search";

const SELECT_STROKE = "#34d399";

type StickyNoteShapeProps = {
  object: BoardObjectSticky;
  isSelected: boolean;
  /** PR 16: dim non-matches, amber ring on matches when query is active. */
  textSearchVisual?: TextSearchVisual;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onRequestEdit: () => void;
  onDragEnd: (e: KonvaEventObject<Event>) => void;
  onDragMove?: (e: KonvaEventObject<Event>) => void;
  onDragStart?: () => void;
  interactionLocked?: boolean;
};

function StickyNoteShapeInner({
  object,
  isSelected,
  textSearchVisual = "inactive",
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
  onDragMove,
  onDragStart,
  interactionLocked = false,
}: StickyNoteShapeProps) {
  const canInteract = !interactionLocked;
  const pad = 10;
  const dimmed = textSearchVisual === "dim";
  const hit = textSearchVisual === "match";
  const strokeColor = isSelected
    ? SELECT_STROKE
    : hit
      ? SEARCH_HIT_STROKE
      : object.stroke;
  const strokeW = isSelected ? 3 : hit ? 3 : object.strokeWidth;

  return (
    <Group
      id={object.id}
      ref={innerRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      opacity={dimmed ? 0.22 : 1}
      draggable={canInteract}
      listening={canInteract}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStart?.();
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        onDragMove?.(e);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        onDragEnd(e);
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onObjectTap(e);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onRequestEdit();
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onRequestEdit();
      }}
    >
      <Rect
        width={object.width}
        height={object.height}
        fill={object.fill}
        stroke={strokeColor}
        strokeWidth={strokeW}
        cornerRadius={4}
        shadowColor="black"
        shadowBlur={6}
        shadowOpacity={0.2}
        shadowOffsetY={2}
      />
      <Text
        x={pad}
        y={pad}
        width={object.width - pad * 2}
        height={object.height - pad * 2}
        text={object.text.trim() ? object.text : " "}
        fontSize={object.fontSize ?? 14}
        fontFamily={object.fontFamily ?? DEFAULT_BOARD_FONT_FAMILY}
        fill="#1c1917"
        align="left"
        verticalAlign="top"
        wrap="word"
        ellipsis
        listening={false}
      />
    </Group>
  );
}

function stickyPropsEqual(
  a: StickyNoteShapeProps,
  b: StickyNoteShapeProps,
): boolean {
  if (a.isSelected !== b.isSelected) return false;
  if ((a.textSearchVisual ?? "inactive") !== (b.textSearchVisual ?? "inactive"))
    return false;
  const o = a.object;
  const p = b.object;
  if (o === p) return true;
  return (
    o.id === p.id &&
    o.x === p.x &&
    o.y === p.y &&
    o.width === p.width &&
    o.height === p.height &&
    o.rotation === p.rotation &&
    o.fill === p.fill &&
    o.stroke === p.stroke &&
    o.strokeWidth === p.strokeWidth &&
    o.text === p.text &&
    (o.fontSize ?? 14) === (p.fontSize ?? 14) &&
    (o.fontFamily ?? DEFAULT_BOARD_FONT_FAMILY) ===
      (p.fontFamily ?? DEFAULT_BOARD_FONT_FAMILY)
  );
}

/** Memoized: ignores callback identity (PR 17). */
export const StickyNoteShape = memo(StickyNoteShapeInner, stickyPropsEqual);
