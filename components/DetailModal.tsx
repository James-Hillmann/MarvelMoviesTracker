"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/lib/chiptune";
import { ICONS, iconFor } from "@/lib/sprites";
import { Entry, PHASE_BOSSES } from "@/lib/timeline";
import { TitleInfo } from "@/lib/tmdb";
import PixelImage from "./PixelImage";
import PixelSprite from "./PixelSprite";

interface Props {
  entry: Entry;
  watched: boolean;
  onToggle: (entry: Entry) => void;
  onClose: () => void;
}

function searchUrl(entry: Entry) {
  const q = encodeURIComponent([entry.sub === "Thunderbolts*" ? "Thunderbolts" : entry.sub, entry.title].filter(Boolean).join(" "));
  return {
    disney: `https://www.disneyplus.com/search?q=${q}`,
    justwatch: `https://www.justwatch.com/us/search?q=${q}`,
  };
}

/** RPG-style text crawl; click the box to skip to the end */
function useTypewriter(text: string, speed = 14) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(t);
          return v;
        }
        return v + 2;
      });
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

function StatBar({ value, color }: { value: number; color: string }) {
  const blocks = 10;
  const on = Math.round((value / 100) * blocks);
  return (
    <span className="stat-bar" style={{ "--stat-color": color } as React.CSSProperties}>
      {Array.from({ length: blocks }, (_, i) => (
        <span key={i} className={i < on ? "on" : ""} />
      ))}
    </span>
  );
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

  const close = () => {
    sfx.back();
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sfx.back();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const links = searchUrl(entry);
  const score = info?.score ? Math.round(info.score * 10) : null;
  const scoreColor = score === null ? "#888" : score >= 70 ? "#3dff6e" : score >= 50 ? "#ffd84a" : "#ff3048";

  const overview = loading
    ? "Loading save data…"
    : info?.overview ??
      (info && !info.configured
        ? "Add a free TMDB API key to see posters, synopses and reviews — see the README."
        : "No intel on this stage yet — it may not be out.");
  const crawl = useTypewriter(overview);
  const boss = entry.phase !== undefined ? PHASE_BOSSES[entry.phase] : undefined;
  const runtime = info?.runtime ? `${Math.floor(info.runtime / 60)}H ${String(info.runtime % 60).padStart(2, "0")}M` : null;

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="rpg-window"
        style={{ "--aura": entry.wm.aura } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={entry.title}
      >
        {/* title bar over a pixelated backdrop */}
        <div className="rpg-head">
          {info?.backdrop && <PixelImage className="rpg-backdrop" src={info.backdrop} pixels={120} aspect={16 / 6} levels={6} />}
          <div className="rpg-head-shade" />
          <div className="rpg-head-row">
            <div className="rpg-emblem">
              <PixelSprite sprite={ICONS[iconFor(entry.id)]} scale={5} aura={entry.wm.aura} />
            </div>
            <div className="min-w-0">
              {entry.sub && <div className="rpg-sub">{entry.sub}</div>}
              <h2 className="rpg-title">{entry.title}</h2>
              <div className="rpg-tags">
                {entry.phase !== undefined && <span>WORLD {entry.phase}</span>}
                <span>{entry.type === "movie" ? "MAIN QUEST" : entry.type === "netflix" ? "BONUS STAGE" : "SIDE QUEST"}</span>
                {watched && <span className="rpg-cleared">★ CLEARED</span>}
              </div>
            </div>
          </div>
          <button className="rpg-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="rpg-body">
          <div className="rpg-poster">
            {info?.poster ? (
              <PixelImage src={info.poster} pixels={64} aspect={2 / 3} levels={7} alt={`${entry.title} poster`} />
            ) : (
              <div className="rpg-poster-empty">
                <PixelSprite sprite={ICONS[iconFor(entry.id)]} scale={6} aura={entry.wm.aura} />
                <span>{loading ? "LOADING" : "NO IMAGE"}</span>
              </div>
            )}
          </div>

          <div className="rpg-stats">
            <dl className="stat-sheet">
              <div>
                <dt>YEAR</dt>
                <dd>{info?.releaseDate?.slice(0, 4) ?? entry.year}</dd>
              </div>
              {runtime && (
                <div>
                  <dt>TIME</dt>
                  <dd>{runtime}</dd>
                </div>
              )}
              {info?.seasons ? (
                <div>
                  <dt>SEASONS</dt>
                  <dd>
                    {info.seasons} · {info.episodes} EPS
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>RATING</dt>
                <dd title={info?.votes ? `${info.votes.toLocaleString()} ratings on TMDB` : undefined}>
                  {score !== null ? (
                    <>
                      <StatBar value={score} color={scoreColor} /> <span style={{ color: scoreColor }}>{score}%</span>
                    </>
                  ) : (
                    <span className="stat-dim">???</span>
                  )}
                </dd>
              </div>
              {info?.genres && info.genres.length > 0 && (
                <div>
                  <dt>CLASS</dt>
                  <dd>{info.genres.slice(0, 3).join(" / ").toUpperCase()}</dd>
                </div>
              )}
              {boss && (
                <div>
                  <dt>BOSS</dt>
                  <dd>{boss.name.toUpperCase()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="rpg-dialog" onClick={crawl.skip}>
          {info?.tagline && <p className="rpg-tagline">“{info.tagline}”</p>}
          <p className="rpg-text">
            {crawl.shown}
            {!crawl.done && <span className="rpg-cursor">▌</span>}
          </p>
          {crawl.done && <span className="rpg-more">▼</span>}
        </div>

        {info?.cast && info.cast.length > 0 && (
          <div className="rpg-party">
            <div className="rpg-party-label">PARTY</div>
            <div className="rpg-party-row">
              {info.cast.map((c) => (
                <div key={c.name} className="party-member" title={`${c.name} as ${c.character}`}>
                  <div className="party-face">
                    {c.profile ? (
                      <PixelImage src={c.profile} pixels={18} aspect={1} levels={6} alt={c.name} />
                    ) : (
                      <span>{c.name[0]}</span>
                    )}
                  </div>
                  <div className="party-name">{c.name.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rpg-actions">
          <a className="px-btn px-btn-blue" href={links.disney} target="_blank" rel="noopener noreferrer" onClick={() => sfx.select()}>
            ▶ DISNEY+
          </a>
          <a className="px-link" href={links.justwatch} target="_blank" rel="noopener noreferrer">
            ALL STREAMING
          </a>
          <button className={`px-btn ml-auto ${watched ? "px-btn-dim" : "px-btn-green"}`} onClick={() => onToggle(entry)}>
            {watched ? "↺ RESET STAGE" : "✓ CLEAR STAGE"}
          </button>
        </div>
      </div>
    </div>
  );
}
