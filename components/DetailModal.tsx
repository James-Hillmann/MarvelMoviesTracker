"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Entry } from "@/lib/timeline";
import { burstPoints } from "@/lib/comic";
import { TitleInfo } from "@/lib/tmdb";
import Wordmark from "./Wordmark";

interface Props {
  entry: Entry;
  watched: boolean;
  onToggle: (entry: Entry) => void;
  onClose: () => void;
}

const SCORE_BURST = burstPoints(12, 0.74, 5);

function searchUrl(entry: Entry) {
  const q = encodeURIComponent([entry.sub === "Thunderbolts*" ? "Thunderbolts" : entry.sub, entry.title].filter(Boolean).join(" "));
  return {
    disney: `https://www.disneyplus.com/search?q=${q}`,
    justwatch: `https://www.justwatch.com/us/search?q=${q}`,
  };
}

export default function DetailModal({ entry, watched, onToggle, onClose }: Props) {
  const [info, setInfo] = useState<TitleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoading(true);
    fetch(`/api/title/${entry.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TitleInfo | null) => {
        if (!cancelled) {
          setInfo(data);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entry.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const links = searchUrl(entry);
  const score = info?.score ? Math.round(info.score * 10) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ "--aura": entry.wm.aura } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={entry.title}
      >
        {/* backdrop header, screened like a printed panel */}
        <div className="modal-hero h-48 w-full sm:h-60">
          {info?.backdrop ? (
            <Image src={info.backdrop} alt="" fill className="object-cover" sizes="680px" priority />
          ) : (
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: entry.wm.gradient }} />
          )}
          <div className="screen" />
          <div className="title-caption">
            {entry.sub && <div className="sub-label mb-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em]">{entry.sub}</div>}
            <Wordmark entry={entry} base={1.9} />
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex gap-5 p-5">
          {info?.poster && (
            <div className="modal-poster relative hidden h-[186px] w-[124px] shrink-0 overflow-hidden sm:block">
              <Image src={info.poster} alt={`${entry.title} poster`} fill className="object-cover" sizes="124px" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-bold">
                <span className="f-bangers text-xl tracking-wide">{info?.releaseDate?.slice(0, 4) ?? entry.year}</span>
                {info?.runtime ? <span>{Math.floor(info.runtime / 60)}h {info.runtime % 60}m</span> : null}
                {info?.seasons ? (
                  <span>
                    {info.seasons} season{info.seasons > 1 ? "s" : ""} · {info.episodes} eps
                  </span>
                ) : null}
                {info?.genres?.slice(0, 3).map((g) => (
                  <span key={g} className="tag-chip">
                    {g}
                  </span>
                ))}
              </div>
              {score !== null && (
                <div
                  className="score-burst -mt-2"
                  style={{ "--score-color": score >= 70 ? "#2bd456" : score >= 50 ? "#ffd23f" : "#e62429" } as React.CSSProperties}
                  title={`${info?.votes?.toLocaleString()} ratings on TMDB`}
                >
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <polygon points={SCORE_BURST} />
                  </svg>
                  <span>{score}%</span>
                </div>
              )}
            </div>

            {info?.tagline && <p className="tagline-bubble mt-3">“{info.tagline}”</p>}

            <p className="mt-3 text-sm leading-relaxed">
              {loading
                ? "Summoning intel…"
                : info?.overview ??
                  (info && !info.configured
                    ? "Add a free TMDB API key to see posters, synopses and reviews — see the README."
                    : "No intel available for this one yet — it may not be out.")}
            </p>

            {info?.cast && info.cast.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto px-0.5 pb-2">
                {info.cast.map((c) => (
                  <div key={c.name} className="w-14 shrink-0 text-center">
                    {c.profile ? (
                      <Image
                        src={c.profile}
                        alt={c.name}
                        width={56}
                        height={56}
                        className="cast-face h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="cast-face flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--yellow)] f-bangers text-xl">
                        {c.name[0]}
                      </div>
                    )}
                    <div className="mt-1 truncate text-[10px] font-bold" title={`${c.name} as ${c.character}`}>
                      {c.name.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions flex flex-wrap items-center gap-3 px-5 py-4">
          <a className="btn-comic btn-disney" href={links.disney} target="_blank" rel="noopener noreferrer">
            ▶ Watch on Disney+
          </a>
          <a className="link-ink" href={links.justwatch} target="_blank" rel="noopener noreferrer">
            All streaming options
          </a>
          <button
            className={`btn-comic btn-watched ml-auto ${watched ? "is-watched" : ""}`}
            onClick={() => onToggle(entry)}
          >
            {watched ? "↺ Unwatch" : "✓ Mark watched!"}
          </button>
        </div>
      </div>
    </div>
  );
}
