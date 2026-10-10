import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { redisCmd, storageKind } from "./progressStore";
import { QuizResult, TriviaMap } from "./trivia";

/**
 * Per-profile quiz scores, stored next to watch progress but under their own
 * key so the existing `mcu:watched:*` hashes are untouched.
 *  - Redis: hash `mcu:trivia:<profile>`, movie id -> JSON QuizResult
 *  - dev: `.data/trivia-<profile>.json`
 */

const redisKey = (profile: string) => `mcu:trivia:${profile}`;

const fileCandidates = (profile: string) => [
  path.join(process.cwd(), ".data", `trivia-${profile}.json`),
  path.join(os.tmpdir(), `mcu-trivia-${profile}.json`),
];

async function readFileMap(profile: string): Promise<TriviaMap> {
  for (const file of fileCandidates(profile)) {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as TriviaMap;
    } catch {
      /* try next */
    }
  }
  return {};
}

async function writeFileMap(profile: string, map: TriviaMap): Promise<void> {
  let lastErr: unknown;
  for (const file of fileCandidates(profile)) {
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

export async function getTrivia(profile: string): Promise<TriviaMap> {
  if (storageKind() === "redis") {
    const flat = (await redisCmd(["HGETALL", redisKey(profile)])) as string[] | null;
    const map: TriviaMap = {};
    if (Array.isArray(flat)) {
      for (let i = 0; i < flat.length; i += 2) {
        try {
          map[flat[i]] = JSON.parse(flat[i + 1]) as QuizResult;
        } catch {
          /* skip a corrupt entry rather than failing the whole board */
        }
      }
    }
    return map;
  }
  return readFileMap(profile);
}

/** record an attempt, keeping the best score */
export async function recordQuiz(profile: string, id: string, score: number, total: number): Promise<TriviaMap> {
  const map = await getTrivia(profile);
  const prev = map[id];
  const next: QuizResult = {
    best: Math.max(prev?.best ?? 0, score),
    total,
    tries: (prev?.tries ?? 0) + 1,
    at: Date.now(),
  };
  map[id] = next;
  if (storageKind() === "redis") {
    await redisCmd(["HSET", redisKey(profile), id, JSON.stringify(next)]);
  } else {
    await writeFileMap(profile, map);
  }
  return map;
}
