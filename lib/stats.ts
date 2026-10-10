import { runtimeOf } from "./runtimes";
import { COUNTED_MOVIES, DOOMSDAY_DATE, MOVIES, PHASE_BOSSES, SHOWS } from "./timeline";

export type WatchedMap = Record<string, number>;
export type RatingMap = Record<string, number>;

const DAY = 86_400_000;

/** local-calendar day key, so a 11pm watch and a 1am watch are different days */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface Stats {
  moviesWatched: number;
  moviesTotal: number;
  showsWatched: number;
  showsTotal: number;
  minutesWatched: number;
  minutesLeft: number;
  phasesCleared: number[];
  currentStreak: number;
  bestStreak: number;
  /** most movies marked in one calendar day */
  bestDay: { day: string; count: number } | null;
  /** movies-only watch timestamps, ascending */
  timeline: number[];
  byWeekday: number[];
  firstWatch: number | null;
  lastWatch: number | null;
  /** movies/day over the last 14 days */
  recentRate: number;
  daysLeft: number;
  /** movies/day needed from today to finish before Doomsday */
  neededRate: number;
  /** finish date at recent pace, null if no recent pace */
  projectedFinish: number | null;
  onTrack: boolean;
  avgRating: number | null;
  ratedCount: number;
}

export function computeStats(watched: WatchedMap, ratings: RatingMap, now = Date.now()): Stats {
  const counted = COUNTED_MOVIES.filter((m) => watched[m.id]);
  const timeline = counted.map((m) => watched[m.id]).filter((t) => t > 0).sort((a, b) => a - b);

  const minutesWatched = counted.reduce((sum, m) => sum + runtimeOf(m.id), 0);
  const minutesLeft = COUNTED_MOVIES.filter((m) => !watched[m.id]).reduce((sum, m) => sum + runtimeOf(m.id), 0);

  const phasesCleared = Object.keys(PHASE_BOSSES)
    .map(Number)
    .filter((p) => MOVIES.filter((m) => m.phase === p).every((m) => watched[m.id]));

  // streaks over distinct days with ≥1 movie
  const days = [...new Set(timeline.map(dayKey))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(`${d}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  // the current streak survives until the end of tomorrow-not-watched (i.e. today counts if yesterday did)
  let current = 0;
  if (days.length) {
    const last = new Date(`${days[days.length - 1]}T12:00:00`).getTime();
    const gap = Math.round((startOfDay(now) + DAY / 2 - last) / DAY);
    current = gap <= 1 ? run : 0;
  }

  const perDay = new Map<string, number>();
  for (const t of timeline) perDay.set(dayKey(t), (perDay.get(dayKey(t)) ?? 0) + 1);
  let bestDay: Stats["bestDay"] = null;
  for (const [day, count] of perDay) if (!bestDay || count > bestDay.count) bestDay = { day, count };

  const byWeekday = Array(7).fill(0) as number[];
  for (const t of timeline) byWeekday[new Date(t).getDay()] += 1;

  const recent = timeline.filter((t) => t > now - 14 * DAY).length;
  const recentRate = recent / 14;

  const remaining = COUNTED_MOVIES.length - counted.length;
  const daysLeft = Math.max(0, Math.floor((new Date(DOOMSDAY_DATE).getTime() - now) / DAY));
  const neededRate = remaining === 0 ? 0 : daysLeft > 0 ? remaining / daysLeft : now < new Date(DOOMSDAY_DATE).getTime() ? remaining : Infinity;
  const projectedFinish = remaining === 0 ? now : recentRate > 0 ? now + (remaining / recentRate) * DAY : null;
  const onTrack = remaining === 0 || (projectedFinish !== null && projectedFinish <= new Date(DOOMSDAY_DATE).getTime());

  const rated = Object.values(ratings).filter((r) => r > 0);

  return {
    moviesWatched: counted.length,
    moviesTotal: COUNTED_MOVIES.length,
    showsWatched: SHOWS.filter((s) => watched[s.id]).length,
    showsTotal: SHOWS.length,
    minutesWatched,
    minutesLeft,
    phasesCleared,
    currentStreak: current,
    bestStreak: best,
    bestDay,
    timeline,
    byWeekday,
    firstWatch: timeline[0] ?? null,
    lastWatch: timeline[timeline.length - 1] ?? null,
    recentRate,
    daysLeft,
    neededRate,
    projectedFinish,
    onTrack,
    avgRating: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null,
    ratedCount: rated.length,
  };
}

export function formatDate(ts: number, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(ts).toLocaleDateString(undefined, opts);
}
