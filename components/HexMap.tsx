"use client";

import { Entry, PHASE_COLORS } from "@/lib/timeline";

interface Props {
  /** movies in display order */
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  /** group hexes into sector clusters (release order only) */
  showPhases: boolean;
  onSelect: (entry: Entry) => void;
}

/**
 * Sector map — every film is a hex node in a honeycomb strip. Cleared nodes
 * fill with their sector colour, the next target pulses amber, Doomsday is
 * the oversized green node at the end of the line.
 */
export default function HexMap({ entries, watched, upNextId, showPhases, onSelect }: Props) {
  const groups: { phase?: number; items: Entry[] }[] = [];
  for (const e of entries) {
    const key = showPhases ? e.phase : undefined;
    const last = groups[groups.length - 1];
    if (!last || last.phase !== key) groups.push({ phase: key, items: [e] });
    else last.items.push(e);
  }

  let index = 0;
  return (
    <div className="hexmap" role="list" aria-label="Sector map">
      {groups.map((g, gi) => (
        <div
          key={gi}
          className="hex-cluster"
          style={{ "--sector": g.phase !== undefined ? PHASE_COLORS[g.phase] : "var(--hud)" } as React.CSSProperties}
        >
          {g.phase !== undefined && <span className="hex-cluster-tag">S{String(g.phase).padStart(2, "0")}</span>}
          <div className="hex-strip">
            {g.items.map((e) => {
              index += 1;
              const isWatched = Boolean(watched[e.id]);
              const isNext = e.id === upNextId;
              const isFinal = e.id === "doomsday";
              return (
                <button
                  key={e.id}
                  role="listitem"
                  className={`hex ${isWatched ? "on" : ""} ${isNext ? "next" : ""} ${isFinal ? "final" : ""}`}
                  style={{ "--aura": e.wm.aura } as React.CSSProperties}
                  onClick={() => onSelect(e)}
                  title={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year})`}
                  aria-label={`${e.sub ? e.sub + " " : ""}${e.title}, ${isWatched ? "cleared" : isNext ? "next target" : "standby"}`}
                >
                  <span className="hex-shape" aria-hidden="true" />
                  <span className="hex-num" aria-hidden="true">
                    {isFinal ? "Ω" : String(index).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
