/** Visual grid in `globals.css` and snap increment (px). */
export const BOARD_GRID_SIZE = 24;

export function snapCoordToGrid(value: number, grid = BOARD_GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}
