"use client";

import { sfx } from "@/lib/chiptune";
import { ICONS, iconFor } from "@/lib/sprites";
import { Entry } from "@/lib/timeline";
import PixelSprite from "./PixelSprite";

interface Props {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId?: string | null;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

/**
 * The TV side quest as a shelf of game cartridges.  Netflix-era shows are the
 * black "bonus" carts; finished ones get a gold 100% seal on the label.
 */
export default function CartridgeShelf({ entries, watched, upNextId, onSelect, onQuickToggle }: Props) {
  return (
    <div className="shelf">
      {entries.map((e, i) => {
        const done = Boolean(watched[e.id]);
        const next = e.id === upNextId && !done;
        const open = () => {
          sfx.select();
          onSelect(e);
        };
        return (
          <div
            key={e.id}
            data-entry={e.id}
            className={`cart ${e.type === "netflix" ? "bonus" : ""} ${done ? "watched" : ""} ${next ? "upnext" : ""}`}
            style={{ "--aura": e.wm.aura, "--label": e.wm.gradient } as React.CSSProperties}
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                open();
              }
            }}
            aria-label={`${e.sub ? e.sub + " " : ""}${e.title} (${e.year})${done ? ", watched" : ""}${next ? ", up next" : ""}`}
          >
            <span className="cart-grip" aria-hidden="true" />
            <span className="cart-label">
              <span className="cart-top">
                <span>TV-{String(i + 1).padStart(2, "0")}</span>
                <span>{e.type === "netflix" ? "BONUS" : e.year}</span>
              </span>
              <span className="cart-art">
                <PixelSprite sprite={ICONS[iconFor(e.id)]} scale={4} aura={e.wm.aura} />
              </span>
              {e.sub && <span className="cart-sub">{e.sub}</span>}
              <span className="cart-title">{e.title}</span>
            </span>
            <span className="cart-pins" aria-hidden="true" />
            {done && (
              <span className="cart-seal" aria-hidden="true">
                100%
              </span>
            )}
            {next && <span className="cart-loading">▶ NOW LOADING</span>}
            <button
              className="cart-quick"
              title={done ? "Mark as unwatched" : "Mark as watched"}
              aria-label={done ? `Mark ${e.title} as unwatched` : `Mark ${e.title} as watched`}
              onClick={(ev) => {
                ev.stopPropagation();
                onQuickToggle(e);
              }}
            >
              {done ? "↺" : "✓"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
