import { NextRequest, NextResponse } from "next/server";
import { profileById } from "@/lib/profiles";
import { getWatched } from "@/lib/progressStore";
import { gradeQuiz } from "@/lib/trivia";
import { getTrivia, recordQuiz } from "@/lib/triviaStore";

export async function GET(req: NextRequest) {
  const profile = profileById(req.nextUrl.searchParams.get("profile"));
  if (!profile) return NextResponse.json({ error: "unknown profile" }, { status: 400 });
  const results = await getTrivia(profile.id);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { profile?: string; id?: string; answers?: unknown }
    | null;
  const profile = profileById(body?.profile);
  const answers = body?.answers;
  if (!profile || !body?.id || !Array.isArray(answers) || !answers.every((a) => typeof a === "string")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  // grade server-side so the leaderboard can trust the numbers
  const graded = gradeQuiz(body.id, answers as string[]);
  if (!graded) return NextResponse.json({ error: "no quiz for that title" }, { status: 400 });
  // quizzes only unlock once the movie is checked off
  const watched = await getWatched(profile.id);
  if (!watched[body.id]) return NextResponse.json({ error: "watch it first" }, { status: 403 });

  const results = await recordQuiz(profile.id, body.id, graded.score, graded.total);
  return NextResponse.json({ ...graded, results });
}
