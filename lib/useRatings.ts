"use client";

import { useCallback, useEffect, useState } from "react";

export type RatingMap = Record<string, number>;

/** Personal 1–10 (half-star) ratings for one profile, shared via /api/ratings. */
export function useRatings(profile: string | null) {
  const [ratings, setRatings] = useState<RatingMap>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/ratings?profile=${encodeURIComponent(profile)}`, { cache: "no-store" });
      if (res.ok) {
        setRatings(((await res.json()) as { ratings: RatingMap }).ratings);
        setLoaded(true);
      }
    } catch {
      /* offline */
    }
  }, [profile]);

  useEffect(() => {
    setRatings({});
    setLoaded(false);
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const rate = useCallback(
    async (id: string, rating: number | null) => {
      if (!profile) return;
      setRatings((m) => {
        const next = { ...m };
        if (rating === null) delete next[id];
        else next[id] = rating;
        return next;
      });
      try {
        const res = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, id, rating }),
        });
        if (res.ok) setRatings(((await res.json()) as { ratings: RatingMap }).ratings);
      } catch {
        /* keep optimistic */
      }
    },
    [profile],
  );

  return { ratings, loaded, rate };
}

export interface CrewMember {
  profile: string;
  watched: Record<string, number>;
  ratings: RatingMap;
}

/** Everyone's boards at once — only fetched while the War Room is open. */
export function useCrew(active: boolean, bump: unknown) {
  const [crew, setCrew] = useState<CrewMember[] | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/crew", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { crew: CrewMember[] } | null) => !cancelled && d && setCrew(d.crew))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [active, bump]);
  return crew;
}
