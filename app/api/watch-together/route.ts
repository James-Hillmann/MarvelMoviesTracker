import { NextRequest, NextResponse } from "next/server";
import { profileById } from "@/lib/profiles";
import { markWatched } from "@/lib/progressStore";
import { entryById } from "@/lib/timeline";

/**
 * Called by the Watch Together extension when a party started from this board
 * reaches the credits: checks the title off for every profile in the party.
 * The extension calls from its own origin, so this route allows CORS. It can
 * only ever mark known titles watched (never unwatch), and keeps the original
 * date if a title was already watched.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { entryId?: unknown; profiles?: unknown } | null;
  const entryId = typeof body?.entryId === "string" ? body.entryId : "";
  const profiles = Array.isArray(body?.profiles)
    ? [...new Set(body.profiles.filter((p): p is string => typeof p === "string" && !!profileById(p)))]
    : [];
  if (!entryById(entryId) || profiles.length === 0) {
    return NextResponse.json({ error: "bad request" }, { status: 400, headers: CORS });
  }
  await Promise.all(profiles.map((p) => markWatched(p, entryId)));
  return NextResponse.json({ ok: true, entryId, profiles }, { headers: CORS });
}
