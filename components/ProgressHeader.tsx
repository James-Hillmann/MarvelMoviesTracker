"use client";

import { useEffect, useRef, useState } from "react";
import { setAudioSettings, sfx, useAudioSettings } from "@/lib/chiptune";
import { Profile, PROFILES } from "@/lib/profiles";
import { pad, scoreFor } from "@/lib/score";
import { Hero } from "@/lib/sprites";
import { DOOMSDAY_DATE } from "@/lib/timeline";
import { HeroParty } from "./PixelSprite";

export interface StageSegment {
  id: string;
  color: string;
  done: boolean;
}

interface Props {
  watchedMovies: number;
  totalMovies: number;
  watchedShows: number;
  totalShows: number;
  score: number;
  segments: StageSegment[];
  orderMode: "release" | "chrono";
  onOrderChange: (mode: "release" | "chrono") => void;
  showShows: boolean;
  onShowShowsChange: (show: boolean) => void;
  profile: Profile;
  heroes: Hero[];
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

/** the other crews' scores, for the HI-SCORE slot — read-only, refreshed on focus */
function useRivals(selfId: string) {
  const [rivals, setRivals] = useState<{ label: string; score: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const others = PROFILES.filter((p) => p.id !== selfId);
      const rows = await Promise.all(
        others.map(async (p) => {
          try {
            const res = await fetch(`/api/progress?profile=${encodeURIComponent(p.id)}`, { cache: "no-store" });
            if (!res.ok) return null;
            const data = (await res.json()) as { watched: Record<string, number> };
            return { label: p.label, score: scoreFor(data.watched ?? {}) };
          } catch {
            return null;
          }
        }),
      );
      if (!cancelled) setRivals(rows.filter((r): r is { label: string; score: number } => r !== null));
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [selfId]);
  return rivals;
}

export default function ProgressHeader({
  watchedMovies,
  totalMovies,
  watchedShows,
  totalShows,
  score,
  segments,
  orderMode,
  onOrderChange,
  showShows,
  onShowShowsChange,
  profile,
  heroes,
  onSwitchProfile,
}: Props) {
  const cd = useCountdown(DOOMSDAY_DATE);
  const remaining = totalMovies - watchedMovies;
  const audio = useAudioSettings();
  const rivals = useRivals(profile.id);
  const topRival = [...rivals].sort((a, b) => b.score - a.score)[0];

  const [menuOpen, setMenuOpenState] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const setMenuOpen = (open: boolean) => {
    if (open !== menuOpen) (open ? sfx.select : sfx.back)();
    setMenuOpenState(open);
  };

  // close on outside tap (hover handles itself on desktop)
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpenState(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpenState(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  let pace: string;
  if (cd && remaining > 0 && cd.days > 0) {
    const daysPer = cd.days / remaining;
    pace =
      daysPer >= 1.5
        ? `1 MOVIE EVERY ${Math.round(daysPer)} DAYS TO MAKE IT`
        : daysPer >= 0.9
          ? "1 MOVIE A DAY TO MAKE IT — GET MOVING!"
          : `${Math.ceil(1 / daysPer)} MOVIES A DAY NEEDED — ASSEMBLE!`;
  } else if (remaining === 0) {
    pace = "ALL STAGES CLEAR — DOOMSDAY AWAITS";
  } else {
    pace = "INSERT COIN";
  }

  const two = (n: number) => String(n).padStart(2, "0");

  return (
    <header className="hud">
      <div className="hud-inner">
        <div className="hud-cell hud-player">
          <span className="hud-1p">{heroes.length > 1 ? "2P" : "1P"}</span>
          <HeroParty heroes={heroes} scale={2} className="hud-heroes" />
          <span className="hud-name">{profile.label}</span>
        </div>

        <div className="hud-cell">
          <span className="hud-k">SCORE</span>
          <span className="hud-v score">{pad(score)}</span>
        </div>

        {topRival && (
          <div className="hud-cell hud-rival">
            <span className="hud-k">{topRival.score > score ? "HI-SCORE" : "RIVAL"} · {topRival.label}</span>
            <span className="hud-v">{pad(topRival.score)}</span>
          </div>
        )}

        <div className="hud-cell">
          <span className="hud-k">STAGE</span>
          <span className="hud-v">
            {two(watchedMovies)}
            <span className="hud-dim">/{totalMovies}</span>
          </span>
        </div>

        <div className="hud-cell hud-time" suppressHydrationWarning>
          <span className="hud-k doom">TIME TO DOOM</span>
          {cd ? (
            <span className="hud-v">
              {cd.days}
              <span className="hud-dim">:</span>
              {two(cd.hours)}
              <span className="hud-dim">:</span>
              {two(cd.mins)}
              <span className="hud-dim hud-secs">:</span>
              <span className="hud-secs">{two(cd.secs)}</span>
            </span>
          ) : (
            <span className="hud-v">--:--:--</span>
          )}
        </div>

        {/* options / pause menu */}
        <div
          ref={menuRef}
          className="options-wrap"
          onMouseEnter={() => setMenuOpenState(true)}
          onMouseLeave={() => setMenuOpenState(false)}
        >
          <button
            className="options-btn"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Options"
          >
            <span className="options-icon" aria-hidden="true">
              ≡
            </span>
            <span className="options-label">OPTIONS</span>
          </button>

          {menuOpen && (
            <div className="options-menu" role="menu">
              <div className="om-title">— PAUSE —</div>

              <div className="om-label">WATCH ORDER</div>
              <div className="om-seg">
                <button
                  className={orderMode === "release" ? "active" : ""}
                  onClick={() => {
                    sfx.blip();
                    onOrderChange("release");
                  }}
                >
                  RELEASE
                </button>
                <button
                  className={orderMode === "chrono" ? "active" : ""}
                  onClick={() => {
                    sfx.blip();
                    onOrderChange("chrono");
                  }}
                >
                  CHRONO
                </button>
              </div>

              <button
                className="om-row"
                role="menuitemcheckbox"
                aria-checked={showShows}
                onClick={() => {
                  sfx.blip();
                  onShowShowsChange(!showShows);
                }}
              >
                <span>TV SIDE QUEST</span>
                <span className={`om-val ${showShows ? "on" : ""}`}>{showShows ? "ON" : "OFF"}</span>
              </button>
              <button
                className="om-row"
                role="menuitemcheckbox"
                aria-checked={audio.sound}
                onClick={() => {
                  setAudioSettings({ sound: !audio.sound });
                  if (!audio.sound) setTimeout(sfx.coin, 0);
                }}
              >
                <span>SOUND FX</span>
                <span className={`om-val ${audio.sound ? "on" : ""}`}>{audio.sound ? "ON" : "OFF"}</span>
              </button>
              <button
                className="om-row"
                role="menuitemcheckbox"
                aria-checked={audio.music}
                onClick={() => {
                  sfx.blip();
                  setAudioSettings({ music: !audio.music });
                }}
              >
                <span>MUSIC</span>
                <span className={`om-val ${audio.music ? "on" : ""}`}>{audio.music ? "ON" : "OFF"}</span>
              </button>

              <div className="om-divider" />

              <button
                className="om-row"
                onClick={() => {
                  sfx.back();
                  onSwitchProfile();
                }}
              >
                <span>SWITCH PLAYER</span>
                <span aria-hidden="true">↩</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* one block per stage, lit in its world's colour once cleared */}
      <div className="hud-stages" aria-label={`${watchedMovies} of ${totalMovies} movies watched`}>
        {segments.map((s) => (
          <span
            key={s.id}
            className={s.done ? "done" : ""}
            style={{ "--seg-color": s.color } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="hud-ticker">
        <div className="hud-ticker-track">
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1}>
              ▶ {pace} &nbsp;★&nbsp; {remaining > 0 ? `${remaining} STAGES TO GO` : "DOOM IS WAITING"}
              {showShows ? `  ★  SIDE QUEST ${watchedShows}/${totalShows}` : ""} &nbsp;★&nbsp; AVENGERS:
              DOOMSDAY · 12.18.2026 &nbsp;★&nbsp;
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
