/** Conservatively allow URL-safe ids for board docs and routes. */
const BOARD_ID_RE = /^[A-Za-z0-9_-]{3,120}$/;

export function isValidBoardId(raw: string): boolean {
  return BOARD_ID_RE.test(raw);
}

export function assertBoardId(raw: string): string {
  const next = raw.trim();
  if (!isValidBoardId(next)) {
    throw new Error(
      "Invalid board id. Use 3-120 characters: letters, numbers, underscore, dash.",
    );
  }
  return next;
}

export function boardFirestorePath(boardId: string): string {
  return `boards/${boardId}`;
}

/** Default title assigned when a board is created (matches `ensureBoardAccess`). */
export function defaultBoardTitle(boardId: string): string {
  return `Board ${boardId.slice(0, 8)}`;
}

export function isDefaultBoardTitle(boardId: string, title: string): boolean {
  return title.trim() === defaultBoardTitle(boardId);
}
