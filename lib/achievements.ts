import { runtimeOf } from "./runtimes";
import { dayKey, RatingMap, WatchedMap } from "./stats";
import { COUNTED_MOVIES, MOVIES, PHASE_BOSSES, PHASE_LABELS, SHOWS } from "./timeline";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** accent for the badge */
  color: string;
  /** [have, need] — drives the progress bar on locked badges */
  progress: (w: WatchedMap, r: RatingMap) => [number, number];
}

const countOf = (ids: string[]) => (w: WatchedMap): [number, number] => [ids.filter((id) => w[id]).length, ids.length];

function moviesPerDay(w: WatchedMap): Map<string, string[]> {
  const days = new Map<string, string[]>();
  for (const m of MOVIES) {
    const t = w[m.id];
    if (!t) continue;
    const k = dayKey(t);
    days.set(k, [...(days.get(k) ?? []), m.id]);
  }
  return days;
}

function longestStreak(w: WatchedMap): number {
  const days = [...moviesPerDay(w).keys()].sort();
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of days) {
    const t = new Date(`${d}T12:00:00`).getTime();
    run = prev && Math.round((t - prev) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

const phaseIds = (p: number) => MOVIES.filter((m) => m.phase === p).map((m) => m.id);
const phaseNames = ["", "One", "Two", "Three", "Four", "Five", "Six"];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "origin", name: "Origin Story", desc: "Watch your first movie", icon: "🎬", color: "#e8b64c", progress: (w) => [Math.min(1, COUNTED_MOVIES.filter((m) => w[m.id]).length), 1] },
  { id: "halfway", name: "Perfectly Balanced", desc: "Watch half the movies before Doomsday", icon: "⚖️", color: "#9a6cf0", progress: (w) => [Math.min(Math.ceil(COUNTED_MOVIES.length / 2), COUNTED_MOVIES.filter((m) => w[m.id]).length), Math.ceil(COUNTED_MOVIES.length / 2)] },
  ...Object.keys(PHASE_BOSSES).map(Number).map<Achievement>((p) => ({
    id: `phase-${p}`,
    name: `${PHASE_BOSSES[p].name} Defeated`,
    desc: `Clear Phase ${phaseNames[p]}${PHASE_LABELS[p].includes("—") ? ` (${PHASE_LABELS[p].split("—")[1].trim()})` : ""}`,
    icon: p === 6 ? "🟢" : "💀",
    color: ["", "#e8b64c", "#e07030", "#c02030", "#8a2bd4", "#6a48e0", "#3dff6e"][p],
    progress: countOf(phaseIds(p)),
  })),
  { id: "infinity-saga", name: "I Am Inevitable", desc: "Finish the whole Infinity Saga (Phases 1–3)", icon: "🧤", color: "#c02030", progress: countOf([...phaseIds(1), ...phaseIds(2), ...phaseIds(3)]) },
  { id: "ready", name: "Ready for Doomsday", desc: "Watch every movie before the finale", icon: "🛡️", color: "#3dff6e", progress: countOf(COUNTED_MOVIES.map((m) => m.id)) },
  { id: "iron", name: "I Am Iron Man", desc: "The Iron Man trilogy", icon: "🦾", color: "#e8b64c", progress: countOf(["iron-man", "iron-man-2", "iron-man-3"]) },
  { id: "cap", name: "I Can Do This All Day", desc: "Every Captain America movie", icon: "🛡", color: "#4d84c4", progress: countOf(["captain-america-1", "captain-america-2", "civil-war", "brave-new-world"]) },
  { id: "thor", name: "Worthy", desc: "All four Thor movies", icon: "🔨", color: "#b8c4d4", progress: countOf(["thor", "thor-dark-world", "ragnarok", "love-and-thunder"]) },
  { id: "spidey", name: "Spider-Sense", desc: "Every Tom Holland Spider-Man movie", icon: "🕷️", color: "#e82c2c", progress: countOf(["homecoming", "far-from-home", "no-way-home", "brand-new-day"]) },
  { id: "guardians", name: "We Are Groot", desc: "The Guardians trilogy", icon: "🌱", color: "#f03e8a", progress: countOf(["guardians", "guardians-2", "guardians-3"]) },
  { id: "ant", name: "Quantum Leap", desc: "The Ant-Man trilogy", icon: "🐜", color: "#e04858", progress: countOf(["ant-man", "ant-man-2", "quantumania"]) },
  { id: "wakanda", name: "Wakanda Forever", desc: "Both Black Panther movies", icon: "🐾", color: "#9a6cf0", progress: countOf(["black-panther", "wakanda-forever"]) },
  {
    id: "binge", name: "Binge Protocol", desc: "Three movies in a single day", icon: "🍿", color: "#ff9040",
    progress: (w) => [Math.min(3, Math.max(0, ...[...moviesPerDay(w).values()].map((d) => d.length))), 3],
  },
  {
    id: "marathon", name: "Endgame Marathon", desc: "Six hours of Marvel in one day", icon: "⏱️", color: "#5ac8f0",
    progress: (w) => {
      const best = Math.max(0, ...[...moviesPerDay(w).values()].map((ids) => ids.reduce((s, id) => s + runtimeOf(id), 0)));
      return [Math.min(360, best), 360];
    },
  },
  { id: "streak-3", name: "On Your Left", desc: "Watch on 3 days in a row", icon: "🔥", color: "#ff6b3d", progress: (w) => [Math.min(3, longestStreak(w)), 3] },
  { id: "streak-7", name: "Hulk Smash Week", desc: "Watch on 7 days in a row", icon: "💚", color: "#4ed13c", progress: (w) => [Math.min(7, longestStreak(w)), 7] },
  {
    id: "night-owl", name: "Night Shift", desc: "Finish a movie between midnight and 4am", icon: "🦉", color: "#7fb3e8",
    progress: (w) => [MOVIES.some((m) => w[m.id] && new Date(w[m.id]).getHours() < 4) ? 1 : 0, 1],
  },
  { id: "critic", name: "Film Critic", desc: "Rate 10 titles", icon: "⭐", color: "#ffd82a", progress: (_w, r) => [Math.min(10, Object.keys(r).length), 10] },
  { id: "perfect", name: "Perfection", desc: "Give something a perfect 5 stars", icon: "🌟", color: "#ffd82a", progress: (_w, r) => [Object.values(r).some((v) => v >= 10) ? 1 : 0, 1] },
  { id: "harsh", name: "Snap It Away", desc: "Rate something 1½ stars or worse", icon: "🫰", color: "#a8a8a8", progress: (_w, r) => [Object.values(r).some((v) => v <= 3) ? 1 : 0, 1] },
  { id: "defenders", name: "The Defenders", desc: "All six Netflix shows", icon: "😈", color: "#c01218", progress: countOf(SHOWS.filter((s) => s.type === "netflix").map((s) => s.id)) },
  { id: "side-quest", name: "Side Quester", desc: "Watch 5 TV shows", icon: "📺", color: "#b478e8", progress: (w) => [Math.min(5, SHOWS.filter((s) => w[s.id]).length), 5] },
];

export function unlockedIds(w: WatchedMap, r: RatingMap): string[] {
  return ACHIEVEMENTS.filter((a) => {
    const [have, need] = a.progress(w, r);
    return have >= need;
  }).map((a) => a.id);
}
