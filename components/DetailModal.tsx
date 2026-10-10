"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Entry } from "@/lib/timeline";
import { TitleInfo } from "@/lib/tmdb";
import Wordmark from "./Wordmark";

interface Props {
  entry: Entry;
  watched: boolean;
  onToggle: (entry: Entry) => void;
  onClose: () => void;
}

function searchUrl(entry: Entry) {
  const q = encodeURIComponent([entry.sub === "Thunderbolts*" ? "Thunderbolts" : entry.sub, entry.title].filter(Boolean).join(" "));
  return {
    disney: `https://www.disneyplus.com/search?q=${q}`,
    justwatch: `https://www.justwatch.com/us/search?q=${q}`,
  };
}

export default function DetailModal({ entry, watched, onToggle, onClose }: Props) {
  const [info, setInfo] = useState<TitleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoading(true);
    fetch(`/api/title/${entry.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TitleInfo | null) => {
        if (!cancelled) {
          setInfo(data);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entry.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const links = searchUrl(entry);
  const score = info?.score ? Math.round(info.score * 10) : null;
  const ringColor = score === null ? "#4fe3ff" : score >= 70 ? "#4fe3ff" : score >= 50 ? "#ffb347" : "#ff3b4a";
  const fileId = entry.id.toUpperCase().replace(/-/g, "·");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ "--aura": entry.wm.aura } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={entry.title}
      >
        {/* dossier strip */}
        <div className="dossier-strip">
          <span>
            Dossier // <span className="id">{fileId}</span>
          </span>
          <span className={`dossier-status ${watched ? "cleared" : ""}`}>
            {watched ? "✓ cleared" : "◌ pending"}
          </span>
        </div>

        {/* backdrop header */}
        <div className="relative h-44 w-full overflow-hidden sm:h-56">
          {info?.backdrop ? (
            <>
              <Image src={info.backdrop} alt="" fill className="object-cover" sizes="700px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1524] via-[#0b1524]/45 to-transparent" />
            </>
          ) : (
            <div
              className="absolute inset-0 opacity-35"
              style={{ backgroundImage: entry.wm.gradient }}
            />
          )}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(120,190,230,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,190,230,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "linear-gradient(180deg, black, transparent 80%)",
              WebkitMaskImage: "linear-gradient(180deg, black, transparent 80%)",
            }}
          />
          <div className="absolute bottom-3 left-5 right-5">
            {entry.sub && <div className="sub-label mb-1">{entry.sub}</div>}
            <Wordmark entry={entry} base={2.1} />
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex gap-5 p-5">
          {info?.poster && (
            <div
              className="relative hidden h-[186px] w-[124px] shrink-0 overflow-hidden sm:block"
              style={{ border: "1px solid var(--line)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
            >
              <Image src={info.poster} alt={`${entry.title} poster`} fill className="object-cover" sizes="124px" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="pill" style={{ color: "#f2f8fc", borderColor: "var(--hud-dim)" }}>
                {info?.releaseDate?.slice(0, 4) ?? entry.year}
              </span>
              {info?.runtime ? (
                <span className="pill">
                  {Math.floor(info.runtime / 60)}h {info.runtime % 60}m
                </span>
              ) : null}
              {info?.seasons ? (
                <span className="pill">
                  {info.seasons} season{info.seasons > 1 ? "s" : ""} · {info.episodes} eps
                </span>
              ) : null}
              {info?.genres?.slice(0, 3).map((g) => (
                <span key={g} className="pill" style={{ opacity: 0.7 }}>
                  {g}
                </span>
              ))}
              {score !== null && (
                <span
                  className="score-ring ml-auto"
                  style={{ "--p": score, "--ring": ringColor } as React.CSSProperties}
                  title={`${info?.votes?.toLocaleString()} ratings on TMDB`}
                >
                  <span>{score}%</span>
                </span>
              )}
            </div>

            {info?.tagline && (
              <p className="mt-3 text-sm italic" style={{ color: "rgba(160,210,235,0.55)" }}>
                “{info.tagline}”
              </p>
            )}

            <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: "rgba(230,241,248,0.8)" }}>
              {loading
                ? "Decrypting intel…"
                : info?.overview ??
                  (info && !info.configured
                    ? "Add a free TMDB API key to see posters, synopses and reviews — see the README."
                    : "No intel on file for this one yet — it may not be out.")}
            </p>

            {info?.cast && info.cast.length > 0 && (
              <>
                <div className="hud-label mt-4 mb-2">Personnel</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {info.cast.map((c) => (
                    <div key={c.name} className="w-14 shrink-0 text-center">
                      {c.profile ? (
                        <Image
                          src={c.profile}
                          alt={c.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 object-cover"
                          style={{
                            clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                          }}
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center text-lg"
                          style={{
                            background: "rgba(120,190,230,0.12)",
                            clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                          }}
                        >
                          {c.name[0]}
                        </div>
                      )}
                      <div
                        className="mt-1 truncate text-[10px]"
                        style={{ color: "rgba(230,241,248,0.7)" }}
                        title={`${c.name} as ${c.character}`}
                      >
                        {c.name.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line)" }}>
          <a className="hud-btn disney" href={links.disney} target="_blank" rel="noopener noreferrer">
            ▶ Watch on Disney+
          </a>
          <a
            className="hud-label underline-offset-4 hover:underline"
            style={{ letterSpacing: "0.18em" }}
            href={links.justwatch}
            target="_blank"
            rel="noopener noreferrer"
          >
            All streaming options
          </a>
          <button
            className={`hud-btn ml-auto ${watched ? "is-watched" : "primary"}`}
            onClick={() => onToggle(entry)}
          >
            {watched ? "↺ Reopen" : "✓ Mark cleared"}
          </button>
        </div>
      </div>
    </div>
  );
}
