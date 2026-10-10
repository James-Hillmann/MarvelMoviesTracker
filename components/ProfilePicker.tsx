"use client";

import { Profile, PROFILES } from "@/lib/profiles";

/** Full-screen "who's watching?" gate, shown until a profile is picked. */
export default function ProfilePicker({ onPick }: { onPick: (p: Profile) => void }) {
  return (
    <div className="picker-overlay">
      <div className="text-center">
        <div className="caption mb-6 text-sm">Road to Doomsday presents…</div>
        <div className="mb-14">
          <h1 className="picker-bubble">Who&apos;s watching?</h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              className="picker-card"
              style={{ "--aura": p.color } as React.CSSProperties}
              onClick={() => onPick(p)}
            >
              <div className="cover-mast">
                <span className="mast-title">Road to Doomsday</span>
                <span className="issue-box">
                  <small>NO.</small>
                  <b>{i + 1}</b>
                </span>
              </div>
              <div className="cover-art">
                <span className="picker-name">{p.label}</span>
              </div>
              <div className="cover-foot">Pick this issue!</div>
            </button>
          ))}
        </div>
        <p className="section-meta mt-12">each crew gets its own trail</p>
      </div>
    </div>
  );
}
