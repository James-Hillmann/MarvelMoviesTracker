"use client";

import { useEffect, useMemo, useState } from "react";
import { bossKO, originOf, pixelBurst, scorePop } from "@/lib/arcadeFx";
import { getAudioSettings, sfx, startMusic } from "@/lib/chiptune";
import { Profile, profileById } from "@/lib/profiles";
import { POINTS, scoreFor } from "@/lib/score";
import { PROFILE_HEROES } from "@/lib/sprites";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useProgress } from "@/lib/useProgress";
import ArcadeBackground from "./ArcadeBackground";
import CartridgeShelf from "./CartridgeShelf";
import DetailModal from "./DetailModal";
import OverworldMap from "./OverworldMap";
import ProfilePicker from "./ProfilePicker";
import ProgressHeader from "./ProgressHeader";

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
  const heroes = profile ? (PROFILE_HEROES[profile.id] ?? []) : [];
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

  // browsers only allow audio after a gesture — resume the soundtrack on the first one
  useEffect(() => {
    const kick = () => {
      if (getAudioSettings().music) startMusic();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
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

  const movieOrder = useMemo(() => moviesInOrder(orderMode), [orderMode]);

  const watchedMovies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const watchedShows = SHOWS.filter((e) => watched[e.id]).length;
  const doomGlow = COUNTED_MOVIES.length ? watchedMovies / COUNTED_MOVIES.length : 0;
  const score = scoreFor(watched);

  const upNextMovie = movieOrder.find((e) => !watched[e.id])?.id ?? null;
  const upNextShow = SHOWS.find((e) => !watched[e.id])?.id ?? null;

  const segments = movieOrder
    .filter((e) => e.id !== "doomsday")
    .map((e) => ({ id: e.id, color: PHASE_COLORS[e.phase ?? 6], done: Boolean(watched[e.id]) }));

  const handleToggle = async (entry: Entry) => {
    const el = document.querySelector(`[data-entry="${entry.id}"]`);
    const nowWatched = await toggle(entry.id);
    if (!nowWatched) {
      sfx.powerDown();
      return;
    }
    // did this watch clear the whole phase? then it's a boss K.O., not just a coin
    const phase = entry.phase;
    const boss = phase !== undefined ? PHASE_BOSSES[phase] : undefined;
    const clearedPhase =
      boss && entry.type === "movie" && MOVIES.filter((m) => m.phase === phase).every((m) => m.id === entry.id || watched[m.id]);
    const origin = originOf(el);
    if (clearedPhase && phase !== undefined) {
      sfx.fanfare();
      bossKO({
        world: phase,
        phaseLabel: PHASE_LABELS[phase].split("—")[0].trim(),
        bossName: boss.name,
        quip: boss.quip,
        color: PHASE_COLORS[phase],
        img: boss.img,
      });
    } else {
      sfx.coin();
      pixelBurst(entry.wm.aura, origin);
      scorePop(`+${entry.type === "movie" ? POINTS.movie : POINTS.show}`, origin);
    }
  };

  // wait for localStorage before rendering anything (avoids a picker flash)
  if (profileId === null) {
    return <div className="min-h-screen" />;
  }

  if (!profile) {
    return (
      <div className="relative min-h-screen">
        <ArcadeBackground />
        <ProfilePicker onPick={pickProfile} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ArcadeBackground progress={doomGlow} />

      <ProgressHeader
        watchedMovies={watchedMovies}
        totalMovies={COUNTED_MOVIES.length}
        watchedShows={watchedShows}
        totalShows={SHOWS.length}
        score={score}
        segments={segments}
        orderMode={orderMode}
        onOrderChange={setOrderMode}
        showShows={showShows}
        onShowShowsChange={setShowShows}
        profile={profile}
        heroes={heroes}
        onSwitchProfile={() => {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          setProfileId("");
        }}
      />

      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-8">
        <div className="map-title">
          <div className="mt-kicker">{orderMode === "release" ? "RELEASE ORDER" : "IN-UNIVERSE TIMELINE"}</div>
          <div className="mt-logo">ROAD TO DOOMSDAY</div>
          <div className="mt-sub">CLEAR EVERY STAGE BEFORE 12.18.2026</div>
        </div>

        <div className={`flex flex-col gap-16 ${showShows ? "lg:flex-row lg:items-start lg:gap-10" : ""}`}>
          {/* movies — the main quest */}
          <section className={showShows ? "min-w-0 lg:flex-[3]" : "mx-auto w-full max-w-3xl min-w-0"}>
            <div className="quest-head">
              <h2>MAIN QUEST · OVERWORLD</h2>
              <span>
                {watchedMovies}/{COUNTED_MOVIES.length} CLEAR
              </span>
            </div>
            <OverworldMap
              entries={movieOrder}
              watched={watched}
              upNextId={upNextMovie}
              showPhases={orderMode === "release"}
              finaleId="doomsday"
              doomGlow={doomGlow}
              heroes={heroes}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </section>

          {/* shows — the side quest */}
          {showShows && (
            <aside className="side-quest min-w-0 lg:flex-[2]">
              <div className="quest-head">
                <h2>SIDE QUEST · CARTRIDGES</h2>
                <span>
                  {watchedShows}/{SHOWS.length}
                </span>
              </div>
              <p className="quest-note">
                Shows don&apos;t count toward the Doomsday clock — knock them out whenever. The first six are the Netflix
                era: bonus stages, semi-canon, skippable, but great.
              </p>
              <CartridgeShelf
                entries={SHOWS}
                watched={watched}
                upNextId={upNextShow}
                onSelect={setSelected}
                onQuickToggle={handleToggle}
              />
            </aside>
          )}
        </div>

        <footer className="arcade-foot">
          <div>
            {profile.label} VS. THE MULTIVERSE · SCORE {String(score).padStart(7, "0")}
          </div>
          <div className="af-dim">DATA FROM TMDB · INSERT COIN TO CONTINUE</div>
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
