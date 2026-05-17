import { deleteField } from "firebase/firestore";
import { lineConnectorWorldPoints } from "@/lib/board-line-connector";
import type { BoardObject } from "@/lib/board-object";

/** Minimum flat length (4 = two vertices) for a surviving freehand fragment. */
const MIN_POLYLINE_FLAT = 4;

export type EraserBrushCreate = {
  id?: string;
  type: "freehand" | "line";
  fields: Record<string, unknown>;
};

export type EraserBrushChange = {
  deleteIds: string[];
  updates: Array<{ id: string; patch: Record<string, unknown> }>;
  creates: EraserBrushCreate[];
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

/** Shortest distance between two segments. */
function distanceSegmentToSegment(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
): number {
  const d1 = distancePointToSegment(ax1, ay1, bx1, by1, bx2, by2);
  const d2 = distancePointToSegment(ax2, ay2, bx1, by1, bx2, by2);
  const d3 = distancePointToSegment(bx1, by1, ax1, ay1, ax2, ay2);
  const d4 = distancePointToSegment(bx2, by2, ax1, ay1, ax2, ay2);
  return Math.min(d1, d2, d3, d4);
}

/** Insert samples along the eraser drag so fast strokes still hit thin strokes. */
export function densifyEraserPath(
  eraserPoints: number[],
  maxSpacing: number,
): number[] {
  if (eraserPoints.length < 2) return [];
  if (eraserPoints.length === 2) return [...eraserPoints];
  const spacing = Math.max(1, maxSpacing);
  const out: number[] = [eraserPoints[0]!, eraserPoints[1]!];
  for (let i = 2; i < eraserPoints.length; i += 2) {
    const x0 = out[out.length - 2]!;
    const y0 = out[out.length - 1]!;
    const x1 = eraserPoints[i]!;
    const y1 = eraserPoints[i + 1]!;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist <= spacing) {
      if (x1 !== x0 || y1 !== y0) out.push(x1, y1);
      continue;
    }
    const steps = Math.ceil(dist / spacing);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
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
  for (let j = 0; j < eraser.length - 2; j += 2) {
    const ex1 = eraser[j]!;
    const ey1 = eraser[j + 1]!;
    const ex2 = eraser[j + 2]!;
    const ey2 = eraser[j + 3]!;
    if (
      distanceSegmentToSegment(x1, y1, x2, y2, ex1, ey1, ex2, ey2) <= threshold
    ) {
      return true;
    }
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

  const eraser = densifyEraserPath(eraserPoints, Math.max(2, threshold * 0.35));
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
  const threshold = radius + Math.max(1, o.strokeWidth / 2);
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
  const threshold = radius + Math.max(1, o.strokeWidth / 2);
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

function patchErasedObject(
  o: BoardObject,
  patch: Record<string, unknown>,
): BoardObject {
  if (o.type === "freehand" && Array.isArray(patch.points)) {
    return { ...o, points: patch.points as number[] };
  }
  if (o.type === "line") {
    const next = {
      ...o,
      x1: typeof patch.x1 === "number" ? patch.x1 : o.x1,
      y1: typeof patch.y1 === "number" ? patch.y1 : o.y1,
      x2: typeof patch.x2 === "number" ? patch.x2 : o.x2,
      y2: typeof patch.y2 === "number" ? patch.y2 : o.y2,
    };
    if (patch.lineStyle === deleteField()) {
      return {
        id: next.id,
        type: "line",
        x1: next.x1,
        y1: next.y1,
        x2: next.x2,
        y2: next.y2,
        stroke: next.stroke,
        strokeWidth: next.strokeWidth,
        zIndex: next.zIndex,
        ...(next.updatedAt ? { updatedAt: next.updatedAt } : {}),
      };
    }
    return next;
  }
  return o;
}

function objectFromCreate(
  id: string,
  create: EraserBrushCreate,
): BoardObject {
  if (create.type === "freehand") {
    return {
      id,
      type: "freehand",
      points: create.fields.points as number[],
      stroke: create.fields.stroke as string,
      strokeWidth: create.fields.strokeWidth as number,
      opacity: create.fields.opacity as number,
      zIndex: create.fields.zIndex as number,
    };
  }
  return {
    id,
    type: "line",
    x1: create.fields.x1 as number,
    y1: create.fields.y1 as number,
    x2: create.fields.x2 as number,
    y2: create.fields.y2 as number,
    stroke: create.fields.stroke as string,
    strokeWidth: create.fields.strokeWidth as number,
    zIndex: create.fields.zIndex as number,
  };
}

/** Preview / local state: apply a brush change and assign ids to new fragments. */
export function applyEraserBrushChangeToObjects(
  objects: BoardObject[],
  change: EraserBrushChange,
  newId: () => string = () => crypto.randomUUID(),
): { objects: BoardObject[]; change: EraserBrushChange } {
  const deleteSet = new Set(change.deleteIds);
  let next = objects.filter((o) => !deleteSet.has(o.id));

  for (const { id, patch } of change.updates) {
    next = next.map((o) => (o.id === id ? patchErasedObject(o, patch) : o));
  }

  const createsWithIds: EraserBrushCreate[] = change.creates.map((c) => {
    const id = c.id ?? newId();
    next.push(objectFromCreate(id, c));
    return { ...c, id };
  });

  return {
    objects: next,
    change: {
      ...change,
      creates: createsWithIds,
    },
  };
}

export function eraserBrushChangeIsEmpty(change: EraserBrushChange): boolean {
  return (
    change.deleteIds.length === 0 &&
    change.updates.length === 0 &&
    change.creates.length === 0
  );
}
