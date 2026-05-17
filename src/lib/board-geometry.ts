import { lineConnectorPathBounds } from "@/lib/board-line-connector";
import { boardObjectAnchor, type BoardObject } from "@/lib/board-object";

function rotatedRectAabb(
  x: number,
  y: number,
  w: number,
  h: number,
  rotationDeg: number,
): { x: number; y: number; width: number; height: number } {
  if (rotationDeg % 360 === 0) return { x, y, width: w, height: h };
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const corners = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ] as const;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [px, py] of corners) {
    const rx = x + px * c - py * s;
    const ry = y + px * s + py * c;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Whether a point lies inside an axis-aligned rectangle (frame bounds, etc.). */
export function pointInsideAxisRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/** Axis-aligned bounds in world space (for marquee hit-testing). */
export function boardObjectWorldAabb(
  o: BoardObject,
  resolve?: (id: string) => BoardObject | undefined,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  switch (o.type) {
    case "rect":
    case "sticky":
    case "frame":
    case "text":
    case "link":
    case "polygon":
      return rotatedRectAabb(o.x, o.y, o.width, o.height, o.rotation);
    case "circle": {
      const r = o.radius;
      return { x: o.x - r, y: o.y - r, width: 2 * r, height: 2 * r };
    }
    case "ellipse": {
      const w = 2 * o.radiusX;
      const h = 2 * o.radiusY;
      return rotatedRectAabb(o.x - o.radiusX, o.y - o.radiusY, w, h, o.rotation);
    }
    case "line": {
      const b = lineConnectorPathBounds(o.x1, o.y1, o.x2, o.y2, o.lineStyle);
      const pad = Math.max(8, o.strokeWidth * 3);
      return {
        x: b.minX - pad,
        y: b.minY - pad,
        width: Math.max(b.maxX - b.minX + 2 * pad, 1),
        height: Math.max(b.maxY - b.minY + 2 * pad, 1),
      };
    }
    case "freehand": {
      const pts = o.points;
      if (pts.length < 2) {
        return { x: 0, y: 0, width: 1, height: 1 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const px = pts[i]!;
        const py = pts[i + 1]!;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
      const pad = Math.max(6, o.strokeWidth * 2);
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(maxX - minX + 2 * pad, 1),
        height: Math.max(maxY - minY + 2 * pad, 1),
      };
    }
    case "comment": {
      const r = 18;
      return { x: o.x - r, y: o.y - r, width: 2 * r, height: 2 * r };
    }
    case "connector": {
      if (!resolve) {
        return { x: 0, y: 0, width: 1, height: 1 };
      }
      const from = resolve(o.fromId);
      const to = resolve(o.toId);
      if (!from || !to) {
        return { x: 0, y: 0, width: 1, height: 1 };
      }
      const p1 = boardObjectAnchor(from);
      const p2 = boardObjectAnchor(to);
      const x1 = Math.min(p1.x, p2.x);
      const y1 = Math.min(p1.y, p2.y);
      const x2 = Math.max(p1.x, p2.x);
      const y2 = Math.max(p1.y, p2.y);
      const pad = Math.max(8, o.strokeWidth * 3);
      return {
        x: x1 - pad,
        y: y1 - pad,
        width: Math.max(x2 - x1 + 2 * pad, 1),
        height: Math.max(y2 - y1 + 2 * pad, 1),
      };
    }
  }
}

export function aabbIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function normalizeMarqueeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x,
    y,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}
