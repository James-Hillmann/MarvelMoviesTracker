import { promises as fs } from "fs";
import os from "os";
import path from "path";

/**
 * Shared watch-progress store.
 *  - Upstash Redis (REST API, no SDK needed) when env vars are present — the
 *    deployed, shared-between-James-and-Deniz mode.
 *  - Local JSON file fallback for dev so the site works with zero setup.
 */

export type WatchedMap = Record<string, number>; // id -> epoch ms watched
export type RatingMap = Record<string, number>; // id -> 1..10 (half-stars out of 5)

/** each per-profile hash we keep; "watched" keeps its original key + file names */
type Bucket = "watched" | "ratings";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redisKey = (profile: string, bucket: Bucket = "watched") => `mcu:${bucket}:${profile}`;

// project-local file for dev; /tmp fallback keeps the API alive on a
// read-only serverless filesystem (ephemeral!) until Redis is connected
const fileCandidates = (profile: string, bucket: Bucket = "watched") => {
  const stem = bucket === "watched" ? "progress" : bucket;
  return [
    path.join(process.cwd(), ".data", `${stem}-${profile}.json`),
    path.join(os.tmpdir(), `mcu-${stem}-${profile}.json`),
  ];
};

export function storageKind(): "redis" | "file" {
  return REDIS_URL && REDIS_TOKEN ? "redis" : "file";
}

async function redisCmd(cmd: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

async function readFileMap(profile: string, bucket: Bucket = "watched"): Promise<Record<string, number>> {
  for (const file of fileCandidates(profile, bucket)) {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as WatchedMap;
    } catch {
      /* try next */
    }
  }
  return {};
}

async function writeFileMap(profile: string, map: Record<string, number>, bucket: Bucket = "watched"): Promise<void> {
  let lastErr: unknown;
  for (const file of fileCandidates(profile, bucket)) {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(map, null, 2));
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function getWatched(profile: string): Promise<WatchedMap> {
  if (storageKind() === "redis") {
    const flat = (await redisCmd(["HGETALL", redisKey(profile)])) as string[] | null;
    const map: WatchedMap = {};
    if (Array.isArray(flat)) {
      for (let i = 0; i < flat.length; i += 2) {
        map[flat[i]] = Number(flat[i + 1]) || 0;
      }
    }
    return map;
  }
  return readFileMap(profile);
}

export async function setWatched(profile: string, id: string, watched: boolean): Promise<WatchedMap> {
  if (storageKind() === "redis") {
    if (watched) {
      await redisCmd(["HSET", redisKey(profile), id, String(Date.now())]);
    } else {
      await redisCmd(["HDEL", redisKey(profile), id]);
    }
    return getWatched(profile);
  }
  const map = await readFileMap(profile);
  if (watched) map[id] = Date.now();
  else delete map[id];
  await writeFileMap(profile, map);
  return map;
}

/** Marks a title watched, keeping the original date if it was already watched. */
export async function markWatched(profile: string, id: string): Promise<void> {
  if (storageKind() === "redis") {
    await redisCmd(["HSETNX", redisKey(profile), id, String(Date.now())]);
    return;
  }
  const map = await readFileMap(profile);
  if (map[id]) return;
  map[id] = Date.now();
  await writeFileMap(profile, map);
}

async function getHash(profile: string, bucket: Bucket): Promise<Record<string, number>> {
  if (storageKind() === "redis") {
    const flat = (await redisCmd(["HGETALL", redisKey(profile, bucket)])) as string[] | null;
    const map: Record<string, number> = {};
    if (Array.isArray(flat)) {
      for (let i = 0; i < flat.length; i += 2) map[flat[i]] = Number(flat[i + 1]) || 0;
    }
    return map;
  }
  return readFileMap(profile, bucket);
}

export function getRatings(profile: string): Promise<RatingMap> {
  return getHash(profile, "ratings");
}

/** rating 1..10, or null to clear */
export async function setRating(profile: string, id: string, rating: number | null): Promise<RatingMap> {
  if (storageKind() === "redis") {
    if (rating === null) await redisCmd(["HDEL", redisKey(profile, "ratings"), id]);
    else await redisCmd(["HSET", redisKey(profile, "ratings"), id, String(rating)]);
    return getRatings(profile);
  }
  const map = await readFileMap(profile, "ratings");
  if (rating === null) delete map[id];
  else map[id] = rating;
  await writeFileMap(profile, map, "ratings");
  return map;
}
