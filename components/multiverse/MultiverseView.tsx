"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import Wordmark from "../Wordmark";
import Scene, { NavState } from "./Scene";

interface Props {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  showPhases: boolean;
  finaleId: string;
  doomGlow: number;
  /** a modal is open — keyboard travel pauses */
  paused: boolean;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

/** viewport-heights of scroll per movie */
const VH_PER_MOVIE = 24;

/**
 * The 3D "multiverse highway".  The page keeps a tall invisible scroll track;
 * scroll position drives the camera down the road (so wheel, trackpad, touch,
 * keyboard and scrollbars all just work), while a fixed WebGL canvas renders
 * the journey and a DOM HUD carries the actions.
 */
export default function MultiverseView({
  entries,
  watched,
  upNextId,
  showPhases,
  finaleId,
  doomGlow,
  paused,
  onSelect,
  onQuickToggle,
}: Props) {
  const nav = useRef<NavState>({ target: 0, focus: 0, map: false, hovered: null, warpAt: -1 });
  const [focusIdx, setFocusIdx] = useState(0);
  const [map, setMap] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const n = entries.length;

  const lowPower = useMemo(() => {
    if (typeof window === "undefined") return false;
    const nav2 = navigator as Navigator & { deviceMemory?: number };
    return window.matchMedia("(max-width: 640px)").matches || (nav2.deviceMemory ?? 8) <= 4;
  }, []);

  // scroll -> camera target
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      nav.current.target = p * (n - 1);
      const idx = Math.round(nav.current.target);
      setFocusIdx((cur) => (cur === idx ? cur : idx));
      if (window.scrollY > 40) setScrolled(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  const fly = useCallback(
    (i: number, smooth = true) => {
      const clamped = Math.max(0, Math.min(n - 1, i));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav.current.map = false;
      setMap(false);
      window.scrollTo({ top: (clamped / Math.max(1, n - 1)) * max, behavior: smooth ? "smooth" : "auto" });
    },
    [n],
  );

  // first arrival: warp to wherever you left off
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current || !upNextId) return;
    const idx = entries.findIndex((e) => e.id === upNextId);
    if (idx <= 0) return;
    // flag inside the timer: dev strict-mode re-runs effects and clears the first one
    const t = setTimeout(() => {
      arrived.current = true;
      fly(idx, false);
    }, 350);
    return () => clearTimeout(t);
  }, [upNextId, entries, fly]);

  // check-off choreography: shockwave (in the scene), then a warp jump to the
  // next unwatched world — or, if that cleared a phase, a letterboxed boss snap
  const watchedRef = useRef(watched);
  watchedRef.current = watched;
  const [snap, setSnap] = useState<{ phase: number; key: number } | null>(null);
  const snapNow = (entry: Entry, w: Record<string, number>) =>
    showPhases &&
    entry.phase !== undefined &&
    Boolean(PHASE_BOSSES[entry.phase]) &&
    entries.filter((e) => e.phase === entry.phase).every((e) => w[e.id]);
  useEffect(() => {
    const onToggle = (ev: Event) => {
      const { id, nowWatched } = (ev as CustomEvent<{ id: string; nowWatched: boolean }>).detail;
      if (!nowWatched) return;
      const idx = entries.findIndex((e) => e.id === id);
      if (idx < 0) return;
      const entry = entries[idx];
      const w = { ...watchedRef.current, [id]: 1 };
      if (showPhases && entry.phase !== undefined && PHASE_BOSSES[entry.phase]) {
        const cleared = entries.filter((e) => e.phase === entry.phase).every((e) => w[e.id]);
        if (cleared) setSnap({ phase: entry.phase, key: Date.now() });
      }
      let next = entries.findIndex((e, i) => i > idx && !w[e.id]);
      if (next < 0) next = entries.findIndex((e) => !w[e.id]);
      if (next < 0) return;
      // after a boss snap, let the dust settle before jumping to the next sector
      setTimeout(
        () => {
          nav.current.warpAt = performance.now();
          fly(next);
        },
        snapNow(entry, w) ? 4400 : 650,
      );
    };
    window.addEventListener("mv:toggle", onToggle);
    return () => window.removeEventListener("mv:toggle", onToggle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, showPhases, fly]);
  useEffect(() => {
    if (!snap) return;
    const t = setTimeout(() => setSnap(null), 4600);
    return () => clearTimeout(t);
  }, [snap]);

  // keyboard travel
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const cur = Math.round(nav.current.target);
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        fly(cur + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        fly(cur - 1);
      } else if (e.key === "Enter") {
        const entry = entries[cur];
        if (entry) onSelect(entry);
      } else if (e.key === "m") {
        toggleMap();
      } else if (e.key === "Escape" && nav.current.map) {
        toggleMap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, fly, entries, onSelect]);

  const toggleMap = () => {
    nav.current.map = !nav.current.map;
    setMap(nav.current.map);
  };

  const focused = entries[focusIdx];
  const focusedWatched = focused ? Boolean(watched[focused.id]) : false;
  const upNextIdx = upNextId ? entries.findIndex((e) => e.id === upNextId) : -1;

  // rail groups: by phase in release order, a single run otherwise
  const groups = useMemo(() => {
    if (!showPhases) return [{ phase: undefined as number | undefined, items: entries.map((e, i) => ({ e, i })) }];
    const out: { phase: number | undefined; items: { e: Entry; i: number }[] }[] = [];
    entries.forEach((e, i) => {
      const last = out[out.length - 1];
      if (!last || last.phase !== e.phase) out.push({ phase: e.phase, items: [{ e, i }] });
      else last.items.push({ e, i });
    });
    return out;
  }, [entries, showPhases]);

  return (
    <>
      {/* the scroll track that drives the camera */}
      <div aria-hidden="true" style={{ height: `calc(${(n - 1) * VH_PER_MOVIE}vh + 100dvh)` }} />

      <div className="mv-canvas">
        <Canvas
          dpr={lowPower ? [1, 1.25] : [1, 1.75]}
          camera={{ fov: 55, near: 0.1, far: 1400, position: [40, 30, 60] }}
          gl={{ antialias: !lowPower, powerPreference: "high-performance" }}
          style={{ touchAction: "pan-y" }}
          onPointerMissed={() => {
            if (nav.current.map) toggleMap();
          }}
        >
          <Suspense fallback={null}>
            <Scene
              entries={entries}
              watched={watched}
              upNextId={upNextId}
              showPhases={showPhases}
              finaleId={finaleId}
              doomGlow={doomGlow}
              nav={nav}
              lowPower={lowPower}
              onSelect={onSelect}
              onFly={(i) => fly(i)}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ---------- HUD ---------- */}
      <div className="mv-hud">
        {/* top controls */}
        <div className="mv-topbar">
          <button className={`mv-chip ${map ? "active" : ""}`} onClick={toggleMap} title="Overview (M)">
            {map ? "◉ Exit map" : "◎ Multiverse map"}
          </button>
          {upNextIdx >= 0 && upNextIdx !== focusIdx && (
            <button className="mv-chip gold" onClick={() => fly(upNextIdx)}>
              ⟶ Jump to up next
            </button>
          )}
        </div>

        {/* phase rail */}
        <nav className="mv-rail" aria-label="Timeline">
          {groups.map((g, gi) => (
            <div key={gi} className="mv-rail-group" style={{ "--phase-color": g.phase ? PHASE_COLORS[g.phase] : "#e8b64c" } as React.CSSProperties}>
              {g.phase !== undefined && (
                <button className="mv-rail-phase" onClick={() => fly(g.items[0].i)} title={PHASE_LABELS[g.phase]}>
                  {g.phase}
                </button>
              )}
              {g.items.map(({ e, i }) => (
                <button
                  key={e.id}
                  className={`mv-rail-dot ${watched[e.id] ? "watched" : ""} ${i === focusIdx ? "current" : ""} ${e.id === upNextId ? "upnext" : ""}`}
                  style={{ "--aura": e.wm.aura } as React.CSSProperties}
                  onClick={() => fly(i)}
                  title={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year})`}
                  aria-label={`${e.sub ? e.sub + " " : ""}${e.title}`}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* focused movie card */}
        {focused && !map && (
          <div key={focused.id} className="mv-card" style={{ "--aura": focused.wm.aura } as React.CSSProperties}>
            <div className="mv-card-meta">
              <span>
                {focusIdx + 1} / {n}
              </span>
              {showPhases && focused.phase !== undefined && (
                <span style={{ color: PHASE_COLORS[focused.phase] }}>{PHASE_LABELS[focused.phase].split("—")[0]}</span>
              )}
              <span>{focused.year}</span>
            </div>
            {focused.sub && <div className="sub-label">{focused.sub}</div>}
            <div className="mv-card-title">
              <Wordmark entry={focused} base={1.7} />
            </div>
            <div className="mv-card-actions">
              <button className="mv-nav" onClick={() => fly(focusIdx - 1)} disabled={focusIdx === 0} aria-label="Previous">
                ‹
              </button>
              <button className="mv-btn" onClick={() => onSelect(focused)}>
                Details
              </button>
              <button className={`mv-claim ${focusedWatched ? "done" : ""}`} onClick={() => onQuickToggle(focused)}>
                {focusedWatched ? "↺ Reopen" : "◉ Explored"}
              </button>
              <button className="mv-nav" onClick={() => fly(focusIdx + 1)} disabled={focusIdx === n - 1} aria-label="Next">
                ›
              </button>
            </div>
          </div>
        )}

        {snap && (
          <div key={snap.key} className="mv-snap" style={{ "--phase-color": PHASE_COLORS[snap.phase] } as React.CSSProperties}>
            <div className="mv-snap-bar top" />
            <div className="mv-snap-bar bottom">
              <div className="mv-snap-text">
                <span className="mv-snap-kicker">{PHASE_LABELS[snap.phase].split("—")[0]} · threat erased</span>
                <span className="mv-snap-boss">{PHASE_BOSSES[snap.phase].name}</span>
                <span className="mv-snap-quip">“{PHASE_BOSSES[snap.phase].quip}”</span>
              </div>
            </div>
          </div>
        )}

        {map && <div className="mv-hint show">Click any world to travel there · Esc to return</div>}
        {!map && <div className={`mv-hint ${scrolled ? "" : "show"}`}>Scroll to travel the multiverse · ↑ ↓ keys · M for map</div>}
      </div>
    </>
  );
}
