"use client";

import { useEffect, useRef, useState } from "react";
import { Profile } from "@/lib/profiles";
import { DOOMSDAY_DATE } from "@/lib/timeline";

interface Props {
  watchedMovies: number;
  totalMovies: number;
  watchedShows: number;
  totalShows: number;
  orderMode: "release" | "chrono";
  onOrderChange: (mode: "release" | "chrono") => void;
  showShows: boolean;
  onShowShowsChange: (show: boolean) => void;
  profile: Profile;
  onOpenWarRoom: () => void;
  onSwitchProfile: () => void;
}

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return { days, hours, mins, secs };
}

export default function ProgressHeader({
  watchedMovies,
  totalMovies,
  watchedShows,
  totalShows,
  orderMode,
  onOrderChange,
  showShows,
  onShowShowsChange,
  profile,
  onOpenWarRoom,
  onSwitchProfile,
}: Props) {
  const cd = useCountdown(DOOMSDAY_DATE);
  const remaining = totalMovies - watchedMovies;
  const pct = totalMovies ? (watchedMovies / totalMovies) * 100 : 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside tap (hover handles itself on desktop)
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  let pace: string | null = null;
  if (cd && remaining > 0 && cd.days > 0) {
    const daysPer = cd.days / remaining;
    pace =
      daysPer >= 1.5
        ? `≈ 1 movie every ${Math.floor(daysPer)} days to make it`
        : daysPer >= 0.9
          ? "≈ 1 movie a day to make it — get moving!"
          : `≈ ${Math.ceil(1 / daysPer)} movies a day needed — assemble!`;
  } else if (remaining === 0) {
    pace = "Caught up. Doomsday awaits.";
  }

  return (
    <header className="relative z-40 border-b border-white/10 bg-black/55 backdrop-blur-md sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1.5 px-3 py-2 sm:gap-y-2 sm:px-4 sm:py-3">
        {/* row 1: title · countdown · profile/settings */}
        <h1 className="hdr-title text-xl sm:text-3xl">ROAD TO DOOMSDAY</h1>

        <div className="ml-auto flex items-center gap-3 sm:order-3 sm:ml-0">
          <div className="text-right leading-tight" suppressHydrationWarning>
            {cd ? (
              <>
                <div className="font-mono text-sm tabular-nums text-white/90 sm:text-xl">
                  {cd.days}
                  <span className="text-white/40">d </span>
                  {String(cd.hours).padStart(2, "0")}
                  <span className="text-white/40">h </span>
                  {String(cd.mins).padStart(2, "0")}
                  <span className="text-white/40">m </span>
                  <span className="hidden sm:inline">
                    {String(cd.secs).padStart(2, "0")}
                    <span className="text-white/40">s</span>
                  </span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-[color:var(--doom-green)]/80 sm:text-[10px]">
                  until Doomsday
                </div>
              </>
            ) : (
              <div className="h-8 w-32 sm:h-9 sm:w-40" />
            )}
          </div>

          <button className="warroom-btn" onClick={onOpenWarRoom} aria-label="Open the War Room: stats, movie nights, crew and badges">
            <span aria-hidden="true">◈</span>
            <span className="hidden sm:inline">War Room</span>
          </button>

          {/* profile chip + settings dropdown */}
          <div
            ref={menuRef}
            className="settings-wrap"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className="profile-chip"
              style={{ "--aura": profile.color } as React.CSSProperties}
              onClick={() => setMenuOpen(true)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {profile.label}
              <span className={`chev ${menuOpen ? "open" : ""}`} aria-hidden="true">
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="settings-menu" role="menu">
                <div className="settings-label">Watch order</div>
                <div className="settings-seg">
                  <button
                    className={orderMode === "release" ? "active" : ""}
                    onClick={() => onOrderChange("release")}
                  >
                    Release
                  </button>
                  <button
                    className={orderMode === "chrono" ? "active" : ""}
                    onClick={() => onOrderChange("chrono")}
                  >
                    Chronological
                  </button>
                </div>

                <button
                  className="settings-row"
                  role="menuitemcheckbox"
                  aria-checked={showShows}
                  onClick={() => onShowShowsChange(!showShows)}
                >
                  <span>Show TV shows</span>
                  <span className={`switch ${showShows ? "on" : ""}`} aria-hidden="true">
                    <span className="knob" />
                  </span>
                </button>

                <div className="settings-divider" />

                <button className="settings-row" onClick={onOpenWarRoom}>
                  <span>War Room · stats &amp; badges</span>
                  <span aria-hidden="true">◈</span>
                </button>

                <button className="settings-row" onClick={onSwitchProfile}>
                  <span>Switch profile</span>
                  <span aria-hidden="true">↩</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* row 2: full-width progress bar */}
        <div className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:min-w-[160px] sm:flex-1">
          <div className="mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">
            <span>
              <span className="text-white/95">{watchedMovies}</span> / {totalMovies} movies
            </span>
            {showShows && (
              <span>
                side quest {watchedShows}/{totalShows}
              </span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          {pace && <div className="mt-1 text-[10px] tracking-wide text-white/45 sm:text-[11px]">{pace}</div>}
        </div>
      </div>
    </header>
  );
}
