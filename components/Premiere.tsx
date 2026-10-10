"use client";

import { DOOMSDAY_DATE, Entry } from "@/lib/timeline";
import { ArtMap, posterAt } from "@/lib/useArtwork";
import { useCountdown } from "@/lib/useCountdown";
import Wordmark from "./Wordmark";

function Bulbs({ row, watched }: { row: Entry[]; watched: Record<string, number> }) {
  return (
    <div className="bulbs" aria-hidden="true">
      {row.map((e, i) => (
        <span
          key={e.id}
          className={`bulb ${watched[e.id] ? "on" : ""}`}
          title={e.sub ? `${e.sub} ${e.title}` : e.title}
          style={{ "--b": e.wm.aura, animationDelay: `${(i % 6) * 0.18}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

interface Props {
  finale: Entry;
  /** the movies before it, in watch order — one marquee bulb each */
  road: Entry[];
  watched: Record<string, number>;
  art: ArtMap;
  onSelect: (e: Entry) => void;
  onToggle: (e: Entry, origin?: Element | null) => void;
}

/**
 * The finish line as an opening-night theatre marquee: one bulb per movie on
 * the road, lit as you watch them.  Light them all and the house is ready.
 */
export default function Premiere({ finale, road, watched, art, onSelect, onToggle }: Props) {
  const cd = useCountdown(DOOMSDAY_DATE);
  const lit = road.filter((e) => watched[e.id]).length;
  const ready = lit === road.length;
  const half = Math.ceil(road.length / 2);
  const rows = [road.slice(0, half), road.slice(half)];
  const backdrop = art[finale.id]?.backdrop ?? null;
  const poster = posterAt(art[finale.id]?.poster, "w500");
  const seen = Boolean(watched[finale.id]);

  return (
    <section
      className={`premiere ${ready ? "ready" : ""}`}
      style={{ "--aura": finale.wm.aura, "--glow": road.length ? lit / road.length : 0 } as React.CSSProperties}
    >
      <div className="premiere-kicker">Opening night · Dec 18, 2026</div>

      <div className="marquee-sign">
        <Bulbs row={rows[0]} watched={watched} />
        <button className="marquee-title" onClick={() => onSelect(finale)}>
          <span className="sub-label">{finale.sub}</span>
          <Wordmark entry={finale} base={3} />
        </button>
        <Bulbs row={rows[1]} watched={watched} />
        <div className="marquee-meta">
          <span>
            <strong>{lit}</strong> / {road.length} lights on
          </span>
          <span suppressHydrationWarning>
            {seen ? "Seen it. Excelsior." : cd ? (cd.days > 0 ? `Doors open in ${cd.days} days` : "Now playing") : ""}
          </span>
        </div>
      </div>

      <div className="screen">
        <div className="screen-glow" />
        <button className="screen-face" onClick={() => onSelect(finale)} aria-label={`Open ${finale.title}`}>
          {backdrop || poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(backdrop ?? poster) as string} alt="" />
          ) : (
            <span className="screen-fallback" style={{ backgroundImage: finale.wm.gradient }} />
          )}
          {!seen && cd && (
            <span className="leader" aria-hidden="true">
              <span className="leader-sweep" />
              <span className="leader-num" suppressHydrationWarning>
                {cd.days}
              </span>
              <span className="leader-lbl">days</span>
            </span>
          )}
          <span className="screen-text">{ready ? "The house is ready." : "Light every bulb before the doors open."}</span>
        </button>
        <div className="seats" aria-hidden="true" />
      </div>

      {(ready || seen) && (
        <button className={`btn-ghost premiere-seen ${seen ? "is-watched" : ""}`} onClick={(ev) => onToggle(finale, ev.currentTarget)}>
          {seen ? "↺ Unwatch Doomsday" : "✓ I've seen Doomsday"}
        </button>
      )}
    </section>
  );
}
