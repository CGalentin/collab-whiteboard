"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Circle, Group, Text } from "react-konva";
import type { BoardObjectComment } from "@/lib/board-object";

const R = 12;

type CommentPinShapeProps = {
  object: BoardObjectComment;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onRequestEdit: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export function CommentPinShape({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
}: CommentPinShapeProps) {
  const ring = isSelected ? "#38bdf8" : "#a78bfa";
  const preview =
    object.body.trim().length > 0
      ? object.body.trim().slice(0, 2)
      : "＋";

  return (
    <Group
      id={object.id}
      ref={innerRef}
      x={object.x}
      y={object.y}
      draggable
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        const g = e.target;
        onDragEnd(g.x(), g.y());
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
    >
      <Circle
        x={0}
        y={0}
        radius={R + (isSelected ? 2 : 0)}
        fill="rgba(56,189,248,0.2)"
        stroke={ring}
        strokeWidth={isSelected ? 2 : 1}
        listening={false}
      />
      <Circle
        x={0}
        y={0}
        radius={R}
        fill="#7c3aed"
        stroke="#fafafa"
        strokeWidth={2}
      />
      <Text
        x={-R}
        y={-8}
        width={R * 2}
        text={preview}
        align="center"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fill="#fafafa"
        listening={false}
      />
    </Group>
  );
}
