"use client";

import { useEffect, useMemo, useState } from "react";
import { celebrate, phaseVictory } from "@/lib/confetti";
import { Profile, profileById } from "@/lib/profiles";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useArtwork } from "@/lib/useArtwork";
import { useProgress } from "@/lib/useProgress";
import Chapter from "./Chapter";
import DetailModal from "./DetailModal";
import Hero from "./Hero";
import Premiere from "./Premiere";
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

  // phones get slightly smaller wordmarks on the title cards
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const movieOrder = useMemo(() => moviesInOrder(orderMode), [orderMode]);
  const finale = MOVIES.find((e) => e.id === "doomsday") as Entry;
  const road = useMemo(() => movieOrder.filter((e) => e.id !== finale.id), [movieOrder, finale]);

  // release order: one chapter per phase, each with its villain.
  // timeline order: the same road cut into reels.
  const chapters = useMemo(() => {
    if (orderMode === "release") {
      const phases = [...new Set(road.map((e) => e.phase as number))];
      return phases.map((p) => {
        const [title, saga] = PHASE_LABELS[p].split("—").map((x) => x.trim());
        return {
          key: `phase-${p}`,
          number: p,
          kicker: "Chapter",
          title,
          saga,
          color: PHASE_COLORS[p],
          boss: PHASE_BOSSES[p],
          entries: road.filter((e) => e.phase === p),
        };
      });
    }
    const REEL = 8;
    const words = ["One", "Two", "Three", "Four", "Five", "Six"];
    const colors = Object.values(PHASE_COLORS);
    return Array.from({ length: Math.ceil(road.length / REEL) }, (_, i) => ({
      key: `reel-${i}`,
      number: i + 1,
      kicker: "Timeline",
      title: `Reel ${words[i] ?? i + 1}`,
      saga: undefined,
      color: colors[Math.min(i, colors.length - 1)],
      boss: undefined,
      entries: road.slice(i * REEL, (i + 1) * REEL),
    }));
  }, [orderMode, road]);

  const showChapters = [
    { key: "netflix", number: 1, kicker: "Bonus", title: "The Defenders Saga", saga: "Netflix", color: "#c01218", boss: undefined, entries: SHOWS.filter((e) => e.type === "netflix") },
    { key: "disney", number: 2, kicker: "Bonus", title: "The Series", saga: "Disney+", color: "#3a8ad4", boss: undefined, entries: SHOWS.filter((e) => e.type === "show") },
  ];

  const watchedMovies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const watchedShows = SHOWS.filter((e) => watched[e.id]).length;

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
        reel={road.map((e) => ({ id: e.id, aura: e.wm.aura, on: Boolean(watched[e.id]) }))}
        art={art}
        onOpen={setSelected}
        onToggle={handleToggle}
      />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14">
        <div className="section-head">
          <div>
            <div className="section-kicker">{orderMode === "release" ? "Six chapters · six villains" : "In-universe order"}</div>
            <h2 className="section-title">{orderMode === "release" ? "The Saga" : "The Timeline"}</h2>
          </div>
          <div className="order-switch" role="group" aria-label="Watch order">
            <button className={orderMode === "release" ? "active" : ""} onClick={() => setOrderMode("release")}>
              Release
            </button>
            <button className={orderMode === "chrono" ? "active" : ""} onClick={() => setOrderMode("chrono")}>
              Timeline
            </button>
          </div>
        </div>

        <div className="chapters">
          {chapters.map(({ key, ...c }) => (
            <Chapter
              key={`${orderMode}-${key}`}
              {...c}
              numberOf={(e) => movieOrder.indexOf(e) + 1}
              watched={watched}
              art={art}
              upNextId={upNextMovie}
              wordmarkBase={isMobile ? 1.0 : 1.1}
              onSelect={setSelected}
              onToggle={handleToggle}
            />
          ))}
        </div>

        <Premiere
          finale={finale}
          road={road}
          watched={watched}
          art={art}
          onSelect={setSelected}
          onToggle={handleToggle}
        />

        {/* shows — bonus features, never count toward the clock */}
        {showShows && (
          <div className="bonus">
            <div className="section-head">
              <div>
                <div className="section-kicker">Side quest · {watchedShows}/{SHOWS.length} seen</div>
                <h2 className="section-title">Bonus Features</h2>
              </div>
            </div>
            <p className="bonus-note">
              The shows don&apos;t count toward the Doomsday clock — knock them out whenever. The Netflix era is
              semi-canon, skippable, but great.
            </p>
            <div className="chapters">
              {showChapters.map(({ key, ...c }) => (
                <Chapter
                  key={key}
                  {...c}
                  numberOf={(e) => SHOWS.indexOf(e) + 1}
                  watched={watched}
                  art={art}
                  upNextId={upNextShow}
                  wordmarkBase={isMobile ? 0.95 : 1.05}
                  onSelect={setSelected}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        )}

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
