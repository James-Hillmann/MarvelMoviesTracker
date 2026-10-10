"use client";

import { RefObject, useEffect, useState } from "react";

interface Box {
  /** center */
  x: number;
  y: number;
  /** half extents */
  hw: number;
  hh: number;
}

interface Props {
  /** container the SVG overlays (position: relative) */
  containerRef: RefObject<HTMLElement | null>;
  /** id -> cell element */
  cellRefs: RefObject<Map<string, HTMLElement>>;
  /** entry ids in trail order */
  order: string[];
  /** ids that are watched — segment leaving a watched cell turns green */
  watched: Record<string, number>;
  /** bump to force re-measure (e.g. order-mode change) */
  layoutKey: string;
}

/**
 * One continuous arrow trail through the board, drawn as per-pair segments so
 * completed stretches can glow green independently.  Segments use
 * pathLength=1 so the draw-in animation needs no length measuring.
 */
export default function ArrowPath({ containerRef, cellRefs, order, watched, layoutKey }: Props) {
  const [points, setPoints] = useState<Record<string, Box>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const cRect = container.getBoundingClientRect();
      const next: Record<string, Box> = {};
      for (const id of order) {
        const el = cellRefs.current?.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        next[id] = {
          x: r.left + r.width / 2 - cRect.left,
          y: r.top + r.height / 2 - cRect.top,
          hw: r.width / 2,
          hh: r.height / 2,
        };
      }
      setPoints(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    // fonts loading can shift layout
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, order.join(","), containerRef, cellRefs]);

  const segs: { d: string; done: boolean; key: string }[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const a = points[order[i]];
    const b = points[order[i + 1]];
    if (!a || !b) continue;
    const done = Boolean(watched[order[i]]);
    let d: string;
    const gap = 7;
    if (Math.abs(a.y - b.y) < 6) {
      // same row — straight arrow through the gutter between the two posters
      const dir = Math.sign(b.x - a.x) || 1;
      d = `M ${a.x + (a.hw + gap) * dir} ${a.y} L ${b.x - (b.hw + gap) * dir} ${b.y}`;
    } else {
      // row wrap — S-curve from under one poster to the top of the next
      const y1 = a.y + a.hh + gap;
      const y2 = b.y - b.hh - gap;
      const bend = Math.max(18, (y2 - y1) * 0.6);
      d = `M ${a.x} ${y1} C ${a.x} ${y1 + bend}, ${b.x} ${y2 - bend}, ${b.x} ${y2}`;
    }
    segs.push({ d, done, key: `${order[i]}->${order[i + 1]}:${done}` });
  }

  let doneIdx = 0;
  return (
    <svg className="trail-svg" aria-hidden="true">
      <defs>
        <marker id="arrow-grey" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(255,255,255,0.35)" />
        </marker>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#35e06a" />
        </marker>
      </defs>
      {segs.map((s) => {
        const delay = s.done ? `${Math.min(doneIdx++ * 0.045, 1.2)}s` : "0s";
        return (
          <path
            key={s.key}
            d={s.d}
            pathLength={1}
            className={`trail-seg ${s.done ? "done fresh" : ""}`}
            style={s.done ? ({ "--seg-len": 1, animationDelay: delay } as React.CSSProperties) : undefined}
            markerEnd={`url(#${s.done ? "arrow-green" : "arrow-grey"})`}
          />
        );
      })}
    </svg>
  );
}
