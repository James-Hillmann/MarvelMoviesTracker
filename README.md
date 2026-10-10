# Road to Doomsday 🟢

James & Deniz's MCU watch-through tracker — every Marvel movie before **Avengers: Doomsday** (Dec 18, 2026).

A poster-style snake board: click a title for posters, reviews and where to watch; mark it watched and the arrow trail turns green behind you. Movies are the main quest; the TV shows are a side quest that doesn't count toward the Doomsday clock.

On first visit you pick a profile — **James & Deniz** or **Kate** — and each crew gets its own shared trail (add more in `lib/profiles.ts`). The settings menu under the profile chip switches between release/chronological order and shows/hides the TV column; profile and settings are remembered per device.

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

## Watch together

If you watch with the [Watch Together](https://github.com/James-Hillmann/watch-together) browser extension, open a movie's card and press **👥 Watch together**. It opens Disney+ with a hand-off the extension catches; start the party there as usual and send the link. When the movie reaches the credits, the extension checks it off here for everyone in the party, and the board picks it up on its next refresh.

- Whoever started the party gets it checked off on the profile they had open. A friend on a different profile (say Kate) gets it on theirs too once they've used the button on their own device at least once.
- Movies only: a show party would count as finished after one episode.
- The extension calls `POST /api/watch-together`, which can only mark titles watched, never unwatch, and keeps the original date if it was already watched.

## Where things live

- `lib/timeline.ts` — every movie/show, the watch orders, and each title's wordmark style (font, gradient, aura color). Add or restyle titles here.
- `lib/timeline.ts` → `DOOMSDAY_DATE` — the countdown target if the release date moves.
- `components/Board.tsx` + `ArrowPath.tsx` — the snake grid and the arrow trail.
- `app/api/progress` — shared watched-state (Redis, falls back to a local file).
- `app/api/watch-together` + `lib/watchTogether.ts` — the Watch Together hand-off and check-off.
- `app/api/title/[id]` — TMDB proxy (key stays server-side, cached daily).
