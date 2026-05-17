import type Konva from "konva";
import type { BoardObject } from "@/lib/board-object";

/** Drag delta for Konva nodes (offset-based lines vs absolute x/y groups). */
export function dragDeltaFromNode(
  o: BoardObject,
  node: Konva.Node,
  origin: { x: number; y: number },
): { dx: number; dy: number } {
  if (o.type === "line" || o.type === "freehand") {
    return { dx: node.x(), dy: node.y() };
  }
  return { dx: node.x() - origin.x, dy: node.y() - origin.y };
}

/** Top-left or anchor position used for group-move delta (excludes line/freehand/connector). */
export function boardObjectDragPosition(
  o: BoardObject,
): { x: number; y: number } | null {
  switch (o.type) {
    case "rect":
    case "sticky":
    case "frame":
    case "text":
    case "link":
    case "polygon":
    case "circle":
    case "ellipse":
    case "comment":
      return { x: o.x, y: o.y };
    case "line":
      return { x: o.x1, y: o.y1 };
    case "freehand": {
      const pts = o.points;
      if (pts.length < 2) return null;
      let minX = Infinity;
      let minY = Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]!);
        minY = Math.min(minY, pts[i + 1]!);
      }
      return { x: minX, y: minY };
    }
    default:
      return null;
  }
}

/** Patch fields after applying (dx, dy) from drag origin. */
export function boardObjectPositionPatch(
  o: BoardObject,
  origin: { x: number; y: number },
  dx: number,
  dy: number,
): Record<string, unknown> | null {
  switch (o.type) {
    case "rect":
    case "sticky":
    case "frame":
    case "text":
    case "link":
    case "polygon":
    case "circle":
    case "ellipse":
    case "comment":
      return { x: origin.x + dx, y: origin.y + dy };
    case "line":
      return {
        x1: o.x1 + dx,
        y1: o.y1 + dy,
        x2: o.x2 + dx,
        y2: o.y2 + dy,
      };
    case "freehand": {
      const pts = o.points;
      const next: number[] = [];
      for (let i = 0; i < pts.length; i += 2) {
        next.push(pts[i]! + dx, pts[i + 1]! + dy);
      }
      return { points: next };
    }
    default:
      return null;
  }
}
