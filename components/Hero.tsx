"use client";

import { useEffect, useState } from "react";
import { DOOMSDAY_DATE, Entry, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import { TitleInfo } from "@/lib/tmdb";
import { ArtMap, posterAt } from "@/lib/useArtwork";
import { paceLine, useCountdown } from "@/lib/useCountdown";
import Wordmark from "./Wordmark";

interface Props {
  /** next unwatched movie, or the finale once everything else is done */
  entry: Entry;
  /** 1-based slot in the current watch order */
  position: number;
  total: number;
  watchedCount: number;
  allDone: boolean;
  /** every movie on the road, in order — drawn as a strip of frames */
  reel: { id: string; aura: string; on: boolean }[];
  art: ArtMap;
  onOpen: (entry: Entry) => void;
  onToggle: (entry: Entry) => void;
}

/** Cinematic "Now showing" spotlight on the next movie plus the big Doomsday clock. */
export default function Hero({ entry, position, total, watchedCount, allDone, reel, art, onOpen, onToggle }: Props) {
  const cd = useCountdown(DOOMSDAY_DATE);
  const [info, setInfo] = useState<TitleInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    fetch(`/api/title/${entry.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TitleInfo | null) => !cancelled && setInfo(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [entry.id]);

  const backdrop = art[entry.id]?.backdrop ?? info?.backdrop ?? null;
  const poster = posterAt(art[entry.id]?.poster ?? info?.poster, "w500");
  const remaining = total - watchedCount;
  const pct = total ? (watchedCount / total) * 100 : 0;
  const pace = paceLine(cd?.days, remaining);
  const phaseName = entry.phase !== undefined ? PHASE_LABELS[entry.phase].split("—")[0].trim() : null;
  const phaseColor = entry.phase !== undefined ? PHASE_COLORS[entry.phase] : entry.wm.aura;

  const units = cd
    ? [
        { v: cd.days, l: "Days" },
        { v: cd.hours, l: "Hours" },
        { v: cd.mins, l: "Min" },
        { v: cd.secs, l: "Sec" },
      ]
    : null;

  return (
    <section
      className={`hero ${backdrop ? "has-art" : ""}`}
      style={{ "--aura": entry.wm.aura, "--phase-color": phaseColor } as React.CSSProperties}
    >
      {/* backdrop layer — keyed so a new movie cross-fades in */}
      <div key={entry.id} className="hero-bg">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-bg-img" src={backdrop} alt="" />
        ) : (
          <div className="hero-bg-fallback" style={{ backgroundImage: entry.wm.gradient }} />
        )}
      </div>
      <div className="hero-shade" />
      <div className="hero-beam" />

      <div className="hero-inner mx-auto max-w-6xl px-4">
        <div key={entry.id} className="hero-copy">
          <div className="hero-kicker">
            <span className="hero-dot" />
            {allDone ? "Final feature" : "Now showing"}
            <span className="hero-kicker-sep" />
            <span className="text-white/55">
              No. {String(position).padStart(2, "0")} of {total + 1}
              {phaseName ? ` · ${phaseName}` : ""}
            </span>
          </div>

          {entry.sub && <div className="hero-sub">{entry.sub}</div>}
          <h2 className="hero-title">
            <Wordmark entry={entry} base={3.1} />
          </h2>

          <div className="hero-meta">
            <span>{info?.releaseDate?.slice(0, 4) ?? entry.year}</span>
            {info?.runtime ? (
              <span>
                {Math.floor(info.runtime / 60)}h {info.runtime % 60}m
              </span>
            ) : null}
            {info?.genres?.slice(0, 2).map((g) => <span key={g}>{g}</span>)}
            {info?.score ? <span className="hero-score">★ {Math.round(info.score * 10)}%</span> : null}
          </div>

          {(info?.tagline || info?.overview) && (
            <p className="hero-overview">{info?.tagline ? `“${info.tagline}”` : info?.overview}</p>
          )}

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onOpen(entry)}>
              <span aria-hidden="true">▶</span> Details &amp; where to watch
            </button>
            {!allDone && (
              <button className="btn-ghost" onClick={() => onToggle(entry)}>
                <span aria-hidden="true">✓</span> Mark watched
              </button>
            )}
          </div>
        </div>

        {poster && (
          <button key={`p-${entry.id}`} className="hero-poster" onClick={() => onOpen(entry)} aria-label={`Open ${entry.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt="" />
          </button>
        )}
      </div>

      {/* the Doomsday clock */}
      <div className="hero-clock mx-auto max-w-6xl px-4">
        <div className="clock-panel">
          <div className="clock-units" suppressHydrationWarning>
            {units
              ? units.map((u) => (
                  <div key={u.l} className="clock-unit">
                    <span className="clock-num">{u.l === "Days" ? u.v : String(u.v).padStart(2, "0")}</span>
                    <span className="clock-lbl">{u.l}</span>
                  </div>
                ))
              : <div className="h-[3.4rem]" />}
            <div className="clock-caption">
              until <strong>Avengers: Doomsday</strong>
            </div>
          </div>

          <div className="clock-progress">
            <div className="flex items-baseline justify-between gap-4">
              <span className="clock-count">
                <strong>{watchedCount}</strong>
                <span className="text-white/45"> / {total} watched</span>
              </span>
              <span className="clock-pct">{Math.round(pct)}%</span>
            </div>
            <div className="reel-meter" aria-hidden="true">
              {reel.map((f) => (
                <span
                  key={f.id}
                  className={`reel-cell ${f.on ? "on" : ""} ${f.id === entry.id ? "here" : ""}`}
                  style={{ "--c": f.aura } as React.CSSProperties}
                />
              ))}
            </div>
            {pace && <div className="clock-pace">{pace}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
