/**
 * Preset “polygon” shapes: closed paths in local box (0,0)–(w, h) for `BoardObjectPolygon`.
 */
export type PolygonKind =
  | "triangle"
  | "triangleDown"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "trapezoid"
  | "parallelogram"
  | "roundRect"
  | "star"
  | "plus"
  | "decision"
  | "merge"
  | "database"
  | "document"
  | "multiDocument"
  | "process"
  | "predefinedProcess"
  | "storedData"
  | "internalStorage"
  | "display"
  | "terminal"
  | "manualOperation"
  | "preparation"
  | "offPageConnector"
  | "manualInput"
  | "or";

/** Used by the shapes menu to group presets (labels double as hover / tooltip text). */
export type PolygonKindSection = "basic" | "flowchart";

export const POLYGON_KINDS: {
  kind: PolygonKind;
  label: string;
  section: PolygonKindSection;
}[] = [
  { kind: "triangle", label: "Triangle", section: "basic" },
  { kind: "triangleDown", label: "Triangle (point down)", section: "basic" },
  { kind: "diamond", label: "Diamond", section: "basic" },
  { kind: "pentagon", label: "Pentagon", section: "basic" },
  { kind: "hexagon", label: "Hexagon", section: "basic" },
  { kind: "roundRect", label: "Round rectangle", section: "basic" },
  { kind: "star", label: "Star", section: "basic" },
  { kind: "plus", label: "Plus", section: "basic" },
  { kind: "parallelogram", label: "Data / Input-output", section: "flowchart" },
  { kind: "decision", label: "Decision", section: "flowchart" },
  { kind: "database", label: "Database", section: "flowchart" },
  { kind: "document", label: "Document", section: "flowchart" },
  { kind: "multiDocument", label: "Multiple documents", section: "flowchart" },
  { kind: "process", label: "Process", section: "flowchart" },
  { kind: "predefinedProcess", label: "Predefined process", section: "flowchart" },
  { kind: "storedData", label: "Stored data", section: "flowchart" },
  { kind: "internalStorage", label: "Internal storage", section: "flowchart" },
  { kind: "display", label: "Display", section: "flowchart" },
  { kind: "terminal", label: "Terminal", section: "flowchart" },
  { kind: "manualOperation", label: "Manual operation", section: "flowchart" },
  { kind: "merge", label: "Merge", section: "flowchart" },
  { kind: "preparation", label: "Preparation", section: "flowchart" },
  { kind: "offPageConnector", label: "Connector (off-page)", section: "flowchart" },
  { kind: "manualInput", label: "Manual input", section: "flowchart" },
  { kind: "or", label: "Or", section: "flowchart" },
  { kind: "trapezoid", label: "Trapezoid", section: "flowchart" },
];

const KIND_SET = new Set<PolygonKind>(POLYGON_KINDS.map((e) => e.kind));

export function isPolygonKind(v: unknown): v is PolygonKind {
  return typeof v === "string" && KIND_SET.has(v as PolygonKind);
}

/** Kinds rendered as a composite `Group` (not a single closed `Line` from `getPolygonLinePointsFlat`). */
export function polygonKindIsComposite(kind: PolygonKind): boolean {
  switch (kind) {
    case "star":
    case "roundRect":
    case "plus":
    case "database":
    case "document":
    case "multiDocument":
    case "predefinedProcess":
    case "storedData":
    case "internalStorage":
    case "display":
    case "terminal":
    case "offPageConnector":
    case "or":
      return true;
    default:
      return false;
  }
}

/**
 * Flat points for a closed `Konva.Line` in local coordinates (x0,y0,…), top-left origin.
 * Returns [] for composite kinds (`polygonKindIsComposite`).
 */
export function getPolygonLinePointsFlat(
  kind: PolygonKind,
  w: number,
  h: number,
): number[] {
  if (polygonKindIsComposite(kind)) {
    return [];
  }
  const r = Math.min(w, h) * 0.48;
  const cx = w / 2;
  const cy = h / 2;
  switch (kind) {
    case "triangle":
      return [cx, 0, w, h, 0, h];
    case "triangleDown":
    case "merge":
      return [0, 0, w, 0, cx, h];
    case "diamond":
    case "decision":
      return [cx, 0, w, cy, cx, h, 0, cy];
    case "pentagon": {
      const pts: number[] = [];
      for (let k = 0; k < 5; k += 1) {
        const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        pts.push(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
      }
      return pts;
    }
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
    case "process":
      return [0, 0, w, 0, w, h, 0, h];
    case "manualOperation":
      return [w * 0.1, 0, w * 0.9, 0, w, h, 0, h];
    case "preparation":
      return [0, cy, w * 0.25, 0, w * 0.75, 0, w, cy, w * 0.75, h, w * 0.25, h];
    case "manualInput":
      return [w * 0.05, h * 0.12, w * 0.97, 0, w, h, 0, h];
    default:
      return [];
  }
}

/** Arm thickness for `plus` polygons (fraction of min(width, height)). */
export function plusStrokeThickness(w: number, h: number): number {
  return Math.max(4, Math.min(w, h) * 0.28);
}

export function defaultStarRadii(
  w: number,
  h: number,
): { outer: number; inner: number; cx: number; cy: number } {
  const m = Math.min(w, h);
  const outer = m * 0.45;
  return { outer, inner: outer * 0.4, cx: w / 2, cy: h / 2 };
}
