"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Arrow } from "react-konva";
import { boardObjectAnchor, type BoardObject, type BoardObjectConnector } from "@/lib/board-object";

type ConnectorShapeProps = {
  object: BoardObjectConnector;
  objects: BoardObject[];
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
};

export function ConnectorShape({
  object,
  objects,
  isSelected,
  innerRef,
  onObjectTap,
}: ConnectorShapeProps) {
  const from = objects.find((o) => o.id === object.fromId);
  const to = objects.find((o) => o.id === object.toId);
  if (!from || !to) return null;

  const p1 = boardObjectAnchor(from);
  const p2 = boardObjectAnchor(to);

  return (
    <Arrow
      id={object.id}
      ref={innerRef as (n: Konva.Arrow | null) => void}
      points={[p1.x, p1.y, p2.x, p2.y]}
      stroke={isSelected ? "#34d399" : object.stroke}
      strokeWidth={object.strokeWidth + (isSelected ? 1 : 0)}
      fill={isSelected ? "#34d399" : object.stroke}
      pointerLength={12}
      pointerWidth={12}
      pointerAtBeginning={false}
      pointerAtEnding
      lineJoin="round"
      hitStrokeWidth={Math.max(20, object.strokeWidth * 4)}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onObjectTap(e);
      }}
    />
  );
}
