"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectText } from "@/lib/board-object";

const SELECT_STROKE = "#34d399";

type TextObjectShapeProps = {
  object: BoardObjectText;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onRequestEdit: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export function TextObjectShape({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
}: TextObjectShapeProps) {
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
        fill="rgba(24,24,27,0.35)"
        stroke={isSelected ? SELECT_STROKE : "rgba(161,161,170,0.5)"}
        strokeWidth={isSelected ? 2 : 1}
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
