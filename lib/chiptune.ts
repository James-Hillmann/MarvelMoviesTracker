"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny WebAudio chiptune engine: square/triangle/noise voices, a handful of
 * sound effects and an optional looping soundtrack.  Everything is synthesized
 * on the fly — no audio files.  The AudioContext is created lazily on the
 * first sound, which is always triggered by a click or key press.
 */

// ---------------------------------------------------------------------------
// settings store (per device, like the other display settings)
// ---------------------------------------------------------------------------

export interface AudioSettings {
  sound: boolean;
  music: boolean;
}

const STORAGE_KEY = "mcu-audio";
const DEFAULTS: AudioSettings = { sound: true, music: false };
let settings: AudioSettings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<AudioSettings>;
    settings = {
      sound: typeof saved.sound === "boolean" ? saved.sound : DEFAULTS.sound,
      music: typeof saved.music === "boolean" ? saved.music : DEFAULTS.music,
    };
  } catch {
    /* corrupt — defaults win */
  }
}

export function getAudioSettings(): AudioSettings {
  ensureLoaded();
  return settings;
}

export function setAudioSettings(patch: Partial<AudioSettings>) {
  ensureLoaded();
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
  if (patch.music === true) startMusic();
  if (patch.music === false) stopMusic();
  listeners.forEach((l) => l());
}

export function useAudioSettings(): AudioSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getAudioSettings,
    () => DEFAULTS,
  );
}

// ---------------------------------------------------------------------------
// voices
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.16;
    sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.07;
    musicBus.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" → 440, "C#5" → 554.37 */
export function hz(note: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) return 440;
  let n = NOTE_INDEX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  n += (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slideTo?: number;
  bus?: "sfx" | "music";
  /** 12.5% / 25% pulse via a detuned square pair — the NES "thin" lead */
  thin?: boolean;
}

function tone(freq: number, at: number, dur: number, opts: ToneOpts = {}) {
  const c = audio();
  const bus = opts.bus === "music" ? musicBus : sfxBus;
  if (!c || !bus) return;
  const t0 = at;
  const vol = opts.vol ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.004);
  g.gain.setValueAtTime(vol, t0 + Math.max(0.005, dur * 0.65));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(bus);

  const voices = opts.thin ? [0, 0.5] : [0];
  for (const detune of voices) {
    const osc = c.createOscillator();
    osc.type = opts.type ?? "square";
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.setValueAtTime(detune * 12, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }
}

let noiseBuf: AudioBuffer | null = null;
function noise(at: number, dur: number, vol = 1, lowpass = 4000) {
  const c = audio();
  if (!c || !sfxBus) return;
  if (!noiseBuf) {
    // decimated noise — every sample held 8 frames for that crunchy 8-bit hiss
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let v = 0;
    for (let i = 0; i < d.length; i++) {
      if (i % 8 === 0) v = Math.random() * 2 - 1;
      d[i] = v;
    }
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(lowpass, at);
  f.frequency.exponentialRampToValueAtTime(120, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(at);
  src.stop(at + dur + 0.05);
}

/** play a list of [note, beats] at a tempo; "-" is a rest */
function seq(notes: [string, number][], bpm: number, opts: ToneOpts = {}, offset = 0) {
  const c = audio();
  if (!c) return;
  const beat = 60 / bpm;
  let t = c.currentTime + 0.01 + offset;
  for (const [n, b] of notes) {
    if (n !== "-") tone(hz(n), t, b * beat * 0.92, opts);
    t += b * beat;
  }
}

// ---------------------------------------------------------------------------
// sound effects
// ---------------------------------------------------------------------------

function now() {
  return (audio()?.currentTime ?? 0) + 0.005;
}

const on = () => getAudioSettings().sound;

export const sfx = {
  /** cursor moved */
  blip() {
    if (!on()) return;
    tone(hz("A5"), now(), 0.045, { vol: 0.35, thin: true });
  },
  /** opened something */
  select() {
    if (!on()) return;
    const t = now();
    tone(hz("E5"), t, 0.05, { vol: 0.5 });
    tone(hz("B5"), t + 0.055, 0.09, { vol: 0.5 });
  },
  /** closed / backed out */
  back() {
    if (!on()) return;
    const t = now();
    tone(hz("B5"), t, 0.05, { vol: 0.4 });
    tone(hz("E5"), t + 0.055, 0.08, { vol: 0.4 });
  },
  /** marked watched — the classic two-note coin */
  coin() {
    if (!on()) return;
    const t = now();
    tone(hz("B5"), t, 0.07, { vol: 0.6 });
    tone(hz("E6"), t + 0.07, 0.38, { vol: 0.6 });
  },
  /** un-watched — power-down slide */
  powerDown() {
    if (!on()) return;
    tone(hz("E5"), now(), 0.32, { slideTo: hz("E3"), vol: 0.45 });
  },
  /** player picked */
  start() {
    if (!on()) return;
    seq(
      [
        ["C5", 0.25],
        ["E5", 0.25],
        ["G5", 0.25],
        ["C6", 0.75],
      ],
      240,
      { vol: 0.55 },
    );
    seq([["C4", 1.5]], 240, { type: "triangle", vol: 0.9 });
  },
  /** whole phase cleared — boss down */
  fanfare() {
    if (!on()) return;
    const t = now();
    noise(t, 0.45, 0.9, 5000);
    tone(hz("C4"), t, 0.4, { slideTo: hz("C2"), vol: 0.6 });
    seq(
      [
        ["G4", 0.33],
        ["C5", 0.33],
        ["E5", 0.34],
        ["G5", 1],
        ["E5", 0.5],
        ["G5", 2],
      ],
      180,
      { vol: 0.55, thin: true },
      0.5,
    );
    seq(
      [
        ["C3", 1],
        ["G3", 1],
        ["C4", 2.5],
      ],
      180,
      { type: "triangle", vol: 0.9 },
      0.5,
    );
  },
};

// ---------------------------------------------------------------------------
// soundtrack — an original 8-bar loop in A minor (Am · F · C · G)
// ---------------------------------------------------------------------------

const BPM = 138;
const LEAD: (string | null)[] = [
  // bar 1 — Am
  "A4", null, "C5", "E5", "A5", null, "G5", "E5",
  // bar 2 — F
  "F5", null, "E5", "C5", "A4", null, null, null,
  // bar 3 — C
  "G4", null, "C5", "E5", "G5", null, "A5", "G5",
  // bar 4 — G
  "D5", null, null, "B4", "D5", null, "G5", null,
  // bar 5 — Am
  "A4", null, "C5", "E5", "A5", null, "B5", "C6",
  // bar 6 — F
  "A5", null, "G5", "F5", "E5", null, "C5", null,
  // bar 7 — C
  "E5", "G5", "C6", null, "B5", null, "G5", null,
  // bar 8 — G
  "B4", null, "D5", null, "E5", null, null, null,
];
const BASS_ROOTS = ["A2", "F2", "C3", "G2", "A2", "F2", "C3", "G2"];

let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextStep = 0;
let nextTime = 0;

function scheduleMusic() {
  const c = audio();
  if (!c) return;
  const step = 60 / BPM / 2; // eighth notes
  while (nextTime < c.currentTime + 0.25) {
    const i = nextStep % LEAD.length;
    const lead = LEAD[i];
    if (lead) tone(hz(lead), nextTime, step * 0.9, { bus: "music", vol: 0.55, thin: true });
    // octave-hopping triangle bass, the backbone of every NES boss theme
    const root = hz(BASS_ROOTS[Math.floor(i / 8)]);
    tone(i % 2 ? root * 2 : root, nextTime, step * 0.85, { bus: "music", type: "triangle", vol: 1 });
    nextStep++;
    nextTime += step;
  }
}

export function startMusic() {
  if (musicTimer || typeof window === "undefined") return;
  const c = audio();
  if (!c) return;
  nextStep = 0;
  nextTime = c.currentTime + 0.05;
  scheduleMusic();
  musicTimer = setInterval(scheduleMusic, 90);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
