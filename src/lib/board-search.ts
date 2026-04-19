import type { BoardObject } from "@/lib/board-object";

/** Amber ring for search hits (selection green still wins). */
export const SEARCH_HIT_STROKE = "#f59e0b";

/** Canvas styling for sticky/text while a search query is active (PR 16). */
export type TextSearchVisual = "inactive" | "match" | "dim";

/**
 * Client-side substring match on **sticky** and **text** objects only (case-insensitive).
 * Empty query → empty set (caller treats as “search off”).
 */
export function getTextSearchMatchIds(
  objects: BoardObject[],
  queryTrimmed: string,
): Set<string> {
  const q = queryTrimmed.trim();
  if (q.length === 0) return new Set();
  const lower = q.toLowerCase();
  const ids = new Set<string>();
  for (const o of objects) {
    if (o.type !== "sticky" && o.type !== "text") continue;
    const t = o.text ?? "";
    if (t.toLowerCase().includes(lower)) ids.add(o.id);
  }
  return ids;
}
