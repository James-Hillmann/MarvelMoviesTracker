import { NextRequest, NextResponse } from "next/server";
import { profileById } from "@/lib/profiles";
import { getRatings, setRating } from "@/lib/progressStore";
import { entryById } from "@/lib/timeline";

export async function GET(req: NextRequest) {
  const profile = profileById(req.nextUrl.searchParams.get("profile"));
  if (!profile) return NextResponse.json({ error: "unknown profile" }, { status: 400 });
  const ratings = await getRatings(profile.id);
  return NextResponse.json({ ratings }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { profile?: string; id?: string; rating?: number | null }
    | null;
  const profile = profileById(body?.profile);
  const rating = body?.rating;
  const validRating = rating === null || (Number.isInteger(rating) && (rating as number) >= 1 && (rating as number) <= 10);
  if (!profile || !body?.id || !entryById(body.id) || !validRating) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const ratings = await setRating(profile.id, body.id, rating ?? null);
  return NextResponse.json({ ratings });
}
