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

const pad = (n: number) => String(n).padStart(2, "0");

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
  const pct = totalMovies ? Math.round((watchedMovies / totalMovies) * 100) : 0;

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
        ? `required pace: 1 film / ${Math.floor(daysPer)} days`
        : daysPer >= 0.9
          ? "required pace: 1 film / day — move"
          : `required pace: ${Math.ceil(1 / daysPer)} films / day — assemble`;
  } else if (remaining === 0) {
    pace = "all objectives complete. awaiting doomsday.";
  }

  const initials = profile.label
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="hud-header sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2.5 sm:gap-y-2 sm:px-4 sm:py-3">
        {/* row 1: title · countdown · profile/settings */}
        <div className="flex flex-col gap-0.5">
          <div className="hdr-kicker">
            <span className="live" aria-hidden="true" />
            Operation // Mission Control
          </div>
          <h1 className="hdr-title text-xl sm:text-[1.7rem]">Road to Doomsday</h1>
        </div>

        <div className="ml-auto flex items-center gap-3 sm:order-3 sm:ml-0 sm:gap-4">
          <div className="flex flex-col items-end gap-0.5" suppressHydrationWarning>
            {cd ? (
              <>
                <div className="countdown">
                  <span className="unit">
                    <b>{cd.days}</b>
                    <small>days</small>
                  </span>
                  <span className="sep">:</span>
                  <span className="unit">
                    <b>{pad(cd.hours)}</b>
                    <small>hrs</small>
                  </span>
                  <span className="sep">:</span>
                  <span className="unit">
                    <b>{pad(cd.mins)}</b>
                    <small>min</small>
                  </span>
                  <span className="sep hidden sm:inline">:</span>
                  <span className="unit hidden sm:flex">
                    <b>{pad(cd.secs)}</b>
                    <small>sec</small>
                  </span>
                </div>
                <div className="hud-label" style={{ color: "var(--doom-green)", opacity: 0.85 }}>
                  T-minus · Doomsday
                </div>
              </>
            ) : (
              <div className="h-9 w-36 sm:h-10 sm:w-48" />
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
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
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
                  <span>Switch operative</span>
                  <span aria-hidden="true">↩</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* row 2: segmented charge meter, one tick per movie */}
        <div className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:min-w-[200px] sm:flex-1">
          <div className="mb-1.5 flex items-baseline justify-between hud-label">
            <span>
              <span className="on">{pad(watchedMovies)}</span> / {totalMovies} films cleared · <span className="on">{pct}%</span>
            </span>
            {showShows && (
              <span>
                side quest {watchedShows}/{totalShows}
              </span>
            )}
          </div>
          <div className="charge" aria-hidden="true">
            {Array.from({ length: totalMovies + 1 }, (_, i) => {
              const isLast = i === totalMovies;
              const on = i < watchedMovies;
              const next = i === watchedMovies && !isLast;
              return <i key={i} className={`${on ? "on" : ""} ${next ? "next" : ""} ${isLast ? "last" : ""}`} />;
            })}
          </div>
          {pace && <div className="mt-1.5 hud-label" style={{ letterSpacing: "0.14em" }}>{pace}</div>}
        </div>
      </div>
    </header>
  );
}
