"use client";

import { useEffect, useMemo, useState } from "react";
import { celebrate, phaseVictory } from "@/lib/confetti";
import { Profile, profileById } from "@/lib/profiles";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useArtwork } from "@/lib/useArtwork";
import { useProgress } from "@/lib/useProgress";
import Board from "./Board";
import DetailModal from "./DetailModal";
import Hero from "./Hero";
import ProfilePicker from "./ProfilePicker";
import ProgressHeader from "./ProgressHeader";
import SagaBackground from "./SagaBackground";

const PROFILE_STORAGE_KEY = "mcu-profile";

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
  const art = useArtwork();
  const [orderMode, setOrderModeState] = useState<"release" | "chrono">("release");
  const [showShows, setShowShowsState] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);

  // per-device display settings
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mcu-settings") ?? "{}") as {
        orderMode?: "release" | "chrono";
        showShows?: boolean;
      };
      if (saved.orderMode === "chrono" || saved.orderMode === "release") setOrderModeState(saved.orderMode);
      if (typeof saved.showShows === "boolean") setShowShowsState(saved.showShows);
    } catch {
      /* corrupt settings — defaults win */
    }
  }, []);

  const saveSettings = (orderModeVal: "release" | "chrono", showShowsVal: boolean) => {
    localStorage.setItem("mcu-settings", JSON.stringify({ orderMode: orderModeVal, showShows: showShowsVal }));
  };
  const setOrderMode = (mode: "release" | "chrono") => {
    setOrderModeState(mode);
    saveSettings(mode, showShows);
  };
  const setShowShows = (show: boolean) => {
    setShowShowsState(show);
    saveSettings(orderMode, show);
  };

  // poster wall density: 2-up on phones, 4-up on tablets, 3-up beside the TV
  // column, a 6-wide shelf when the movies have the whole stage
  const [viewport, setViewport] = useState<"phone" | "tablet" | "wide">("wide");
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 640px)");
    const tablet = window.matchMedia("(max-width: 1023px)");
    const update = () => setViewport(phone.matches ? "phone" : tablet.matches ? "tablet" : "wide");
    update();
    phone.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);
  const isMobile = viewport === "phone";
  const movieCols = isMobile ? 2 : showShows ? 3 : viewport === "tablet" ? 4 : 6;

  const movieOrder = useMemo(() => moviesInOrder(orderMode), [orderMode]);

  const watchedMovies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const watchedShows = SHOWS.filter((e) => watched[e.id]).length;
  const doomGlow = COUNTED_MOVIES.length ? watchedMovies / COUNTED_MOVIES.length : 0;

  const upNextMovie = movieOrder.find((e) => !watched[e.id])?.id ?? null;
  const heroEntry = movieOrder.find((e) => e.id === upNextMovie) ?? movieOrder[movieOrder.length - 1];
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
  if (profileId === null) {
    return <div className="min-h-screen" />;
  }

  if (!profile) {
    return (
      <div className="relative min-h-screen">
        <SagaBackground />
        <ProfilePicker onPick={pickProfile} art={art} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <SagaBackground />

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
      />

      <Hero
        entry={heroEntry}
        position={movieOrder.indexOf(heroEntry) + 1}
        total={COUNTED_MOVIES.length}
        watchedCount={watchedMovies}
        allDone={upNextMovie === null || upNextMovie === "doomsday"}
        art={art}
        onOpen={setSelected}
        onToggle={handleToggle}
      />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
          {/* movies — the main quest */}
          <section className={showShows ? "min-w-0 lg:flex-[3]" : "w-full min-w-0"}>
            <div className="section-head">
              <h2 className="section-title">The Movies</h2>
              <div className="order-switch" role="group" aria-label="Watch order">
                <button className={orderMode === "release" ? "active" : ""} onClick={() => setOrderMode("release")}>
                  Release
                </button>
                <button className={orderMode === "chrono" ? "active" : ""} onClick={() => setOrderMode("chrono")}>
                  Timeline
                </button>
              </div>
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
              art={art}
              wordmarkBase={isMobile ? 1.15 : movieCols >= 4 ? 1.1 : 1.35}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </section>

          {/* shows — the side quest */}
          {showShows && (
          <aside className="min-w-0 lg:flex-[2] lg:border-l lg:border-white/10 lg:pl-8">
            <div className="section-head">
              <h2 className="section-title">Side Quest · TV</h2>
              <span className="section-meta">
                {watchedShows}/{SHOWS.length}
              </span>
            </div>
            <p className="mb-6 text-xs leading-relaxed text-white/45">
              The shows don&apos;t count toward the Doomsday clock — knock them out whenever.
              The first six are the Netflix era: semi-canon, skippable, but great.
            </p>
            <Board
              entries={SHOWS}
              cols={2}
              watched={watched}
              upNextId={upNextShow}
              layoutKey="shows"
              art={art}
              wordmarkBase={isMobile ? 1.0 : 1.15}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </aside>
          )}
        </div>

        <footer className="site-footer">
          {profile.label} vs. the Multiverse · data from TMDB
        </footer>
      </main>

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
