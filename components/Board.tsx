"use client";

import { useEffect, useRef, useState } from "react";
import { CRACKS_SVG } from "@/lib/bossArt";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import { ArtMap, posterAt } from "@/lib/useArtwork";
import ArrowPath from "./ArrowPath";
import Wordmark from "./Wordmark";

type LayoutRow =
  | { kind: "banner"; phase: number }
  | { kind: "cells"; entries: Entry[]; dir: 1 | -1 };

function buildRows(entries: Entry[], cols: number, showPhases: boolean): LayoutRow[] {
  const rows: LayoutRow[] = [];
  let current: Entry[] = [];
  let cellRowIdx = 0;
  let phase: number | undefined;

  const flush = () => {
    if (!current.length) return;
    rows.push({ kind: "cells", entries: current, dir: cellRowIdx % 2 === 0 ? 1 : -1 });
    cellRowIdx++;
    current = [];
  };

  for (const e of entries) {
    if (showPhases && e.phase !== undefined && e.phase !== phase) {
      flush();
      rows.push({ kind: "banner", phase: e.phase });
      phase = e.phase;
    }
    current.push(e);
    if (current.length === cols) flush();
  }
  flush();
  return rows;
}

/** fade/slide in once, the first time `el` scrolls into view */
function useReveal<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function PhaseBanner({
  phase,
  row,
  defeated,
  done,
  total,
}: {
  phase: number;
  row: number;
  defeated: boolean;
  done: number;
  total: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.4);
  const boss = PHASE_BOSSES[phase];
  const [name, saga] = PHASE_LABELS[phase].split("—").map((s) => s.trim());
  return (
    <div
      ref={ref}
      className={`phase-banner ${visible ? "visible" : ""} ${defeated ? "defeated" : ""}`}
      style={{ "--phase-color": PHASE_COLORS[phase], gridRow: row, gridColumn: "1 / -1" } as React.CSSProperties}
    >
      <div className="rule" />
      <div className="banner-core">
        <span className="kicker">{saga ?? `Chapter ${phase}`}</span>
        <span className="label">{name}</span>
        <span className="tally">
          {defeated && boss ? (
            <span className="boss-tag">
              <span className="boss-skull">☠</span> {boss.name} defeated
            </span>
          ) : (
            <>
              <span className="tally-num">{done}</span> / {total} watched
            </>
          )}
        </span>
      </div>
      <div className="rule" />
    </div>
  );
}

interface CellProps {
  entry: Entry;
  index: number;
  poster: string | null;
  watched: boolean;
  upNext: boolean;
  conquered: boolean;
  finale?: boolean;
  wordmarkBase: number;
  register: (el: HTMLElement | null) => void;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function PosterCell({
  entry: e,
  index,
  poster,
  watched,
  upNext,
  conquered,
  finale,
  wordmarkBase,
  register,
  onSelect,
  onQuickToggle,
}: CellProps) {
  const { ref: revealRef, visible } = useReveal<HTMLDivElement>(0.12);
  const [loaded, setLoaded] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);

  // the trail measures the outer cell, so tilt + reveal only ever move inner layers
  const onMove = (ev: React.PointerEvent) => {
    const el = tiltRef.current;
    if (!el || !finePointer()) return;
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width;
    const y = (ev.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={register}
      className={`cell group ${watched ? "watched" : ""} ${upNext ? "upnext" : ""} ${conquered ? "conquered" : ""} ${finale ? "finale" : ""}`}
      style={{ "--aura": e.wm.aura } as React.CSSProperties}
      onClick={() => onSelect(e)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onSelect(e);
        }
      }}
      aria-label={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year})${watched ? ", watched" : ""}`}
    >
      <div ref={revealRef} className={`pc-reveal ${visible ? "in" : ""}`}>
        <div ref={tiltRef} className="pc-tilt">
          <div className="pc-frame">
            {poster ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`pc-img ${loaded ? "loaded" : ""}`}
                  src={poster}
                  alt=""
                  loading={finale ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                />
              </>
            ) : null}
            {(!poster || !loaded) && (
              <div className="pc-fallback" style={{ "--wm-fill": e.wm.gradient } as React.CSSProperties}>
                <span className="pc-fallback-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="pc-fallback-studio">Marvel Studios</span>
                <div className="pc-fallback-mark">
                  {e.sub && <span className="sub-label">{e.sub}</span>}
                  <Wordmark entry={e} base={wordmarkBase * 1.05} />
                </div>
              </div>
            )}
            <div className="pc-shade" />
            <div className="pc-glare" />
            {poster && loaded && <span className="pc-index">{String(index + 1).padStart(2, "0")}</span>}
            {e.type === "netflix" && <span className="pc-optional">optional</span>}
            {watched && (
              <span className="pc-watched">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Watched
              </span>
            )}
          </div>
          {upNext && <span className="upnext-badge">Up Next</span>}
        </div>
        {/* the title card already carries the wordmark — only repeat it under real posters */}
        <div className="pc-caption">
          {poster && loaded && (
            <>
              {e.sub && <span className="sub-label">{e.sub}</span>}
              <Wordmark entry={e} base={wordmarkBase * 0.62} />
            </>
          )}
          <span className="pc-year">{e.year}</span>
        </div>
      </div>
      <button
        className="quick-check"
        title={watched ? "Mark as unwatched" : "Mark as watched"}
        aria-label={watched ? `Mark ${e.title} as unwatched` : `Mark ${e.title} as watched`}
        onClick={(ev) => {
          ev.stopPropagation();
          onQuickToggle(e);
        }}
      >
        {watched ? "↺" : "✓"}
      </button>
    </div>
  );
}

interface BoardProps {
  entries: Entry[];
  cols: number;
  watched: Record<string, number>;
  art: ArtMap;
  upNextId?: string | null;
  showPhases?: boolean;
  /** render this entry inside the Doomsday portal below the grid */
  finaleId?: string;
  /** 0..1 — how bright the portal burns */
  doomGlow?: number;
  layoutKey: string;
  wordmarkBase?: number;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

export default function Board({
  entries,
  cols,
  watched,
  art,
  upNextId,
  showPhases = false,
  finaleId,
  doomGlow = 0,
  layoutKey,
  wordmarkBase = 1.35,
  onSelect,
  onQuickToggle,
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLElement>());

  const finale = finaleId ? entries.find((e) => e.id === finaleId) : undefined;
  const gridEntries = finale ? entries.filter((e) => e.id !== finale.id) : entries;
  const rows = buildRows(gridEntries, cols, showPhases);
  const order = entries.map((e) => e.id);

  const phaseEntries = (p: number) => entries.filter((e) => e.phase === p);
  const phaseDefeated = (p: number) => phaseEntries(p).every((e) => watched[e.id]);

  // grid-row span of each phase's cells (banner row excluded) for ruin overlays
  const phaseSpans: { phase: number; start: number; end: number }[] = [];
  rows.forEach((row, i) => {
    if (row.kind === "banner") {
      phaseSpans.push({ phase: row.phase, start: i + 2, end: i + 2 });
    } else if (phaseSpans.length) {
      phaseSpans[phaseSpans.length - 1].end = i + 1;
    }
  });

  const registerCell = (id: string) => (el: HTMLElement | null) => {
    if (el) cellRefs.current.set(id, el);
    else cellRefs.current.delete(id);
  };

  const renderCell = (e: Entry, gridStyle?: React.CSSProperties, isFinale = false) => {
    const isWatched = Boolean(watched[e.id]);
    const cell = (
      <PosterCell
        key={e.id}
        entry={e}
        index={order.indexOf(e.id)}
        poster={posterAt(art[e.id]?.poster, isFinale ? "w500" : "w342")}
        watched={isWatched}
        upNext={e.id === upNextId && !isWatched}
        conquered={showPhases && e.phase !== undefined && phaseDefeated(e.phase)}
        finale={isFinale}
        wordmarkBase={isFinale ? wordmarkBase * 1.25 : wordmarkBase}
        register={registerCell(e.id)}
        onSelect={onSelect}
        onQuickToggle={onQuickToggle}
      />
    );
    return gridStyle ? (
      <div key={e.id} className="cell-slot" style={gridStyle}>
        {cell}
      </div>
    ) : (
      cell
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="board-grid relative grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {rows.flatMap((row, ri) => {
          const gridRow = ri + 1;
          if (row.kind === "banner") {
            const pe = phaseEntries(row.phase);
            return [
              <PhaseBanner
                key={`banner-${row.phase}`}
                phase={row.phase}
                row={gridRow}
                defeated={phaseDefeated(row.phase)}
                done={pe.filter((e) => watched[e.id]).length}
                total={pe.length}
              />,
            ];
          }
          return row.entries.map((e, j) => {
            const col = row.dir === 1 ? j : cols - 1 - j;
            return renderCell(e, { gridRow, gridColumn: col + 1 });
          });
        })}

        {/* war-torn overlays across conquered phases */}
        {phaseSpans
          .filter((s) => phaseDefeated(s.phase))
          .map((s) => (
            <div
              key={`ruin-${s.phase}`}
              className="phase-ruin"
              style={{
                gridRow: `${s.start} / ${s.end + 1}`,
                gridColumn: "1 / -1",
                "--phase-color": PHASE_COLORS[s.phase],
              } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ruin-boss" src={PHASE_BOSSES[s.phase].img} alt="" draggable={false} />
              <div className="ruin-cracks" dangerouslySetInnerHTML={{ __html: CRACKS_SVG }} />
              <div className="ruin-slash a" />
              <div className="ruin-slash b" />
              <div className="ruin-scorch" />
            </div>
          ))}
      </div>

      {finale && (
        <div className="portal-wrap" style={{ "--doom-glow": doomGlow } as React.CSSProperties}>
          <div className="doom-mist" />
          <div className="portal-ring" />
          <div className="portal-ring inner" />
          <div className="portal-kicker">The finish line · Dec 18, 2026</div>
          <div className="w-[min(230px,56vw)]">{renderCell(finale, undefined, true)}</div>
        </div>
      )}

      <ArrowPath
        containerRef={containerRef}
        cellRefs={cellRefs}
        order={order}
        watched={watched}
        layoutKey={layoutKey}
      />
    </div>
  );
}
