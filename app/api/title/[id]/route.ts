import { NextRequest, NextResponse } from "next/server";
import { fetchTitleInfo } from "@/lib/tmdb";
import { entryById } from "@/lib/timeline";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = entryById(id);
  if (!entry) return NextResponse.json({ error: "unknown title" }, { status: 404 });
  // two-letter country code for watch providers; anything else falls back to US
  const region = req.nextUrl.searchParams.get("region")?.toUpperCase() ?? "";
  const info = await fetchTitleInfo(entry, /^[A-Z]{2}$/.test(region) ? region : "US");
  return NextResponse.json(info);
}
