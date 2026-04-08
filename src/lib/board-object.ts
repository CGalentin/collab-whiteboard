import { Timestamp } from "firebase/firestore";

/**
 * Discriminated canvas entities in Firestore `boards/{boardId}/objects/{objectId}`.
 * PR 09–11: `rect`, `sticky`, `circle`, `line`; more types later (`text`, …).
 */
export type BoardObjectType =
  | "rect"
  | "sticky"
  | "circle"
  | "line"
  | "text"
  | "frame"
  | "connector";

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
  | BoardObjectLine;

export type BoardObject =
  | BoardObjectRect
  | BoardObjectSticky
  | BoardObjectCircle
  | BoardObjectLine
  | BoardObjectFrame
  | BoardObjectText
  | BoardObjectConnector;

export function isShapeLayerObject(o: BoardObject): o is BoardObjectShapeLayer {
  return o.type === "rect" || o.type === "circle" || o.type === "line";
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
    case "connector":
      return { x: 0, y: 0 };
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
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
      fill: str(raw.fill, "#fafafa"),
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
    updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt : undefined,
  };
}

export function sortBoardObjects(a: BoardObject, b: BoardObject): number {
  if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
  return a.id.localeCompare(b.id);
}
