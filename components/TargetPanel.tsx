"use client";

import { useEffect, useState } from "react";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import { TitleInfo } from "@/lib/tmdb";
import Wordmark from "./Wordmark";

interface Props {
  /** the next unwatched film, or null when everything is cleared */
  target: Entry | null;
  /** the most recently cleared film */
  lastCleared: Entry | null;
  lastClearedAt?: number;
  position: number;
  total: number;
  onOpen: (entry: Entry) => void;
  onClear: (entry: Entry) => void;
}

function fmtDate(ms?: number) {
  if (!ms) return null;
  return new Date(ms).toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase();
}

/**
 * Current target — the hero panel for whatever is next on the flight path.
 * Pulls the TMDB backdrop so the next film fills the panel with its own art.
 */
export default function TargetPanel({ target, lastCleared, lastClearedAt, position, total, onOpen, onClear }: Props) {
  const [info, setInfo] = useState<TitleInfo | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setInfo(null);
    fetch(`/api/title/${target.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TitleInfo | null) => !cancelled && setInfo(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [target]);

  if (!target) {
    return (
      <section className="target-panel done" style={{ "--aura": "#3dff6e" } as React.CSSProperties}>
        <span className="br-bl" aria-hidden="true" />
        <span className="br-br" aria-hidden="true" />
        <div className="tp-kicker">All objectives complete</div>
        <div className="tp-title" style={{ color: "var(--doom-green)" }}>
          Awaiting Doomsday
        </div>
        <p className="tp-sub">Every film on the flight path is cleared. Hold position until 18 Dec 2026.</p>
      </section>
    );
  }

  const phase = target.phase;
  const boss = phase !== undefined ? PHASE_BOSSES[phase] : undefined;
  const sectorColor = phase !== undefined ? PHASE_COLORS[phase] : "var(--hud)";
  const sectorName = phase !== undefined ? PHASE_LABELS[phase].split("—")[0].trim() : "Timeline";
  const isFinal = target.id === "doomsday";

  return (
    <section
      className={`target-panel ${isFinal ? "final" : ""}`}
      style={{ "--aura": target.wm.aura, "--sector": sectorColor } as React.CSSProperties}
    >
      <span className="br-bl" aria-hidden="true" />
      <span className="br-br" aria-hidden="true" />
      {info?.backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tp-backdrop" src={info.backdrop} alt="" />
      )}
      <div className="tp-scan" aria-hidden="true" />

      <div className="tp-body">
        <div className="tp-kicker">
          <span className="dot" aria-hidden="true" />
          {isFinal ? "Final objective" : "Current target"} · {String(position).padStart(2, "0")} / {total}
        </div>

        <div className="tp-wordmark">
          {target.sub && <div className="sub-label mb-1">{target.sub}</div>}
          <Wordmark entry={target} base={2.6} />
        </div>

        <div className="tp-meta">
          <span className="pill">{target.year}</span>
          {info?.runtime ? (
            <span className="pill">
              {Math.floor(info.runtime / 60)}h {info.runtime % 60}m
            </span>
          ) : null}
          <span className="pill" style={{ color: sectorColor, borderColor: sectorColor }}>
            {sectorName}
          </span>
          {boss && (
            <span className="pill" style={{ opacity: 0.8 }}>
              threat: {boss.name}
            </span>
          )}
        </div>

        {info?.tagline && <p className="tp-sub">“{info.tagline}”</p>}

        <div className="tp-actions">
          <button className="hud-btn primary" onClick={() => onClear(target)}>
            ✓ Mark cleared
          </button>
          <button className="hud-btn" onClick={() => onOpen(target)}>
            Open dossier
          </button>
          {lastCleared && (
            <span className="tp-last">
              last cleared · <b>{lastCleared.title}</b>
              {fmtDate(lastClearedAt) && <> · {fmtDate(lastClearedAt)}</>}
            </span>
          )}
        </div>
      </div>

      {boss && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tp-boss" src={boss.img} alt="" draggable={false} />
      )}
    </section>
  );
}
