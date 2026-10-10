"use client";

import { useEffect, useMemo, useState } from "react";
import { celebrate, phaseVictory } from "@/lib/confetti";
import { Profile, profileById } from "@/lib/profiles";
import { COUNTED_MOVIES, Entry, MOVIES, moviesInOrder, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS, SHOWS } from "@/lib/timeline";
import { useProgress } from "@/lib/useProgress";
import ComicBook from "./ComicBook";
import DetailModal from "./DetailModal";
import ProfilePicker from "./ProfilePicker";
import ProgressHeader from "./ProgressHeader";
import SagaBackground from "./SagaBackground";
import StickerAlbum from "./StickerAlbum";

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
  const movieCols = isMobile ? 2 : 6;

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
      celebrate(entry.wm.aura, document.querySelector(`[data-entry="${entry.id}"]`));
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
        spines={movieOrder.filter((e) => e.id !== "doomsday").map((e) => ({ id: e.id, title: e.title, aura: e.wm.aura, read: Boolean(watched[e.id]) }))}
        upNext={movieOrder.find((e) => e.id === upNextMovie) ?? null}
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

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
          {/* movies — the main quest */}
          <section className={showShows ? "min-w-0 lg:flex-[3]" : "mx-auto w-full max-w-4xl min-w-0"}>
            <div className="mb-8 flex items-center justify-between gap-3">
              <h2 className="section-title">The Collection</h2>
              <span className="section-meta">
                {orderMode === "release" ? "six issues, read in release order" : "the omnibus, in-universe order"}
              </span>
            </div>
            <ComicBook
              entries={movieOrder}
              cols={movieCols}
              watched={watched}
              upNextId={upNextMovie}
              showPhases={orderMode === "release"}
              finaleId="doomsday"
              doomGlow={doomGlow}
              wordmarkBase={isMobile ? 1.2 : 1.5}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </section>

          {/* shows — the side quest */}
          {showShows && (
          <aside className="min-w-0 lg:flex-[2] lg:border-l-[3px] lg:border-dashed lg:border-[color:var(--ink)] lg:pl-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="section-title">Sticker Album: TV</h2>
              <span className="section-meta">
                {watchedShows}/{SHOWS.length}
              </span>
            </div>
            <p className="note-box mb-10">
              The shows don&apos;t count toward the Doomsday clock. Watch one and its sticker goes in.
              The Netflix six are bonus stickers: semi-canon, skippable, but great.
            </p>
            <StickerAlbum
              entries={SHOWS}
              watched={watched}
              upNextId={upNextShow}
              wordmarkBase={isMobile ? 1.0 : 1.1}
              onSelect={setSelected}
              onQuickToggle={handleToggle}
            />
          </aside>
          )}
        </div>

        <footer className="mt-24 text-center">
          <span className="caption">{profile.label} vs. the Multiverse</span>
          <div className="section-meta mt-3">To be continued… · data from TMDB</div>
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
