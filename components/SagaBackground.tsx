"use client";

import { useEffect, useRef } from "react";

/**
 * "Saga Eras" background — four fixed gradient layers (gold → red → purple →
 * doom green) cross-faded by scroll progress, plus film grain and a
 * vignette.  Nothing here animates on its own: a full-screen layer that
 * changes every frame makes big monitors recomposite the whole page.
 */

const LAYERS = [
  { stop: 0.0, bg: "radial-gradient(110% 80% at 50% 10%, #2a1f08 0%, #120d04 45%, #050508 100%)" }, // gold era
  { stop: 0.38, bg: "radial-gradient(110% 80% at 50% 30%, #2c0a10 0%, #16060a 45%, #050508 100%)" }, // infinity red
  { stop: 0.7, bg: "radial-gradient(110% 80% at 50% 50%, #1c0a34 0%, #0e0620 45%, #050508 100%)" }, // multiverse purple
  { stop: 1.0, bg: "radial-gradient(110% 90% at 50% 85%, #06301a 0%, #04180e 45%, #050508 100%)" }, // doom green
];

/** baked into each era layer rather than its own full-screen layer — one less to composite */
const VIGNETTE =
  "radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(0, 0, 0, 0.7) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 12%, transparent 88%, rgba(0, 0, 0, 0.45))";

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
        const op = Math.max(0, 1 - dist * 2.6);
        el.style.opacity = String(op);
        // a hidden layer costs nothing to composite; an opacity-0 one still might
        el.style.visibility = op > 0 ? "visible" : "hidden";
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
          style={{ backgroundImage: `${VIGNETTE}, ${layer.bg}`, opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
        />
      ))}
      <div className="grain" />
    </>
  );
}
