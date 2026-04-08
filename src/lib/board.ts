/**
 * Shared demo board id for MVP. Firestore layout: `boards/{DEMO_BOARD_ID}/…`
 * (objects, cursors, presence) — see `docs/ARCHITECTURE.md`.
 */
export const DEMO_BOARD_ID =
  process.env.NEXT_PUBLIC_APP_DEMO_BOARD_ID ?? "demo";

/** Same path prefix as architecture table, for logs and UI. */
export const DEMO_BOARD_FIRESTORE_PATH = `boards/${DEMO_BOARD_ID}`;
