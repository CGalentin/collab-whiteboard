/**
 * PR 30: safe http(s) links only. Client-side validation before open / persist.
 */
export function normalizeBoardHref(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  let u: URL;
  try {
    const withProto = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
    u = new URL(withProto);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return u.href;
}

export function openBoardHrefInNewTab(href: string): void {
  const n = normalizeBoardHref(href);
  if (!n) return;
  window.open(n, "_blank", "noopener,noreferrer");
}
