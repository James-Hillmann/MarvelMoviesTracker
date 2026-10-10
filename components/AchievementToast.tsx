"use client";

import { useEffect, useState } from "react";
import { Achievement, ACHIEVEMENTS, unlockedIds } from "@/lib/achievements";
import { RatingMap, WatchedMap } from "@/lib/stats";

interface Props {
  profileId: string;
  watched: WatchedMap;
  ratings: RatingMap;
  /** don't judge "new" until the first server load lands */
  ready: boolean;
  onOpenBadges: () => void;
}

/**
 * Pops a toast when a badge unlocks.  The seen-set lives per device + profile,
 * and the first load silently seeds it so you aren't spammed with old wins.
 */
export default function AchievementToast({ profileId, watched, ratings, ready, onOpenBadges }: Props) {
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!ready) return;
    const key = `mcu-badges-seen-${profileId}`;
    const unlocked = unlockedIds(watched, ratings);
    let seen: string[] | null = null;
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? "null") as string[] | null;
    } catch {
      seen = null;
    }
    // first visit ever on this device: seed quietly
    if (!Array.isArray(seen)) {
      try {
        localStorage.setItem(key, JSON.stringify(unlocked));
      } catch {
        /* ignore */
      }
      return;
    }
    const seenList = seen;
    const fresh = unlocked.filter((id) => !seenList.includes(id));
    if (fresh.length) {
      // a big sync (e.g. another device caught up) shouldn't bury the board in toasts
      setQueue((q) => [...q, ...ACHIEVEMENTS.filter((a) => fresh.includes(a.id))].slice(0, 3));
      try {
        localStorage.setItem(key, JSON.stringify([...new Set([...seenList, ...fresh])]));
      } catch {
        /* ignore */
      }
    }
  }, [profileId, watched, ratings, ready]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 4200);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;
  return (
    <button
      key={current.id}
      className="badge-toast"
      style={{ "--aura": current.color } as React.CSSProperties}
      onClick={() => {
        setQueue([]);
        onOpenBadges();
      }}
    >
      <span className="badge-toast-icon">{current.icon}</span>
      <span>
        <span className="badge-toast-kicker">Badge unlocked</span>
        <span className="badge-toast-name">{current.name}</span>
        <span className="badge-toast-desc">{current.desc}</span>
      </span>
    </button>
  );
}
