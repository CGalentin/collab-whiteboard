import { cloneBoardObjectFields } from "@/lib/clone-board-object";
import type { BoardObject } from "@/lib/board-object";

/** Plain-text clipboard marker so we do not hijack arbitrary JSON. */
export const CLIPBOARD_PREFIX = "collabwb:v1:";

export const PASTE_OFFSET = 32;

const MAX_CLIPBOARD_CHARS = 400_000;

export type ClipboardItemV1 = {
  refId: string;
  fields: Record<string, unknown>;
};

export type ClipboardPayloadV1 = {
  v: 1;
  items: ClipboardItemV1[];
};

export function encodeClipboardPayload(selected: BoardObject[]): string {
  const idRemap = new Map<string, string>();
  const items: ClipboardItemV1[] = selected.map((o) => ({
    refId: o.id,
    fields: cloneBoardObjectFields(o, 0, 0, o.zIndex, idRemap),
  }));
  const payload: ClipboardPayloadV1 = { v: 1, items };
  return CLIPBOARD_PREFIX + JSON.stringify(payload);
}

export function tryDecodeClipboardPayload(text: string): ClipboardPayloadV1 | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith(CLIPBOARD_PREFIX)) return null;
  if (trimmed.length > MAX_CLIPBOARD_CHARS) return null;
  try {
    const raw = JSON.parse(trimmed.slice(CLIPBOARD_PREFIX.length)) as unknown;
    if (
      !raw ||
      typeof raw !== "object" ||
      (raw as ClipboardPayloadV1).v !== 1 ||
      !Array.isArray((raw as ClipboardPayloadV1).items)
    ) {
      return null;
    }
    return raw as ClipboardPayloadV1;
  } catch {
    return null;
  }
}

function applyOffsetToFields(
  fields: Record<string, unknown>,
  ox: number,
  oy: number,
): void {
  const t = fields.type;
  if (
    t === "rect" ||
    t === "sticky" ||
    t === "frame" ||
    t === "text" ||
    t === "link"
  ) {
    fields.x = (fields.x as number) + ox;
    fields.y = (fields.y as number) + oy;
  } else if (t === "circle") {
    fields.x = (fields.x as number) + ox;
    fields.y = (fields.y as number) + oy;
  } else if (t === "ellipse") {
    fields.x = (fields.x as number) + ox;
    fields.y = (fields.y as number) + oy;
  } else if (t === "line") {
    fields.x1 = (fields.x1 as number) + ox;
    fields.y1 = (fields.y1 as number) + oy;
    fields.x2 = (fields.x2 as number) + ox;
    fields.y2 = (fields.y2 as number) + oy;
  } else if (t === "freehand") {
    const pts = fields.points as number[];
    fields.points = pts.map((v, i) => (i % 2 === 0 ? v + ox : v + oy));
  } else if (t === "comment") {
    fields.x = (fields.x as number) + ox;
    fields.y = (fields.y as number) + oy;
  }
}

/**
 * Build Firestore-ready docs: new ids, optional position offset, connectors after other types.
 */
export function buildPasteOperations(
  payload: ClipboardPayloadV1,
  offsetX: number,
  offsetY: number,
): Array<{ id: string; data: Record<string, unknown> }> {
  const idRemap = new Map(
    payload.items.map((it) => [it.refId, crypto.randomUUID()] as const),
  );
  const baseZ = Date.now();
  let zi = 0;

  const nonConn = payload.items.filter((it) => it.fields.type !== "connector");
  const conn = payload.items.filter((it) => it.fields.type === "connector");

  const ops: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const it of nonConn) {
    const newId = idRemap.get(it.refId);
    if (!newId) continue;
    const data = { ...it.fields };
    applyOffsetToFields(data, offsetX, offsetY);
    data.zIndex = baseZ + zi;
    zi += 1;
    ops.push({ id: newId, data });
  }
  for (const it of conn) {
    const newId = idRemap.get(it.refId);
    if (!newId) continue;
    const data = { ...it.fields };
    const fromId = data.fromId as string;
    const toId = data.toId as string;
    data.fromId = idRemap.get(fromId) ?? fromId;
    data.toId = idRemap.get(toId) ?? toId;
    data.zIndex = baseZ + zi;
    zi += 1;
    ops.push({ id: newId, data });
  }

  return ops;
}
