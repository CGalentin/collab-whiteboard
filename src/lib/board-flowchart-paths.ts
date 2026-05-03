/** SVG path `d` strings in local box 0–w, 0–h for Konva `Path` flowchart shapes. */

export function documentPathData(w: number, h: number): string {
  const t = h * 0.66;
  const wv = h * 0.07;
  return [
    `M 0 0`,
    `L ${w} 0`,
    `L ${w} ${t}`,
    `Q ${w * 0.78} ${t + wv} ${w * 0.55} ${t - wv * 0.3}`,
    `Q ${w * 0.35} ${t - wv * 1.2} ${w * 0.18} ${t + wv * 0.4}`,
    `Q ${w * 0.08} ${t + wv} 0 ${t}`,
    `Z`,
  ].join(" ");
}

export function storedDataPathData(w: number, h: number): string {
  const xl = w * 0.14;
  const xr = w * 0.86;
  const yt = h * 0.12;
  const yb = h * 0.88;
  const bulge = w * 0.1;
  return [
    `M ${xl} ${yt}`,
    `L ${xr} ${yt}`,
    `Q ${xr + bulge} ${(yt + yb) / 2} ${xr} ${yb}`,
    `L ${xl} ${yb}`,
    `Q ${xl - bulge} ${(yt + yb) / 2} ${xl} ${yt}`,
    `Z`,
  ].join(" ");
}

/** Pointed left, semicircle on the right (flowchart “display”). */
export function displayPathData(w: number, h: number): string {
  const r = h / 2;
  const xr = Math.max(r + 1, w - r);
  const nx = Math.min(0.34 * w, Math.max(4, xr - r - 2));
  return `M 0 ${h / 2} L ${nx} 0 H ${xr} A ${r} ${r} 0 0 1 ${xr} ${h} H ${nx} Z`;
}
