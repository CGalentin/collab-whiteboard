/** Visual grid in `globals.css` and snap increment (px). */
export const BOARD_GRID_SIZE = 24;

export function snapCoordToGrid(value: number, grid = BOARD_GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}

/** Snap axis-aligned box edges to the grid (position + size). */
export function snapBoxToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  grid = BOARD_GRID_SIZE,
  minSize = 8,
): { x: number; y: number; width: number; height: number } {
  const sx = snapCoordToGrid(x, grid);
  const sy = snapCoordToGrid(y, grid);
  let ex = snapCoordToGrid(x + width, grid);
  let ey = snapCoordToGrid(y + height, grid);
  let w = ex - sx;
  let h = ey - sy;
  if (w < minSize) {
    w = minSize;
    ex = sx + w;
  }
  if (h < minSize) {
    h = minSize;
    ey = sy + h;
  }
  return { x: sx, y: sy, width: w, height: h };
}
