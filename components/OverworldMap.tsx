"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "@/lib/chiptune";
import { DECOS, DecoKey, flagSprite, Hero, ICONS, iconFor, padSprite } from "@/lib/sprites";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import DoomCastle, { CastleTheme } from "./DoomCastle";
import HpBar from "./HpBar";
import PixelImage from "./PixelImage";
import PixelSprite, { HeroParty } from "./PixelSprite";

/* ------------------------------------------------------------------
   World themes — every phase is its own biome on the overworld
   ------------------------------------------------------------------ */

interface Theme {
  name: string;
  base: string;
  alt: string;
  edge: string;
  decos: DecoKey[];
  castle: CastleTheme;
}

const THEMES: Record<number, Theme> = {
  0: {
    name: "The Sacred Timeline",
    base: "#4a2c12",
    alt: "#55331a",
    edge: "#f08a20",
    decos: ["clock", "rock", "flower"],
    castle: { stone: "#6a4a2a", light: "#8a6a40", dark: "#3a2814", glow: "240,138,32", banner: "#f08a20" },
  },
  1: {
    name: "Grasslands",
    base: "#215f2b",
    alt: "#266c31",
    edge: "#7ae06a",
    decos: ["tree", "bush", "flower", "tree", "rock"],
    castle: { stone: "#5a6a4a", light: "#7a8a66", dark: "#34402a", glow: "120,220,90", banner: "#2e7a2a" },
  },
  2: {
    name: "Scorched Desert",
    base: "#8a6428",
    alt: "#96702e",
    edge: "#ffcf6a",
    decos: ["cactus", "rock", "cactus"],
    castle: { stone: "#8a7a5a", light: "#b0a07a", dark: "#5a4a30", glow: "255,140,40", banner: "#c05020" },
  },
  3: {
    name: "Titan's Lava Fields",
    base: "#3a1212",
    alt: "#461816",
    edge: "#ff6a20",
    decos: ["spire", "lava", "rock", "skull"],
    castle: { stone: "#4a3a48", light: "#6a5a70", dark: "#2a1e2a", glow: "255,90,40", banner: "#6a2ab0" },
  },
  4: {
    name: "Mystic Multiverse",
    base: "#27144d",
    alt: "#2e1a5a",
    edge: "#c48aff",
    decos: ["crystal", "bubble", "crystal"],
    castle: { stone: "#4a2a5a", light: "#6a4a80", dark: "#2a1438", glow: "232,48,80", banner: "#c02040" },
  },
  5: {
    name: "Quantum Realm",
    base: "#0d2846",
    alt: "#113053",
    edge: "#5ad8ff",
    decos: ["bubble", "crystal", "bubble"],
    castle: { stone: "#2a3a5a", light: "#4a5a80", dark: "#141e34", glow: "90,216,255", banner: "#202028" },
  },
  6: {
    name: "Latveria",
    base: "#112418",
    alt: "#162d1e",
    edge: "#3dff6e",
    decos: ["skull", "rock", "spire"],
    castle: { stone: "#3a4250", light: "#59637a", dark: "#232836", glow: "61,255,110", banner: "#0d5a26" },
  },
};

const PAD_LOCKED = padSprite("#4a4468", "#2a2648", "#1c1934");
const PAD_CLEAR = padSprite("#ffd84a", "#c89a10", "#8a6a08");
const PAD_NEXT = padSprite("#ffffff", "#3a3480", "#24205a");

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Pt {
  x: number;
  y: number;
}

/** Catmull-Rom through the stops, sampled every ~14px and snapped to the 4px grid */
function sampleRoad(points: Pt[], lit: boolean[]): { x: number; y: number; lit: boolean }[] {
  const out: { x: number; y: number; lit: boolean }[] = [];
  const seen = new Set<string>();
  for (let k = 0; k < points.length - 1; k++) {
    const p0 = points[Math.max(0, k - 1)];
    const p1 = points[k];
    const p2 = points[k + 1];
    const p3 = points[Math.min(points.length - 1, k + 2)];
    const n = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 14));
    for (let s = 0; s < n; s++) {
      const t = s / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      const sx = Math.round(x / 4) * 4;
      const sy = Math.round(y / 4) * 4;
      const key = `${sx},${sy}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ x: sx, y: sy, lit: lit[k] });
    }
  }
  return out;
}

/* ------------------------------------------------------------------
   Stage pieces
   ------------------------------------------------------------------ */

interface StageState {
  watched: boolean;
  upNext: boolean;
  conquered: boolean;
}

function Marker({
  entry,
  state,
  heroes,
  flagSide = "r",
  style,
  onOpen,
}: {
  entry: Entry;
  state: StageState;
  heroes: Hero[];
  /** plant the flag away from the signpost */
  flagSide?: "l" | "r";
  style?: React.CSSProperties;
  onOpen: () => void;
}) {
  const pad = state.watched ? PAD_CLEAR : state.upNext ? PAD_NEXT : PAD_LOCKED;
  return (
    <div
      className={`marker ${state.watched ? "watched" : ""} ${state.upNext ? "upnext" : ""}`}
      style={{ "--aura": entry.wm.aura, ...style } as React.CSSProperties}
      data-entry={entry.id}
      onClick={onOpen}
      aria-hidden="true"
    >
      {state.upNext && heroes.length > 0 && (
        <div className="marker-player">
          <span className="marker-bubble">UP NEXT!</span>
          <HeroParty heroes={heroes} scale={3} />
        </div>
      )}
      <PixelSprite className="marker-pad" sprite={pad} scale={4} />
      <span className="marker-icon">
        <PixelSprite sprite={ICONS[iconFor(entry.id)]} scale={3} aura={entry.wm.aura} />
      </span>
      {state.watched && (
        <span className={`marker-flag flag-${flagSide}`}>
          <PixelSprite sprite={flagSprite(state.conquered ? "#ffd84a" : entry.wm.aura)} scale={3} />
        </span>
      )}
    </div>
  );
}

function Plaque({
  entry,
  code,
  state,
  side,
  style,
  onOpen,
  onQuickToggle,
}: {
  entry: Entry;
  code: string;
  state: StageState;
  side: "l" | "r" | "c";
  style?: React.CSSProperties;
  onOpen: () => void;
  onQuickToggle: () => void;
}) {
  return (
    <div
      className={`plaque plaque-${side} ${state.watched ? "watched" : ""} ${state.upNext ? "upnext" : ""} ${state.conquered ? "conquered" : ""}`}
      style={{ "--aura": entry.wm.aura, ...style } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${entry.sub ? entry.sub + " " : ""}${entry.title} (${entry.year})${state.watched ? ", cleared" : ""}${state.upNext ? ", up next" : ""}`}
    >
      <div className="pl-head">
        <span className="pl-code">{code}</span>
        {state.watched ? <span className="pl-clear">★ CLEAR</span> : <span className="pl-year">{entry.year}</span>}
      </div>
      {entry.sub && <div className="pl-sub">{entry.sub}</div>}
      <div className="pl-title">{entry.title}</div>
      <button
        className="pl-quick"
        title={state.watched ? "Mark as unwatched" : "Mark as watched"}
        aria-label={state.watched ? `Mark ${entry.title} as unwatched` : `Mark ${entry.title} as watched`}
        onClick={(ev) => {
          ev.stopPropagation();
          onQuickToggle();
        }}
      >
        {state.watched ? "↺" : "✓"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   One world: biome terrain, winding road, stages, boss fort / castle
   ------------------------------------------------------------------ */

interface WorldProps {
  phase?: number;
  entries: Entry[];
  codes: Map<string, string>;
  watched: Record<string, number>;
  upNextId?: string | null;
  heroes: Hero[];
  conquered: boolean;
  finale?: Entry;
  doomGlow: number;
  countedTotal: number;
  countedLeft: number;
  onSelect: (e: Entry) => void;
  onQuickToggle: (e: Entry) => void;
}

function World({
  phase,
  entries,
  codes,
  watched,
  upNextId,
  heroes,
  conquered,
  finale,
  doomGlow,
  countedTotal,
  countedLeft,
  onSelect,
  onQuickToggle,
}: WorldProps) {
  const theme = THEMES[phase ?? 0];
  const mapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const measure = () => setW(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = W < 520;
  const STEP = narrow ? 108 : 118;
  const TOP = 36;
  const mapH = TOP + entries.length * STEP + 24;
  const cx = W / 2;
  const amp = Math.min(W * 0.3, 230);

  const stateOf = (e: Entry): StageState => ({
    watched: Boolean(watched[e.id]),
    upNext: e.id === upNextId && !watched[e.id],
    conquered,
  });

  const layout = useMemo(() => {
    if (!W) return null;
    const pts = entries.map((_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const mag = 0.62 + 0.38 * Math.abs(Math.sin(i * 1.7 + (phase ?? 0) * 2.3));
      return { x: Math.round(cx + side * amp * mag), y: TOP + i * STEP + STEP / 2, side };
    });

    // plaques sit on the inside of each bend
    const plaques = pts.map((p) => {
      const avail = p.side < 0 ? W - (p.x + 42) - 8 : p.x - 42 - 8;
      const width = Math.max(120, Math.min(250, avail));
      return p.side < 0 ? { left: p.x + 42, top: p.y, width } : { left: p.x - 42 - width, top: p.y, width };
    });

    // scenery on the outside of each bend, plus a few strays
    const r = rng((phase ?? 0) + 7);
    const decos: { key: DecoKey; x: number; y: number; scale: number; flip: boolean }[] = [];
    const scale = narrow ? 3 : 4;
    pts.forEach((p, i) => {
      const lo = p.side < 0 ? 6 : p.x + 44;
      const hi = p.side < 0 ? p.x - 72 : W - 46;
      if (hi - lo > 10) {
        decos.push({
          key: theme.decos[Math.floor(r() * theme.decos.length)],
          x: Math.round(lo + r() * (hi - lo)),
          y: Math.round(p.y - 30 + r() * 40),
          scale,
          flip: r() > 0.5,
        });
      }
      if (i % 2 === 1 && r() > 0.35) {
        decos.push({
          key: theme.decos[Math.floor(r() * theme.decos.length)],
          x: Math.round(8 + r() * (W - 60)),
          y: Math.round(p.y + STEP / 2 - 10),
          scale: scale - 1,
          flip: r() > 0.5,
        });
      }
    });

    const lit = [
      ...entries.map((e) => Boolean(watched[e.id]) || e.id === upNextId),
      Boolean(watched[entries[entries.length - 1]?.id]),
    ];
    const road = sampleRoad([{ x: cx, y: -20 }, ...pts, { x: cx, y: mapH + 90 }], lit);
    return { pts, plaques, decos, road };
  }, [W, entries, watched, upNextId, phase, cx, amp, STEP, mapH, narrow, theme.decos]);

  const cleared = entries.filter((e) => watched[e.id]).length;
  const [label, saga] = phase ? PHASE_LABELS[phase].split("—").map((s) => s.trim()) : ["Every movie, in-universe order", ""];
  const boss = phase ? PHASE_BOSSES[phase] : undefined;
  const bossLeft = entries.filter((e) => !watched[e.id]).length + (finale && !watched[finale.id] ? 1 : 0);
  const open = (e: Entry) => {
    sfx.select();
    onSelect(e);
  };

  return (
    <section
      className={`world ${conquered ? "conquered" : ""}`}
      style={
        {
          "--t-base": theme.base,
          "--t-alt": theme.alt,
          "--t-edge": theme.edge,
          "--phase-color": phase ? PHASE_COLORS[phase] : theme.edge,
        } as React.CSSProperties
      }
    >
      <header className="world-sign">
        <div className="ws-num">{phase ? `WORLD ${phase}` : "THE WHOLE SAGA"}</div>
        <div className="ws-name">{theme.name}</div>
        <div className="ws-meta">
          {label}
          {saga ? ` · ${saga}` : ""} · {cleared}/{entries.length} CLEAR
        </div>
      </header>

      <div ref={mapRef} className="world-map" style={{ height: mapH }}>
        {layout && (
          <>
            <svg className="road" width={W} height={mapH + 100} shapeRendering="crispEdges" aria-hidden="true">
              {layout.road.map((d) => (
                <rect key={`b${d.x},${d.y}`} x={d.x - 6} y={d.y - 6} width={12} height={12} className="road-bed" />
              ))}
              {layout.road.map((d) => (
                <rect key={`d${d.x},${d.y}`} x={d.x - 3} y={d.y - 3} width={6} height={6} className={d.lit ? "road-dot lit" : "road-dot"} />
              ))}
            </svg>

            {layout.decos.map((d, i) => (
              <span
                key={`deco${i}`}
                className={`deco ${d.flip ? "flip" : ""}`}
                style={{ left: d.x, top: d.y }}
                aria-hidden="true"
              >
                <PixelSprite sprite={DECOS[d.key]} scale={d.scale} />
              </span>
            ))}

            {entries.map((e, i) => {
              const p = layout.pts[i];
              const pl = layout.plaques[i];
              const st = stateOf(e);
              return (
                <Fragment key={e.id}>
                  <Marker
                    entry={e}
                    state={st}
                    heroes={heroes}
                    flagSide={p.side < 0 ? "l" : "r"}
                    style={{ left: p.x, top: p.y }}
                    onOpen={() => open(e)}
                  />
                  <Plaque
                    entry={e}
                    code={codes.get(e.id) ?? ""}
                    state={st}
                    side={p.side < 0 ? "r" : "l"}
                    style={{ left: pl.left, top: pl.top, width: pl.width }}
                    onOpen={() => open(e)}
                    onQuickToggle={() => onQuickToggle(e)}
                  />
                </Fragment>
              );
            })}
          </>
        )}
      </div>

      {finale ? (
        <div className="final-stage" style={{ "--doom-glow": doomGlow } as React.CSSProperties}>
          <div className="lm-plate final">
            <div className="lm-title">
              FINAL STAGE · <span>DOCTOR DOOM</span>
            </div>
            <HpBar total={countedTotal} left={countedLeft} color="#3dff6e" label="Doctor Doom health" />
          </div>
          <div className="final-arena">
            <PixelImage className="final-doom" src={PHASE_BOSSES[6]?.img ?? "/bosses/doom.png"} pixels={48} levels={5} />
            <div className="castle-wrap">
              <DoomCastle glow={doomGlow} className="final-castle" />
              <Marker
                entry={finale}
                state={stateOf(finale)}
                heroes={heroes}
                style={{ left: "50%", top: "86%" }}
                onOpen={() => open(finale)}
              />
            </div>
          </div>
          <Plaque
            entry={finale}
            code={codes.get(finale.id) ?? ""}
            state={stateOf(finale)}
            side="c"
            onOpen={() => open(finale)}
            onQuickToggle={() => onQuickToggle(finale)}
          />
        </div>
      ) : (
        boss && (
          <div className={`fort ${bossLeft === 0 ? "down" : ""}`}>
            <div className="lm-plate">
              <div className="lm-title">
                {bossLeft === 0 ? "K.O." : "BOSS"} · <span>{boss.name}</span>
              </div>
              <HpBar total={entries.length} left={bossLeft} color={bossLeft === 0 ? "#555" : "#ff3048"} label={`${boss.name} health`} />
            </div>
            <div className="fort-arena">
              <PixelImage className="fort-boss" src={boss.img} pixels={40} levels={5} />
              {bossLeft === 0 && <span className="fort-ko">K.O.</span>}
              <DoomCastle
                theme={theme.castle}
                glow={bossLeft === 0 ? 0.1 : 0.5}
                flag={bossLeft === 0 ? "#ffd84a" : undefined}
                className="fort-castle"
              />
            </div>
          </div>
        )
      )}
    </section>
  );
}

/* ------------------------------------------------------------------
   The whole overworld
   ------------------------------------------------------------------ */

interface Props {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId?: string | null;
  showPhases: boolean;
  finaleId: string;
  doomGlow: number;
  heroes: Hero[];
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

export default function OverworldMap({ entries, watched, upNextId, showPhases, finaleId, doomGlow, heroes, onSelect, onQuickToggle }: Props) {
  const finale = entries.find((e) => e.id === finaleId);
  const stages = entries.filter((e) => e.id !== finaleId);

  const worlds = useMemo(() => {
    if (!showPhases) return [{ phase: undefined as number | undefined, entries: stages }];
    const out: { phase: number | undefined; entries: Entry[] }[] = [];
    for (const e of stages) {
      const last = out[out.length - 1];
      if (last && last.phase === e.phase) last.entries.push(e);
      else out.push({ phase: e.phase, entries: [e] });
    }
    return out;
  }, [stages, showPhases]);

  // level codes: "3-4" by world, else a running "LV 07"
  const codes = new Map<string, string>();
  if (showPhases) {
    const seen: Record<number, number> = {};
    for (const e of entries) {
      const p = e.phase ?? 0;
      seen[p] = (seen[p] ?? 0) + 1;
      codes.set(e.id, `${p}-${seen[p]}`);
    }
  } else {
    entries.forEach((e, i) => codes.set(e.id, `LV ${String(i + 1).padStart(2, "0")}`));
  }

  const countedLeft = stages.filter((e) => !watched[e.id]).length;
  const phaseDone = (p?: number) =>
    p !== undefined && entries.filter((e) => e.phase === p).every((e) => watched[e.id]);

  return (
    <div className="overworld">
      {worlds.map((w, i) => {
        const prevDone = i > 0 && worlds[i - 1].entries.every((e) => watched[e.id]);
        const isLast = i === worlds.length - 1;
        return (
          <Fragment key={w.phase ?? "all"}>
            {i > 0 && <div className={`world-link ${prevDone ? "lit" : ""}`} aria-hidden="true" />}
            <World
              phase={w.phase}
              entries={w.entries}
              codes={codes}
              watched={watched}
              upNextId={upNextId}
              heroes={heroes}
              conquered={phaseDone(w.phase)}
              finale={isLast ? finale : undefined}
              doomGlow={doomGlow}
              countedTotal={stages.length}
              countedLeft={countedLeft}
              onSelect={onSelect}
              onQuickToggle={onQuickToggle}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
