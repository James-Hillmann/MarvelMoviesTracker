"use client";

import { Entry } from "@/lib/timeline";
import Wordmark from "../Wordmark";

interface Props {
  shows: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  onSelect: (e: Entry) => void;
  onToggle: (e: Entry) => void;
}

/**
 * TV side quest as a field of moons — each show is a little CSS planet in its
 * signature colour that lights up and gains a green orbit once watched.
 */
export default function ShowMoons({ shows, watched, upNextId, onSelect, onToggle }: Props) {
  const groups: { title: string; note: string; items: Entry[] }[] = [
    { title: "Defenders era", note: "Netflix · optional, semi-canon", items: shows.filter((s) => s.type === "netflix") },
    { title: "Disney+ era", note: "the canon side quest", items: shows.filter((s) => s.type !== "netflix") },
  ];
  return (
    <div className="moons">
      {groups.map((g) => (
        <section key={g.title} className="moons-group">
          <header className="moons-head">
            <span className="moons-title">{g.title}</span>
            <span className="moons-note">
              {g.note} · {g.items.filter((s) => watched[s.id]).length}/{g.items.length}
            </span>
          </header>
          <div className="moons-grid">
            {g.items.map((s, i) => {
              const done = Boolean(watched[s.id]);
              const next = s.id === upNextId && !done;
              return (
                <div
                  key={s.id}
                  className={`moon ${done ? "done" : ""} ${next ? "next" : ""}`}
                  style={{ "--aura": s.wm.aura, "--spin": `${14 + (i % 5) * 3}s` } as React.CSSProperties}
                >
                  <button className="moon-orb" onClick={() => onSelect(s)} aria-label={`${s.sub ?? ""} ${s.title}`}>
                    <span className="moon-surface" />
                    <span className="moon-orbit" />
                    {next && <span className="moon-ping" />}
                  </button>
                  <button className="moon-name" onClick={() => onSelect(s)}>
                    {s.sub && <span className="moon-sub">{s.sub}</span>}
                    <Wordmark entry={s} base={0.95} />
                    <span className="moon-year">{s.year}</span>
                  </button>
                  <button
                    className="moon-toggle"
                    onClick={() => onToggle(s)}
                    title={done ? "Mark as unwatched" : "Mark as watched"}
                  >
                    {done ? "orbit reached" : "land here"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
