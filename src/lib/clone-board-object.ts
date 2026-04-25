import type { BoardObject } from "@/lib/board-object";

/**
 * Fields for `setDoc` when duplicating an object (new id assigned by caller).
 * Applies a uniform world offset; `zIndex` should be unique per duplicate batch.
 */
export function cloneBoardObjectFields(
  o: BoardObject,
  dx: number,
  dy: number,
  zIndex: number,
  idRemap: Map<string, string>,
): Record<string, unknown> {
  switch (o.type) {
    case "rect":
      return {
        type: "rect",
        x: o.x + dx,
        y: o.y + dy,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        fill: o.fill,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        zIndex,
        ...(o.text !== undefined ? { text: o.text } : {}),
        ...(o.href ? { href: o.href } : {}),
      };
    case "sticky":
      return {
        type: "sticky",
        x: o.x + dx,
        y: o.y + dy,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        fill: o.fill,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        text: o.text,
        zIndex,
        ...(o.href ? { href: o.href } : {}),
      };
    case "circle":
      return {
        type: "circle",
        x: o.x + dx,
        y: o.y + dy,
        radius: o.radius,
        rotation: o.rotation,
        fill: o.fill,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        zIndex,
        ...(o.href ? { href: o.href } : {}),
      };
    case "line":
      return {
        type: "line",
        x1: o.x1 + dx,
        y1: o.y1 + dy,
        x2: o.x2 + dx,
        y2: o.y2 + dy,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        zIndex,
      };
    case "freehand":
      return {
        type: "freehand",
        points: o.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)),
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        opacity: o.opacity,
        zIndex,
      };
    case "frame":
      return {
        type: "frame",
        x: o.x + dx,
        y: o.y + dy,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        title: o.title,
        fill: o.fill,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        zIndex,
        ...(o.href ? { href: o.href } : {}),
      };
    case "text":
      return {
        type: "text",
        x: o.x + dx,
        y: o.y + dy,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        text: o.text,
        fontSize: o.fontSize,
        fill: o.fill,
        zIndex,
        ...(o.href ? { href: o.href } : {}),
      };
    case "comment":
      return {
        type: "comment",
        x: o.x + dx,
        y: o.y + dy,
        body: o.body,
        zIndex,
        ...(o.href ? { href: o.href } : {}),
      };
    case "link":
      return {
        type: "link",
        x: o.x + dx,
        y: o.y + dy,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        href: o.href,
        label: o.label,
        zIndex,
      };
    case "connector":
      return {
        type: "connector",
        fromId: idRemap.get(o.fromId) ?? o.fromId,
        toId: idRemap.get(o.toId) ?? o.toId,
        stroke: o.stroke,
        strokeWidth: o.strokeWidth,
        zIndex,
      };
  }
}
