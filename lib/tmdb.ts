import { Entry } from "./timeline";

/**
 * TMDB proxy helpers — runs server-side only so the API key never reaches the
 * browser.  Responses are cached for a day via Next's fetch cache.
 */

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export interface TitleInfo {
  configured: boolean;
  title?: string;
  tagline?: string;
  overview?: string;
  poster?: string | null;
  backdrop?: string | null;
  score?: number; // 0-10
  votes?: number;
  runtime?: number; // movies, minutes
  seasons?: number; // tv
  episodes?: number; // tv
  genres?: string[];
  releaseDate?: string;
  cast?: { name: string; character: string; profile: string | null }[];
  /** where to watch in the requested country (TMDB data, powered by JustWatch) */
  providers?: WatchProviders;
}

export interface Provider {
  name: string;
  logo: string | null;
}

export interface WatchProviders {
  region: string;
  /** TMDB's watch page for the title, which deep-links to each service */
  link?: string;
  stream: Provider[];
  free: Provider[];
  rent: Provider[];
  buy: Provider[];
}

type RawProvider = { provider_name: string; logo_path: string | null; display_priority?: number };

function toProviders(list: RawProvider[] | undefined): Provider[] {
  return [...(list ?? [])]
    .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
    .map((p) => ({ name: p.provider_name, logo: p.logo_path ? `${IMG}/w92${p.logo_path}` : null }));
}

function parseProviders(data: Record<string, unknown>, region: string): WatchProviders | undefined {
  const all = (data["watch/providers"] as { results?: Record<string, Record<string, unknown>> } | undefined)?.results;
  const r = all?.[region];
  if (!r) return undefined;
  return {
    region,
    link: (r.link as string) || undefined,
    stream: toProviders(r.flatrate as RawProvider[]),
    free: toProviders([...((r.free as RawProvider[]) ?? []), ...((r.ads as RawProvider[]) ?? [])]),
    rent: toProviders(r.rent as RawProvider[]),
    buy: toProviders(r.buy as RawProvider[]),
  };
}

function apiKey(): string | undefined {
  return process.env.TMDB_API_KEY;
}

export function tmdbConfigured(): boolean {
  return Boolean(apiKey());
}

async function tmdbFetch(pathname: string, params: Record<string, string> = {}): Promise<Record<string, unknown> | null> {
  const url = new URL(BASE + pathname);
  url.searchParams.set("api_key", apiKey() as string);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

/** Resolve a TMDB id — uses the hand-authored id, falls back to a search. */
async function resolveId(entry: Entry): Promise<number | null> {
  if (entry.tmdbId) return entry.tmdbId;
  const kind = entry.mediaType === "movie" ? "movie" : "tv";
  const query = [entry.sub, entry.title].filter(Boolean).join(" ");
  const data = await tmdbFetch(`/search/${kind}`, {
    query,
    year: String(entry.year),
  });
  const results = (data?.results as { id: number }[] | undefined) ?? [];
  return results[0]?.id ?? null;
}

export async function fetchTitleInfo(entry: Entry, region = "US"): Promise<TitleInfo> {
  if (!tmdbConfigured()) return { configured: false };

  const id = await resolveId(entry);
  if (!id) return { configured: true };

  const kind = entry.mediaType === "movie" ? "movie" : "tv";
  const data = await tmdbFetch(`/${kind}/${id}`, { append_to_response: "credits,watch/providers" });
  if (!data) return { configured: true };

  const credits = data.credits as { cast?: { name: string; character: string; profile_path: string | null }[] } | undefined;

  return {
    configured: true,
    title: (data.title as string) ?? (data.name as string),
    tagline: (data.tagline as string) || undefined,
    overview: (data.overview as string) || undefined,
    poster: data.poster_path ? `${IMG}/w500${data.poster_path}` : null,
    backdrop: data.backdrop_path ? `${IMG}/w1280${data.backdrop_path}` : null,
    score: typeof data.vote_average === "number" ? data.vote_average : undefined,
    votes: typeof data.vote_count === "number" ? data.vote_count : undefined,
    runtime: typeof data.runtime === "number" ? data.runtime : undefined,
    seasons: typeof data.number_of_seasons === "number" ? data.number_of_seasons : undefined,
    episodes: typeof data.number_of_episodes === "number" ? data.number_of_episodes : undefined,
    genres: ((data.genres as { name: string }[] | undefined) ?? []).map((g) => g.name),
    releaseDate: ((data.release_date as string) ?? (data.first_air_date as string)) || undefined,
    cast: (credits?.cast ?? []).slice(0, 6).map((c) => ({
      name: c.name,
      character: c.character,
      profile: c.profile_path ? `${IMG}/w185${c.profile_path}` : null,
    })),
    providers: parseProviders(data, region),
  };
}
