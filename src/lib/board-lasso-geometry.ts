import { boardObjectAnchor, type BoardObject } from "@/lib/board-object";

/** Ray-casting point-in-polygon (closed ring: pairs x0,y0,x1,y1,…). */
export function pointInPolygon(
  x: number,
  y: number,
  flatRing: number[],
): boolean {
  const n = flatRing.length / 2;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = flatRing[i * 2]!;
    const yi = flatRing[i * 2 + 1]!;
    const xj = flatRing[j * 2]!;
    const yj = flatRing[j * 2 + 1]!;
    if (Math.abs(yj - yi) < 1e-9) continue;
    const intersect =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Close freehand lasso by repeating the first vertex if the path is not already
 * within `closePx` of the start.
 */
export function closeLassoRing(points: number[], closePx = 10): number[] {
  if (points.length < 6) return points;
  const x0 = points[0]!;
  const y0 = points[1]!;
  const xl = points[points.length - 2]!;
  const yl = points[points.length - 1]!;
  if (Math.hypot(xl - x0, yl - y0) <= closePx) {
    return points;
  }
  return points.concat([x0, y0]);
}

/** Object ids whose `boardObjectAnchor` lies inside the polygon (connectors skipped). */
export function objectIdsWithAnchorInPolygon(
  objects: BoardObject[],
  flatRing: number[],
): string[] {
  if (flatRing.length < 6) return [];
  const out: string[] = [];
  for (const o of objects) {
    if (o.type === "connector") continue;
    const p = boardObjectAnchor(o);
    if (pointInPolygon(p.x, p.y, flatRing)) out.push(o.id);
  }
  return out;
}
