"use client";

import { Profile, PROFILES } from "@/lib/profiles";

/** Full-screen "choose your universe" gate, shown until a profile is picked. */
export default function ProfilePicker({ onPick }: { onPick: (p: Profile) => void }) {
  return (
    <div className="picker-overlay picker-cosmos">
      <div className="text-center">
        <div className="mb-2 text-[11px] uppercase tracking-[0.5em] text-white/40">Road to Doomsday</div>
        <h1 className="f-bebas mb-12 text-3xl tracking-[0.2em] text-white/90 sm:text-4xl">CHOOSE YOUR UNIVERSE</h1>
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              className="universe-pick"
              style={{ "--aura": p.color, "--spin": `${16 + i * 5}s` } as React.CSSProperties}
              onClick={() => onPick(p)}
            >
              <span className="universe-orb">
                <span className="moon-surface" />
                <span className="universe-ring" />
                <span className="universe-ring b" />
              </span>
              <span className="picker-name">{p.label}</span>
              <span className="universe-id">Earth-{616 + i * 583}</span>
            </button>
          ))}
        </div>
        <p className="mt-12 text-[11px] uppercase tracking-[0.25em] text-white/30">each crew travels its own timeline</p>
      </div>
    </div>
  );
}
