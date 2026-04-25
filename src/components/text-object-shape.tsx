"use client";

import { memo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectText } from "@/lib/board-object";
import { SEARCH_HIT_STROKE, type TextSearchVisual } from "@/lib/board-search";

const SELECT_STROKE = "#34d399";

type TextObjectShapeProps = {
  object: BoardObjectText;
  isSelected: boolean;
  textSearchVisual?: TextSearchVisual;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onRequestEdit: () => void;
  onDragEnd: (x: number, y: number) => void;
};

function TextObjectShapeInner({
  object,
  isSelected,
  textSearchVisual = "inactive",
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
}: TextObjectShapeProps) {
  const dimmed = textSearchVisual === "dim";
  const hit = textSearchVisual === "match";
  const strokeColor = isSelected
    ? SELECT_STROKE
    : hit
      ? SEARCH_HIT_STROKE
      : "rgba(161,161,170,0.5)";
  const strokeW = isSelected ? 2 : hit ? 3 : 1;

  return (
    <Group
      id={object.id}
      ref={innerRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      opacity={dimmed ? 0.22 : 1}
      draggable
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd(node.x(), node.y());
        e.cancelBubble = true;
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
        fill="rgba(255,255,255,0.88)"
        stroke={strokeColor}
        strokeWidth={strokeW}
        cornerRadius={4}
      />
      <Text
        x={8}
        y={8}
        width={object.width - 16}
        height={object.height - 16}
        text={object.text.trim() ? object.text : " "}
        fontSize={object.fontSize}
        fontFamily="system-ui, sans-serif"
        fill={object.fill}
        align="left"
        verticalAlign="top"
        wrap="word"
        ellipsis
      />
    </Group>
  );
}

function textObjectPropsEqual(
  a: TextObjectShapeProps,
  b: TextObjectShapeProps,
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
    o.text === p.text &&
    o.fontSize === p.fontSize &&
    o.fill === p.fill
  );
}

export const TextObjectShape = memo(TextObjectShapeInner, textObjectPropsEqual);
