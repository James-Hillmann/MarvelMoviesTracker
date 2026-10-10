"use client";

import { useEffect, useRef, useState } from "react";
import { Entry, PhaseBoss } from "@/lib/timeline";
import { ArtMap, posterAt } from "@/lib/useArtwork";
import Wordmark from "./Wordmark";

/** "Oct 10" from a watched epoch */
function seenOn(ts: number) {
  return ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}

/** after the first paint, so the "develop" animation only plays on fresh watches */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), 600);
    return () => clearTimeout(t);
  }, []);
  return m;
}

interface FrameProps {
  entry: Entry;
  /** 1-based position in the whole watch order */
  number: number;
  poster: string | null;
  watchedAt: number | undefined;
  upNext: boolean;
  animate: boolean;
  wordmarkBase: number;
  onSelect: (entry: Entry) => void;
  onToggle: (entry: Entry) => void;
}

/**
 * One frame of film.  Unwatched titles sit as cold, undeveloped negatives;
 * watching one develops it into full colour and tears you a ticket stub.
 */
function Frame({ entry: e, number, poster, watchedAt, upNext, animate, wordmarkBase, onSelect, onToggle }: FrameProps) {
  const [loaded, setLoaded] = useState(false);
  const watched = Boolean(watchedAt);
  const prevWatched = useRef(watched);
  const [justDeveloped, setJustDeveloped] = useState(false);

  useEffect(() => {
    if (watched && !prevWatched.current && animate) {
      setJustDeveloped(true);
      const t = setTimeout(() => setJustDeveloped(false), 1800);
      prevWatched.current = watched;
      return () => clearTimeout(t);
    }
    prevWatched.current = watched;
  }, [watched, animate]);

  const state = watched ? "developed" : upNext ? "showing" : "negative";
  const label = `${e.sub ? e.sub + " " : ""}${e.title} (${e.year})${watched ? ", seen" : ""}`;

  return (
    <div
      className={`frame ${state} ${justDeveloped ? "just-developed" : ""}`}
      style={{ "--aura": e.wm.aura } as React.CSSProperties}
      data-upnext={upNext || undefined}
    >
      {upNext && <div className="frame-beam" aria-hidden="true" />}
      <button className="frame-card" onClick={() => onSelect(e)} aria-label={label}>
        <span className="frame-pic">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={loaded ? "loaded" : ""}
              src={poster}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setLoaded(true)}
            />
          )}
          {(!poster || !loaded) && (
            <span className="frame-titlecard" style={{ "--wm-fill": e.wm.gradient } as React.CSSProperties}>
              {e.sub && <span className="sub-label">{e.sub}</span>}
              <Wordmark entry={e} base={wordmarkBase} />
            </span>
          )}
          <span className="frame-flash" aria-hidden="true" />
        </span>
        <span className="frame-num">{String(number).padStart(2, "0")}</span>
        {e.type === "netflix" && <span className="frame-optional">optional</span>}
        {upNext && <span className="frame-now">Now showing</span>}
      </button>

      <div className="frame-foot">
        {watched ? (
          <button
            className="stub"
            onClick={() => onToggle(e)}
            title="Seen it — tap to tear the stub back off"
            aria-label={`Mark ${e.title} as unwatched`}
          >
            <span className="stub-admit">Admit one</span>
            <span className="stub-date">Seen {seenOn(watchedAt as number)}</span>
          </button>
        ) : (
          <button className="develop" onClick={() => onToggle(e)} aria-label={`Mark ${e.title} as watched`}>
            <span className="develop-dot" aria-hidden="true" />
            {upNext ? "Seen it" : "Mark seen"}
          </button>
        )}
        <span className="frame-year">{e.year}</span>
      </div>
    </div>
  );
}

/** Scrollable film strip — sprockets top and bottom, frames in watch order. */
function FilmStrip({
  entries,
  numberOf,
  watched,
  art,
  upNextId,
  wordmarkBase,
  onSelect,
  onToggle,
}: {
  entries: Entry[];
  numberOf: (e: Entry) => number;
  watched: Record<string, number>;
  art: ArtMap;
  upNextId: string | null;
  wordmarkBase: number;
  onSelect: (e: Entry) => void;
  onToggle: (e: Entry) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const animate = useMounted();

  const updateEdges = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };

  // roll the strip so the up-next frame sits in view (without moving the page)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>("[data-upnext]");
    if (target) {
      el.scrollTo({ left: target.offsetLeft - el.clientWidth / 2 + target.offsetWidth / 2, behavior: "smooth" });
    }
    updateEdges();
  }, [upNextId]);

  useEffect(() => {
    const ro = new ResizeObserver(updateEdges);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={`strip-wrap ${edges.start ? "at-start" : ""} ${edges.end ? "at-end" : ""}`}>
      <button className="strip-nav prev" onClick={() => nudge(-1)} aria-label="Scroll back" tabIndex={-1}>
        ‹
      </button>
      <div ref={ref} className="strip" onScroll={updateEdges}>
        <div className="strip-track">
          {entries.map((e) => (
            <Frame
              key={e.id}
              entry={e}
              number={numberOf(e)}
              poster={posterAt(art[e.id]?.poster, "w342")}
              watchedAt={watched[e.id]}
              upNext={e.id === upNextId && !watched[e.id]}
              animate={animate}
              wordmarkBase={wordmarkBase}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
      <button className="strip-nav next" onClick={() => nudge(1)} aria-label="Scroll forward" tabIndex={-1}>
        ›
      </button>
    </div>
  );
}

function TallyRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="tally-ring" aria-label={`${done} of ${total} seen`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="tr-bg" />
        <circle cx="32" cy="32" r={r} className="tr-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span>
        <strong>{done}</strong>/{total}
      </span>
    </div>
  );
}

interface ChapterProps {
  number: number;
  kicker: string;
  title: string;
  /** "The Infinity Saga" etc. */
  saga?: string;
  color: string;
  boss?: PhaseBoss;
  entries: Entry[];
  numberOf: (e: Entry) => number;
  watched: Record<string, number>;
  art: ArtMap;
  upNextId: string | null;
  wordmarkBase: number;
  onSelect: (e: Entry) => void;
  onToggle: (e: Entry) => void;
}

/** A phase as a movie chapter: title card, the villain looming behind, and its reel. */
export default function Chapter({
  number,
  kicker,
  title,
  saga,
  color,
  boss,
  entries,
  numberOf,
  watched,
  art,
  upNextId,
  wordmarkBase,
  onSelect,
  onToggle,
}: ChapterProps) {
  const done = entries.filter((e) => watched[e.id]).length;
  const defeated = done === entries.length && entries.length > 0;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = entries.some((e) => e.id === upNextId);

  return (
    <section
      ref={ref}
      className={`chapter ${visible ? "visible" : ""} ${defeated ? "defeated" : ""} ${active ? "active" : ""}`}
      style={{ "--phase-color": color } as React.CSSProperties}
    >
      <header className="chapter-head">
        {boss && (
          <div className="chapter-boss" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={boss.img} alt="" draggable={false} />
          </div>
        )}
        <div className="chapter-copy">
          <div className="chapter-kicker">
            <span className="chapter-no">{String(number).padStart(2, "0")}</span>
            {kicker}
            {saga && <span className="chapter-saga">· {saga}</span>}
          </div>
          <h3 className="chapter-title">{title}</h3>
          {boss && (
            <div className="chapter-villain">
              {defeated ? (
                <>
                  <span className="villain-x">{boss.name}</span> defeated · “{boss.quip}”
                </>
              ) : (
                <>
                  Villain: <strong>{boss.name}</strong> · finish the reel to take them down
                </>
              )}
            </div>
          )}
        </div>
        <TallyRing done={done} total={entries.length} />
        {defeated && boss && <div className="defeated-stamp">Defeated</div>}
      </header>

      <FilmStrip
        entries={entries}
        numberOf={numberOf}
        watched={watched}
        art={art}
        upNextId={upNextId}
        wordmarkBase={wordmarkBase}
        onSelect={onSelect}
        onToggle={onToggle}
      />
    </section>
  );
}
