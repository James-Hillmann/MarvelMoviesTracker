"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  /** art-pixel width the image is shrunk to before being blown back up */
  pixels: number;
  /** output aspect (w / h); the image is cover-cropped to it */
  aspect?: number;
  /** colour levels per channel — lower is more 16-bit */
  levels?: number;
  className?: string;
  alt?: string;
}

function load(src: string, cors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draws any image (TMDB posters, cast photos, boss renders) at a tiny
 * resolution and scales it up with nearest-neighbour, optionally posterizing
 * the palette, so photos read as 16-bit cartridge art.
 */
export default function PixelImage({ src, pixels, aspect, levels = 6, className = "", alt = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      let img: HTMLImageElement;
      let readable = true;
      try {
        img = await load(src, true);
      } catch {
        // host without CORS headers — still drawable, just not posterizable
        readable = false;
        try {
          img = await load(src, false);
        } catch {
          return;
        }
      }
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const ar = aspect ?? img.naturalWidth / img.naturalHeight;
      const w = pixels;
      const h = Math.max(1, Math.round(pixels / ar));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // cover-crop the source to the target aspect
      const srcAr = img.naturalWidth / img.naturalHeight;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (srcAr > ar) sw = sh * ar;
      else sh = sw / ar;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      if (readable && levels > 0) {
        try {
          const data = ctx.getImageData(0, 0, w, h);
          const step = 255 / (levels - 1);
          const d = data.data;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.round(d[i] / step) * step;
            d[i + 1] = Math.round(d[i + 1] / step) * step;
            d[i + 2] = Math.round(d[i + 2] / step) * step;
            d[i + 3] = d[i + 3] < 110 ? 0 : 255; // hard alpha edge, no soft fringe
          }
          ctx.putImageData(data, 0, 0);
        } catch {
          /* tainted canvas — keep the plain pixelation */
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [src, pixels, aspect, levels]);

  return (
    <canvas
      ref={ref}
      className={`pixel-img ${ready ? "ready" : ""} ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    />
  );
}
