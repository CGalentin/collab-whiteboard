"use client";

import { memo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { BoardObjectLink } from "@/lib/board-object";

const SELECT_STROKE = "#34d399";

type LinkHotspotShapeProps = {
  object: BoardObjectLink;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<Event>) => void;
  onDragMove?: (e: KonvaEventObject<Event>) => void;
  onDragStart?: () => void;
  interactionLocked?: boolean;
};

function LinkHotspotShapeInner({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onDragEnd,
  onDragMove,
  onDragStart,
  interactionLocked = false,
}: LinkHotspotShapeProps) {
  const canInteract = !interactionLocked;
  const stroke = isSelected ? SELECT_STROKE : "#0ea5e9";
  const sw = (isSelected ? 2 : 1) + 0;

  return (
    <Group
      id={object.id}
      ref={innerRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
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
    >
      <Rect
        width={object.width}
        height={object.height}
        fill="rgba(14, 165, 233, 0.12)"
        stroke={stroke}
        strokeWidth={sw}
        dash={isSelected ? [] : [6, 4]}
        cornerRadius={4}
      />
      <Text
        x={6}
        y={4}
        width={object.width - 12}
        height={object.height - 8}
        text={object.label}
        fontSize={12}
        fontStyle="500"
        fontFamily="system-ui, sans-serif"
        fill={isSelected ? "#047857" : "#0c4a6e"}
        ellipsis
        verticalAlign="middle"
      />
    </Group>
  );
}

function linkEqual(a: LinkHotspotShapeProps, b: LinkHotspotShapeProps): boolean {
  if (a.isSelected !== b.isSelected) return false;
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
    o.href === p.href &&
    o.label === p.label
  );
}

export const LinkHotspotShape = memo(LinkHotspotShapeInner, linkEqual);
