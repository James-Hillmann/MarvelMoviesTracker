/**
 * Theatrical runtimes in minutes — baked in so stats work without a TMDB key
 * (and without 40 API calls).  Brand New Day + Doomsday are estimates.
 */
export const RUNTIMES: Record<string, number> = {
  "iron-man": 126,
  "incredible-hulk": 112,
  "iron-man-2": 124,
  thor: 115,
  "captain-america-1": 124,
  avengers: 143,
  "iron-man-3": 130,
  "thor-dark-world": 112,
  "captain-america-2": 136,
  guardians: 121,
  "age-of-ultron": 141,
  "ant-man": 117,
  "civil-war": 147,
  "doctor-strange": 115,
  "guardians-2": 136,
  homecoming: 133,
  ragnarok: 130,
  "black-panther": 134,
  "infinity-war": 149,
  "ant-man-2": 118,
  "captain-marvel": 123,
  endgame: 181,
  "far-from-home": 129,
  "black-widow": 134,
  "shang-chi": 132,
  eternals: 156,
  "no-way-home": 148,
  "multiverse-of-madness": 126,
  "love-and-thunder": 119,
  "wakanda-forever": 161,
  quantumania: 125,
  "guardians-3": 150,
  "the-marvels": 105,
  "deadpool-wolverine": 128,
  "brave-new-world": 118,
  thunderbolts: 127,
  "fantastic-four": 115,
  "brand-new-day": 130,
  doomsday: 150,
};

export const runtimeOf = (id: string) => RUNTIMES[id] ?? 125;

export function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
