import { NextResponse } from "next/server";
import { PROFILES } from "@/lib/profiles";
import { getRatings, getWatched } from "@/lib/progressStore";

/** every profile's progress + ratings in one go — powers the leaderboard + rating face-off */
export async function GET() {
  const crew = await Promise.all(
    PROFILES.map(async (p) => {
      const [watched, ratings] = await Promise.all([getWatched(p.id), getRatings(p.id)]);
      return { profile: p.id, watched, ratings };
    }),
  );
  return NextResponse.json({ crew }, { headers: { "Cache-Control": "no-store" } });
}
