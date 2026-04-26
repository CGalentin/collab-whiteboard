import { Timestamp } from "firebase/firestore";
import { isPolygonKind, type PolygonKind } from "@/lib/board-polygon-kinds";

/**
 * Discriminated canvas entities in Firestore `boards/{boardId}/objects/{objectId}`.
 * PR 09–11: `rect`, `sticky`, `circle`, `line`; more types later (`text`, …).
 */
export type BoardObjectType =
  | "rect"
  | "sticky"
  | "circle"
  | "line"
  | "freehand"
  | "text"
  | "frame"
  | "comment"
  | "connector"
  | "link"
  | "polygon";

export type BoardObjectRect = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  text?: string;
  /** PR 30: optional https URL — Cmd/Ctrl+click opens. */
  href?: string;
  updatedAt?: Timestamp;
};

/** Sticky note — PR 10: `text` + `fill` swatches, drag + debounced writes. */
export type BoardObjectSticky = {
  id: string;
  type: "sticky";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text: string;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Center + radius (Konva `Circle`). PR 11. */
export type BoardObjectCircle = {
  id: string;
  type: "circle";
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  rotation: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Segment in world space. PR 11. */
export type BoardObjectLine = {
  id: string;
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  updatedAt?: Timestamp;
};

/** Polyline stroke in world space (`points` flat [x0,y0,x1,y1,…]). PR 28. */
export type BoardObjectFreehand = {
  id: string;
  type: "freehand";
  points: number[];
  stroke: string;
  strokeWidth: number;
  opacity: number;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Labeled region (PR 14). Renders like a light rect + title bar. */
export type BoardObjectFrame = {
  id: string;
  type: "frame";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  title: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Standalone text box — no sticky chrome (PR 14). */
export type BoardObjectText = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  fontSize: number;
  fill: string;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Canvas comment pin — PR 29 MVP: single `body` field (LWW on concurrent edit). */
export type BoardObjectComment = {
  id: string;
  type: "comment";
  x: number;
  y: number;
  body: string;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** PR 30: visible link hotspot (always has `href`). */
export type BoardObjectLink = {
  id: string;
  type: "link";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  href: string;
  label: string;
  zIndex: number;
  updatedAt?: Timestamp;
};

/** Closed preset shape in a bounding box (triangles, hex, star, etc.). */
export type BoardObjectPolygon = {
  id: string;
  type: "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  kind: PolygonKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  /** PR 30 */
  href?: string;
  updatedAt?: Timestamp;
};

/** Arrow between two object ids; endpoints follow object centers (PR 14). */
export type BoardObjectConnector = {
  id: string;
  type: "connector";
  fromId: string;
  toId: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
  updatedAt?: Timestamp;
};

export type BoardObjectShapeLayer =
  | BoardObjectRect
  | BoardObjectCircle
  | BoardObjectLine
  | BoardObjectFreehand
  | BoardObjectPolygon;

export type BoardObject =
  | BoardObjectRect
  | BoardObjectSticky
  | BoardObjectCircle
  | BoardObjectLine
  | BoardObjectFreehand
  | BoardObjectFrame
  | BoardObjectText
  | BoardObjectComment
  | BoardObjectLink
  | BoardObjectConnector
  | BoardObjectPolygon;

export function isShapeLayerObject(o: BoardObject): o is BoardObjectShapeLayer {
  return (
    o.type === "rect" ||
    o.type === "circle" ||
    o.type === "line" ||
    o.type === "freehand" ||
    o.type === "polygon"
  );
}

/** Center point in world space for connector routing. */
export function boardObjectAnchor(o: BoardObject): { x: number; y: number } {
  switch (o.type) {
    case "rect":
    case "sticky":
    case "frame":
    case "text":
      return { x: o.x + o.width / 2, y: o.y + o.height / 2 };
    case "circle":
      return { x: o.x, y: o.y };
    case "line":
      return { x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2 };
    case "freehand": {
      const n = o.points.length / 2;
      if (n <= 0) return { x: 0, y: 0 };
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < o.points.length; i += 2) {
        sx += o.points[i]!;
        sy += o.points[i + 1]!;
      }
      return { x: sx / n, y: sy / n };
    }
    case "comment":
      return { x: o.x, y: o.y };
    case "link":
    case "polygon":
      return { x: o.x + o.width / 2, y: o.y + o.height / 2 };
    case "connector":
      return { x: 0, y: 0 };
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function flatPointsArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const x of v) {
    const n = num(x);
    if (n === null) return null;
    out.push(n);
  }
  return out.length >= 4 && out.length % 2 === 0 ? out : null;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function optionalStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** PR 30: URL if field is a non-empty string. */
export function getBoardObjectHref(o: BoardObject): string | undefined {
  switch (o.type) {
    case "link":
      return o.href;
    case "rect":
    case "sticky":
    case "circle":
    case "text":
    case "frame":
    case "comment":
    case "polygon":
      return o.href;
    default:
      return undefined;
  }
}

/** Whether the user can set an https link on this object (including standalone `link`). */
export function boardObjectSupportsUserHref(o: BoardObject): boolean {
  return (
    o.type === "rect" ||
    o.type === "sticky" ||
    o.type === "circle" ||
    o.type === "text" ||
    o.type === "frame" ||
    o.type === "comment" ||
    o.type === "link" ||
    o.type === "polygon"
  );
}

/**
 * Best-effort parse from Firestore. Unknown `type` values are skipped (returns null).
 */
export function parseBoardObject(
  id: string,
  raw: Record<string, unknown>,
): BoardObject | null {
  const type = raw.type;

  if (type === "sticky") {
    const x = num(raw.x);
    const y = num(raw.y);
    const width = num(raw.width);
    const height = num(raw.height);
    if (x === null || y === null || width === null || height === null) return null;
    if (width <= 0 || height <= 0) return null;

    const rotation = num(raw.rotation) ?? 0;
    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 1;

    const shref = optionalStr(raw.href);
    return {
      id,
      type: "sticky",
      x,
      y,
      width,
      height,
      rotation,
      fill: str(raw.fill, "#fef08a"),
      stroke: str(raw.stroke, "#854d0e"),
      strokeWidth,
      text: str(raw.text, ""),
      zIndex,
      ...(shref ? { href: shref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "circle") {
    const x = num(raw.x);
    const y = num(raw.y);
    const radius = num(raw.radius);
    if (x === null || y === null || radius === null) return null;
    if (radius <= 0) return null;

    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 2;
    const rotation = num(raw.rotation) ?? 0;

    const chref = optionalStr(raw.href);
    return {
      id,
      type: "circle",
      x,
      y,
      radius,
      fill: str(raw.fill, "#bfdbfe"),
      stroke: str(raw.stroke, "#1e40af"),
      strokeWidth,
      zIndex,
      rotation,
      ...(chref ? { href: chref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "line") {
    const x1 = num(raw.x1);
    const y1 = num(raw.y1);
    const x2 = num(raw.x2);
    const y2 = num(raw.y2);
    if (x1 === null || y1 === null || x2 === null || y2 === null) return null;

    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 2;

    return {
      id,
      type: "line",
      x1,
      y1,
      x2,
      y2,
      stroke: str(raw.stroke, "#57534e"),
      strokeWidth,
      zIndex,
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "freehand") {
    const points = flatPointsArray(raw.points);
    if (!points) return null;
    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 3;
    const opacityRaw = num(raw.opacity);
    const opacity =
      opacityRaw !== null && opacityRaw >= 0 && opacityRaw <= 1
        ? opacityRaw
        : 1;

    return {
      id,
      type: "freehand",
      points,
      stroke: str(raw.stroke, "#18181b"),
      strokeWidth,
      opacity,
      zIndex,
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "frame") {
    const x = num(raw.x);
    const y = num(raw.y);
    const width = num(raw.width);
    const height = num(raw.height);
    if (x === null || y === null || width === null || height === null) return null;
    if (width <= 0 || height <= 0) return null;

    const rotation = num(raw.rotation) ?? 0;
    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 2;

    const fhref = optionalStr(raw.href);
    return {
      id,
      type: "frame",
      x,
      y,
      width,
      height,
      rotation,
      title: str(raw.title, "Frame"),
      fill: str(raw.fill, "rgba(39,39,42,0.25)"),
      stroke: str(raw.stroke, "#71717a"),
      strokeWidth,
      zIndex,
      ...(fhref ? { href: fhref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "text") {
    const x = num(raw.x);
    const y = num(raw.y);
    const width = num(raw.width);
    const height = num(raw.height);
    if (x === null || y === null || width === null || height === null) return null;
    if (width <= 0 || height <= 0) return null;

    const rotation = num(raw.rotation) ?? 0;
    const zIndex = num(raw.zIndex) ?? 0;
    const fontSize = num(raw.fontSize) ?? 16;

    // `fill` is Konva **text** color. Older docs used near-white (#fafafa), which was unreadable on light box chrome.
    const rawFill = typeof raw.fill === "string" ? raw.fill.trim() : "";
    const fill =
      rawFill === "" || rawFill.toLowerCase() === "#fafafa"
        ? "#18181b"
        : rawFill;

    const thref = optionalStr(raw.href);
    return {
      id,
      type: "text",
      x,
      y,
      width,
      height,
      rotation,
      text: str(raw.text, "Text"),
      fontSize,
      fill,
      zIndex,
      ...(thref ? { href: thref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "comment") {
    const x = num(raw.x);
    const y = num(raw.y);
    if (x === null || y === null) return null;
    const zIndex = num(raw.zIndex) ?? 0;

    const cohref = optionalStr(raw.href);
    return {
      id,
      type: "comment",
      x,
      y,
      body: typeof raw.body === "string" ? raw.body : "",
      zIndex,
      ...(cohref ? { href: cohref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "link") {
    const x = num(raw.x);
    const y = num(raw.y);
    const width = num(raw.width);
    const height = num(raw.height);
    if (x === null || y === null || width === null || height === null) return null;
    if (width <= 0 || height <= 0) return null;
    const rotation = num(raw.rotation) ?? 0;
    const zIndex = num(raw.zIndex) ?? 0;
    const href = optionalStr(raw.href) ?? "https://example.com";
    return {
      id,
      type: "link",
      x,
      y,
      width,
      height,
      rotation,
      href,
      label: str(raw.label, "Link"),
      zIndex,
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "connector") {
    const fromId = str(raw.fromId, "");
    const toId = str(raw.toId, "");
    if (!fromId || !toId || fromId === toId) return null;

    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 2;

    return {
      id,
      type: "connector",
      fromId,
      toId,
      stroke: str(raw.stroke, "#a1a1aa"),
      strokeWidth,
      zIndex,
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type === "polygon") {
    const x = num(raw.x);
    const y = num(raw.y);
    const width = num(raw.width);
    const height = num(raw.height);
    if (x === null || y === null || width === null || height === null) return null;
    if (width <= 0 || height <= 0) return null;
    if (!isPolygonKind(raw.kind)) return null;

    const rotation = num(raw.rotation) ?? 0;
    const zIndex = num(raw.zIndex) ?? 0;
    const strokeWidth = num(raw.strokeWidth) ?? 2;
    const phref = optionalStr(raw.href);
    return {
      id,
      type: "polygon",
      x,
      y,
      width,
      height,
      rotation,
      kind: raw.kind,
      fill: str(raw.fill, "#bfdbfe"),
      stroke: str(raw.stroke, "#1e40af"),
      strokeWidth,
      zIndex,
      ...(phref ? { href: phref } : {}),
      updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
    };
  }

  if (type !== "rect") return null;

  const x = num(raw.x);
  const y = num(raw.y);
  const width = num(raw.width);
  const height = num(raw.height);
  if (x === null || y === null || width === null || height === null) return null;
  if (width <= 0 || height <= 0) return null;

  const rotation = num(raw.rotation) ?? 0;
  const zIndex = num(raw.zIndex) ?? 0;
  const strokeWidth = num(raw.strokeWidth) ?? 2;

  const rhref = optionalStr(raw.href);
  return {
    id,
    type: "rect",
    x,
    y,
    width,
    height,
    rotation,
    fill: str(raw.fill, "#3f3f46"),
    stroke: str(raw.stroke, "#a1a1aa"),
    strokeWidth,
    zIndex,
    text: typeof raw.text === "string" ? raw.text : undefined,
    ...(rhref ? { href: rhref } : {}),
    updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
  };
}

export function sortBoardObjects(a: BoardObject, b: BoardObject): number {
  if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
  return a.id.localeCompare(b.id);
}
