"use client";

import { useEffect, useRef, useState } from "react";
import { Profile } from "@/lib/profiles";
import { DOOMSDAY_DATE, Entry } from "@/lib/timeline";

interface Spine {
  id: string;
  title: string;
  aura: string;
  read: boolean;
}

interface Props {
  /** one comic spine per counted movie, in reading order */
  spines: Spine[];
  upNext: Entry | null;
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
  spines,
  upNext,
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

  const continueReading = () => {
    if (!upNext) return;
    const el = document.querySelector<HTMLElement>(`[data-entry="${upNext.id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  return (
    <header className="masthead sm:sticky sm:top-0">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2.5 px-3 py-2.5 sm:px-4 sm:py-3">
        {/* row 1: logo · next-issue countdown · profile/settings */}
        <h1 className="hdr-title text-[1.6rem] sm:text-[2.3rem]">Road to Doomsday!</h1>

        <div className="ml-auto flex items-center gap-3 sm:order-3 sm:ml-0">
          <div className="next-issue" suppressHydrationWarning>
            <span className="ni-label">Next issue: Doomsday</span>
            {cd ? (
              <span className="ni-time">
                <b>{cd.days}</b>d <b>{String(cd.hours).padStart(2, "0")}</b>h{" "}
                <b>{String(cd.mins).padStart(2, "0")}</b>m
                <span className="hidden sm:inline">
                  {" "}
                  <b>{String(cd.secs).padStart(2, "0")}</b>s
                </span>
              </span>
            ) : (
              <span className="ni-time">&nbsp;</span>
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

        {/* row 2: the collection shelf — one spine per movie, coloured once read */}
        <div className="order-3 flex w-full min-w-0 items-end gap-3 sm:order-2 sm:w-auto sm:flex-1">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs font-bold sm:text-sm">
              <span>
                <span className="f-anton text-lg text-[color:var(--red)]">{watchedMovies}</span> of {totalMovies}{" "}
                issues read
              </span>
              {showShows && (
                <span className="hidden sm:inline">
                  stickers {watchedShows}/{totalShows}
                </span>
              )}
            </div>
            <div className="spine-shelf" role="img" aria-label={`${watchedMovies} of ${totalMovies} movies watched`}>
              {spines.map((sp) => (
                <i
                  key={sp.id}
                  title={sp.title}
                  className={sp.read ? "read" : sp.id === upNext?.id ? "next" : ""}
                  style={{ "--aura": sp.aura } as React.CSSProperties}
                />
              ))}
            </div>
            {pace && <div className="pace-note mt-1 text-[11px] sm:text-xs">{pace}</div>}
          </div>
          {upNext && (
            <button className="continue-btn" onClick={continueReading} title={`Jump to ${upNext.title}`}>
              <small>Continue</small>
              <span>reading!</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
