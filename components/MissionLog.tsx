"use client";

import { useState } from "react";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import Wordmark from "./Wordmark";

interface Props {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  /** group rows into sectors with boss dossiers (release order only) */
  showPhases: boolean;
  /** offset for the running index (0 for movies) */
  wordmarkBase?: number;
  onSelect: (entry: Entry) => void;
  onToggle: (entry: Entry) => void;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase();
}

function Ring({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className="ring" style={{ "--p": pct, "--ring": color } as React.CSSProperties}>
      <span>{pct}%</span>
    </span>
  );
}

/**
 * Mission log — a terminal-style ledger of every film. Rows are grouped into
 * sectors (phases), each with a boss dossier that flips to NEUTRALIZED once
 * the sector is clear. Cleared rows carry the date they were cleared.
 */
export default function MissionLog({ entries, watched, upNextId, showPhases, wordmarkBase = 1.05, onSelect, onToggle }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups: { key: string; phase?: number; items: Entry[] }[] = [];
  for (const e of entries) {
    const phase = showPhases ? e.phase : undefined;
    const key = phase === undefined ? "all" : `p${phase}`;
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, phase, items: [e] });
    else last.items.push(e);
  }

  let index = 0;
  return (
    <div className="log">
      {groups.map((g) => {
        const cleared = g.items.filter((e) => watched[e.id]).length;
        const total = g.items.length;
        const neutralized = cleared === total;
        const boss = g.phase !== undefined ? PHASE_BOSSES[g.phase] : undefined;
        const color = g.phase !== undefined ? PHASE_COLORS[g.phase] : "#4fe3ff";
        const [name, saga] = g.phase !== undefined ? PHASE_LABELS[g.phase].split("—").map((t) => t.trim()) : ["", ""];
        const isCollapsed = collapsed[g.key] ?? (neutralized && g.phase !== undefined);
        const startIndex = index;
        index += total;

        return (
          <section
            key={g.key}
            className={`sector ${neutralized ? "neutralized" : ""} ${isCollapsed ? "collapsed" : ""}`}
            style={{ "--sector": color } as React.CSSProperties}
          >
            {g.phase !== undefined && (
              <header className="sector-head" onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !isCollapsed }))}>
                <div className="sector-id">
                  <span className="num">Sector {String(g.phase).padStart(2, "0")}</span>
                  <span className="name">{name}</span>
                  {saga && <span className="saga">{saga}</span>}
                </div>

                <div className="sector-stats">
                  <Ring value={cleared} total={total} color={color} />
                  <div className="sector-count">
                    <b>{cleared}</b> / {total} cleared
                  </div>
                </div>

                {boss && (
                  <div className="sector-boss">
                    <div className="boss-text">
                      <span className="boss-label">{neutralized ? "Neutralized" : "Threat"}</span>
                      <span className="boss-name">{boss.name}</span>
                      {neutralized && <span className="boss-quip">“{boss.quip}”</span>}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="boss-img" src={boss.img} alt="" draggable={false} />
                  </div>
                )}

                <span className="sector-toggle" aria-hidden="true">
                  {isCollapsed ? "▸" : "▾"}
                </span>
              </header>
            )}

            {!isCollapsed && (
              <ol className="log-rows">
                {g.items.map((e, i) => {
                  const ts = watched[e.id];
                  const isWatched = Boolean(ts);
                  const isNext = e.id === upNextId;
                  const isFinal = e.id === "doomsday";
                  const n = startIndex + i + 1;
                  return (
                    <li
                      key={e.id}
                      className={`log-row ${isWatched ? "on" : ""} ${isNext ? "next" : ""} ${isFinal ? "final" : ""}`}
                      style={{ "--aura": e.wm.aura } as React.CSSProperties}
                    >
                      <button
                        className="log-main"
                        onClick={() => onSelect(e)}
                        aria-label={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year}) — open dossier`}
                      >
                        <span className="log-idx">{isFinal ? "Ω" : String(n).padStart(2, "0")}</span>
                        <span className="log-title">
                          {e.sub && <span className="log-sub">{e.sub}</span>}
                          <Wordmark entry={e} base={wordmarkBase} />
                          {e.type === "netflix" && <span className="optional-badge">optional</span>}
                        </span>
                        <span className="log-year">{e.year}</span>
                        <span className="log-status">
                          {isWatched ? (
                            <>
                              <i className="st on" /> cleared · {fmtDate(ts)}
                            </>
                          ) : isNext ? (
                            <>
                              <i className="st next" /> target
                            </>
                          ) : (
                            <>
                              <i className="st" /> standby
                            </>
                          )}
                        </span>
                      </button>
                      <button
                        className="log-toggle"
                        onClick={() => onToggle(e)}
                        title={isWatched ? "Reopen" : "Mark cleared"}
                        aria-label={isWatched ? `Reopen ${e.title}` : `Mark ${e.title} cleared`}
                      >
                        {isWatched ? "↺" : "✓"}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
