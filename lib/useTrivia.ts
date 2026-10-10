"use client";

import { useCallback, useEffect, useState } from "react";
import type { TriviaMap } from "./trivia";

/** per-profile quiz scores from /api/trivia */
export function useTrivia(profile: string | null) {
  const [results, setResults] = useState<TriviaMap>({});

  useEffect(() => {
    setResults({});
    if (!profile) return;
    let cancelled = false;
    fetch(`/api/trivia?profile=${encodeURIComponent(profile)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { results: TriviaMap } | null) => {
        if (!cancelled && data) setResults(data.results);
      })
      .catch(() => {
        /* offline — quizzes still playable, scores sync next time */
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const submit = useCallback(
    async (id: string, answers: string[]) => {
      if (!profile) return;
      try {
        const res = await fetch("/api/trivia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, id, answers }),
        });
        if (res.ok) {
          const data = (await res.json()) as { results: TriviaMap };
          setResults(data.results);
        }
      } catch {
        /* score just doesn't save this time */
      }
    },
    [profile],
  );

  return { results, submit };
}
