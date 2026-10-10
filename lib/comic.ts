/**
 * Comic-book helpers shared by the board, the header and the DOM-built
 * celebrations: sound effects, starburst outlines and the CMYK ink palette.
 */

export const INK = "#141414";
export const COMIC_RED = "#e62429";
export const COMIC_YELLOW = "#ffd23f";
export const COMIC_BLUE = "#2a5bd7";

const SFX = ["POW!", "BAM!", "WHAM!", "ZAP!", "KRAK!", "BOOM!", "THWIP!", "SMASH!", "KA-POW!", "ZOINK!", "BLAM!", "WHOOSH!"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** stable sound effect per title so a stamp never changes between renders */
export function sfxFor(id: string) {
  return SFX[hash(id) % SFX.length];
}

export function randomSfx() {
  return SFX[Math.floor(Math.random() * SFX.length)];
}

/** stable small tilt (-3..3deg) so panels look hand-laid without jitter */
export function tiltFor(id: string, max = 3) {
  return ((hash(id + "tilt") % 1000) / 1000 - 0.5) * 2 * max;
}

/**
 * Jagged starburst outline as an SVG points string in a 0..100 box.
 * Deterministic for a given seed.
 */
export function burstPoints(spikes = 14, inner = 0.68, seed = 1) {
  const pts: string[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < spikes * 2; i++) {
    const outer = i % 2 === 0;
    const r = (outer ? 0.5 : 0.5 * inner) * (outer ? 0.9 + rand() * 0.1 : 0.92 + rand() * 0.16);
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(50 + Math.cos(a) * r * 100).toFixed(1)},${(50 + Math.sin(a) * r * 100).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** same outline as a CSS clip-path polygon */
export function burstClipPath(spikes = 14, inner = 0.68, seed = 1) {
  return `polygon(${burstPoints(spikes, inner, seed)
    .split(" ")
    .map((p) => {
      const [x, y] = p.split(",");
      return `${x}% ${y}%`;
    })
    .join(", ")})`;
}

/**
 * Lay a run of stories out as comic pages: rows of mixed-width panels
 * (spans sum to `cols`), a few rows per page.  Row patterns cycle so pages
 * read like a hand-drawn layout instead of a uniform grid.
 */
export function layoutPages<T>(items: T[], cols: 6 | 2): { item: T; span: number; tall: boolean }[][] {
  const patterns: number[][] =
    cols === 6 ? [[4, 2], [2, 2, 2], [3, 3], [2, 4], [2, 2, 2], [3, 3]] : [[2], [1, 1], [1, 1]];
  const rowsPerPage = cols === 6 ? 3 : 4;
  const rows: { item: T; span: number; tall: boolean }[][] = [];
  let i = 0;
  let p = 0;
  while (i < items.length) {
    const left = items.length - i;
    let row = patterns[p++ % patterns.length];
    if (row.length > left) {
      // leftovers still fill the width
      row = left === 1 ? [cols] : left === 2 ? [cols / 2, cols / 2] : [2, 2, 2];
    }
    rows.push(row.map((span) => ({ item: items[i++], span, tall: cols === 6 && span >= 4 })));
  }
  const pages: { item: T; span: number; tall: boolean }[][] = [];
  for (let r = 0; r < rows.length; r += rowsPerPage) pages.push(rows.slice(r, r + rowsPerPage).flat());
  return pages;
}
