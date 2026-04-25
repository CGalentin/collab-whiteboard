/**
 * Default board fill colors (toolbar + sticky recolor), ROY order + neutrals.
 * `stroke` is a readable border on the sticky / shape chrome.
 */

export type BoardFillSwatch = {
  id: string;
  fill: string;
  stroke: string;
};

export const BOARD_PALETTE_SWATCHES: readonly BoardFillSwatch[] = [
  { id: "clear", fill: "rgba(0,0,0,0)", stroke: "#71717a" },
  { id: "red", fill: "#fecaca", stroke: "#991b1b" },
  { id: "orange", fill: "#fdba74", stroke: "#9a3412" },
  { id: "yellow", fill: "#fef08a", stroke: "#854d0e" },
  { id: "green", fill: "#86efac", stroke: "#166534" },
  { id: "blue", fill: "#93c5fd", stroke: "#1e3a8a" },
  { id: "indigo", fill: "#a5b4fc", stroke: "#312e81" },
  { id: "violet", fill: "#d8b4fe", stroke: "#5b21b6" },
  { id: "white", fill: "#ffffff", stroke: "#a1a1aa" },
  { id: "black", fill: "#171717", stroke: "#e5e5e5" },
] as const;

export type BoardPaletteChoice =
  | { kind: "swatch"; index: number }
  | { kind: "custom"; fill: string; stroke: string };

export function paletteChoiceToStyle(
  choice: BoardPaletteChoice,
): { fill: string; stroke: string } {
  if (choice.kind === "custom") {
    return { fill: choice.fill, stroke: choice.stroke };
  }
  const s = BOARD_PALETTE_SWATCHES[choice.index];
  if (!s) {
    return { fill: BOARD_PALETTE_SWATCHES[3]!.fill, stroke: BOARD_PALETTE_SWATCHES[3]!.stroke };
  }
  return { fill: s.fill, stroke: s.stroke };
}

/** Find swatch index when fill+stroke match a preset (exact). */
export function matchSwatchIndex(fill: string, stroke: string): number | null {
  const i = BOARD_PALETTE_SWATCHES.findIndex(
    (s) => s.fill === fill && s.stroke === stroke,
  );
  return i === -1 ? null : i;
}

/** Derive a contrasting stroke for arbitrary fill (hex or rgba). */
export function companionStrokeForFill(fill: string): string {
  const t = fill.trim();
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
    t,
  );
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    const a = rgba[4] !== undefined ? Number(rgba[4]) : 1;
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b))
      return "#52525b";
    if (a < 0.2) return "#52525b";
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return y > 165 ? "#27272a" : "#e5e5e5";
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!hex) return "#52525b";
  let r: number;
  let g: number;
  let b: number;
  const h = hex[1]!.toLowerCase();
  if (h.length === 3) {
    r = parseInt(h[0]! + h[0]!, 16);
    g = parseInt(h[1]! + h[1]!, 16);
    b = parseInt(h[2]! + h[2]!, 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y > 200 ? "#27272a" : "#e5e5e5";
}

/** Normalize to #rrggbb for `<input type="color">` (transparent → white). */
export function fillToHexForColorInput(fill: string): string {
  const t = fill.trim().toLowerCase();
  if (t === "rgba(0,0,0,0)" || t === "transparent") return "#ffffff";
  const rgba =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
      t,
    );
  if (rgba) {
    const r = Math.min(255, Math.max(0, Math.round(Number(rgba[1]))));
    const g = Math.min(255, Math.max(0, Math.round(Number(rgba[2]))));
    const b = Math.min(255, Math.max(0, Math.round(Number(rgba[3]))));
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      const to = (n: number) => n.toString(16).padStart(2, "0");
      return `#${to(r)}${to(g)}${to(b)}`;
    }
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(t);
  if (hex) return `#${hex[1]!.toLowerCase()}`;
  const short = /^#([0-9a-f]{3})$/i.exec(t);
  if (short) {
    const s = short[1]!.toLowerCase();
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return "#6366f1";
}
