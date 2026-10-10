"use client";

import { useEffect, useRef } from "react";

/**
 * "Mission Control" background — four fixed tint layers (steel → infinity
 * red → multiverse violet → doom green) cross-faded by scroll progress, a
 * holographic grid, scanlines, a slow radar sweep and a sparse data-mote
 * canvas. rAF-throttled, paused when the tab is hidden, static under
 * prefers-reduced-motion.
 */

const LAYERS = [
  { stop: 0.0, bg: "radial-gradient(110% 80% at 50% 10%, #0a1a2c 0%, #060d18 45%, #04070d 100%)" }, // steel / stark
  { stop: 0.38, bg: "radial-gradient(110% 80% at 50% 30%, #2a0a14 0%, #14060c 45%, #04070d 100%)" }, // infinity red
  { stop: 0.7, bg: "radial-gradient(110% 80% at 50% 50%, #180a30 0%, #0c061e 45%, #04070d 100%)" }, // multiverse violet
  { stop: 1.0, bg: "radial-gradient(110% 90% at 50% 85%, #06301a 0%, #04180e 45%, #04070d 100%)" }, // doom green
];

export default function SagaBackground() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // scroll-driven cross-fade
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      LAYERS.forEach((layer, i) => {
        const el = refs.current[i];
        if (!el) return;
        const dist = Math.abs(p - layer.stop);
        el.style.opacity = String(Math.max(0, 1 - dist * 2.6));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // data motes — tiny cyan squares drifting upward, flickering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const parts = Array.from({ length: 34 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1400,
      s: 1 + Math.random() * 1.6,
      vy: 0.08 + Math.random() * 0.28,
      vx: (Math.random() - 0.5) * 0.1,
      a: 0.08 + Math.random() * 0.3,
      tw: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let running = true;
    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += 0.03;
        if (p.y < -4) {
          p.y = H + 4;
          p.x = Math.random() * W;
        }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;
        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.tw));
        ctx.fillStyle = `rgba(120, 225, 255, ${alpha})`;
        ctx.fillRect(p.x % (W + 8), p.y, p.s, p.s);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      {LAYERS.map((layer, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="saga-layer"
          style={{ backgroundImage: layer.bg, opacity: i === 0 ? 1 : 0 }}
        />
      ))}
      <div className="hud-grid" />
      <div className="hud-scanlines" />
      <div className="hud-sweep" />
      <div className="vignette" />
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, opacity: 0.8 }}
      />
      <div className="hud-corner bl" aria-hidden="true">
        SYS // MISSION CONTROL
        <br />
        UPLINK: TMDB · SECURE
      </div>
      <div className="hud-corner br" aria-hidden="true">
        TARGET: AVENGERS DOOMSDAY
        <br />
        2026.12.18
      </div>
    </>
  );
}
