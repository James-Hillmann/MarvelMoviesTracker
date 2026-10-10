"use client";

import { tiltFor } from "@/lib/comic";
import { Entry } from "@/lib/timeline";
import { CornerFold } from "./ComicBook";
import Wordmark from "./Wordmark";

/**
 * The TV side quest as a sticker album: every show has a numbered empty
 * slot, and watching one sticks its sticker in (slightly crooked, as
 * stickers always are).  Netflix shows are the bonus stickers.
 */
export default function StickerAlbum({
  entries,
  watched,
  upNextId,
  wordmarkBase,
  onSelect,
  onQuickToggle,
}: {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  wordmarkBase: number;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}) {
  return (
    <div className="album">
      {entries.map((e, i) => {
        const stuck = Boolean(watched[e.id]);
        const next = !stuck && e.id === upNextId;
        return (
          <div
            key={e.id}
            data-entry={e.id}
            className={`slot ${stuck ? "stuck" : ""} ${next ? "next" : ""}`}
            style={{ "--aura": e.wm.aura, "--tilt": `${tiltFor(e.id, 5).toFixed(1)}deg` } as React.CSSProperties}
            onClick={() => onSelect(e)}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onSelect(e);
              }
            }}
            aria-label={`Sticker ${i + 1}: ${e.sub ? e.sub + " " : ""}${e.title}${stuck ? ", watched" : ""}`}
          >
            <span className="slot-num">{i + 1}</span>
            {e.type === "netflix" && <span className="slot-bonus">Bonus</span>}
            {stuck ? (
              <div className="sticker">
                {e.sub && <span className="sub-label">{e.sub}</span>}
                <Wordmark entry={e} base={wordmarkBase} />
              </div>
            ) : (
              <div className="slot-ghost">
                {e.sub && <span className="ghost-sub">{e.sub}</span>}
                <span className="ghost-title">{e.title}</span>
                {next && <span className="ghost-next">Up next!</span>}
              </div>
            )}
            <CornerFold read={stuck} onClick={() => onQuickToggle(e)} />
          </div>
        );
      })}
    </div>
  );
}
