"use client";

import { useEffect, useMemo, useState } from "react";
import { celebrate, phaseVictory } from "@/lib/confetti";
import { Profile, profileById } from "@/lib/profiles";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useProgress } from "@/lib/useProgress";
import DetailModal from "./DetailModal";
import HexMap from "./HexMap";
import MissionLog from "./MissionLog";
import ProfilePicker from "./ProfilePicker";
import ProgressHeader from "./ProgressHeader";
import SagaBackground from "./SagaBackground";
import TargetPanel from "./TargetPanel";

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

  // phones get a roomier 2-wide snake so wordmarks don't wrap into mush
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const movieOrder = useMemo(() => moviesInOrder(orderMode), [orderMode]);

  const watchedMovies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const watchedShows = SHOWS.filter((e) => watched[e.id]).length;
  const doomGlow = COUNTED_MOVIES.length ? watchedMovies / COUNTED_MOVIES.length : 0;

  const upNextMovie = movieOrder.find((e) => !watched[e.id])?.id ?? null;
  const upNextShow = SHOWS.find((e) => !watched[e.id])?.id ?? null;
  const target = movieOrder.find((e) => e.id === upNextMovie) ?? null;
  const targetPosition = target ? movieOrder.indexOf(target) + 1 : movieOrder.length;
  const lastCleared = MOVIES.filter((e) => watched[e.id]).sort((a, b) => watched[b.id] - watched[a.id])[0] ?? null;

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
        <ProfilePicker onPick={pickProfile} />
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

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:pt-8">
        {/* sector map — the whole flight path at a glance */}
        <section className="mb-6">
          <div className="sec-head">
            <h2>Sector map</h2>
            <span className="hud-label">
              {orderMode === "release" ? "release order" : "in-universe timeline"} · {COUNTED_MOVIES.length} films
            </span>
          </div>
          <HexMap
            entries={movieOrder}
            watched={watched}
            upNextId={upNextMovie}
            showPhases={orderMode === "release"}
            onSelect={setSelected}
          />
        </section>

        {/* current target */}
        <TargetPanel
          target={target}
          lastCleared={lastCleared}
          lastClearedAt={lastCleared ? watched[lastCleared.id] : undefined}
          position={targetPosition}
          total={movieOrder.length}
          onOpen={setSelected}
          onClear={handleToggle}
        />

        <div className="mt-10 flex flex-col gap-12 lg:flex-row lg:gap-8">
          {/* movies — the mission log */}
          <section className={showShows ? "min-w-0 lg:flex-[3]" : "w-full min-w-0"}>
            <div className="sec-head">
              <h2>Mission log</h2>
              <span className="hud-label">
                <span className="on">{String(watchedMovies).padStart(2, "0")}</span> / {COUNTED_MOVIES.length} cleared
              </span>
            </div>
            <MissionLog
              entries={movieOrder}
              watched={watched}
              upNextId={upNextMovie}
              showPhases={orderMode === "release"}
              wordmarkBase={isMobile ? 0.95 : 1.1}
              onSelect={setSelected}
              onToggle={handleToggle}
            />
          </section>

          {/* shows — the side channel */}
          {showShows && (
          <aside className="min-w-0 lg:flex-[2] lg:border-l lg:border-[color:var(--line)] lg:pl-8">
            <div className="sec-head">
              <h2>Side channel · TV</h2>
              <span className="hud-label">
                {watchedShows}/{SHOWS.length} cleared
              </span>
            </div>
            <p className="mb-5 text-xs leading-relaxed" style={{ color: "rgba(160,210,235,0.5)" }}>
              The shows don&apos;t count toward the Doomsday clock — knock them out whenever.
              The first six are the Netflix era: semi-canon, skippable, but great.
            </p>
            <MissionLog
              entries={SHOWS}
              watched={watched}
              upNextId={upNextShow}
              showPhases={false}
              wordmarkBase={isMobile ? 0.85 : 0.95}
              onSelect={setSelected}
              onToggle={handleToggle}
            />
          </aside>
          )}
        </div>

        <footer className="mt-20 text-center hud-label" style={{ opacity: 0.7 }}>
          operative: {profile.label} · uplink: TMDB · end of transmission
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
