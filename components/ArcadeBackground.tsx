"use client";

import { useEffect, useRef } from "react";

/**
 * Night-sky stage backdrop rendered at 1/3 resolution and blown up with
 * nearest-neighbour scaling: banded 16-bit sky, twinkling pixel stars, the
 * odd shooting star and a procedurally built city skyline with Avengers
 * Tower.  The horizon glows greener the closer you get to Doomsday.
 * Throttled to ~15fps, paused while hidden, static under reduced motion.
 */

const PX = 3;

// banded sky, top → horizon
const SKY_BANDS = ["#07051a", "#0b0824", "#110b30", "#180e3a", "#211042", "#2c1248", "#3a144c"];
const DOOM_BANDS = ["#07051a", "#06091e", "#071222", "#081c24", "#0a2a26", "#0d3a28", "#10502c"];

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number; lit: boolean; flicker: boolean }[];
  antenna: boolean;
  tower?: boolean;
}

function buildSkyline(W: number): Building[] {
  const r = rng(1938);
  const out: Building[] = [];
  let x = -2;
  const towerAt = Math.floor(W * 0.68);
  while (x < W) {
    const tower = !out.some((b) => b.tower) && x > towerAt;
    const w = tower ? 16 : 8 + Math.floor(r() * 14);
    const h = tower ? 74 : 16 + Math.floor(r() * 40);
    const windows: Building["windows"] = [];
    for (let wy = 4; wy < h - 3; wy += 4) {
      for (let wx = 2; wx < w - 2; wx += 3) {
        windows.push({ x: wx, y: wy, lit: r() > 0.62, flicker: r() > 0.94 });
      }
    }
    out.push({ x, w, h, windows, antenna: r() > 0.7, tower });
    x += w + (r() > 0.7 ? 2 : 0);
  }
  return out;
}

export default function ArcadeBackground({ progress = 0 }: { progress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const redrawRef = useRef<(t: number) => void>(() => {});

  // the animated loop picks this up next frame; the static one needs a nudge
  useEffect(() => {
    progressRef.current = progress;
    redrawRef.current(performance.now());
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let stars: { x: number; y: number; b: number; tw: number; big: boolean }[] = [];
    let skyline: Building[] = [];
    let shooting: { x: number; y: number; life: number } | null = null;

    const resize = () => {
      W = Math.ceil(window.innerWidth / PX);
      H = Math.ceil(window.innerHeight / PX);
      canvas.width = W;
      canvas.height = H;
      const r = rng(77);
      stars = Array.from({ length: Math.floor((W * H) / 260) }, () => ({
        x: Math.floor(r() * W),
        y: Math.floor(r() * H * 0.8),
        b: r(),
        tw: r() * Math.PI * 2,
        big: r() > 0.93,
      }));
      skyline = buildSkyline(W);
      draw(0);
    };

    const draw = (t: number) => {
      const p = progressRef.current;
      // sky bands
      const bandH = Math.ceil(H / SKY_BANDS.length);
      SKY_BANDS.forEach((c, i) => {
        ctx.fillStyle = mix(c, DOOM_BANDS[i], p * 0.85);
        ctx.fillRect(0, i * bandH, W, bandH + 1);
      });
      // dithered seam between bands — checkerboard rows
      for (let i = 1; i < SKY_BANDS.length; i++) {
        ctx.fillStyle = mix(SKY_BANDS[i], DOOM_BANDS[i], p * 0.85);
        const y = i * bandH - 1;
        for (let x = (i % 2); x < W; x += 2) ctx.fillRect(x, y, 1, 1);
      }

      // stars
      for (const s of stars) {
        const tw = still ? 1 : 0.55 + 0.45 * Math.sin(t / 600 + s.tw);
        const a = (0.35 + s.b * 0.65) * tw;
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fillRect(s.x, s.y, 1, 1);
        if (s.big && tw > 0.8) {
          ctx.fillStyle = `rgba(255,240,200,${(a * 0.6).toFixed(2)})`;
          ctx.fillRect(s.x - 1, s.y, 1, 1);
          ctx.fillRect(s.x + 1, s.y, 1, 1);
          ctx.fillRect(s.x, s.y - 1, 1, 1);
          ctx.fillRect(s.x, s.y + 1, 1, 1);
        }
      }

      // shooting star
      if (!still) {
        if (!shooting && Math.random() < 0.004) shooting = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.3, life: 0 };
        if (shooting) {
          shooting.life++;
          for (let k = 0; k < 8; k++) {
            ctx.fillStyle = `rgba(255,255,255,${(1 - k / 8).toFixed(2)})`;
            ctx.fillRect(Math.round(shooting.x - k * 2), Math.round(shooting.y - k), 2, 1);
          }
          shooting.x += 4;
          shooting.y += 2;
          if (shooting.life > 22) shooting = null;
        }
      }

      // horizon glow
      const glow = mix("#5a1a60", "#2bd456", p);
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, H - 34, W, 34);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, H - 52, W, 18);
      ctx.globalAlpha = 1;

      // skyline
      const base = H;
      for (const b of skyline) {
        const top = base - b.h;
        ctx.fillStyle = b.tower ? "#0c0a1c" : "#08061a";
        ctx.fillRect(b.x, top, b.w, b.h);
        // rim light
        ctx.fillStyle = "#1c1638";
        ctx.fillRect(b.x, top, 1, b.h);
        if (b.antenna) {
          ctx.fillStyle = "#08061a";
          ctx.fillRect(b.x + Math.floor(b.w / 2), top - 5, 1, 5);
          if (!still && Math.floor(t / 700) % 2) {
            ctx.fillStyle = "#ff3048";
            ctx.fillRect(b.x + Math.floor(b.w / 2), top - 6, 1, 1);
          }
        }
        for (const w of b.windows) {
          let lit = w.lit;
          if (w.flicker && !still) lit = Math.floor(t / 900 + w.x) % 3 !== 0;
          if (!lit) continue;
          ctx.fillStyle = b.tower ? "#9fe8ff" : "#ffd27a";
          ctx.fillRect(b.x + w.x, top + w.y, 1, 2);
        }
        if (b.tower) {
          // the big "A" up top
          ctx.fillStyle = "#cfe8ff";
          const ax = b.x + 5;
          const ay = top + 4;
          ctx.fillRect(ax + 2, ay, 2, 1);
          ctx.fillRect(ax + 1, ay + 1, 1, 4);
          ctx.fillRect(ax + 4, ay + 1, 1, 4);
          ctx.fillRect(ax + 1, ay + 3, 4, 1);
          // landing pad
          ctx.fillStyle = "#08061a";
          ctx.fillRect(b.x - 4, top + 14, 6, 2);
        }
      }
    };

    redrawRef.current = draw;
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || t - last < 66) return;
      last = t;
      draw(t);
    };
    if (!still) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="arcade-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="arcade-sky" />
      <div className="crt-scanlines" />
      <div className="crt-vignette" />
    </div>
  );
}
