"use client";

import { Profile, PROFILES } from "@/lib/profiles";
import { MOVIES } from "@/lib/timeline";
import { ArtMap, posterAt } from "@/lib/useArtwork";
import Wordmark from "./Wordmark";

/** three slow drifting rows of posters (or title cards until art arrives) */
function PosterMarquee({ art }: { art: ArtMap }) {
  const rows = [0, 1, 2].map((r) => MOVIES.filter((_, i) => i % 3 === r));
  return (
    <div className="marquee" aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={`marquee-row ${r % 2 ? "rev" : ""}`} style={{ animationDuration: `${90 + r * 25}s` }}>
          {[...row, ...row].map((e, i) => {
            const poster = posterAt(art[e.id]?.poster, "w185");
            return (
              <div key={`${e.id}-${i}`} className="marquee-tile" style={{ "--aura": e.wm.aura } as React.CSSProperties}>
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" loading="lazy" />
                ) : (
                  <div className="marquee-fallback">
                    {e.sub && <span className="sub-label">{e.sub}</span>}
                    <Wordmark entry={e} base={0.95} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Full-screen "who's watching?" gate, shown until a profile is picked. */
export default function ProfilePicker({ onPick, art }: { onPick: (p: Profile) => void; art: ArtMap }) {
  return (
    <div className="picker-overlay">
      <PosterMarquee art={art} />
      <div className="picker-scrim" />
      <div className="picker-content text-center">
        <div className="picker-kicker">
          <span className="brand-dot" aria-hidden="true" /> Road to Doomsday
        </div>
        <h1 className="picker-title">Who&apos;s watching?</h1>
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              className="picker-card"
              style={{ "--aura": p.color, animationDelay: `${0.25 + i * 0.12}s` } as React.CSSProperties}
              onClick={() => onPick(p)}
            >
              <span className="picker-avatar" aria-hidden="true">
                {p.label
                  .split(/\s*&\s*|\s+/)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="picker-name">{p.label}</span>
            </button>
          ))}
        </div>
        <p className="picker-foot">Each crew gets its own trail</p>
      </div>
    </div>
  );
}
