"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Entry, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import { TitleInfo } from "@/lib/tmdb";
import Wordmark from "../Wordmark";

interface Props {
  entry: Entry;
  watched: boolean;
  onToggle: (entry: Entry) => void;
  onClose: () => void;
}

function links(entry: Entry) {
  const q = encodeURIComponent([entry.sub === "Thunderbolts*" ? "Thunderbolts" : entry.sub, entry.title].filter(Boolean).join(" "));
  return { disney: `https://www.disneyplus.com/search?q=${q}`, justwatch: `https://www.justwatch.com/us/search?q=${q}` };
}

/**
 * Details for the 3D view: a holographic "universe dossier" that slides in
 * over the left of the scene, leaving the world you're orbiting visible.
 */
export default function Dossier({ entry, watched, onToggle, onClose }: Props) {
  const [info, setInfo] = useState<TitleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoading(true);
    fetch(`/api/title/${entry.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TitleInfo | null) => {
        if (!cancelled) {
          setInfo(d);
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
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const score = info?.score ? Math.round(info.score * 10) : null;
  const l = links(entry);
  const designation = `E-${String(entry.tmdbId ?? entry.year).slice(-5)}`;

  return (
    <div className="dossier-scrim" onClick={onClose}>
      <aside
        className="dossier"
        style={{ "--aura": entry.wm.aura } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={entry.title}
      >
        <div className="dossier-scan" aria-hidden="true" />
        <div className="dossier-top">
          <span>Universe dossier · {designation}</span>
          <button onClick={onClose} aria-label="Close" className="dossier-x">
            ✕
          </button>
        </div>

        <div className="dossier-hero">
          {info?.backdrop && <Image src={info.backdrop} alt="" fill className="dossier-backdrop" sizes="520px" />}
          {info?.poster && (
            <div className="dossier-poster">
              <Image src={info.poster} alt={`${entry.title} poster`} fill sizes="150px" className="object-cover" />
            </div>
          )}
          <div className="dossier-title">
            {entry.sub && <div className="dossier-sub">{entry.sub}</div>}
            <Wordmark entry={entry} base={2.2} />
          </div>
        </div>

        <dl className="dossier-stats">
          <div>
            <dt>Released</dt>
            <dd>{info?.releaseDate?.slice(0, 4) ?? entry.year}</dd>
          </div>
          {info?.runtime ? (
            <div>
              <dt>Runtime</dt>
              <dd>
                {Math.floor(info.runtime / 60)}h {info.runtime % 60}m
              </dd>
            </div>
          ) : null}
          {info?.seasons ? (
            <div>
              <dt>Seasons</dt>
              <dd>
                {info.seasons} · {info.episodes} eps
              </dd>
            </div>
          ) : null}
          {entry.phase !== undefined && (
            <div>
              <dt>Sector</dt>
              <dd style={{ color: PHASE_COLORS[entry.phase] }}>{PHASE_LABELS[entry.phase].split("—")[0]}</dd>
            </div>
          )}
          {score !== null && (
            <div className="dossier-score" style={{ "--score": score } as React.CSSProperties}>
              <dt>TMDB</dt>
              <dd>
                <span className="gauge">
                  <span>{score}</span>
                </span>
              </dd>
            </div>
          )}
        </dl>

        {info?.tagline && <p className="dossier-tagline">“{info.tagline}”</p>}
        <p className="dossier-body">
          {loading
            ? "Scanning this universe…"
            : info?.overview ??
              (info && !info.configured
                ? "Add a free TMDB API key to see posters, synopses and reviews — see the README."
                : "No signal from this universe yet — it may not be out.")}
        </p>

        {info?.cast && info.cast.length > 0 && (
          <div className="dossier-cast">
            <div className="dossier-label">Known variants</div>
            <div className="dossier-cast-row">
              {info.cast.map((c) => (
                <div key={c.name} className="dossier-person" title={`${c.name} as ${c.character}`}>
                  {c.profile ? (
                    <Image src={c.profile} alt={c.name} width={52} height={52} />
                  ) : (
                    <span className="dossier-initial">{c.name[0]}</span>
                  )}
                  <span>{c.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dossier-actions">
          <button className={`dossier-claim ${watched ? "done" : ""}`} onClick={() => onToggle(entry)}>
            {watched ? "↺ Reopen this universe" : "◉ Universe explored"}
          </button>
          <a className="dossier-link" href={l.disney} target="_blank" rel="noopener noreferrer">
            ▶ Disney+
          </a>
          <a className="dossier-link ghost" href={l.justwatch} target="_blank" rel="noopener noreferrer">
            Where to stream
          </a>
        </div>
      </aside>
    </div>
  );
}
