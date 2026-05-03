"use client";

import { memo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import {
  Arrow,
  Circle,
  Ellipse,
  Group,
  Line,
  Path,
  Rect,
  Star,
} from "react-konva";
import { lineConnectorWorldPoints } from "@/lib/board-line-connector";
import type { BoardObjectShapeLayer } from "@/lib/board-object";
import {
  displayPathData,
  documentPathData,
  storedDataPathData,
} from "@/lib/board-flowchart-paths";
import {
  defaultStarRadii,
  getPolygonLinePointsFlat,
  plusStrokeThickness,
} from "@/lib/board-polygon-kinds";

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
        hitStrokeWidth={Math.max(16, object.strokeWidth * 3)}
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
        onTap={(e) => {
          e.cancelBubble = true;
          onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
        }}
      />
    );
  }

  if (object.type === "freehand") {
    const strokeW = object.strokeWidth + (isSelected ? 1 : 0);
    return (
      <Line
        id={object.id}
        ref={innerRef}
        points={object.points}
        stroke={isSelected ? SELECT_STROKE : object.stroke}
        strokeWidth={strokeW}
        opacity={object.opacity}
        lineCap="round"
        lineJoin="round"
        perfectDrawEnabled={false}
        hitStrokeWidth={Math.max(24, object.strokeWidth * 4)}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
        }}
      />
    );
  }

  if (object.type === "polygon") {
    const o = object;
    const w = o.width;
    const h = o.height;
    const commonStrokeP = isSelected ? SELECT_STROKE : o.stroke;
    const strokeP = o.strokeWidth + (isSelected ? 1 : 0);
    const groupProps = {
      id: o.id,
      ref: innerRef,
      x: o.x,
      y: o.y,
      rotation: o.rotation,
      draggable: true,
      onDragStart: (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
      },
      onDragEnd: (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onDragEnd(e);
      },
      onMouseDown: (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
      },
      onTap: (e: KonvaEventObject<Event>) => {
        e.cancelBubble = true;
        onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
      },
    };
    if (o.kind === "plus") {
      const t = plusStrokeThickness(w, h);
      const cx = w / 2;
      const cy = h / 2;
      return (
        <Group {...groupProps}>
          <Rect
            id={`${o.id}-plus-v`}
            x={cx - t / 2}
            y={0}
            width={t}
            height={h}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Rect
            id={`${o.id}-plus-h`}
            x={0}
            y={cy - t / 2}
            width={w}
            height={t}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "roundRect") {
      return (
        <Group {...groupProps}>
          <Rect
            name="round-rect-poly"
            x={0}
            y={0}
            width={w}
            height={h}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
            cornerRadius={Math.min(w, h) * 0.15}
          />
        </Group>
      );
    }
    if (o.kind === "star") {
      const { outer, inner, cx, cy } = defaultStarRadii(w, h);
      return (
        <Group {...groupProps}>
          <Star
            name="star-poly"
            x={cx}
            y={cy}
            numPoints={5}
            innerRadius={inner}
            outerRadius={outer}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "database") {
      return (
        <Group {...groupProps}>
          <Ellipse
            name="db-top"
            x={w / 2}
            y={h * 0.12}
            radiusX={Math.max(4, w * 0.42)}
            radiusY={Math.max(3, h * 0.09)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Rect
            name="db-body"
            x={w * 0.08}
            y={h * 0.12}
            width={w * 0.84}
            height={h * 0.63}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Ellipse
            name="db-bot"
            x={w / 2}
            y={h * 0.88}
            radiusX={Math.max(4, w * 0.42)}
            radiusY={Math.max(3, h * 0.09)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "document") {
      return (
        <Group {...groupProps}>
          <Path
            name="doc-path"
            data={documentPathData(w, h)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "multiDocument") {
      const dw = Math.max(12, w - 10);
      const dh = Math.max(12, h - 10);
      return (
        <Group {...groupProps}>
          <Path
            name="md-back"
            x={-2}
            y={-2}
            data={documentPathData(dw, dh)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
            opacity={0.88}
          />
          <Path
            name="md-mid"
            x={2}
            y={2}
            data={documentPathData(dw, dh)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
            opacity={0.92}
          />
          <Path
            name="md-front"
            data={documentPathData(w, h)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "predefinedProcess") {
      return (
        <Group {...groupProps}>
          <Rect
            name="pp-rect"
            x={0}
            y={0}
            width={w}
            height={h}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Line
            name="pp-bar-l"
            points={[w * 0.12, h * 0.1, w * 0.12, h * 0.9]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.85)}
            lineCap="round"
          />
          <Line
            name="pp-bar-r"
            points={[w * 0.88, h * 0.1, w * 0.88, h * 0.9]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.85)}
            lineCap="round"
          />
        </Group>
      );
    }
    if (o.kind === "storedData") {
      return (
        <Group {...groupProps}>
          <Path
            name="sd-path"
            data={storedDataPathData(w, h)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "internalStorage") {
      return (
        <Group {...groupProps}>
          <Rect
            name="is-rect"
            x={0}
            y={0}
            width={w}
            height={h}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Line
            name="is-l"
            points={[w * 0.14, h * 0.12, w * 0.14, h * 0.88]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.85)}
            lineCap="round"
          />
          <Line
            name="is-t"
            points={[w * 0.14, h * 0.12, w * 0.55, h * 0.12]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.85)}
            lineCap="round"
          />
        </Group>
      );
    }
    if (o.kind === "display") {
      return (
        <Group {...groupProps}>
          <Path
            name="disp-path"
            data={displayPathData(w, h)}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "terminal") {
      const r = Math.min(h / 2, w / 2);
      return (
        <Group {...groupProps}>
          <Rect
            name="term-rect"
            x={0}
            y={0}
            width={w}
            height={h}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
            cornerRadius={r}
          />
        </Group>
      );
    }
    if (o.kind === "offPageConnector") {
      const rad = Math.max(4, Math.min(w, h) / 2 - strokeP);
      return (
        <Group {...groupProps}>
          <Circle
            name="opc-circle"
            x={w / 2}
            y={h / 2}
            radius={rad}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
        </Group>
      );
    }
    if (o.kind === "or") {
      const rad = Math.max(4, Math.min(w, h) / 2 - strokeP * 1.5);
      const inner = Math.max(2, rad * 0.45);
      return (
        <Group {...groupProps}>
          <Circle
            name="or-circle"
            x={w / 2}
            y={h / 2}
            radius={rad}
            fill={o.fill}
            stroke={commonStrokeP}
            strokeWidth={strokeP}
          />
          <Line
            name="or-h"
            points={[w / 2 - inner, h / 2, w / 2 + inner, h / 2]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.75)}
            lineCap="square"
          />
          <Line
            name="or-v"
            points={[w / 2, h / 2 - inner, w / 2, h / 2 + inner]}
            stroke={commonStrokeP}
            strokeWidth={Math.max(1.5, strokeP * 0.75)}
            lineCap="square"
          />
        </Group>
      );
    }
    const pts = getPolygonLinePointsFlat(o.kind, w, h);
    return (
      <Group {...groupProps}>
        <Line
          name="line-poly"
          points={pts}
          closed
          fill={o.fill}
          stroke={commonStrokeP}
          strokeWidth={strokeP}
        />
      </Group>
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
        hitStrokeWidth={Math.max(24, object.strokeWidth * 4)}
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
        onTap={(e) => {
          e.cancelBubble = true;
          onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
        }}
      />
    );
  }

  if (object.type === "ellipse") {
    return (
      <Ellipse
        id={object.id}
        ref={innerRef}
        x={object.x}
        y={object.y}
        radiusX={object.radiusX}
        radiusY={object.radiusY}
        rotation={object.rotation}
        fill={object.fill}
        stroke={commonStroke}
        strokeWidth={strokeW}
        hitStrokeWidth={Math.max(24, object.strokeWidth * 4)}
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
        onTap={(e) => {
          e.cancelBubble = true;
          onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
        }}
      />
    );
  }

  const o = object;
  const pts = lineConnectorWorldPoints(o.x1, o.y1, o.x2, o.y2, o.lineStyle);
  const hitW = Math.max(24, o.strokeWidth * 4);
  const pointerLen = Math.max(10, strokeW * 4);
  const pointerW = Math.max(10, strokeW * 4);

  if (!o.lineStyle) {
    return (
      <Line
        id={o.id}
        ref={innerRef}
        points={pts}
        stroke={commonStroke}
        strokeWidth={strokeW}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={hitW}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
        }}
      />
    );
  }

  const pointerStart =
    o.lineStyle === "arrowBoth" || o.lineStyle === "orthogonalBoth";
  const pointerEnd =
    o.lineStyle === "arrow" ||
    o.lineStyle === "arrowBoth" ||
    o.lineStyle === "orthogonalBoth" ||
    o.lineStyle === "arcUp" ||
    o.lineStyle === "arcDown";

  return (
    <Arrow
      id={o.id}
      ref={innerRef}
      points={pts}
      stroke={commonStroke}
      strokeWidth={strokeW}
      fill={commonStroke}
      lineCap="round"
      lineJoin="round"
      pointerLength={pointerLen}
      pointerWidth={pointerW}
      pointerAtBeginning={pointerStart}
      pointerAtEnding={pointerEnd}
      hitStrokeWidth={hitW}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onPointerDown(e as unknown as KonvaEventObject<MouseEvent>);
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
  if (o.type === "ellipse" && p.type === "ellipse") {
    return (
      o.x === p.x &&
      o.y === p.y &&
      o.radiusX === p.radiusX &&
      o.radiusY === p.radiusY &&
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
      o.strokeWidth === p.strokeWidth &&
      (o.lineStyle ?? "") === (p.lineStyle ?? "")
    );
  }
  if (o.type === "freehand" && p.type === "freehand") {
    if (o.points.length !== p.points.length) return false;
    for (let i = 0; i < o.points.length; i++) {
      if (o.points[i] !== p.points[i]) return false;
    }
    return (
      o.stroke === p.stroke &&
      o.strokeWidth === p.strokeWidth &&
      o.opacity === p.opacity
    );
  }
  if (o.type === "polygon" && p.type === "polygon") {
    return (
      o.x === p.x &&
      o.y === p.y &&
      o.width === p.width &&
      o.height === p.height &&
      o.rotation === p.rotation &&
      o.kind === p.kind &&
      o.fill === p.fill &&
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
