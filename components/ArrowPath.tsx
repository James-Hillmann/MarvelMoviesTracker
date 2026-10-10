"use client";

import { RefObject, useEffect, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Props {
  /** container the SVG overlays (position: relative) */
  containerRef: RefObject<HTMLElement | null>;
  /** id -> cell element */
  cellRefs: RefObject<Map<string, HTMLElement>>;
  /** entry ids in trail order */
  order: string[];
  /** ids that are watched — segment leaving a watched cell lights up */
  watched: Record<string, number>;
  /** bump to force re-measure (e.g. order-mode change) */
  layoutKey: string;
}

/**
 * One continuous flight path through the board, drawn as per-pair segments so
 * completed stretches can glow independently, with a waypoint node where the
 * path enters each cell. Segments use pathLength=1 so the draw-in animation
 * needs no length measuring.
 */
export default function ArrowPath({ containerRef, cellRefs, order, watched, layoutKey }: Props) {
  const [points, setPoints] = useState<Record<string, Point>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const cRect = container.getBoundingClientRect();
      const next: Record<string, Point> = {};
      for (const id of order) {
        const el = cellRefs.current?.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        next[id] = { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
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

  const segs: { d: string; done: boolean; key: string; node: Point }[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const a = points[order[i]];
    const b = points[order[i + 1]];
    if (!a || !b) continue;
    const done = Boolean(watched[order[i]]);
    let d: string;
    let node: Point;
    if (Math.abs(a.y - b.y) < 6) {
      // same row — straight run, trimmed clear of the wordmarks
      const dir = Math.sign(b.x - a.x) || 1;
      const trim = Math.min(Math.abs(b.x - a.x) * 0.32, 70);
      d = `M ${a.x + trim * dir} ${a.y} L ${b.x - trim * dir} ${b.y}`;
      node = { x: b.x - trim * dir, y: b.y };
    } else {
      // row wrap — S-curve from below the cell to above the next
      const drop = 20;
      d = `M ${a.x} ${a.y + drop} C ${a.x} ${a.y + drop + 26}, ${b.x} ${b.y - drop - 26}, ${b.x} ${b.y - drop}`;
      node = { x: b.x, y: b.y - drop };
    }
    segs.push({ d, done, key: `${order[i]}->${order[i + 1]}:${done}`, node });
  }

  let doneIdx = 0;
  return (
    <svg className="trail-svg" aria-hidden="true">
      <defs>
        <marker id="arrow-grey" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(120,190,230,0.4)" />
        </marker>
        <marker id="arrow-hud" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#4fe3ff" />
        </marker>
      </defs>
      {segs.map((s) => {
        const delay = s.done ? `${Math.min(doneIdx++ * 0.045, 1.2)}s` : "0s";
        return (
          <g key={s.key}>
            <path
              d={s.d}
              pathLength={1}
              className={`trail-seg ${s.done ? "done fresh" : ""}`}
              style={s.done ? ({ "--seg-len": 1, animationDelay: delay } as React.CSSProperties) : undefined}
              markerEnd={`url(#${s.done ? "arrow-hud" : "arrow-grey"})`}
            />
            <circle className={`trail-node ${s.done ? "done" : ""}`} cx={s.node.x} cy={s.node.y} r={2.4} />
          </g>
        );
      })}
    </svg>
  );
}
