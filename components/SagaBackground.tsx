"use client";

import { useEffect, useRef } from "react";

/**
 * "Saga Eras" background — four fixed newsprint layers whose Ben-Day dot
 * ink shifts gold → red → purple → doom green, cross-faded by scroll
 * progress, plus paper grain and an aged-edge vignette.  rAF-throttled.
 */

const dots = (rgba: string, paper: string) =>
  `radial-gradient(circle, ${rgba} 1.5px, transparent 2.1px) 0 0 / 15px 15px, ` +
  `radial-gradient(circle, ${rgba} 1.5px, transparent 2.1px) 7.5px 7.5px / 15px 15px, ${paper}`;

const LAYERS = [
  { stop: 0.0, bg: dots("rgba(232, 182, 76, 0.28)", "#f7f0dc") }, // gold era
  { stop: 0.38, bg: dots("rgba(230, 36, 41, 0.16)", "#f8ede0") }, // infinity red
  { stop: 0.7, bg: dots("rgba(138, 43, 212, 0.14)", "#f2ecf0") }, // multiverse purple
  { stop: 1.0, bg: dots("rgba(43, 212, 86, 0.2)", "#ecf3e2") }, // doom green
];

export default function SagaBackground() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <>
      {LAYERS.map((layer, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="saga-layer"
          style={{ background: layer.bg, opacity: i === 0 ? 1 : 0 }}
        />
      ))}
      <div className="halftone" />
      <div className="vignette" />
    </>
  );
}
