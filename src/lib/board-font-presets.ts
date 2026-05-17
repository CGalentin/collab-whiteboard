/** Canvas text font presets (PR 48). */
export const BOARD_FONT_FAMILIES = [
  { id: "sans", label: "Sans", value: "system-ui, sans-serif" },
  { id: "serif", label: "Serif", value: "Georgia, serif" },
  { id: "mono", label: "Mono", value: "ui-monospace, monospace" },
] as const;

export type BoardFontFamilyId = (typeof BOARD_FONT_FAMILIES)[number]["id"];

export const DEFAULT_BOARD_FONT_FAMILY = BOARD_FONT_FAMILIES[0].value;

export function boardFontFamilyFromId(
  id: string | undefined,
): string {
  const hit = BOARD_FONT_FAMILIES.find((f) => f.id === id);
  return hit?.value ?? DEFAULT_BOARD_FONT_FAMILY;
}

export function boardFontFamilyIdFromValue(
  value: string | undefined,
): BoardFontFamilyId {
  const hit = BOARD_FONT_FAMILIES.find((f) => f.value === value);
  return hit?.id ?? "sans";
}
