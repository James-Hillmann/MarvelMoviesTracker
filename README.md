# Road to Doomsday 🟢

James & Deniz's MCU watch-through tracker — every Marvel movie before **Avengers: Doomsday** (Dec 18, 2026).

A poster-style snake board: click a title for posters, reviews and where to watch; mark it watched and the arrow trail turns green behind you. Movies are the main quest; the TV shows are a side quest that doesn't count toward the Doomsday clock.

On first visit you pick a profile — **James & Deniz** or **Kate** — and each crew gets its own shared trail (add more in `lib/profiles.ts`). The settings menu under the profile chip switches between release/chronological order and shows/hides the TV column; profile and settings are remembered per device.

The header also counts the viewing time left on your trail (and the hours a week you need to make it), each title's card lists where it's streaming, renting or free in your country (TMDB / JustWatch data), and the **Add key Disney+ series** setting slots Loki, WandaVision, Falcon & Winter Soldier and Ms. Marvel into the movie trail at the right spot, with a note on why each one matters for Doomsday. Those series still don't count toward the movie tally.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. It works immediately — progress is saved to `.data/progress.json` locally.

## TMDB API key (posters, synopses, reviews)

1. Create a free account at https://www.themoviedb.org/signup
2. Go to https://www.themoviedb.org/settings/api and request an API key (choose "Developer", any personal-use answers are fine)
3. Copy `.env.example` to `.env.local` and paste the "API Key" (the short v3 one) as `TMDB_API_KEY`
4. Restart the dev server

Without the key everything still works — the detail cards just show basic info instead of live TMDB data.

## Deploy (shared progress for James + Deniz)

Deployed on Vercel with Upstash Redis so both of you see and update the same trail from any device:

```bash
npx vercel
```

Then in the Vercel dashboard:
1. **Storage → Marketplace → Upstash Redis** → create the free database and connect it to the project (this injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)
2. **Settings → Environment Variables** → add `TMDB_API_KEY`
3. Redeploy. The site URL is your shared board — bookmark it on both phones.

## Where things live

- `lib/timeline.ts` — every movie/show, the watch orders, and each title's wordmark style (font, gradient, aura color). Add or restyle titles here.
- `lib/timeline.ts` → `RUNTIMES` / `keySeries` — runtimes behind the hours-left total, and which series slot into the trail (and where).
- `lib/timeline.ts` → `DOOMSDAY_DATE` — the countdown target if the release date moves.
- `components/Board.tsx` + `ArrowPath.tsx` — the snake grid and the arrow trail.
- `app/api/progress` — shared watched-state (Redis, falls back to a local file).
- `app/api/title/[id]` — TMDB proxy (key stays server-side, cached daily).
