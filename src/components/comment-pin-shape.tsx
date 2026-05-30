"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Circle, Group, Text } from "react-konva";
import type { BoardObjectComment } from "@/lib/board-object";

const R = 17;
/** Invisible touch target — 52px diameter (mobile-friendly). */
const HIT_R = 26;
/** Ignore small finger jitter so tap still registers (Konva default is 3px). */
const DRAG_DISTANCE = 12;

type CommentPinShapeProps = {
  object: BoardObjectComment;
  isSelected: boolean;
  innerRef: (node: Konva.Node | null) => void;
  onObjectTap: (e: KonvaEventObject<Event>) => void;
  onRequestEdit: () => void;
  onDragEnd: (e: KonvaEventObject<Event>) => void;
  onDragMove?: (e: KonvaEventObject<Event>) => void;
  onDragStart?: () => void;
  interactionLocked?: boolean;
};

export function CommentPinShape({
  object,
  isSelected,
  innerRef,
  onObjectTap,
  onRequestEdit,
  onDragEnd,
  onDragMove,
  onDragStart,
  interactionLocked = false,
}: CommentPinShapeProps) {
  const canInteract = !interactionLocked;
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
      draggable={canInteract}
      listening={canInteract}
      dragDistance={DRAG_DISTANCE}
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
      onTouchStart={(e) => {
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onObjectTap(e);
      }}
      onTap={(e) => {
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
      <Circle
        x={0}
        y={0}
        radius={HIT_R}
        fill="rgba(0,0,0,0.001)"
        listening={canInteract}
        perfectDrawEnabled={false}
      />
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
        listening={false}
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
