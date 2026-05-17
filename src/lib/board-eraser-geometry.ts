import { deleteField } from "firebase/firestore";
import { lineConnectorWorldPoints } from "@/lib/board-line-connector";
import type { BoardObject } from "@/lib/board-object";

/** Minimum flat length (4 = two vertices) for a surviving freehand fragment. */
const MIN_POLYLINE_FLAT = 4;

export type EraserBrushChange = {
  deleteIds: string[];
  updates: Array<{ id: string; patch: Record<string, unknown> }>;
  creates: Array<{
    type: "freehand" | "line";
    fields: Record<string, unknown>;
  }>;
};

/** Shortest distance from point (px, py) to segment (x1,y1)-(x2,y2). */
export function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

function sampleEraserPath(eraserPoints: number[], sampleStep = 2): number[] {
  if (eraserPoints.length < 2) return [];
  const out: number[] = [];
  for (let i = 0; i < eraserPoints.length; i += 2 * sampleStep) {
    out.push(eraserPoints[i]!, eraserPoints[i + 1]!);
  }
  const last = eraserPoints.length - 2;
  if (last >= 0) {
    const lx = eraserPoints[last]!;
    const ly = eraserPoints[last + 1]!;
    const sl = out.length - 2;
    if (sl < 0 || out[sl] !== lx || out[sl + 1] !== ly) {
      out.push(lx, ly);
    }
  }
  return out;
}

function segmentHitByEraser(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  eraser: number[],
  threshold: number,
): boolean {
  for (let j = 0; j < eraser.length; j += 2) {
    const ex = eraser[j]!;
    const ey = eraser[j + 1]!;
    if (distancePointToSegment(ex, ey, x1, y1, x2, y2) <= threshold) {
      return true;
    }
    if (Math.hypot(x1 - ex, y1 - ey) <= threshold) return true;
    if (Math.hypot(x2 - ex, y2 - ey) <= threshold) return true;
  }
  return false;
}

/** Split a polyline where segments intersect the eraser brush. */
export function splitPolylineByEraser(
  flatPoints: number[],
  eraserPoints: number[],
  threshold: number,
): number[][] {
  const n = flatPoints.length / 2;
  if (n < 2 || eraserPoints.length < 2) return [flatPoints];

  const eraser = sampleEraserPath(eraserPoints);
  const segErased: boolean[] = [];
  for (let i = 0; i < n - 1; i++) {
    const x1 = flatPoints[i * 2]!;
    const y1 = flatPoints[i * 2 + 1]!;
    const x2 = flatPoints[(i + 1) * 2]!;
    const y2 = flatPoints[(i + 1) * 2 + 1]!;
    segErased[i] = segmentHitByEraser(x1, y1, x2, y2, eraser, threshold);
  }

  const runs: number[][] = [];
  let run: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i > 0 && segErased[i - 1]) {
      if (run.length >= MIN_POLYLINE_FLAT) runs.push([...run]);
      run = [];
    }
    run.push(flatPoints[i * 2]!, flatPoints[i * 2 + 1]!);
  }
  if (run.length >= MIN_POLYLINE_FLAT) runs.push(run);
  return runs;
}

function pointsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function applyFreehandEraser(
  o: Extract<BoardObject, { type: "freehand" }>,
  eraserPoints: number[],
  radius: number,
  change: EraserBrushChange,
): void {
  const threshold = radius + Math.max(2, o.strokeWidth / 2);
  const runs = splitPolylineByEraser(o.points, eraserPoints, threshold);
  if (runs.length === 0) {
    change.deleteIds.push(o.id);
    return;
  }
  if (runs.length === 1 && pointsEqual(runs[0]!, o.points)) return;

  const [primary, ...rest] = runs;
  change.updates.push({ id: o.id, patch: { points: primary } });
  for (const pts of rest) {
    change.creates.push({
      type: "freehand",
      fields: {
        type: "freehand",
        points: pts,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        opacity: o.opacity,
        zIndex: o.zIndex,
      },
    });
  }
}

function applyLineEraser(
  o: Extract<BoardObject, { type: "line" }>,
  eraserPoints: number[],
  radius: number,
  change: EraserBrushChange,
): void {
  const threshold = radius + Math.max(2, o.strokeWidth / 2);
  const flat = lineConnectorWorldPoints(o.x1, o.y1, o.x2, o.y2, o.lineStyle);
  const runs = splitPolylineByEraser(flat, eraserPoints, threshold);

  if (runs.length === 0) {
    change.deleteIds.push(o.id);
    return;
  }

  const toLineFields = (pts: number[]) => {
    const x1 = pts[0]!;
    const y1 = pts[1]!;
    const x2 = pts[pts.length - 2]!;
    const y2 = pts[pts.length - 1]!;
    return {
      type: "line" as const,
      x1,
      y1,
      x2,
      y2,
      stroke: o.stroke,
      strokeWidth: o.strokeWidth,
      zIndex: o.zIndex,
    };
  };

  const unchanged =
    runs.length === 1 &&
    runs[0]!.length === flat.length &&
    pointsEqual(runs[0]!, flat);
  if (unchanged) return;

  const [primary, ...rest] = runs;
  const p = primary!;
  const patch: Record<string, unknown> = {
    x1: p[0],
    y1: p[1],
    x2: p[p.length - 2],
    y2: p[p.length - 1],
  };
  if (o.lineStyle) {
    patch.lineStyle = deleteField();
  }
  change.updates.push({ id: o.id, patch });

  for (const pts of rest) {
    change.creates.push({
      type: "line",
      fields: toLineFields(pts),
    });
  }
}

/**
 * Partial brush erase: carve holes in freehand / line geometry instead of
 * deleting whole objects when the eraser only crosses part of a stroke.
 */
export function computeEraserBrushChanges(
  objects: BoardObject[],
  eraserPoints: number[],
  radius: number,
): EraserBrushChange {
  const change: EraserBrushChange = {
    deleteIds: [],
    updates: [],
    creates: [],
  };
  if (eraserPoints.length < 2) return change;

  for (const o of objects) {
    if (o.type === "freehand") {
      applyFreehandEraser(o, eraserPoints, radius, change);
    } else if (o.type === "line") {
      applyLineEraser(o, eraserPoints, radius, change);
    }
  }

  return change;
}
