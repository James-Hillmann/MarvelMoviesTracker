"use client";

import { useEffect, useState } from "react";

/** Ticking d/h/m/s countdown — null until mounted so SSR and client agree. */
export function useCountdown(target: string) {
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

/** "≈ 1 movie every N days" style pacing line for the remaining count. */
export function paceLine(daysLeft: number | undefined, remaining: number): string | null {
  if (remaining === 0) return "Caught up. Doomsday awaits.";
  if (daysLeft === undefined || daysLeft <= 0) return null;
  const daysPer = daysLeft / remaining;
  return daysPer >= 1.5
    ? `≈ 1 movie every ${Math.floor(daysPer)} days to make it`
    : daysPer >= 0.9
      ? "≈ 1 movie a day to make it — get moving!"
      : `≈ ${Math.ceil(1 / daysPer)} movies a day needed — assemble!`;
}

