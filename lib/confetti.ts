"use client";

/** Tiny dependency-free confetti + screen-edge flash for "marked watched". */

export function celebrate(color: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  screenFlash(color);
  confettiBurst(color);
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
      <div class="pv-phase">${phaseLabel} // sector cleared</div>
      <div class="pv-boss">${bossName}<span class="pv-slash"></span></div>
      <div class="pv-defeated">Neutralized</div>
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

  const palette = [color, "#ffffff", "#e8b64c", color];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const parts = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.45,
    vx: (Math.random() - 0.5) * 14,
    vy: -6 - Math.random() * 10,
    size: 4 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: palette[Math.floor(Math.random() * palette.length)],
    shape: Math.random() > 0.5 ? "rect" : "circle",
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
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
