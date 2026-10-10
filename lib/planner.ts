import { runtimeOf } from "./runtimes";
import { displayTitle, DOOMSDAY_DATE, Entry } from "./timeline";

export interface PlanNight {
  date: number; // local midnight of the movie night
  movies: Entry[];
}

export interface PlanSettings {
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  perNight: 1 | 2 | 3;
  /** "HH:MM", used for the calendar export */
  startTime: string;
}

export const DEFAULT_PLAN: PlanSettings = { weekdays: [5, 6], perNight: 1, startTime: "20:00" };

/**
 * Lay the remaining movies onto the chosen nights, starting today, until the
 * list is exhausted.  Pure + deterministic so the UI can re-run it on every tweak.
 */
export function buildPlan(remaining: Entry[], settings: PlanSettings, now = Date.now()): PlanNight[] {
  const nights: PlanNight[] = [];
  if (!settings.weekdays.length || !remaining.length) return nights;
  const queue = [...remaining];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  // if tonight's start time already passed, begin tomorrow
  const [hh, mm] = settings.startTime.split(":").map(Number);
  const tonight = new Date(cursor);
  tonight.setHours(hh, mm);
  if (tonight.getTime() < now) cursor.setDate(cursor.getDate() + 1);

  for (let guard = 0; queue.length && guard < 800; guard++) {
    if (settings.weekdays.includes(cursor.getDay())) {
      nights.push({ date: cursor.getTime(), movies: queue.splice(0, settings.perNight) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

export function planFinishesInTime(plan: PlanNight[]): boolean {
  if (!plan.length) return true;
  return plan[plan.length - 1].date < new Date(DOOMSDAY_DATE).getTime();
}

/** Fewest nights a week (at the current movies-per-night) that still beats Doomsday. */
export function minimumNightsPerWeek(remaining: Entry[], perNight: number, now = Date.now()): number | null {
  const weeks = (new Date(DOOMSDAY_DATE).getTime() - now) / (7 * 86_400_000);
  if (weeks <= 0) return null;
  const n = Math.ceil(remaining.length / perNight / weeks);
  return n > 7 ? null : Math.max(1, n);
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsStamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/** iCalendar file of every movie night (floating local time, so it lands at 8pm wherever you are). */
export function planToIcs(plan: PlanNight[], settings: PlanSettings, crew: string): string {
  const [hh, mm] = settings.startTime.split(":").map(Number);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Road to Doomsday//Movie Nights//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:Road to Doomsday · ${crew}`,
  ];
  const stamp = icsStamp(new Date()).replace(/T.*/, "T000000");
  for (const night of plan) {
    const start = new Date(night.date);
    start.setHours(hh, mm, 0, 0);
    const mins = night.movies.reduce((s, m) => s + runtimeOf(m.id), 0) + (night.movies.length - 1) * 15;
    const end = new Date(start.getTime() + mins * 60_000);
    const names = night.movies.map(displayTitle);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${night.movies.map((m) => m.id).join("+")}@road-to-doomsday`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:🎬 MCU night: ${names.join(" + ").replace(/[,;]/g, "\\$&")}`,
      `DESCRIPTION:Road to Doomsday movie night for ${crew}.`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
