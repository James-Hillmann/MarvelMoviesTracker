"use client";

/**
 * Check-off effects engine — everything that goes off when a title gets marked
 * watched.  One shared full-screen canvas for particles/beams/bolts plus a few
 * DOM overlays (comic "POW!" text, combo counter, milestone banner, +1 toast).
 * Dependency-free; the canvas tears itself down when nothing is animating.
 */

import type { Entry } from "./timeline";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* canvas engine                                                       */
/* ------------------------------------------------------------------ */

interface Fx {
  age: number;
  delay: number;
  dur: number;
  draw(ctx: CanvasRenderingContext2D, age: number, k: number): void;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let fxList: Fx[] = [];
let raf = 0;
let last = 0;
let W = 0;
let H = 0;

function sizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function add(draw: Fx["draw"], dur: number, delay = 0) {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "fx-canvas";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
  }
  fxList.push({ age: 0, delay, dur, draw });
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

function tick(t: number) {
  const dt = Math.min(50, t - last);
  last = t;
  const k = dt / 16.667; // physics are tuned for 60fps steps
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, W, H);
  fxList = fxList.filter((fx) => {
    if (fx.delay > 0) {
      fx.delay -= dt;
      return true;
    }
    fx.age += dt;
    if (fx.age > fx.dur) return false;
    ctx!.save();
    fx.draw(ctx!, fx.age, k);
    ctx!.restore();
    return true;
  });
  if (fxList.length) {
    raf = requestAnimationFrame(tick);
  } else {
    raf = 0;
    window.removeEventListener("resize", sizeCanvas);
    canvas.remove();
    canvas = null;
    ctx = null;
  }
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

interface BurstOpts {
  count: number;
  colors: string[];
  speed?: [number, number];
  gravity?: number;
  drag?: number;
  size?: [number, number];
  life?: number;
  kind?: "spark" | "confetti" | "star";
  /** emit only in this arc (radians) — default full circle */
  angle?: [number, number];
  delay?: number;
}

function burst(x: number, y: number, o: BurstOpts) {
  const life = o.life ?? 1200;
  const [s0, s1] = o.speed ?? [3, 12];
  const [z0, z1] = o.size ?? [2, 5];
  const [a0, a1] = o.angle ?? [0, Math.PI * 2];
  const kind = o.kind ?? "spark";
  const ps = Array.from({ length: o.count }, () => {
    const a = rand(a0, a1);
    const s = rand(s0, s1);
    return {
      x,
      y,
      px: x,
      py: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      size: rand(z0, z1),
      rot: rand(0, Math.PI),
      vr: rand(-0.3, 0.3),
      color: pick(o.colors),
      wobble: rand(0, Math.PI * 2),
    };
  });
  const g = o.gravity ?? 0.18;
  const drag = o.drag ?? 0.96;
  add(
    (c, age, k) => {
      const fade = 1 - Math.max(0, (age - life * 0.55) / (life * 0.45));
      if (kind === "spark") c.globalCompositeOperation = "lighter";
      for (const p of ps) {
        p.px = p.x;
        p.py = p.y;
        p.vx *= Math.pow(drag, k);
        p.vy = p.vy * Math.pow(drag, k) + g * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.rot += p.vr * k;
        c.globalAlpha = Math.max(0, fade);
        if (kind === "spark") {
          c.strokeStyle = p.color;
          c.lineWidth = p.size * 0.6;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(p.px - p.vx * 1.5, p.py - p.vy * 1.5);
          c.lineTo(p.x, p.y);
          c.stroke();
        } else if (kind === "star") {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.fillStyle = p.color;
          starPath(c, p.size * 1.6, p.size * 0.6, 5);
          c.fill();
          c.restore();
        } else {
          p.wobble += 0.15 * k;
          c.save();
          c.translate(p.x + Math.sin(p.wobble) * 2, p.y);
          c.rotate(p.rot);
          c.scale(1, Math.abs(Math.cos(p.wobble)) + 0.2);
          c.fillStyle = p.color;
          c.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
          c.restore();
        }
      }
    },
    life,
    o.delay ?? 0,
  );
}

function starPath(c: CanvasRenderingContext2D, R: number, r: number, n: number) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = (i * Math.PI) / n - Math.PI / 2;
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  c.closePath();
}

function shockwave(x: number, y: number, color: string, delay = 0, maxR = 260) {
  add(
    (c, age) => {
      const t = age / 700;
      const r = ease(t) * maxR;
      c.globalAlpha = 1 - t;
      c.strokeStyle = color;
      c.lineWidth = 10 * (1 - t) + 1;
      c.shadowColor = color;
      c.shadowBlur = 20;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
    },
    700,
    delay,
  );
}

function confettiRain(colors: string[], count = 120) {
  const ps = Array.from({ length: count }, () => ({
    x: rand(0, W || window.innerWidth),
    y: rand(-H * 0.6, -10),
    vy: rand(2, 5),
    size: rand(4, 8),
    rot: rand(0, Math.PI),
    vr: rand(-0.2, 0.2),
    wob: rand(0, Math.PI * 2),
    color: pick(colors),
  }));
  add((c, age, k) => {
    c.globalAlpha = Math.min(1, (3000 - age) / 600);
    for (const p of ps) {
      p.y += p.vy * k;
      p.wob += 0.08 * k;
      p.rot += p.vr * k;
      c.save();
      c.translate(p.x + Math.sin(p.wob) * 18, p.y);
      c.rotate(p.rot);
      c.scale(1, Math.abs(Math.cos(p.wob * 1.3)) + 0.15);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    }
  }, 3000);
}

function fireworks(n: number, colors: string[]) {
  for (let i = 0; i < n; i++) {
    const delay = i * 260 + rand(0, 120);
    const x = rand(W * 0.12, W * 0.88);
    const ty = rand(H * 0.12, H * 0.45);
    const color = pick(colors);
    const rise = 650;
    add(
      (c, age) => {
        const t = ease(age / rise);
        const y = H + 10 - (H + 10 - ty) * t;
        c.globalCompositeOperation = "lighter";
        c.fillStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(x, y, 3, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 0.5;
        c.fillRect(x - 1, y, 2, 40 * (1 - t));
      },
      rise,
      delay,
    );
    burst(x, ty, { count: 70, colors: [color, "#ffffff", color], speed: [2, 8], gravity: 0.06, drag: 0.95, life: 1400, delay: delay + rise });
  }
}

function flash(color: string, strength = 0.9) {
  const el = document.createElement("div");
  el.className = "screen-flash";
  el.style.setProperty("--flash-color", color);
  el.style.opacity = String(strength);
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function whiteout(ms = 120) {
  add((c, age) => {
    c.globalAlpha = 0.4 * (1 - age / ms);
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  }, ms);
}

function shake(level: "small" | "big") {
  const root = document.querySelector<HTMLElement>("[data-fx-shake]");
  if (!root) return;
  const cls = level === "big" ? "fx-shake-big" : "fx-shake";
  root.classList.remove("fx-shake", "fx-shake-big");
  void root.offsetWidth; // restart the animation
  root.classList.add(cls);
  root.addEventListener("animationend", () => root.classList.remove(cls), { once: true });
}

function pulseClass(el: Element | null, cls: string) {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
}

/* ------------------------------------------------------------------ */
/* hero signatures                                                     */
/* ------------------------------------------------------------------ */

type Signature =
  | "lightning"
  | "repulsor"
  | "smash"
  | "shield"
  | "webs"
  | "mystic"
  | "quantum"
  | "cosmic"
  | "claws"
  | "infinity"
  | "kapow";

const SIGNATURE_BY_ID: Record<string, Signature> = {
  thor: "lightning",
  "thor-dark-world": "lightning",
  ragnarok: "lightning",
  "love-and-thunder": "lightning",
  avengers: "lightning",
  "iron-man": "repulsor",
  "iron-man-2": "repulsor",
  "iron-man-3": "repulsor",
  "age-of-ultron": "repulsor",
  ironheart: "repulsor",
  "incredible-hulk": "smash",
  "she-hulk": "smash",
  thunderbolts: "smash",
  "captain-america-1": "shield",
  "captain-america-2": "shield",
  "civil-war": "shield",
  "falcon-winter-soldier": "shield",
  "brave-new-world": "shield",
  homecoming: "webs",
  "far-from-home": "webs",
  "no-way-home": "webs",
  "brand-new-day": "webs",
  "doctor-strange": "mystic",
  "multiverse-of-madness": "mystic",
  "shang-chi": "mystic",
  eternals: "mystic",
  wandavision: "mystic",
  loki: "mystic",
  "agatha-all-along": "mystic",
  visionquest: "mystic",
  "ant-man": "quantum",
  "ant-man-2": "quantum",
  quantumania: "quantum",
  guardians: "cosmic",
  "guardians-2": "cosmic",
  "guardians-3": "cosmic",
  "captain-marvel": "cosmic",
  "the-marvels": "cosmic",
  "fantastic-four": "cosmic",
  "black-panther": "claws",
  "wakanda-forever": "claws",
  "deadpool-wolverine": "claws",
  daredevil: "claws",
  "daredevil-born-again": "claws",
  "infinity-war": "infinity",
  endgame: "infinity",
  doomsday: "infinity",
};

const WORDS: Record<Signature, string[]> = {
  lightning: ["KRAKOOM!", "SKRAKA-BOOM!", "BZZAKT!"],
  repulsor: ["FWOOSH!", "ZZARK!", "REPULSE!"],
  smash: ["SMASH!", "KRUNCH!", "KA-BOOM!"],
  shield: ["KLANG!", "SHWING!", "ON YOUR LEFT!"],
  webs: ["THWIP!", "THWIP THWIP!", "THWAPP!"],
  mystic: ["ZWOOM!", "SHAZAMM!", "BY THE VISHANTI!"],
  quantum: ["ZOOP!", "BLOOP!", "PYM!"],
  cosmic: ["ZWARP!", "BLAST OFF!", "WOOHOO!"],
  claws: ["SNIKT!", "SHRAKK!", "SLASH!"],
  infinity: ["*SNAP*", "ASSEMBLE!", "INEVITABLE!"],
  kapow: ["KAPOW!", "BAM!", "WHAM!", "POW!"],
};

function lightning(x: number, y: number) {
  const bolt = (x1: number, y1: number, x2: number, y2: number) => {
    let pts: [number, number][] = [
      [x1, y1],
      [x2, y2],
    ];
    let disp = Math.hypot(x2 - x1, y2 - y1) / 4;
    for (let i = 0; i < 6; i++) {
      const next: [number, number][] = [pts[0]];
      for (let j = 1; j < pts.length; j++) {
        const [ax, ay] = pts[j - 1];
        const [bx, by] = pts[j];
        next.push([(ax + bx) / 2 + rand(-disp, disp), (ay + by) / 2 + rand(-disp / 3, disp / 3)], [bx, by]);
      }
      pts = next;
      disp /= 2;
    }
    return pts;
  };
  for (let n = 0; n < 3; n++) {
    const sx = x + rand(-W * 0.35, W * 0.35);
    let pts = bolt(sx, -20, x, y);
    let regen = 0;
    add(
      (c, age, k) => {
        regen += k;
        if (regen > 4) {
          pts = bolt(sx, -20, x + rand(-6, 6), y);
          regen = 0;
        }
        const flicker = Math.random() > 0.25 ? 1 : 0.3;
        c.globalAlpha = (1 - age / 520) * flicker;
        c.globalCompositeOperation = "lighter";
        c.lineJoin = "round";
        for (const [w, col, blur] of [
          [9, "rgba(120,180,255,0.35)", 30],
          [3.5, "#bfe0ff", 14],
          [1.4, "#ffffff", 0],
        ] as const) {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.shadowColor = "#7ab8ff";
          c.shadowBlur = blur;
          c.beginPath();
          pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
          c.stroke();
        }
      },
      520,
      n * 90,
    );
  }
  whiteout(140);
  burst(x, y, { count: 60, colors: ["#bfe0ff", "#ffffff", "#7ab8ff"], speed: [4, 14], life: 900, delay: 60 });
  shake("small");
}

function repulsor(x: number, y: number) {
  const fromRight = x < W / 2;
  const sx = fromRight ? W + 20 : -20;
  const sy = H + 20;
  add((c, age) => {
    const t = age / 650;
    const grow = ease(t * 3);
    const ex = sx + (x - sx) * grow;
    const ey = sy + (y - sy) * grow;
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 1 - Math.max(0, (t - 0.45) / 0.55);
    c.lineCap = "round";
    for (const [w, col] of [
      [26, "rgba(90,200,255,0.25)"],
      [12, "rgba(150,230,255,0.7)"],
      [4, "#ffffff"],
    ] as const) {
      c.strokeStyle = col;
      c.lineWidth = w * (1 - t * 0.6);
      c.shadowColor = "#5ac8f0";
      c.shadowBlur = 30;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(ex, ey);
      c.stroke();
    }
    // the palm glow at the impact point
    const g = c.createRadialGradient(ex, ey, 0, ex, ey, 60);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(90,200,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(ex, ey, 60, 0, Math.PI * 2);
    c.fill();
  }, 650);
  burst(x, y, { count: 70, colors: ["#e0f7ff", "#5ac8f0", "#ffd166"], speed: [3, 13], life: 1000, delay: 200 });
  shockwave(x, y, "#5ac8f0", 200);
}

function smash(x: number, y: number) {
  shake("big");
  const cracks = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2);
    const pts: [number, number][] = [[x, y]];
    let cx = x;
    let cy = y;
    const len = rand(120, 260);
    for (let d = 0; d < len; d += 22) {
      cx += Math.cos(a + rand(-0.5, 0.5)) * 22;
      cy += Math.sin(a + rand(-0.5, 0.5)) * 22;
      pts.push([cx, cy]);
    }
    return pts;
  });
  add((c, age) => {
    const grow = ease(age / 250);
    c.globalAlpha = 1 - Math.max(0, (age - 700) / 500);
    c.strokeStyle = "#7dff6a";
    c.shadowColor = "#4ed13c";
    c.shadowBlur = 16;
    c.lineWidth = 3;
    for (const pts of cracks) {
      const n = Math.max(2, Math.floor(pts.length * grow));
      c.beginPath();
      pts.slice(0, n).forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
      c.stroke();
    }
  }, 1200);
  burst(x, y, { count: 50, colors: ["#4ed13c", "#a6ff9a", "#6b5a3a", "#3a3020"], speed: [4, 13], gravity: 0.45, life: 1300, kind: "confetti", size: [3, 7] });
  shockwave(x, y, "#4ed13c", 0, 340);
  shockwave(x, y, "#a6ff9a", 120, 220);
}

function shield(x: number, y: number) {
  const leftToRight = Math.random() > 0.5;
  const sx = leftToRight ? -80 : W + 80;
  const ex = leftToRight ? W + 80 : -80;
  const R = 34;
  add((c, age) => {
    const t = age / 1000;
    // pass through the tile at t=0.5
    const px = t < 0.5 ? sx + (x - sx) * t * 2 : x + (ex - x) * (t - 0.5) * 2;
    const u = (t - 0.5) * 2;
    const py = y + 140 * u * u; // swoops through the tile at t=0.5
    c.translate(px, py);
    c.rotate(age / 40);
    c.shadowColor = "rgba(0,0,0,0.6)";
    c.shadowBlur = 12;
    for (const [r, col] of [
      [R, "#c01218"],
      [R * 0.78, "#f2f2f2"],
      [R * 0.56, "#c01218"],
      [R * 0.36, "#1c4f8a"],
    ] as const) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
    }
    c.shadowBlur = 0;
    c.fillStyle = "#ffffff";
    starPath(c, R * 0.33, R * 0.13, 5);
    c.fill();
  }, 1000);
  // ricochet sparks when it clips the tile
  burst(x, y, { count: 40, colors: ["#ffffff", "#ffd166", "#c01218", "#4d84c4"], speed: [3, 11], life: 900, delay: 480 });
  shockwave(x, y, "#4d84c4", 480);
}

function webs(x: number, y: number) {
  const strands = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + rand(-0.15, 0.15);
    const len = rand(Math.max(W, H) * 0.4, Math.max(W, H) * 0.8);
    return { a, len };
  });
  add((c, age) => {
    const grow = ease(age / 280);
    c.globalAlpha = 1 - Math.max(0, (age - 900) / 500);
    c.strokeStyle = "rgba(255,255,255,0.85)";
    c.lineWidth = 1.6;
    c.shadowColor = "#ffffff";
    c.shadowBlur = 6;
    for (const s of strands) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(s.a) * s.len * grow, y + Math.sin(s.a) * s.len * grow);
      c.stroke();
    }
    // the cross threads, drawn as sagging arcs between neighbours
    for (let ring = 1; ring <= 6; ring++) {
      const r = ring * 42 * grow;
      c.beginPath();
      strands.forEach((s, i) => {
        const n = strands[(i + 1) % strands.length];
        const ax = x + Math.cos(s.a) * r;
        const ay = y + Math.sin(s.a) * r;
        const bx = x + Math.cos(n.a) * r;
        const by = y + Math.sin(n.a) * r;
        const mid = (s.a + n.a + (n.a < s.a ? Math.PI * 2 : 0)) / 2;
        const sag = r * 0.82;
        if (i === 0) c.moveTo(ax, ay);
        c.quadraticCurveTo(x + Math.cos(mid) * sag, y + Math.sin(mid) * sag, bx, by);
      });
      c.stroke();
    }
  }, 1400);
  burst(x, y, { count: 30, colors: ["#ffffff", "#ec1d24", "#1c4f8a"], speed: [3, 9], life: 800 });
}

function mystic(x: number, y: number) {
  add((c, age) => {
    const t = age / 1500;
    const r = 50 + ease(t * 2) * 70;
    c.globalAlpha = 1 - Math.max(0, (t - 0.6) / 0.4);
    c.globalCompositeOperation = "lighter";
    c.translate(x, y);
    c.shadowColor = "#f0a030";
    c.shadowBlur = 18;
    for (const [rr, dir, ticks] of [
      [r, 1, 36],
      [r * 0.72, -1.6, 24],
      [r * 0.45, 2.4, 8],
    ] as const) {
      c.save();
      c.rotate((age / 600) * dir);
      c.strokeStyle = "#ffb347";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 0, rr, 0, Math.PI * 2);
      c.stroke();
      // rune ticks + sparks spinning off the rim
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        c.lineTo(Math.cos(a) * (rr + 8), Math.sin(a) * (rr + 8));
        c.stroke();
        if (Math.random() < 0.12) {
          c.fillStyle = "#ffe9c4";
          c.fillRect(Math.cos(a) * rr + rand(-4, 4), Math.sin(a) * rr + rand(-4, 4), 2, 2);
        }
      }
      c.restore();
    }
    // inner square sigil
    c.rotate(-age / 900);
    c.strokeStyle = "#ffd28a";
    c.lineWidth = 1.5;
    c.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
    c.rotate(Math.PI / 4);
    c.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
  }, 1500);
  burst(x, y, { count: 60, colors: ["#ffb347", "#ffe9c4", "#f0a030"], speed: [1, 6], gravity: -0.02, drag: 0.97, life: 1500 });
}

function quantum(x: number, y: number, tile: HTMLElement | null) {
  pulseClass(tile, "fx-shrink");
  for (let i = 0; i < 5; i++) {
    add(
      (c, age) => {
        const t = age / 600;
        c.globalAlpha = t;
        c.strokeStyle = i % 2 ? "#f060d0" : "#40c8ff";
        c.lineWidth = 3;
        c.shadowColor = c.strokeStyle;
        c.shadowBlur = 16;
        c.beginPath();
        c.arc(x, y, (1 - ease(t)) * 220 + 4, 0, Math.PI * 2);
        c.stroke();
      },
      600,
      i * 70,
    );
  }
  burst(x, y, { count: 80, colors: ["#f060d0", "#40c8ff", "#ffe0f8", "#b040e8"], speed: [5, 15], life: 1100, delay: 650 });
  shockwave(x, y, "#f060d0", 650);
}

function cosmic(x: number, y: number) {
  const cx = W / 2;
  const cy = H / 2;
  const streaks = Array.from({ length: 140 }, () => ({
    a: rand(0, Math.PI * 2),
    d: rand(10, 200),
    v: rand(4, 12),
    col: pick(["#ffe95e", "#ff9040", "#f03e8a", "#8a2bd4", "#5ac8f0", "#ffffff"]),
  }));
  add((c, age, k) => {
    c.globalAlpha = 1 - Math.max(0, (age - 700) / 500);
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    for (const s of streaks) {
      s.v *= Math.pow(1.06, k);
      s.d += s.v * k;
      const len = s.v * 3;
      c.strokeStyle = s.col;
      c.lineWidth = 1.5 + s.d / 400;
      c.beginPath();
      c.moveTo(cx + Math.cos(s.a) * s.d, cy + Math.sin(s.a) * s.d);
      c.lineTo(cx + Math.cos(s.a) * (s.d + len), cy + Math.sin(s.a) * (s.d + len));
      c.stroke();
    }
  }, 1200);
  burst(x, y, { count: 50, colors: ["#ffe95e", "#f03e8a", "#5ac8f0", "#ffffff"], speed: [2, 10], life: 1200, kind: "star", size: [3, 6], gravity: 0.08 });
}

function claws(x: number, y: number, color: string) {
  const len = Math.min(W, 520);
  for (let i = 0; i < 3; i++) {
    add(
      (c, age) => {
        const t = age / 700;
        const draw = ease(t * 3);
        const off = (i - 1) * 34;
        const ax = x - len / 2 + off;
        const ay = y - len / 3 - off * 0.2;
        const bx = ax + len * draw;
        const by = ay + (len * 2) / 3 * draw;
        c.globalAlpha = 1 - Math.max(0, (t - 0.4) / 0.6);
        c.globalCompositeOperation = "lighter";
        c.strokeStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 24;
        c.lineCap = "round";
        c.lineWidth = 7 * (1 - t) + 1;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2;
        c.stroke();
      },
      700,
      i * 70,
    );
  }
  burst(x, y, { count: 50, colors: [color, "#ffffff"], speed: [4, 12], life: 900, delay: 150, angle: [-Math.PI * 0.1, Math.PI * 0.6] });
  shake("small");
}

const STONES = ["#3b6cff", "#ff2d2d", "#a24bff", "#ffd400", "#ff8a00", "#22e06b"];

function infinity(x: number, y: number) {
  const dur = 1400;
  add((c, age) => {
    const t = age / dur;
    const r = 140 * (1 - ease(Math.max(0, (t - 0.35) / 0.4)));
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
    STONES.forEach((col, i) => {
      const a = (i / STONES.length) * Math.PI * 2 + age / 220;
      const sx = x + Math.cos(a) * r;
      const sy = y + Math.sin(a) * r * 0.55;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, 22);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, col);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx, sy, 22, 0, Math.PI * 2);
      c.fill();
    });
  }, dur);
  // the snap
  setTimeout(() => {
    whiteout(260);
    shake("big");
  }, dur * 0.75);
  burst(x, y, { count: 120, colors: STONES.concat("#ffffff"), speed: [5, 18], life: 1500, delay: dur * 0.75 });
  shockwave(x, y, "#ffd400", dur * 0.75, 420);
  shockwave(x, y, "#a24bff", dur * 0.75 + 120, 300);
}

function kapow(x: number, y: number, color: string) {
  burst(x, y, { count: 40, colors: [color, "#ffffff", "#ffd166"], speed: [3, 10], life: 1000, kind: "star", size: [3, 6], gravity: 0.1 });
  shockwave(x, y, color, 0, 200);
}

/* ------------------------------------------------------------------ */
/* DOM overlays                                                        */
/* ------------------------------------------------------------------ */

function comicWord(x: number, y: number, word: string, color: string) {
  const el = document.createElement("div");
  el.className = "fx-pow";
  el.textContent = word;
  el.style.left = `${Math.min(W - 90, Math.max(90, x))}px`;
  el.style.top = `${Math.max(70, y - 70)}px`;
  el.style.setProperty("--pow-color", color);
  el.style.setProperty("--pow-tilt", `${rand(-14, 14).toFixed(1)}deg`);
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function xpToast(text: string, color: string) {
  const fill = document.querySelector(".progress-fill");
  pulseClass(fill, "fx-surge");
  const r = fill?.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "fx-xp";
  el.textContent = text;
  el.style.setProperty("--xp-color", color);
  if (r && r.bottom > 0) {
    el.style.left = `${Math.min(window.innerWidth - 80, Math.max(80, r.right))}px`;
    el.style.top = `${r.bottom + 8}px`;
  } else {
    el.style.left = "50%";
    el.style.top = "16px";
  }
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

let comboTimes: number[] = [];
let comboEl: HTMLDivElement | null = null;
let comboTimer: ReturnType<typeof setTimeout> | undefined;

function combo() {
  const now = Date.now();
  comboTimes = comboTimes.filter((t) => now - t < 12_000).concat(now);
  const n = comboTimes.length;
  if (n < 2) return n;
  if (!comboEl) {
    comboEl = document.createElement("div");
    comboEl.className = "fx-combo";
    document.body.appendChild(comboEl);
  }
  const label = n >= 5 ? "ALL-NIGHTER" : n >= 4 ? "MARATHON" : n >= 3 ? "TRIPLE FEATURE" : "DOUBLE FEATURE";
  comboEl.innerHTML = `<span class="fx-combo-n">×${n}</span><span class="fx-combo-label">${label}</span>`;
  pulseClass(comboEl, "bump");
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    comboEl?.classList.add("out");
    setTimeout(() => {
      comboEl?.remove();
      comboEl = null;
    }, 400);
  }, 4000);
  return n;
}

function milestoneBanner(title: string, sub: string, color: string) {
  const el = document.createElement("div");
  el.className = "fx-milestone";
  el.style.setProperty("--ms-color", color);
  el.innerHTML = `<div class="fx-ms-title"></div><div class="fx-ms-sub"></div>`;
  (el.firstElementChild as HTMLElement).textContent = title;
  (el.lastElementChild as HTMLElement).textContent = sub;
  document.body.appendChild(el);
  el.addEventListener("animationend", (ev) => ev.target === el && el.remove());
}

function staticToast(text: string) {
  const el = document.createElement("div");
  el.className = "fx-static-toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

const MILESTONES: [number, string, string][] = [
  [0.25, "QUARTER WAY THERE", "The multiverse is starting to notice"],
  [0.5, "HALFWAY TO DOOMSDAY", "Whatever it takes"],
  [0.75, "THREE QUARTERS DOWN", "The endgame is near"],
  [1, "READY FOR DOOMSDAY", "Every movie watched. Assemble."],
];

export interface CheckOffInfo {
  entry: Entry;
  origin?: Element | null;
  /** counted movies watched before / after this toggle */
  before: number;
  after: number;
  total: number;
  /** true when a phase-boss victory splash is also going off */
  bossKill?: boolean;
}

function originPoint(entry: Entry, origin?: Element | null) {
  const el = origin ?? document.querySelector(`[data-entry-id="${entry.id}"]`);
  const r = el?.getBoundingClientRect();
  if (r && r.bottom > 0 && r.top < window.innerHeight) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Everything that goes off when a title is marked watched. */
export function checkOffFx({ entry, origin, before, after, total, bossKill }: CheckOffInfo) {
  const isMovie = entry.type === "movie" && entry.id !== "doomsday";
  const left = total - after;

  if (prefersReducedMotion()) {
    staticToast(isMovie ? `✓ ${entry.title} · ${left} to go` : `✓ ${entry.title}`);
    return;
  }

  // make sure the canvas has dimensions before anything reads W/H
  W = window.innerWidth;
  H = window.innerHeight;

  const { x, y } = originPoint(entry, origin);
  const color = entry.wm.aura;
  const tile = document.querySelector<HTMLElement>(`[data-entry-id="${entry.id}"]`);
  pulseClass(tile, "fx-hit");

  const sig = SIGNATURE_BY_ID[entry.id] ?? "kapow";
  switch (sig) {
    case "lightning": lightning(x, y); break;
    case "repulsor": repulsor(x, y); break;
    case "smash": smash(x, y); break;
    case "shield": shield(x, y); break;
    case "webs": webs(x, y); break;
    case "mystic": mystic(x, y); break;
    case "quantum": quantum(x, y, tile); break;
    case "cosmic": cosmic(x, y); break;
    case "claws": claws(x, y, color); break;
    case "infinity": infinity(x, y); break;
    default: kapow(x, y, color);
  }

  // universal layer: aura flash, sparks in the title's colour, comic word, confetti
  flash(color);
  burst(x, y, { count: 90, colors: [color, "#ffffff", "#e8b64c"], speed: [2, 12], life: 1300, kind: "confetti", gravity: 0.25, size: [3, 6], angle: [-Math.PI * 0.95, -Math.PI * 0.05] });
  comicWord(x, y, pick(WORDS[sig]), color);
  if (!bossKill) confettiRain([color, "#ffffff", "#e8b64c", "#ec1d24"], 90);

  if (isMovie) xpToast(left > 0 ? `+1 · ${left} to go` : "ALL CAUGHT UP", color);

  const n = combo();
  if (n >= 3) fireworks(Math.min(n, 6) - 1, [color, "#e8b64c", "#ffffff"]);

  // crossing a milestone gets the big show
  if (isMovie && total > 0) {
    const crossed = MILESTONES.filter(([p]) => before / total < p && after / total >= p).pop();
    if (crossed) {
      setTimeout(() => {
        milestoneBanner(crossed[1], crossed[2], crossed[0] === 1 ? "#3dff6e" : "#e8b64c");
        fireworks(crossed[0] === 1 ? 10 : 5, ["#e8b64c", "#ec1d24", "#5ac8f0", "#3dff6e", "#ffffff"]);
        confettiRain(["#e8b64c", "#ec1d24", "#ffffff", "#5ac8f0"], 200);
      }, bossKill ? 2600 : 900);
    }
  }
}

/** Smaller Time Stone "rewind" when something gets unchecked. */
export function uncheckFx(entry: Entry, origin?: Element | null) {
  if (prefersReducedMotion()) return;
  W = window.innerWidth;
  H = window.innerHeight;
  const { x, y } = originPoint(entry, origin);
  add((c, age) => {
    const t = age / 700;
    c.globalAlpha = 1 - t;
    c.translate(x, y);
    c.rotate(-age / 120);
    c.strokeStyle = "#22e06b";
    c.shadowColor = "#22e06b";
    c.shadowBlur = 14;
    c.lineWidth = 2.5;
    const r = 70 * (1 - ease(t)) + 10;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 1.6);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.6, Math.PI, Math.PI * 2.4);
    c.stroke();
  }, 700);
}
