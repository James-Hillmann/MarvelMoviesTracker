import { Hero, Sprite } from "@/lib/sprites";

interface Props {
  sprite: Sprite;
  /** screen pixels per art pixel */
  scale?: number;
  /** fills the "A" palette slot */
  aura?: string;
  className?: string;
  title?: string;
}

/** Renders a palette sprite as crisp SVG rects, merging horizontal runs. */
export default function PixelSprite({ sprite, scale = 4, aura = "#ffffff", className, title }: Props) {
  const { rows, palette } = sprite;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const fill = ch === "A" ? aura : palette[ch];
      if (ch !== "." && fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      x += run;
    }
  });
  return (
    <svg
      className={className}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

/** A hero's two walk frames stacked; CSS steps() flips between them. */
export function HeroSprite({ hero, scale = 3, className = "" }: { hero: Hero; scale?: number; className?: string }) {
  return (
    <span className={`hero ${className}`} title={hero.name}>
      <PixelSprite sprite={hero.frames[0]} scale={scale} className="hero-f0" />
      <PixelSprite sprite={hero.frames[1]} scale={scale} className="hero-f1" />
    </span>
  );
}

/** the profile's party, side by side */
export function HeroParty({ heroes, scale = 3, className = "" }: { heroes: Hero[]; scale?: number; className?: string }) {
  return (
    <span className={`hero-party ${className}`}>
      {heroes.map((h, i) => (
        <HeroSprite key={h.name} hero={h} scale={scale} className={i % 2 ? "hero-offbeat" : ""} />
      ))}
    </span>
  );
}
