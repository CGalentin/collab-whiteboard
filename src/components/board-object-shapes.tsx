"use client";

import { memo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Circle, Line, Rect } from "react-konva";
import type { BoardObjectShapeLayer } from "@/lib/board-object";

const SELECT_STROKE = "#34d399";

type BoardObjectShapeProps = {
  object: BoardObjectShapeLayer;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onPointerDown: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
};

function BoardObjectShapeInner({
  object,
  isSelected,
  innerRef,
  onPointerDown,
  onDragEnd,
}: BoardObjectShapeProps) {
  const commonStroke = isSelected ? SELECT_STROKE : object.stroke;
  const strokeW = object.strokeWidth + (isSelected ? 1 : 0);

  if (object.type === "rect") {
    return (
      <Rect
        id={object.id}
        ref={innerRef}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rotation={object.rotation}
        fill={object.fill}
        stroke={commonStroke}
        strokeWidth={strokeW}
        draggable
        onDragStart={(e) => {
          e.cancelBubble = true;
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
          onPointerDown(e);
        }}
      />
    );
  }

  if (object.type === "circle") {
    return (
      <Circle
        id={object.id}
        ref={innerRef}
        x={object.x}
        y={object.y}
        radius={object.radius}
        rotation={object.rotation}
        fill={object.fill}
        stroke={commonStroke}
        strokeWidth={strokeW}
        draggable
        onDragStart={(e) => {
          e.cancelBubble = true;
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
          onPointerDown(e);
        }}
      />
    );
  }

  return (
    <Line
      id={object.id}
      ref={innerRef}
      points={[object.x1, object.y1, object.x2, object.y2]}
      stroke={commonStroke}
      strokeWidth={strokeW}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={Math.max(24, object.strokeWidth * 4)}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onPointerDown(e);
      }}
    />
  );
}

function boardObjectShapeEqual(
  a: BoardObjectShapeProps,
  b: BoardObjectShapeProps,
): boolean {
  if (a.isSelected !== b.isSelected) return false;
  const o = a.object;
  const p = b.object;
  if (o.type !== p.type || o.id !== p.id) return false;
  if (o === p) return true;
  if (o.type === "rect" && p.type === "rect") {
    return (
      o.x === p.x &&
      o.y === p.y &&
      o.width === p.width &&
      o.height === p.height &&
      o.rotation === p.rotation &&
      o.fill === p.fill &&
      o.stroke === p.stroke &&
      o.strokeWidth === p.strokeWidth &&
      (o.text ?? "") === (p.text ?? "")
    );
  }
  if (o.type === "circle" && p.type === "circle") {
    return (
      o.x === p.x &&
      o.y === p.y &&
      o.radius === p.radius &&
      o.rotation === p.rotation &&
      o.fill === p.fill &&
      o.stroke === p.stroke &&
      o.strokeWidth === p.strokeWidth
    );
  }
  if (o.type === "line" && p.type === "line") {
    return (
      o.x1 === p.x1 &&
      o.y1 === p.y1 &&
      o.x2 === p.x2 &&
      o.y2 === p.y2 &&
      o.stroke === p.stroke &&
      o.strokeWidth === p.strokeWidth
    );
  }
  return false;
}

export const BoardObjectShape = memo(
  BoardObjectShapeInner,
  boardObjectShapeEqual,
);
