"use client";

import { useEffect, useState } from "react";
import type { Artwork } from "@/lib/tmdb";

export type ArtMap = Record<string, Artwork>;

const CACHE_KEY = "mcu-artwork-v1";

/** Posters + backdrops for every title, session-cached so the wall paints instantly on reload. */
export function useArtwork(): ArtMap {
  const [art, setArt] = useState<ArtMap>({});

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) setArt(JSON.parse(cached) as ArtMap);
    } catch {
      /* storage blocked — just fetch */
    }
    let cancelled = false;
    fetch("/api/artwork")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { art?: ArtMap } | null) => {
        if (cancelled || !data?.art || !Object.keys(data.art).length) return;
        setArt(data.art);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.art));
        } catch {
          /* quota — fine */
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return art;
}

/** TMDB poster URL at a lighter size for grid use. */
export function posterAt(url: string | null | undefined, size: "w185" | "w342" | "w500" | "w780") {
  return url ? url.replace(/\/w\d+\//, `/${size}/`) : null;
}

/**
 * Responsive srcset for a full-bleed TMDB backdrop.  TMDB only serves w300,
 * w780, w1280 and the original (usually 3840 or 1920 wide), so big and
 * high-DPI screens get the original instead of an upscaled w1280.
 */
export function backdropSrcSet(url: string | null | undefined) {
  if (!url) return undefined;
  const at = (size: string) => url.replace(/\/(w\d+|original)\//, `/${size}/`);
  return `${at("w780")} 780w, ${at("w1280")} 1280w, ${at("original")} 3840w`;
}
