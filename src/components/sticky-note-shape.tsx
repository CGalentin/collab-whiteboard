"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectSticky } from "@/lib/board-object";

const SELECT_STROKE = "#34d399";

type StickyNoteShapeProps = {
  object: BoardObjectSticky;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onRequestEdit: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export function StickyNoteShape({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
}: StickyNoteShapeProps) {
  const pad = 10;

  return (
    <Group
      id={object.id}
      ref={innerRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
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
        fill={object.fill}
        stroke={isSelected ? SELECT_STROKE : object.stroke}
        strokeWidth={isSelected ? 3 : object.strokeWidth}
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
        fontSize={14}
        fontFamily="system-ui, sans-serif"
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
