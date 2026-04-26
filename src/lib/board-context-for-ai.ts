import type { BoardObject } from "@/lib/board-object";

/** Max objects included; keeps prompts within model context limits. */
const MAX_OBJECTS = 80;

/** Max characters for the full context string sent to `/api/ai`. */
const MAX_CONTEXT_CHARS = 24_000;

/**
 * Compact one-line-per-object summary for Gemini (getBoardState / PR 20).
 * Truncates long text fields.
 */
export function buildBoardContextForAi(objects: BoardObject[]): string {
  const slice = objects.slice(0, MAX_OBJECTS);
  const lines: string[] = slice.map(summarizeObject);
  if (objects.length > MAX_OBJECTS) {
    lines.push(
      `... (${objects.length - MAX_OBJECTS} more objects omitted; board has ${objects.length} total)`,
    );
  }
  let text = lines.join("\n");
  if (text.length > MAX_CONTEXT_CHARS) {
    text = `${text.slice(0, MAX_CONTEXT_CHARS)}\n... (context truncated)`;
  }
  return text;
}

function summarizeObject(o: BoardObject): string {
  switch (o.type) {
    case "sticky":
      return JSON.stringify({
        id: o.id,
        type: "sticky",
        x: o.x,
        y: o.y,
        w: o.width,
        h: o.height,
        text: clip(o.text, 100),
      });
    case "rect":
      return JSON.stringify({
        id: o.id,
        type: "rect",
        x: o.x,
        y: o.y,
        w: o.width,
        h: o.height,
      });
    case "circle":
      return JSON.stringify({
        id: o.id,
        type: "circle",
        x: o.x,
        y: o.y,
        r: o.radius,
      });
    case "line":
      return JSON.stringify({
        id: o.id,
        type: "line",
        x1: o.x1,
        y1: o.y1,
        x2: o.x2,
        y2: o.y2,
      });
    case "freehand":
      return JSON.stringify({
        id: o.id,
        type: "freehand",
        nPoints: o.points.length / 2,
        stroke: o.stroke,
      });
    case "frame":
      return JSON.stringify({
        id: o.id,
        type: "frame",
        x: o.x,
        y: o.y,
        title: clip(o.title, 80),
      });
    case "text":
      return JSON.stringify({
        id: o.id,
        type: "text",
        x: o.x,
        y: o.y,
        text: clip(o.text, 100),
      });
    case "connector":
      return JSON.stringify({
        id: o.id,
        type: "connector",
        fromId: o.fromId,
        toId: o.toId,
      });
    case "comment":
      return JSON.stringify({
        id: o.id,
        type: "comment",
        x: o.x,
        y: o.y,
        body: clip(o.body, 120),
      });
    case "polygon":
      return JSON.stringify({
        id: o.id,
        type: "polygon",
        kind: o.kind,
        x: o.x,
        y: o.y,
        w: o.width,
        h: o.height,
      });
    case "link":
      return JSON.stringify({
        id: o.id,
        type: "link",
        x: o.x,
        y: o.y,
        w: o.width,
        h: o.height,
        href: clip(o.href, 200),
        label: clip(o.label, 40),
      });
  }
}

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}
