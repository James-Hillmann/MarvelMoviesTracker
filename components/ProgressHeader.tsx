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
    <header className="masthead sm:sticky sm:top-0">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2.5 px-3 py-2.5 sm:gap-y-2 sm:px-4 sm:py-3">
        {/* row 1: issue no. + title · countdown · profile/settings */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="issue-box" title="Movies watched">
            <small>NO.</small>
            <b>{watchedMovies}</b>
          </div>
          <h1 className="hdr-title text-[1.6rem] sm:text-[2.4rem]">Road to Doomsday!</h1>
        </div>

        <div className="ml-auto flex items-center gap-3 sm:order-3 sm:ml-0">
          <div className="flex flex-col items-end gap-1 leading-tight" suppressHydrationWarning>
            {cd ? (
              <>
                <div className="flex gap-1 text-base sm:text-xl">
                  <span className="cd-box">
                    {cd.days}
                    <small>D</small>
                  </span>
                  <span className="cd-box">
                    {String(cd.hours).padStart(2, "0")}
                    <small>H</small>
                  </span>
                  <span className="cd-box">
                    {String(cd.mins).padStart(2, "0")}
                    <small>M</small>
                  </span>
                  {/* wrapper carries the breakpoint: .cd-box's own display would beat the utility */}
                  <span className="hidden sm:inline-flex">
                    <span className="cd-box">
                      {String(cd.secs).padStart(2, "0")}
                      <small>S</small>
                    </span>
                  </span>
                </div>
                <div className="cd-label text-[10px] sm:text-xs">until Doomsday!</div>
              </>
            ) : (
              <div className="h-10 w-32 sm:h-12 sm:w-44" />
            )}
          </div>

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
          <div className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide sm:text-sm">
            <span>
              <span className="f-bangers text-base tracking-wider text-[color:var(--red)] sm:text-lg">{watchedMovies}</span> of {totalMovies} movies
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
          {pace && <div className="pace-note mt-1.5 text-[11px] sm:text-xs">{pace}</div>}
        </div>
      </div>
    </header>
  );
}
