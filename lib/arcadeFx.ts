"use client";

/**
 * Arcade feedback, built straight on the DOM so it can fire from any handler:
 * chunky pixel bursts, floating score pops, and the full-screen K.O. splash
 * when a phase boss goes down.
 */

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface Origin {
  x: number;
  y: number;
}

export function originOf(el: Element | null | undefined): Origin {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** square particles on a 4px grid, no anti-aliasing, gravity + bounce-free fall */
export function pixelBurst(color: string, origin?: Origin, count = 70) {
  if (reduced()) return;
  const PX = 4;
  const W = Math.ceil(window.innerWidth / PX);
  const H = Math.ceil(window.innerHeight / PX);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.className = "fx-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.imageSmoothingEnabled = false;

  const o = origin ?? originOf(null);
  const palette = [color, "#ffffff", "#ffd84a", color, "#ff5aa0"];
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = 0.8 + Math.random() * 2.6;
    return {
      x: o.x / PX,
      y: o.y / PX,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1.6,
      size: Math.random() > 0.75 ? 2 : 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 26 + Math.random() * 22,
    };
  });

  let frame = 0;
  // step at ~30fps for that choppy console cadence
  const timer = setInterval(() => {
    frame++;
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (const p of parts) {
      if (frame > p.life) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;
      p.vx *= 0.97;
      // flicker out over the last few frames
      if (p.life - frame < 6 && frame % 2) continue;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    if (!alive) {
      clearInterval(timer);
      canvas.remove();
    }
  }, 33);
}

/** "+1000" style floating text */
export function scorePop(text: string, origin?: Origin, color = "#ffd84a") {
  const o = origin ?? originOf(null);
  const el = document.createElement("div");
  el.className = "fx-score";
  el.textContent = text;
  el.style.left = `${o.x}px`;
  el.style.top = `${o.y}px`;
  el.style.setProperty("--pop-color", color);
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
  if (reduced()) setTimeout(() => el.remove(), 900);
}

/** quick white frame flash, like a hit on an old CRT */
export function screenFlash(color = "#ffffff") {
  if (reduced()) return;
  const el = document.createElement("div");
  el.className = "fx-flash";
  el.style.setProperty("--flash-color", color);
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function pixelateInto(canvas: HTMLCanvasElement, src: string, px: number) {
  const img = new Image();
  img.onload = () => {
    const w = px;
    const h = Math.round((px * img.naturalHeight) / img.naturalWidth);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    try {
      const data = ctx.getImageData(0, 0, w, h);
      const d = data.data;
      const step = 255 / 5;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / step) * step;
        d[i + 1] = Math.round(d[i + 1] / step) * step;
        d[i + 2] = Math.round(d[i + 2] / step) * step;
        d[i + 3] = d[i + 3] < 110 ? 0 : 255;
      }
      ctx.putImageData(data, 0, 0);
    } catch {
      /* fine without posterize */
    }
    canvas.classList.add("ready");
  };
  img.src = src;
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** Full-screen "K.O.!" splash for finishing every movie in a phase. */
export function bossKO(opts: { world: number; phaseLabel: string; bossName: string; quip: string; color: string; img?: string }) {
  const { world, phaseLabel, bossName, quip, color, img } = opts;
  screenFlash("#ffffff");
  pixelBurst(color, undefined, 140);
  setTimeout(() => pixelBurst("#ffd84a", undefined, 90), 380);

  const overlay = document.createElement("div");
  overlay.className = `ko-overlay ${reduced() ? "still" : ""}`;
  overlay.style.setProperty("--ko-color", color);
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-label", `${bossName} defeated`);
  overlay.innerHTML = `
    <div class="ko-inner">
      <div class="ko-world">WORLD ${world} CLEAR</div>
      <div class="ko-stage">
        ${img ? `<canvas class="ko-boss pixel-img"></canvas>` : ""}
        <div class="ko-text">K.O.!</div>
      </div>
      <div class="ko-name">${esc(bossName.toUpperCase())} DEFEATED</div>
      <div class="ko-phase">${esc(phaseLabel)} · +5000 PTS</div>
      <div class="ko-dialog"><span class="ko-quip"></span><span class="ko-caret">▼</span></div>
      <div class="ko-hint">PRESS ANY KEY</div>
    </div>`;
  document.body.appendChild(overlay);

  const bossCanvas = overlay.querySelector<HTMLCanvasElement>(".ko-boss");
  if (bossCanvas && img) pixelateInto(bossCanvas, img, 56);

  // typewriter quip
  const quipEl = overlay.querySelector<HTMLElement>(".ko-quip");
  const line = `“${quip}”`;
  let i = 0;
  const typer = setInterval(() => {
    if (!quipEl) return clearInterval(typer);
    i++;
    quipEl.textContent = line.slice(0, i);
    if (i >= line.length) clearInterval(typer);
  }, reduced() ? 0 : 45);

  const close = () => {
    clearInterval(typer);
    clearTimeout(auto);
    window.removeEventListener("keydown", close);
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 260);
  };
  const auto = setTimeout(close, 6500);
  // give the slam a beat before input can dismiss it
  setTimeout(() => {
    overlay.addEventListener("click", close);
    window.addEventListener("keydown", close);
  }, 600);
}
