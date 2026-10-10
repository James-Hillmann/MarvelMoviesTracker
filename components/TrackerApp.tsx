"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { celebrate, phaseVictory } from "@/lib/confetti";
import { Profile, profileById } from "@/lib/profiles";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useProgress } from "@/lib/useProgress";
import Board from "./Board";
import DetailModal from "./DetailModal";
import ProfilePicker from "./ProfilePicker";
import ProgressHeader from "./ProgressHeader";
import SagaBackground from "./SagaBackground";

// three.js only ever runs in the browser, and only when the 3D view is on
const MultiverseView = dynamic(() => import("./multiverse/MultiverseView"), {
  ssr: false,
  loading: () => <div className="mv-loading">Opening the multiverse…</div>,
});

const PROFILE_STORAGE_KEY = "mcu-profile";

export type ViewMode = "multiverse" | "classic";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function TrackerApp() {
  // null = not yet loaded from storage; "" = loaded, none picked
  const [profileId, setProfileId] = useState<string | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    setProfileId(profileById(saved) ? (saved as string) : "");
  }, []);

  const pickProfile = (p: Profile) => {
    localStorage.setItem(PROFILE_STORAGE_KEY, p.id);
    setProfileId(p.id);
  };

  const profile = profileById(profileId);
  const { watched, toggle } = useProgress(profile?.id ?? null);
  const [orderMode, setOrderModeState] = useState<"release" | "chrono">("release");
  const [showShows, setShowShowsState] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  // null until we know whether this device can (and should) run 3D
  const [viewMode, setViewModeState] = useState<ViewMode | null>(null);
  const [canWebgl, setCanWebgl] = useState(true);
  const [showsOpen, setShowsOpen] = useState(false);

  // per-device display settings
  useEffect(() => {
    const gl = webglAvailable();
    setCanWebgl(gl);
    let mode: ViewMode | undefined;
    try {
      const saved = JSON.parse(localStorage.getItem("mcu-settings") ?? "{}") as {
        orderMode?: "release" | "chrono";
        showShows?: boolean;
        viewMode?: ViewMode;
      };
      if (saved.orderMode === "chrono" || saved.orderMode === "release") setOrderModeState(saved.orderMode);
      if (typeof saved.showShows === "boolean") setShowShowsState(saved.showShows);
      if (saved.viewMode === "multiverse" || saved.viewMode === "classic") mode = saved.viewMode;
    } catch {
      /* corrupt settings — defaults win */
    }
    // phones, reduced-motion and no-WebGL devices default to the classic board
    const preferClassic =
      window.matchMedia("(max-width: 640px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gl) mode = "classic";
    setViewModeState(mode ?? (preferClassic ? "classic" : "multiverse"));
  }, []);

  const saveSettings = (orderModeVal: "release" | "chrono", showShowsVal: boolean, viewModeVal: ViewMode | null) => {
    localStorage.setItem(
      "mcu-settings",
      JSON.stringify({ orderMode: orderModeVal, showShows: showShowsVal, viewMode: viewModeVal ?? undefined }),
    );
  };
  const setOrderMode = (mode: "release" | "chrono") => {
    setOrderModeState(mode);
    saveSettings(mode, showShows, viewMode);
  };
  const setShowShows = (show: boolean) => {
    setShowShowsState(show);
    saveSettings(orderMode, show, viewMode);
  };
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    saveSettings(orderMode, showShows, mode);
    window.scrollTo({ top: 0 });
  };

  // phones get a roomier 2-wide snake so wordmarks don't wrap into mush
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const movieCols = isMobile ? 2 : 3;

  const movieOrder = useMemo(() => moviesInOrder(orderMode), [orderMode]);

  const watchedMovies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const watchedShows = SHOWS.filter((e) => watched[e.id]).length;
  const doomGlow = COUNTED_MOVIES.length ? watchedMovies / COUNTED_MOVIES.length : 0;

  const upNextMovie = movieOrder.find((e) => !watched[e.id])?.id ?? null;
  const upNextShow = SHOWS.find((e) => !watched[e.id])?.id ?? null;

  const handleToggle = async (entry: Entry) => {
    const nowWatched = await toggle(entry.id);
    if (!nowWatched) return;
    // did this watch clear the whole phase? then it's a boss kill, not a confetti pop
    const phase = entry.phase;
    const boss = phase !== undefined ? PHASE_BOSSES[phase] : undefined;
    const clearedPhase =
      boss && MOVIES.filter((m) => m.phase === phase).every((m) => m.id === entry.id || watched[m.id]);
    if (clearedPhase && phase !== undefined) {
      phaseVictory(PHASE_LABELS[phase].split("—")[0].trim(), boss.name, boss.quip, PHASE_COLORS[phase], boss.img);
    } else {
      celebrate(entry.wm.aura);
    }
  };

  // wait for localStorage before rendering anything (avoids a picker flash)
  if (profileId === null || viewMode === null) {
    return <div className="min-h-screen" />;
  }

  if (!profile) {
    return (
      <div className="relative min-h-screen">
        <SagaBackground />
        <ProfilePicker onPick={pickProfile} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {viewMode === "classic" && <SagaBackground />}

      <ProgressHeader
        watchedMovies={watchedMovies}
        totalMovies={COUNTED_MOVIES.length}
        watchedShows={watchedShows}
        totalShows={SHOWS.length}
        orderMode={orderMode}
        onOrderChange={setOrderMode}
        showShows={showShows}
        onShowShowsChange={setShowShows}
        profile={profile}
        onSwitchProfile={() => {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          setProfileId("");
        }}
        viewMode={viewMode}
        onViewModeChange={canWebgl ? setViewMode : undefined}
        fixed={viewMode === "multiverse"}
      />

      {viewMode === "multiverse" ? (
        <>
          <MultiverseView
            entries={movieOrder}
            watched={watched}
            upNextId={upNextMovie}
            showPhases={orderMode === "release"}
            finaleId="doomsday"
            doomGlow={doomGlow}
            paused={Boolean(selected) || showsOpen}
            onSelect={setSelected}
            onQuickToggle={handleToggle}
          />
          {showShows && (
            <>
              <button className="mv-shows-btn" onClick={() => setShowsOpen(true)}>
                Side quest · TV <span className="text-white/50">{watchedShows}/{SHOWS.length}</span>
              </button>
              {showsOpen && (
                <div className="mv-drawer-overlay" onClick={() => setShowsOpen(false)}>
                  <aside className="mv-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 flex items-baseline justify-between">
                      <h2 className="f-bebas text-lg tracking-[0.35em] text-white/70">SIDE QUEST · TV</h2>
                      <button className="text-white/60 hover:text-white" onClick={() => setShowsOpen(false)} aria-label="Close">
                        ✕
                      </button>
                    </div>
                    <p className="mb-6 text-xs leading-relaxed text-white/40">
                      The shows don&apos;t count toward the Doomsday clock — knock them out whenever.
                    </p>
                    <Board
                      entries={SHOWS}
                      cols={2}
                      watched={watched}
                      upNextId={upNextShow}
                      layoutKey="shows-drawer"
                      wordmarkBase={1.0}
                      onSelect={setSelected}
                      onQuickToggle={handleToggle}
                    />
                  </aside>
                </div>
              )}
            </>
          )}
        </>
      ) : (
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
          {/* movies — the main quest */}
          <section className={showShows ? "min-w-0 lg:flex-[3]" : "mx-auto w-full max-w-3xl min-w-0"}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="f-bebas text-lg tracking-[0.35em] text-white/70">THE MOVIES</h2>
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                {orderMode === "release" ? "release order" : "in-universe timeline"}
              </span>
            </div>
            <Board
              entries={movieOrder}
              cols={movieCols}
              watched={watched}
              upNextId={upNextMovie}
              showPhases={orderMode === "release"}
              finaleId="doomsday"
              doomGlow={doomGlow}
              layoutKey={`movies-${orderMode}-${movieCols}`}
              wordmarkBase={isMobile ? 1.2 : 1.35}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </section>

          {/* shows — the side quest */}
          {showShows && (
          <aside className="min-w-0 lg:flex-[2] lg:border-l lg:border-white/10 lg:pl-8">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="f-bebas text-lg tracking-[0.35em] text-white/70">SIDE QUEST · TV</h2>
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                {watchedShows}/{SHOWS.length}
              </span>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-white/40">
              The shows don&apos;t count toward the Doomsday clock — knock them out whenever.
              The first six are the Netflix era: semi-canon, skippable, but great.
            </p>
            <Board
              entries={SHOWS}
              cols={2}
              watched={watched}
              upNextId={upNextShow}
              layoutKey="shows"
              wordmarkBase={isMobile ? 1.0 : 1.15}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </aside>
          )}
        </div>

        <footer className="mt-20 text-center text-[11px] uppercase tracking-[0.3em] text-white/25">
          {profile.label} vs. the Multiverse · data from TMDB
        </footer>
      </main>
      )}

      {selected && (
        <DetailModal
          entry={selected}
          watched={Boolean(watched[selected.id])}
          onToggle={handleToggle}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
