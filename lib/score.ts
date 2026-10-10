import { COUNTED_MOVIES, MOVIES, PHASE_BOSSES, SHOWS } from "./timeline";

export const POINTS = { movie: 1000, show: 500, boss: 5000, finale: 10000 };

/** arcade score for a watched map — movies, side quests, boss kills, the finale */
export function scoreFor(watched: Record<string, number>): number {
  const movies = COUNTED_MOVIES.filter((e) => watched[e.id]).length;
  const shows = SHOWS.filter((e) => watched[e.id]).length;
  const bosses = Object.keys(PHASE_BOSSES).filter((p) =>
    MOVIES.filter((m) => m.phase === Number(p)).every((m) => watched[m.id]),
  ).length;
  const finale = watched["doomsday"] ? 1 : 0;
  return movies * POINTS.movie + shows * POINTS.show + bosses * POINTS.boss + finale * POINTS.finale;
}

export function pad(n: number, width = 7): string {
  return String(n).padStart(width, "0");
}
