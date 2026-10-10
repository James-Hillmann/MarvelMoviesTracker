"use client";

import { useEffect, useRef, useState } from "react";
import { CRACKS_SVG } from "@/lib/bossArt";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
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

function PhaseBanner({
  phase,
  row,
  defeated,
  cleared,
  total,
}: {
  phase: number;
  row: number;
  defeated: boolean;
  cleared: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const boss = PHASE_BOSSES[phase];
  const [name, saga] = PHASE_LABELS[phase].split("—").map((t) => t.trim());
  return (
    <div
      ref={ref}
      className={`phase-banner ${visible ? "visible" : ""} ${defeated ? "defeated" : ""}`}
      style={{ "--phase-color": PHASE_COLORS[phase], gridRow: row, gridColumn: "1 / -1" } as React.CSSProperties}
    >
      <div className="rule lead" />
      <div className="banner-core">
        <div className="label-row">
          <span className="num">SECTOR {String(phase).padStart(2, "0")}</span>
          <span className="label">{name}</span>
          {saga && <span className="num" style={{ opacity: 0.7 }}>{saga}</span>}
        </div>
        <div className="meta">
          <span className="meter" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} className={i < cleared ? "on" : ""} />
            ))}
          </span>
          <span>
            {cleared}/{total} cleared
          </span>
          {defeated && boss ? (
            <span className="boss-tag">
              <span className="boss-skull">☠</span> threat neutralized: {boss.name}
            </span>
          ) : boss ? (
            <span style={{ opacity: 0.7 }}>threat: {boss.name}</span>
          ) : null}
        </div>
      </div>
      <div className="rule" />
    </div>
  );
}

interface BoardProps {
  entries: Entry[];
  cols: number;
  watched: Record<string, number>;
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

  const phaseDefeated = (p: number) =>
    entries.filter((e) => e.phase === p).every((e) => watched[e.id]);
  const phaseCount = (p: number) => {
    const list = entries.filter((e) => e.phase === p);
    return { total: list.length, cleared: list.filter((e) => watched[e.id]).length };
  };
  const indexOf = new Map(entries.map((e, i) => [e.id, i + 1]));

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

  const renderCell = (e: Entry, gridStyle?: React.CSSProperties) => {
    const isWatched = Boolean(watched[e.id]);
    const isUpNext = e.id === upNextId && !isWatched;
    const isConquered = showPhases && e.phase !== undefined && phaseDefeated(e.phase);
    return (
      <div
        key={e.id}
        ref={registerCell(e.id)}
        className={`cell group ${isWatched ? "watched" : ""} ${isUpNext ? "upnext" : ""} ${isConquered ? "conquered" : ""}`}
        style={{ "--aura": e.wm.aura, ...gridStyle } as React.CSSProperties}
        onClick={() => onSelect(e)}
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onSelect(e);
          }
        }}
        aria-label={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year})`}
      >
        <span className="br-bl" aria-hidden="true" />
        <span className="br-br" aria-hidden="true" />
        <span className="idx" aria-hidden="true">{String(indexOf.get(e.id) ?? 0).padStart(2, "0")}</span>
        <span className="yr" aria-hidden="true">{e.year}</span>
        {isUpNext && <span className="scan" aria-hidden="true" />}
        {isUpNext && (
          <span className="upnext-badge">
            <span className="dot" aria-hidden="true" />
            Target locked
          </span>
        )}
        {e.sub && <span className="sub-label">{e.sub}</span>}
        <Wordmark entry={e} base={wordmarkBase} />
        {e.type === "netflix" && <span className="optional-badge">optional</span>}
        {isWatched && (
          <span className="stamp">
            <span>
              <span className="tick" aria-hidden="true">✓</span>
              Cleared
            </span>
          </span>
        )}
        <button
          className="quick-check"
          title={isWatched ? "Mark as unwatched" : "Mark as cleared"}
          onClick={(ev) => {
            ev.stopPropagation();
            onQuickToggle(e);
          }}
        >
          {isWatched ? "↺" : "✓"}
        </button>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="relative grid gap-x-2 gap-y-7"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {rows.flatMap((row, ri) => {
          const gridRow = ri + 1;
          if (row.kind === "banner") {
            return [
              <PhaseBanner
                key={`banner-${row.phase}`}
                phase={row.phase}
                row={gridRow}
                defeated={phaseDefeated(row.phase)}
                {...phaseCount(row.phase)}
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
          <div className="threat-tag">
            Final objective <span className="lvl">threat level omega</span>
          </div>
          <div className="w-[min(240px,60vw)]">{renderCell(finale)}</div>
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
