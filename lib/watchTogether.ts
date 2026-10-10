import { Entry } from "./timeline";

/** Shown by the Watch Together extension, e.g. "From Road to Doomsday". */
const TRACKER_NAME = "Road to Doomsday";

function searchTerm(entry: Entry) {
  return [entry.sub === "Thunderbolts*" ? "Thunderbolts" : entry.sub, entry.title].filter(Boolean).join(" ");
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Disney+ search for this title, with a `#wt=` hand-off the Watch Together
 * extension picks up: the next party started there remembers the movie and,
 * at the credits, calls /api/watch-together to check it off for everyone.
 * Format matches `encodeMovieLink` in the extension's shared/tracker.ts.
 */
export function watchTogetherUrl(entry: Entry, profile: string, origin: string) {
  const payload = {
    v: 1,
    u: origin,
    n: TRACKER_NAME,
    id: entry.id,
    t: searchTerm(entry),
    p: profile,
  };
  return `https://www.disneyplus.com/search?q=${encodeURIComponent(searchTerm(entry))}#wt=${toBase64Url(JSON.stringify(payload))}`;
}
