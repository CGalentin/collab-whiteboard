/** Canvas text font presets (PR 48). */
export const BOARD_FONT_FAMILIES = [
  { id: "arial", label: "Arial", value: "Arial, sans-serif" },
  { id: "verdana", label: "Verdana", value: "Verdana, sans-serif" },
  { id: "tahoma", label: "Tahoma", value: "Tahoma, sans-serif" },
  {
    id: "trebuchet-ms",
    label: "Trebuchet MS",
    value: "Trebuchet MS, sans-serif",
  },
  {
    id: "times-new-roman",
    label: "Times New Roman",
    value: "Times New Roman, serif",
  },
  { id: "georgia", label: "Georgia", value: "Georgia, serif" },
  { id: "garamond", label: "Garamond", value: "Garamond, serif" },
  {
    id: "courier-new",
    label: "Courier New",
    value: "Courier New, monospace",
  },
  {
    id: "brush-script-mt",
    label: "Brush Script MT",
    value: "Brush Script MT, cursive",
  },
] as const;

export type BoardFontFamilyId = (typeof BOARD_FONT_FAMILIES)[number]["id"];

export const DEFAULT_BOARD_FONT_FAMILY = BOARD_FONT_FAMILIES[0].value;

/** Maps retired generic presets to a named face for the toolbar select. */
const LEGACY_FONT_VALUE_TO_ID: Partial<Record<string, BoardFontFamilyId>> = {
  "system-ui, sans-serif": "arial",
  "Georgia, serif": "georgia",
  "ui-monospace, monospace": "courier-new",
};

function primaryFontName(value: string): string {
  return value.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function boardFontFamilyFromId(
  id: string | undefined,
): string {
  const hit = BOARD_FONT_FAMILIES.find((f) => f.id === id);
  return hit?.value ?? DEFAULT_BOARD_FONT_FAMILY;
}

export function boardFontFamilyIdFromValue(
  value: string | undefined,
): BoardFontFamilyId {
  if (!value) return "arial";
  const exact = BOARD_FONT_FAMILIES.find((f) => f.value === value);
  if (exact) return exact.id;
  const legacy = LEGACY_FONT_VALUE_TO_ID[value];
  if (legacy) return legacy;
  const primary = primaryFontName(value);
  const byPrimary = BOARD_FONT_FAMILIES.find(
    (f) => primaryFontName(f.value) === primary,
  );
  return byPrimary?.id ?? "arial";
}
