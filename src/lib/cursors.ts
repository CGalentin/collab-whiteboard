import type { Timestamp } from "firebase/firestore";

/** Trailing debounce for `setDoc` on pointer move (PR 17: ~13 writes/s max if always moving). */
export const CURSOR_WRITE_DEBOUNCE_MS = 75;

/** Hide remote cursors if `updatedAt` is older than this (no explicit delete on idle). */
export const CURSOR_STALE_MS = 5_000;

/** Skip Firestore write if world position barely changed (Konva stage units). */
export const CURSOR_WORLD_EPSILON = 0.35;

export type CursorDocData = {
  /** Konva **world** x after pan/zoom (same space as board objects in PR 09+). */
  x: number;
  /** Konva **world** y. */
  y: number;
  name: string;
  updatedAt?: Timestamp;
};

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function cursorNameFromUser(user: {
  displayName: string | null;
  email: string | null;
}): string {
  return (
    user.displayName?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "User"
  );
}

export function isCursorFresh(
  data: CursorDocData,
  nowMs: number = Date.now(),
): boolean {
  const ts = data.updatedAt;
  if (!ts || typeof ts.toMillis !== "function") return false;
  return nowMs - ts.toMillis() < CURSOR_STALE_MS;
}
