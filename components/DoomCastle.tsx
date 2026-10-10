/**
 * Pixel castle drawn as rects — Castle Doom by default, re-themed for each
 * world's boss fort.  Windows and the gate burn brighter as `glow` (0..1)
 * rises.
 */

const OUTLINE = "#0a0c12";

export interface CastleTheme {
  stone: string;
  light: string;
  dark: string;
  /** "r,g,b" of the window/gate light */
  glow: string;
  banner: string;
}

const DOOM_THEME: CastleTheme = { stone: "#3a4250", light: "#59637a", dark: "#232836", glow: "61,255,110", banner: "#0d5a26" };

function merlons(x0: number, x1: number, y: number, h = 3, w = 2, gap = 2) {
  const out: [number, number, number, number][] = [];
  for (let x = x0; x + w <= x1; x += w + gap) out.push([x, y, w, h]);
  return out;
}

export default function DoomCastle({
  glow = 0,
  className = "",
  theme = DOOM_THEME,
  flag,
}: {
  glow?: number;
  className?: string;
  theme?: CastleTheme;
  /** override the banner colour (a captured fort flies yours) */
  flag?: string;
}) {
  const g = Math.max(0.15, glow);
  const lit = `rgba(${theme.glow},${(0.35 + g * 0.65).toFixed(2)})`;
  const ember = `rgba(${theme.glow},${(0.2 + g * 0.6).toFixed(2)})`;
  const STONE = theme.stone;
  const STONE_LIGHT = theme.light;
  const STONE_DARK = theme.dark;
  const banner = flag ?? theme.banner;

  // [x, y, w, h]
  const towers: [number, number, number, number][] = [
    [0, 12, 12, 28],
    [52, 12, 12, 28],
  ];
  const wall: [number, number, number, number] = [12, 20, 40, 20];
  const keep: [number, number, number, number] = [22, 6, 20, 34];

  const crenels = [
    ...merlons(0, 12, 9),
    ...merlons(52, 64, 9),
    ...merlons(12, 52, 17, 3, 3, 2),
    ...merlons(22, 42, 3),
  ];

  const windows: [number, number][] = [
    [4, 18], [4, 26], [56, 18], [56, 26],
    [26, 12], [36, 12], [16, 25], [46, 25],
  ];

  return (
    <svg
      className={`doom-castle ${className}`}
      viewBox="0 0 64 40"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* banner pole + flag */}
      <rect x={5} y={0} width={1} height={10} fill={OUTLINE} />
      <rect x={6} y={0} width={7} height={4} fill={banner} />
      <rect x={6} y={0} width={7} height={1} fill="rgba(255,255,255,0.35)" />
      <rect x={9} y={1} width={2} height={2} fill="#9fb0c4" />

      {[...towers, wall, keep].map(([x, y, w, h], i) => (
        <g key={`b${i}`}>
          <rect x={x} y={y} width={w} height={h} fill={STONE} />
          <rect x={x} y={y} width={1} height={h} fill={STONE_LIGHT} />
          <rect x={x + w - 1} y={y} width={1} height={h} fill={STONE_DARK} />
        </g>
      ))}
      {crenels.map(([x, y, w, h], i) => (
        <rect key={`c${i}`} x={x} y={y} width={w} height={h} fill={STONE} />
      ))}

      {/* brick hints */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => (
          <rect
            key={`br${row}-${col}`}
            x={12 + col * 5 + (row % 2 ? 2 : 0)}
            y={22 + row * 3}
            width={2}
            height={1}
            fill={STONE_DARK}
          />
        )),
      )}

      {windows.map(([x, y], i) => (
        <g key={`w${i}`}>
          <rect x={x} y={y} width={3} height={4} fill={OUTLINE} />
          <rect x={x} y={y + 1} width={3} height={3} fill={lit} className="castle-window" style={{ animationDelay: `${i * 0.37}s` }} />
        </g>
      ))}

      {/* Doom's emblem over the gate */}
      <rect x={29} y={18} width={6} height={6} fill={OUTLINE} />
      <rect x={30} y={19} width={4} height={4} fill="#9fb0c4" />
      <rect x={30} y={20} width={1} height={1} fill={lit} />
      <rect x={33} y={20} width={1} height={1} fill={lit} />

      {/* gate */}
      <rect x={27} y={27} width={10} height={13} fill={OUTLINE} />
      <rect x={28} y={26} width={8} height={1} fill={OUTLINE} />
      <rect x={28} y={28} width={8} height={12} fill={ember} className="castle-gate" />
      {[29, 31, 33, 35].map((x) => (
        <rect key={`pc${x}`} x={x} y={28} width={1} height={12} fill={OUTLINE} opacity={0.7} />
      ))}
      <rect x={28} y={31} width={8} height={1} fill={OUTLINE} opacity={0.7} />
      <rect x={28} y={35} width={8} height={1} fill={OUTLINE} opacity={0.7} />
    </svg>
  );
}
