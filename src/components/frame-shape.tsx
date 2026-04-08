"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectFrame } from "@/lib/board-object";

const SELECT_STROKE = "#34d399";

type FrameShapeProps = {
  object: BoardObjectFrame;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
};

export function FrameShape({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onDragEnd,
}: FrameShapeProps) {
  const stroke = isSelected ? SELECT_STROKE : object.stroke;
  const sw = object.strokeWidth + (isSelected ? 1 : 0);

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
    >
      <Rect
        width={object.width}
        height={object.height}
        fill={object.fill}
        stroke={stroke}
        strokeWidth={sw}
        cornerRadius={6}
      />
      <Text
        x={8}
        y={6}
        width={object.width - 16}
        text={object.title || "Frame"}
        fontSize={12}
        fontStyle="600"
        fontFamily="system-ui, sans-serif"
        fill="#fafafa"
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.5}
        ellipsis
      />
    </Group>
  );
}
