"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/chiptune";
import { Profile, PROFILES } from "@/lib/profiles";
import { PROFILE_HEROES } from "@/lib/sprites";
import { HeroParty } from "./PixelSprite";

/** Arcade title screen + PLAYER SELECT, shown until a profile is picked. */
export default function ProfilePicker({ onPick }: { onPick: (p: Profile) => void }) {
  const [cursor, setCursor] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number, focus = true) => {
    const next = (to + PROFILES.length) % PROFILES.length;
    if (next !== cursor) sfx.blip();
    setCursor(next);
    if (focus) cardRefs.current[next]?.focus();
  };

  const choose = (p: Profile) => {
    if (picked) return;
    sfx.start();
    setPicked(p.id);
    // let the flash play before the board takes over
    setTimeout(() => onPick(p), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        move(cursor + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        move(cursor - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="title-screen">
      <div className="title-inner">
        <div className="title-kicker">A MARVEL WATCH-ALONG ADVENTURE</div>
        <h1 className="title-logo" aria-label="Road to Doomsday">
          <span className="tl-top">ROAD TO</span>
          <span className="tl-main">DOOMSDAY</span>
        </h1>

        <div className="select-label">— PLAYER SELECT —</div>

        <div className="select-row">
          {PROFILES.map((p, i) => {
            const heroes = PROFILE_HEROES[p.id] ?? [];
            const active = i === cursor;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`select-card ${active ? "active" : ""} ${picked === p.id ? "picked" : ""}`}
                style={{ "--aura": p.color } as React.CSSProperties}
                onMouseEnter={() => move(i, false)}
                onFocus={() => setCursor(i)}
                onClick={() => choose(p)}
              >
                <span className="sc-cursor" aria-hidden="true">
                  ▼
                </span>
                <span className="sc-mode">{heroes.length > 1 ? "2P CO-OP" : "1P SOLO"}</span>
                <span className="sc-stage">
                  <HeroParty heroes={heroes} scale={5} />
                </span>
                <span className="sc-name">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div className="press-start">PRESS START</div>
        <div className="title-foot">© 2026 · EACH CREW GETS ITS OWN SAVE FILE</div>
      </div>
    </div>
  );
}
