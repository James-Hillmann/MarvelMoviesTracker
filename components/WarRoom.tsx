"use client";

import { useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS, unlockedIds } from "@/lib/achievements";
import { buildPlan, DEFAULT_PLAN, minimumNightsPerWeek, PlanSettings, planFinishesInTime, planToIcs } from "@/lib/planner";
import { Profile, PROFILES } from "@/lib/profiles";
import { formatHours, runtimeOf } from "@/lib/runtimes";
import { computeStats, formatDate, RatingMap, WatchedMap } from "@/lib/stats";
import { displayTitle, DOOMSDAY_DATE, Entry, entryById, PHASE_BOSSES, TIMELINE } from "@/lib/timeline";
import { CrewMember, useCrew } from "@/lib/useRatings";
import PaceChart from "./PaceChart";
import StarRating from "./StarRating";

export type WarRoomTab = "intel" | "planner" | "crew" | "badges";

interface Props {
  profile: Profile;
  watched: WatchedMap;
  ratings: RatingMap;
  /** remaining movies in the board's current watch order */
  movieOrder: Entry[];
  initialTab?: WarRoomTab;
  onSelect: (entry: Entry) => void;
  onClose: () => void;
}

const TABS: { id: WarRoomTab; label: string }[] = [
  { id: "intel", label: "Intel" },
  { id: "planner", label: "Movie Nights" },
  { id: "crew", label: "Crew" },
  { id: "badges", label: "Badges" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fullTitle = displayTitle;

function relative(ts: number, now: number) {
  const days = Math.floor((now - ts) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(ts);
}

export default function WarRoom({ profile, watched, ratings, movieOrder, initialTab = "intel", onSelect, onClose }: Props) {
  const [tab, setTab] = useState<WarRoomTab>(initialTab);
  // re-pull everyone's boards whenever ours changes, so the leaderboard is live
  const crew = useCrew(true, watched);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stats = useMemo(() => computeStats(watched, ratings, now), [watched, ratings, now]);

  return (
    <div className="modal-overlay wr-overlay" onClick={onClose}>
      <div
        className="modal-card wr-card"
        style={{ "--aura": profile.color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="War Room"
      >
        <div className="wr-head">
          <div>
            <div className="wr-kicker">{profile.label} · {stats.daysLeft} days to Doomsday</div>
            <h2 className="wr-title">WAR ROOM</h2>
          </div>
          <button className="wr-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="wr-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="wr-body">
          {tab === "intel" && <Intel stats={stats} profile={profile} ratings={ratings} now={now} onSelect={onSelect} />}
          {tab === "planner" && (
            <Planner profile={profile} remaining={movieOrder.filter((m) => m.id !== "doomsday" && !watched[m.id])} onSelect={onSelect} />
          )}
          {tab === "crew" && <Crew crew={crew} me={profile.id} now={now} onSelect={onSelect} />}
          {tab === "badges" && <Badges watched={watched} ratings={ratings} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Intel({
  stats,
  profile,
  ratings,
  now,
  onSelect,
}: {
  stats: ReturnType<typeof computeStats>;
  profile: Profile;
  ratings: RatingMap;
  now: number;
  onSelect: (e: Entry) => void;
}) {
  const remaining = stats.moviesTotal - stats.moviesWatched;
  const maxDay = Math.max(1, ...stats.byWeekday);
  const topRated = Object.entries(ratings)
    .map(([id, r]) => ({ entry: entryById(id), r }))
    .filter((x): x is { entry: Entry; r: number } => Boolean(x.entry))
    .sort((a, b) => b.r - a.r || a.entry.year - b.entry.year)
    .slice(0, 5);

  let verdict: string;
  if (remaining === 0) verdict = "Every movie down. You are ready for Doomsday.";
  else if (!isFinite(stats.neededRate)) verdict = "Doomsday is here. Watch fast.";
  else {
    const every = 1 / stats.neededRate;
    const need = every >= 1.5 ? `1 movie every ${every.toFixed(1)} days` : `${stats.neededRate.toFixed(1)} movies a day`;
    verdict = stats.projectedFinish
      ? `You need ${need}. At your last-two-weeks pace you finish ${formatDate(stats.projectedFinish, { month: "short", day: "numeric", year: "numeric" })}.`
      : `You need ${need}. Nothing watched in the last two weeks, so there's no pace to project yet.`;
  }

  return (
    <div className="wr-stack">
      <div className="wr-tiles">
        <Tile label="Movies" value={`${stats.moviesWatched}`} sub={`of ${stats.moviesTotal} · ${Math.round((stats.moviesWatched / stats.moviesTotal) * 100)}%`} />
        <Tile label="Time watched" value={formatHours(stats.minutesWatched)} sub={`${formatHours(stats.minutesLeft)} to go`} />
        <Tile label="Streak" value={`${stats.currentStreak}d`} sub={`best ${stats.bestStreak} days`} />
        <Tile label="Bosses down" value={`${stats.phasesCleared.length}/6`} sub={stats.phasesCleared.map((p) => PHASE_BOSSES[p].name).join(", ") || "none yet"} />
      </div>

      <div className={`wr-verdict ${stats.onTrack ? "good" : "bad"}`}>
        <span className="wr-verdict-tag">{stats.onTrack ? "✓ On track" : remaining ? "⚠ Behind pace" : "✓ Done"}</span>
        <span>{verdict}</span>
      </div>

      <section>
        <h3 className="wr-h3">The race to Doomsday</h3>
        <PaceChart timeline={stats.timeline} total={stats.moviesTotal} color={profile.color} now={now} />
      </section>

      <div className="wr-two">
        <section>
          <h3 className="wr-h3">Movie nights by weekday</h3>
          <div className="wr-weekdays">
            {stats.byWeekday.map((n, i) => (
              <div key={i} className="wd" title={`${n} movie${n === 1 ? "" : "s"} on ${WEEKDAYS[i]}s`}>
                <div className="wd-bar-wrap">
                  <div className="wd-bar" style={{ height: `${(n / maxDay) * 100}%`, background: profile.color }} />
                </div>
                <div className="wd-n">{n || ""}</div>
                <div className="wd-label">{WEEKDAYS[i][0]}</div>
              </div>
            ))}
          </div>
          <dl className="wr-facts">
            {stats.bestDay && (
              <div>
                <dt>Biggest day</dt>
                <dd>
                  {stats.bestDay.count} movie{stats.bestDay.count > 1 ? "s" : ""} on {formatDate(new Date(`${stats.bestDay.day}T12:00`).getTime(), { month: "short", day: "numeric" })}
                </dd>
              </div>
            )}
            {stats.lastWatch && (
              <div>
                <dt>Last watch</dt>
                <dd>{relative(stats.lastWatch, now)}</dd>
              </div>
            )}
            <div>
              <dt>Side quest</dt>
              <dd>
                {stats.showsWatched}/{stats.showsTotal} shows
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="wr-h3">Your top rated</h3>
          {topRated.length ? (
            <ol className="wr-list">
              {topRated.map(({ entry, r }, i) => (
                <li key={entry.id}>
                  <button className="wr-row" onClick={() => onSelect(entry)}>
                    <span className="wr-rank">{i + 1}</span>
                    <span className="wr-dot" style={{ background: entry.wm.aura }} />
                    <span className="wr-name">{fullTitle(entry)}</span>
                    <StarRating value={r} size={13} />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="wr-empty">Open any title and tap the stars to rate it. Your favourites land here.</p>
          )}
          {stats.avgRating !== null && (
            <p className="wr-note">
              Average rating {(stats.avgRating / 2).toFixed(1)}★ across {stats.ratedCount} title{stats.ratedCount === 1 ? "" : "s"}.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="wr-tile">
      <div className="wr-tile-label">{label}</div>
      <div className="wr-tile-value">{value}</div>
      <div className="wr-tile-sub">{sub}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function usePlanSettings(profileId: string) {
  const key = `mcu-plan-${profileId}`;
  const [settings, setSettings] = useState<PlanSettings>(DEFAULT_PLAN);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as PlanSettings | null;
      if (saved && Array.isArray(saved.weekdays)) setSettings({ ...DEFAULT_PLAN, ...saved });
    } catch {
      /* defaults */
    }
  }, [key]);
  const update = (patch: Partial<PlanSettings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  return [settings, update] as const;
}

function Planner({ profile, remaining, onSelect }: { profile: Profile; remaining: Entry[]; onSelect: (e: Entry) => void }) {
  const [settings, update] = usePlanSettings(profile.id);
  const plan = useMemo(() => buildPlan(remaining, settings), [remaining, settings]);
  const inTime = planFinishesInTime(plan);
  const minNights = minimumNightsPerWeek(remaining, settings.perNight);
  const doom = new Date(DOOMSDAY_DATE).getTime();
  const last = plan[plan.length - 1];
  const slack = last ? Math.round((doom - last.date) / 86_400_000) : 0;

  const download = () => {
    const blob = new Blob([planToIcs(plan, settings, profile.label)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "road-to-doomsday-movie-nights.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!remaining.length) {
    return <p className="wr-empty big">Nothing left to plan. Book your Doomsday tickets for Dec 18.</p>;
  }

  return (
    <div className="wr-stack">
      <div className="planner-controls">
        <div>
          <div className="wr-tile-label">Movie nights</div>
          <div className="day-picks">
            {WEEKDAYS.map((d, i) => {
              const on = settings.weekdays.includes(i);
              return (
                <button
                  key={d}
                  className={on ? "active" : ""}
                  aria-pressed={on}
                  onClick={() =>
                    update({ weekdays: on ? settings.weekdays.filter((x) => x !== i) : [...settings.weekdays, i].sort() })
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="wr-tile-label">Per night</div>
          <div className="day-picks">
            {([1, 2, 3] as const).map((n) => (
              <button key={n} className={settings.perNight === n ? "active" : ""} onClick={() => update({ perNight: n })}>
                {n === 1 ? "1 movie" : `${n} (double${n === 3 ? "+" : ""})`}
              </button>
            ))}
          </div>
        </div>
        <label className="time-pick">
          <span className="wr-tile-label">Showtime</span>
          <input type="time" value={settings.startTime} onChange={(e) => e.target.value && update({ startTime: e.target.value })} />
        </label>
      </div>

      {plan.length > 0 ? (
        <div className={`wr-verdict ${inTime ? "good" : "bad"}`}>
          <span className="wr-verdict-tag">{inTime ? "✓ Makes it" : "✗ Too slow"}</span>
          <span>
            {plan.length} movie night{plan.length === 1 ? "" : "s"}, last one{" "}
            {formatDate(last.date, { weekday: "short", month: "short", day: "numeric" })}
            {inTime
              ? ` with ${slack} day${slack === 1 ? "" : "s"} to spare.`
              : `, ${-slack} day${slack === -1 ? "" : "s"} after Doomsday. ${minNights ? `You need at least ${minNights} night${minNights > 1 ? "s" : ""} a week at this rate.` : "Try more movies per night."}`}
          </span>
        </div>
      ) : (
        <p className="wr-empty">Pick at least one night of the week.</p>
      )}

      {plan.length > 0 && (
        <>
          <div className="planner-actions">
            <button className="btn-watched" onClick={download}>
              📅 Add movie nights to calendar
            </button>
            <span className="wr-note">Downloads an .ics file for Apple, Google or Outlook calendars.</span>
          </div>
          <ol className="plan-list">
            {plan.map((night, i) => {
              const late = night.date >= doom;
              return (
                <li key={night.date} className={late ? "late" : ""}>
                  <div className="plan-date">
                    <span className="plan-dow">{formatDate(night.date, { weekday: "short" })}</span>
                    <span className="plan-day">{new Date(night.date).getDate()}</span>
                    <span className="plan-mon">{formatDate(night.date, { month: "short" })}</span>
                  </div>
                  <div className="plan-movies">
                    {night.movies.map((m) => (
                      <button key={m.id} className="plan-movie" onClick={() => onSelect(m)} style={{ "--aura": m.wm.aura } as React.CSSProperties}>
                        <span className="wr-dot" style={{ background: m.wm.aura }} />
                        <span className="wr-name">{fullTitle(m)}</span>
                        <span className="plan-rt">{formatHours(runtimeOf(m.id))}</span>
                      </button>
                    ))}
                  </div>
                  {i === 0 && <span className="plan-next">next</span>}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Crew({ crew, me, now, onSelect }: { crew: CrewMember[] | null; me: string; now: number; onSelect: (e: Entry) => void }) {
  if (!crew) return <p className="wr-empty">Summoning the crew…</p>;

  const rows = crew
    .map((c) => {
      const p = PROFILES.find((x) => x.id === c.profile)!;
      const s = computeStats(c.watched, c.ratings, now);
      const lastId = Object.entries(c.watched).sort((a, b) => b[1] - a[1])[0]?.[0];
      return { p, s, c, last: lastId ? entryById(lastId) : undefined, badges: unlockedIds(c.watched, c.ratings).length };
    })
    .sort((a, b) => b.s.moviesWatched - a.s.moviesWatched || b.s.minutesWatched - a.s.minutesWatched);

  // rating face-off: titles rated by 2+ crews
  const rated = TIMELINE.map((e) => ({
    e,
    scores: crew.map((c) => ({ profile: PROFILES.find((p) => p.id === c.profile)!, r: c.ratings[e.id] })).filter((x) => x.r),
  })).filter((x) => x.scores.length >= 2);
  const spread = (x: (typeof rated)[number]) => Math.max(...x.scores.map((s) => s.r)) - Math.min(...x.scores.map((s) => s.r));
  const avg = (x: (typeof rated)[number]) => x.scores.reduce((a, s) => a + s.r, 0) / x.scores.length;
  const fights = [...rated].sort((a, b) => spread(b) - spread(a)).filter((x) => spread(x) >= 2).slice(0, 5);
  const favourites = [...rated].sort((a, b) => avg(b) - avg(a)).slice(0, 5);

  return (
    <div className="wr-stack">
      <section>
        <h3 className="wr-h3">Leaderboard</h3>
        <ol className="leaderboard">
          {rows.map(({ p, s, last, badges }, i) => (
            <li key={p.id} className={p.id === me ? "me" : ""} style={{ "--aura": p.color } as React.CSSProperties}>
              <div className="lb-rank">{i === 0 && s.moviesWatched > 0 ? "👑" : i + 1}</div>
              <div className="lb-main">
                <div className="lb-top">
                  <span className="lb-name">{p.label}</span>
                  {p.id === me && <span className="lb-you">you</span>}
                  <span className="lb-count">
                    {s.moviesWatched}
                    <span className="lb-of">/{s.moviesTotal}</span>
                  </span>
                </div>
                <div className="progress-track lb-track">
                  <div className="lb-fill" style={{ width: `${(s.moviesWatched / s.moviesTotal) * 100}%`, background: p.color }} />
                </div>
                <div className="lb-meta">
                  <span>{formatHours(s.minutesWatched)} watched</span>
                  <span>🔥 {s.currentStreak}d streak</span>
                  <span>🏅 {badges}</span>
                  <span>{s.onTrack ? "on track" : s.moviesWatched === s.moviesTotal ? "done" : "behind pace"}</span>
                  {last && s.lastWatch && (
                    <span className="lb-last">
                      last: {fullTitle(last)} · {relative(s.lastWatch, now)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {rows.length > 1 && rows[0].s.moviesWatched !== rows[1].s.moviesWatched && (
          <p className="wr-note">
            {rows[0].p.label} lead{rows[0].p.label.includes("&") ? "" : "s"} by {rows[0].s.moviesWatched - rows[1].s.moviesWatched} movie
            {rows[0].s.moviesWatched - rows[1].s.moviesWatched === 1 ? "" : "s"}.
          </p>
        )}
      </section>

      <div className="wr-two">
        <section>
          <h3 className="wr-h3">Crew favourites</h3>
          {favourites.length ? (
            <ol className="wr-list">
              {favourites.map((x, i) => (
                <li key={x.e.id}>
                  <button className="wr-row" onClick={() => onSelect(x.e)}>
                    <span className="wr-rank">{i + 1}</span>
                    <span className="wr-dot" style={{ background: x.e.wm.aura }} />
                    <span className="wr-name">{fullTitle(x.e)}</span>
                    <span className="wr-score">{(avg(x) / 2).toFixed(1)}★</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="wr-empty">When two crews rate the same title, the consensus shows up here.</p>
          )}
        </section>
        <section>
          <h3 className="wr-h3">Biggest disagreements</h3>
          {fights.length ? (
            <ul className="wr-list">
              {fights.map((x) => (
                <li key={x.e.id}>
                  <button className="wr-row fight" onClick={() => onSelect(x.e)}>
                    <span className="wr-name">{fullTitle(x.e)}</span>
                    <span className="fight-scores">
                      {x.scores.map((s) => (
                        <span key={s.profile.id} title={s.profile.label}>
                          <i style={{ background: s.profile.color }} />
                          {s.r / 2}★
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wr-empty">No beef yet. Rate more titles and see where you split.</p>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Badges({ watched, ratings }: { watched: WatchedMap; ratings: RatingMap }) {
  const unlocked = new Set(unlockedIds(watched, ratings));
  const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)));
  return (
    <div className="wr-stack">
      <p className="wr-note">
        {unlocked.size} of {ACHIEVEMENTS.length} unlocked
      </p>
      <div className="badge-grid">
        {sorted.map((a) => {
          const [have, need] = a.progress(watched, ratings);
          const got = unlocked.has(a.id);
          return (
            <div key={a.id} className={`badge ${got ? "got" : ""}`} style={{ "--aura": a.color } as React.CSSProperties}>
              <div className="badge-icon">{a.icon}</div>
              <div className="badge-name">{a.name}</div>
              <div className="badge-desc">{a.desc}</div>
              {!got && (
                <div className="badge-progress" aria-label={`${have} of ${need}`}>
                  <div style={{ width: `${(have / need) * 100}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
