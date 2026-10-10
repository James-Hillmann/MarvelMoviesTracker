import { NextResponse } from "next/server";
import { Artwork, fetchTitleInfo, tmdbConfigured } from "@/lib/tmdb";
import { TIMELINE } from "@/lib/timeline";

/**
 * Every title's poster + backdrop in one call, so the board can be a wall of
 * posters without 60 round-trips.  Reuses the per-title TMDB fetch (same URL,
 * so the daily fetch cache is shared with the detail modal).
 */
export async function GET() {
  if (!tmdbConfigured()) {
    return NextResponse.json({ configured: false, art: {} });
  }
  const pairs = await Promise.all(
    TIMELINE.map(async (e) => {
      try {
        const info = await fetchTitleInfo(e);
        return [e.id, { poster: info.poster ?? null, backdrop: info.backdrop ?? null }] as const;
      } catch {
        return [e.id, { poster: null, backdrop: null }] as const;
      }
    }),
  );
  return NextResponse.json(
    { configured: true, art: Object.fromEntries(pairs) as Record<string, Artwork> },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
