/** Decorative line / connector appearance (stored on `line` objects as `lineStyle`). */
export const BOARD_LINE_CONNECTOR_STYLES = [
  "arrow",
  "arrowBoth",
  "orthogonalBoth",
  "arcUp",
  "arcDown",
] as const;

export type BoardLineConnectorStyle = (typeof BOARD_LINE_CONNECTOR_STYLES)[number];

export function isBoardLineConnectorStyle(v: unknown): v is BoardLineConnectorStyle {
  return (
    typeof v === "string" &&
    (BOARD_LINE_CONNECTOR_STYLES as readonly string[]).includes(v)
  );
}

function quadraticPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * x1 + 2 * u * t * cx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cy + t * t * y2,
  };
}

/** Unit perpendicular (screen “up” bulge uses +sign on this vector). */
function perpUpNorm(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { x: 0, y: -1 };
  return { x: dy / len, y: -dx / len };
}

export function lineConnectorControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  arc: "arcUp" | "arcDown",
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const bulge = Math.min(120, len * 0.45);
  const p = perpUpNorm(dx, dy);
  const sign = arc === "arcUp" ? 1 : -1;
  return { cx: mx + p.x * bulge * sign, cy: my + p.y * bulge * sign };
}

/** Flat points for Konva `Line` / `Arrow` (straight, orthogonal polyline, or sampled arc). */
export function lineConnectorWorldPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineStyle: BoardLineConnectorStyle | undefined,
): number[] {
  if (!lineStyle) return [x1, y1, x2, y2];
  if (lineStyle === "orthogonalBoth") {
    const mx = (x1 + x2) / 2;
    return [x1, y1, mx, y1, mx, y2, x2, y2];
  }
  if (lineStyle === "arcUp" || lineStyle === "arcDown") {
    const { cx, cy } = lineConnectorControlPoint(x1, y1, x2, y2, lineStyle);
    const n = 28;
    const pts: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = quadraticPoint(x1, y1, cx, cy, x2, y2, t);
      pts.push(p.x, p.y);
    }
    return pts;
  }
  return [x1, y1, x2, y2];
}

export function lineConnectorPathBounds(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineStyle: BoardLineConnectorStyle | undefined,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const pts = lineConnectorWorldPoints(x1, y1, x2, y2, lineStyle);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i]!;
    const y = pts[i + 1]!;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (lineStyle === "arcUp" || lineStyle === "arcDown") {
    const { cx, cy } = lineConnectorControlPoint(
      x1,
      y1,
      x2,
      y2,
      lineStyle,
    );
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);
  }
  return { minX, minY, maxX, maxY };
}
