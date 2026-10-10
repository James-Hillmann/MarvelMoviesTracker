"use client";

import { Profile, PROFILES } from "@/lib/profiles";

function initials(label: string) {
  return label
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

/** Full-screen "identify operative" gate, shown until a profile is picked. */
export default function ProfilePicker({ onPick }: { onPick: (p: Profile) => void }) {
  return (
    <div className="picker-overlay">
      <div className="picker-frame">
        <span className="br-bl" aria-hidden="true" />
        <span className="br-br" aria-hidden="true" />
        <div className="hud-label mb-3" style={{ color: "var(--hud)" }}>
          Road to Doomsday // Access Terminal
        </div>
        <h1 className="picker-title mb-8">Identify operative</h1>
        <div className="flex flex-wrap items-center justify-center gap-5">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              className="picker-card"
              style={{ "--aura": p.color } as React.CSSProperties}
              onClick={() => onPick(p)}
            >
              <span className="picker-avatar" aria-hidden="true">
                {initials(p.label)}
              </span>
              <span className="picker-name">{p.label}</span>
              <span className="picker-clear">Clearance · Level {i + 1 === 1 ? "Alpha" : "Omega"}</span>
            </button>
          ))}
        </div>
        <p className="mt-8 hud-label" style={{ letterSpacing: "0.2em" }}>
          each crew tracks its own flight path
        </p>
      </div>
    </div>
  );
}
