"use client";

import { burstPoints, randomSfx } from "./comic";

/**
 * Tiny dependency-free comic celebrations: a KA-POW! sound-effect burst,
 * an impact frame and a shower of Ben-Day dots + stars for "marked watched".
 */

const POP_OUTER = burstPoints(16, 0.62, 11);
const POP_INNER = burstPoints(16, 0.62, 11)
  .split(" ")
  .map((p) => p.split(",").map((n) => (50 + (Number(n) - 50) * 0.78).toFixed(1)).join(","))
  .join(" ");
const DEFEAT_BURST = burstPoints(20, 0.78, 4);

export function celebrate(color: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  screenFlash(color);
  soundEffect(color);
  confettiBurst(color);
}

/** big onomatopoeia that slams onto the page, then blows away */
function soundEffect(color: string) {
  const el = document.createElement("div");
  el.className = "kapow";
  el.style.setProperty("--kp-color", color);
  el.innerHTML = `
    <div class="kp-lines"></div>
    <div class="kp-burst">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="outer" points="${POP_OUTER}" />
        <polygon class="inner" points="${POP_INNER}" />
      </svg>
      <span class="kp-word">${randomSfx()}</span>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/** Full-screen "boss defeated" splash for completing a phase. */
export function phaseVictory(phaseLabel: string, bossName: string, quip: string, color: string, img?: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  screenFlash(color);
  confettiBurst(color);
  // second wave, slightly delayed, so it reads bigger than a normal watch
  setTimeout(() => confettiBurst(color), 350);

  const overlay = document.createElement("div");
  overlay.className = "phase-victory";
  overlay.style.setProperty("--victory-color", color);
  overlay.innerHTML = `
    <div class="pv-inner">
      ${img ? `<img class="pv-img" src="${img}" alt="">` : ""}
      <div class="pv-phase">${phaseLabel} — Complete!</div>
      <div class="pv-boss">${bossName}<span class="pv-slash"></span></div>
      <div class="pv-defeated">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${DEFEAT_BURST}" /></svg>
        <span>Defeated!</span>
      </div>
      <div class="pv-quip">&ldquo;${quip}&rdquo;</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("animationend", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
}

function screenFlash(color: string) {
  const el = document.createElement("div");
  el.className = "screen-flash";
  el.style.setProperty("--flash-color", color);
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function confettiBurst(color: string) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:70";
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const palette = [color, "#ffd23f", "#e62429", "#2a5bd7", color];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const parts = Array.from({ length: 110 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.45,
    vx: (Math.random() - 0.5) * 14,
    vy: -6 - Math.random() * 10,
    size: 4 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: palette[Math.floor(Math.random() * palette.length)],
    shape: Math.random() > 0.55 ? "star" : "dot",
  }));

  const start = performance.now();
  const DURATION = 1800;

  function frame(t: number) {
    const elapsed = t - start;
    if (elapsed > DURATION || !ctx) return canvas.remove();
    ctx.clearRect(0, 0, W, H);
    const fade = 1 - Math.max(0, (elapsed - DURATION * 0.6) / (DURATION * 0.4));
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "#141414";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (p.shape === "star") {
        const r = p.size * 0.9;
        for (let k = 0; k < 10; k++) {
          const rr = k % 2 === 0 ? r : r * 0.45;
          const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
          if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, p.size / 1.8, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
