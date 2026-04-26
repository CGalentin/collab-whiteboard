/**
 * Preset “polygon” shapes: closed paths in local box (0,0)–(w, h) for `BoardObjectPolygon`.
 */
export type PolygonKind =
  | "triangle"
  | "diamond"
  | "hexagon"
  | "trapezoid"
  | "parallelogram"
  | "roundRect"
  | "star";

export const POLYGON_KINDS: { kind: PolygonKind; label: string; row: "basic" }[] =
  [
    { kind: "triangle", label: "Triangle", row: "basic" },
    { kind: "diamond", label: "Diamond", row: "basic" },
    { kind: "hexagon", label: "Hexagon", row: "basic" },
    { kind: "trapezoid", label: "Trapezoid", row: "basic" },
    { kind: "parallelogram", label: "Parallelogram", row: "basic" },
    { kind: "roundRect", label: "Round rect", row: "basic" },
    { kind: "star", label: "Star", row: "basic" },
  ];

const KIND_SET = new Set<PolygonKind>(POLYGON_KINDS.map((e) => e.kind));

export function isPolygonKind(v: unknown): v is PolygonKind {
  return typeof v === "string" && KIND_SET.has(v as PolygonKind);
}

/**
 * Flat points for a closed `Konva.Line` in local coordinates (x0,y0,…), top-left origin.
 * Not used for `star` or `roundRect` (rendered with `Star` / `Rect`).
 */
export function getPolygonLinePointsFlat(
  kind: PolygonKind,
  w: number,
  h: number,
): number[] {
  if (kind === "star" || kind === "roundRect") {
    return [];
  }
  const r = Math.min(w, h) * 0.48;
  const cx = w / 2;
  const cy = h / 2;
  switch (kind) {
    case "triangle":
      return [cx, 0, w, h, 0, h];
    case "diamond":
      return [cx, 0, w, cy, cx, h, 0, cy];
    case "hexagon": {
      const pts: number[] = [];
      for (let k = 0; k < 6; k += 1) {
        const ang = -Math.PI / 2 + (k * Math.PI) / 3;
        pts.push(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
      }
      return pts;
    }
    case "trapezoid":
      return [w * 0.15, 0, w * 0.85, 0, w, h, 0, h];
    case "parallelogram":
      return [w * 0.2, 0, w, 0, w * 0.8, h, 0, h];
    default: {
      const _x: never = kind;
      return _x;
    }
  }
}

export function defaultStarRadii(
  w: number,
  h: number,
): { outer: number; inner: number; cx: number; cy: number } {
  const m = Math.min(w, h);
  const outer = m * 0.45;
  return { outer, inner: outer * 0.4, cx: w / 2, cy: h / 2 };
}
