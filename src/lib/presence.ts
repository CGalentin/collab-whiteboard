import type { Timestamp } from "firebase/firestore";

/** How often we refresh `lastSeen` while the board tab is open. */
export const PRESENCE_HEARTBEAT_MS = 12_000;

/** Consider a user “online” if `lastSeen` is at least this fresh (PR 06). */
export const PRESENCE_ONLINE_THRESHOLD_MS = 30_000;

export type PresenceDocData = {
  displayName?: string;
  online?: boolean;
  lastSeen?: Timestamp;
};

export function isPresenceEntryOnline(data: PresenceDocData): boolean {
  if (data.online === false) return false;
  const ts = data.lastSeen;
  if (!ts || typeof ts.toMillis !== "function") return false;
  return Date.now() - ts.toMillis() < PRESENCE_ONLINE_THRESHOLD_MS;
}

export function presenceDisplayName(
  data: PresenceDocData,
  uid: string,
): string {
  const n = data.displayName?.trim();
  if (n) return n;
  return `User ${uid.slice(0, 6)}`;
}
