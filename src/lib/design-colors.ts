/**
 * Product palette — primary teal + complementary purples.
 *
 * **Tailwind:** same names are registered in `src/app/globals.css` (`@theme inline`)
 * as `brand-teal`, `brand-teal-hover`, `accent-lavender`, `accent-violet`
 * (e.g. `bg-brand-teal`, `text-accent-violet`, `border-accent-lavender/40`).
 *
 * Keep hex values in sync when you tweak the theme.
 */
export const productPalette = {
  brandTeal: "#128C7E",
  brandTealHover: "#0f7569",
  /** Muted lavender — backgrounds, soft borders, illustrations */
  accentLavender: "#BFA9D3",
  /** Electric violet — high-contrast accents, links, “pop” CTAs vs green */
  accentViolet: "#BA31D4",
} as const;

export type ProductPalette = typeof productPalette;
