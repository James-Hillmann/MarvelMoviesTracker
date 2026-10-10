"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Entry, formatRuntime, runtimeOf } from "@/lib/timeline";
import { Provider, TitleInfo } from "@/lib/tmdb";
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

/** viewer's country from the browser locale ("en-GB" → "GB"), for watch providers */
function viewerRegion(): string {
  const m = /-([A-Za-z]{2})$/.exec(navigator.language ?? "");
  return m ? m[1].toUpperCase() : "US";
}

function ProviderRow({ label, providers }: { label: string; providers: Provider[] }) {
  if (!providers.length) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {providers.slice(0, 6).map((p) =>
          p.logo ? (
            <Image
              key={p.name}
              src={p.logo}
              alt={p.name}
              title={p.name}
              width={28}
              height={28}
              className="h-7 w-7 rounded-md border border-white/10"
            />
          ) : (
            <span key={p.name} className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/70">
              {p.name}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export default function DetailModal({ entry, watched, onToggle, onClose }: Props) {
  const [info, setInfo] = useState<TitleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoading(true);
    fetch(`/api/title/${entry.id}?region=${viewerRegion()}`)
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
  const runtime = info?.runtime || (entry.mediaType === "movie" ? runtimeOf(entry) : 0);
  const providers = info?.providers;
  const hasProviders = Boolean(
    providers && (providers.stream.length || providers.free.length || providers.rent.length || providers.buy.length),
  );
  // only push Disney+ when it actually has the title (or we have no data to say otherwise)
  const onDisney = !hasProviders || providers!.stream.some((p) => /disney/i.test(p.name));

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
        {/* backdrop header */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-[1.25rem] sm:h-56">
          {info?.backdrop ? (
            <>
              <Image src={info.backdrop} alt="" fill className="object-cover" sizes="680px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/40 to-transparent" />
            </>
          ) : (
            <div
              className="absolute inset-0 opacity-40"
              style={{ backgroundImage: entry.wm.gradient }}
            />
          )}
          <div className="absolute bottom-3 left-5 right-5">
            {entry.sub && <div className="sub-label mb-1">{entry.sub}</div>}
            <Wordmark entry={entry} base={2.1} />
          </div>
          <button
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-black/90 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-5 p-5">
          {info?.poster && (
            <div className="relative hidden h-[186px] w-[124px] shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-lg sm:block">
              <Image src={info.poster} alt={`${entry.title} poster`} fill className="object-cover" sizes="124px" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
              <span className="text-white/90">{info?.releaseDate?.slice(0, 4) ?? entry.year}</span>
              {runtime ? <span>{formatRuntime(runtime)}</span> : null}
              {entry.keySeries && runtimeOf(entry) ? <span>≈ {formatRuntime(runtimeOf(entry))} total</span> : null}
              {info?.seasons ? (
                <span>
                  {info.seasons} season{info.seasons > 1 ? "s" : ""} · {info.episodes} eps
                </span>
              ) : null}
              {info?.genres?.slice(0, 3).map((g) => (
                <span key={g} className="rounded-full border border-white/15 px-2 py-0.5 text-[11px]">
                  {g}
                </span>
              ))}
              {score !== null && (
                <span
                  className="ml-auto rounded-full px-2.5 py-0.5 font-mono text-sm font-bold"
                  style={{
                    color: score >= 70 ? "#7dffab" : score >= 50 ? "#ffd82a" : "#ff6b6b",
                    background: "rgba(255,255,255,0.07)",
                  }}
                  title={`${info?.votes?.toLocaleString()} ratings on TMDB`}
                >
                  ★ {score}%
                </span>
              )}
            </div>

            {entry.keySeries && (
              <p className="mt-2 rounded-md border border-[color:var(--doom-green)]/30 bg-[color:var(--doom-green)]/5 px-2.5 py-1.5 text-xs leading-relaxed text-white/75">
                <span className="mr-1.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--doom-green)]">Doomsday setup</span>
                {entry.keySeries.why}
              </p>
            )}

            {info?.tagline && <p className="mt-2 text-sm italic text-white/40">“{info.tagline}”</p>}

            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {loading
                ? "Summoning intel…"
                : info?.overview ??
                  (info && !info.configured
                    ? "Add a free TMDB API key to see posters, synopses and reviews — see the README."
                    : "No intel available for this one yet — it may not be out.")}
            </p>

            {info?.cast && info.cast.length > 0 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {info.cast.map((c) => (
                  <div key={c.name} className="w-14 shrink-0 text-center">
                    {c.profile ? (
                      <Image
                        src={c.profile}
                        alt={c.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg">
                        {c.name[0]}
                      </div>
                    )}
                    <div className="mt-1 truncate text-[10px] text-white/70" title={`${c.name} as ${c.character}`}>
                      {c.name.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {hasProviders && (
          <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Where to watch · {providers!.region}
            </div>
            <ProviderRow label="Stream" providers={providers!.stream} />
            <ProviderRow label="Free" providers={providers!.free} />
            <ProviderRow label="Rent" providers={providers!.rent} />
            {!providers!.rent.length && <ProviderRow label="Buy" providers={providers!.buy} />}
          </div>
        )}
        {info?.configured && !loading && !hasProviders && (
          <div className="border-t border-white/10 px-5 py-3 text-xs text-white/40">
            No streaming info for your region yet.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-5 py-4">
          {onDisney ? (
            <a className="btn-disney" href={links.disney} target="_blank" rel="noopener noreferrer">
              ▶ Watch on Disney+
            </a>
          ) : (
            <a className="btn-disney" href={providers!.link ?? links.justwatch} target="_blank" rel="noopener noreferrer">
              ▶ Where to watch
            </a>
          )}
          <a
            className="text-xs uppercase tracking-[0.15em] text-white/45 underline-offset-4 hover:text-white/80 hover:underline"
            href={providers?.link ?? links.justwatch}
            target="_blank"
            rel="noopener noreferrer"
          >
            All streaming options
          </a>
          <button
            className={`btn-watched ml-auto ${watched ? "is-watched" : ""}`}
            onClick={() => onToggle(entry)}
          >
            {watched ? "↺ Unwatch" : "✓ Mark watched"}
          </button>
        </div>
      </div>
    </div>
  );
}
