"use client";

import { useEffect, useRef, useState } from "react";
import { Profile } from "@/lib/profiles";
import { DOOMSDAY_DATE } from "@/lib/timeline";
import { useCountdown } from "@/lib/useCountdown";

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

  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:gap-6">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Road to Doomsday</span>
        </div>

        <div className="hdr-progress hidden min-w-0 flex-1 sm:block">
          <div className="hdr-progress-row">
            <span>
              <strong>{watchedMovies}</strong>/{totalMovies} movies
            </span>
            {showShows && (
              <span>
                TV {watchedShows}/{totalShows}
              </span>
            )}
          </div>
          <div className="progress-track thin">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <div className="hdr-clock" suppressHydrationWarning>
            {cd ? (
              <>
                <span className="tabular-nums">
                  {cd.days}
                  <i>d</i> {String(cd.hours).padStart(2, "0")}
                  <i>h</i> {String(cd.mins).padStart(2, "0")}
                  <i>m</i>
                </span>
                <span className="hdr-clock-lbl">to Doomsday</span>
              </>
            ) : null}
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
      </div>
    </header>
  );
}
