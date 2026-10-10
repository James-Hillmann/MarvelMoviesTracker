"use client";

import { useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/stats";
import { DOOMSDAY_DATE } from "@/lib/timeline";

interface Props {
  /** movie watch timestamps, ascending */
  timeline: number[];
  total: number;
  color: string;
  now: number;
}

const W = 640;
const H = 220;
const PAD = { l: 34, r: 16, t: 26, b: 26 };
const DAY = 86_400_000;

/**
 * Cumulative movies watched (solid, crew color) against the straight line you
 * still need to hit Doomsday (dashed, neutral).  One y-axis, hover crosshair.
 */
export default function PaceChart({ timeline, total, color, now }: Props) {
  const doom = new Date(DOOMSDAY_DATE).getTime();
  const start = Math.min(timeline[0] ?? now - 30 * DAY, now - 14 * DAY);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const x = (t: number) => PAD.l + ((t - start) / (doom - start)) * (W - PAD.l - PAD.r);
  const y = (n: number) => H - PAD.b - (n / total) * (H - PAD.t - PAD.b);

  const steps = useMemo(() => {
    const pts: [number, number][] = [[start, 0]];
    timeline.forEach((t, i) => {
      pts.push([t, i]);
      pts.push([t, i + 1]);
    });
    pts.push([now, timeline.length]);
    return pts;
  }, [timeline, start, now]);

  const actualPath = steps.map(([t, n], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(n).toFixed(1)}`).join(" ");
  const done = timeline.length;

  // month ticks
  const ticks: number[] = [];
  const d = new Date(start);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() < doom) {
    ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  const yTicks = [0, Math.round(total / 2), total];

  // hover readout
  let readout: { t: number; actual: number | null; needed: number | null } | null = null;
  if (hoverX !== null) {
    const t = start + ((hoverX - PAD.l) / (W - PAD.l - PAD.r)) * (doom - start);
    const actual = t <= now ? timeline.filter((w) => w <= t).length : null;
    const needed = t >= now ? done + ((t - now) / (doom - now)) * (total - done) : null;
    readout = { t, actual, needed };
  }

  const onMove = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    setHoverX(Math.min(W - PAD.r, Math.max(PAD.l, px)));
  };

  return (
    <figure className="pace-chart">
      <figcaption className="wr-legend">
        <span>
          <i style={{ background: color }} /> Watched
        </span>
        <span>
          <i className="dashed" /> Pace needed for Doomsday
        </span>
      </figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${done} of ${total} movies watched; dashed line shows the pace needed to finish by Doomsday`}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverX(null)}
      >
        {yTicks.map((n) => (
          <g key={n}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(n)} y2={y(n)} className="grid" />
            <text x={PAD.l - 8} y={y(n) + 4} textAnchor="end" className="axis">
              {n}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="axis">
            {formatDate(t, { month: "short" })}
          </text>
        ))}

        {/* needed pace from today to the finish line */}
        <line x1={x(now)} y1={y(done)} x2={x(doom)} y2={y(total)} className="needed" />
        <path d={actualPath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <line x1={x(now)} x2={x(now)} y1={PAD.t} y2={H - PAD.b} className="today" />
        <text x={x(now) + 4} y={PAD.t + 8} className="axis">
          today
        </text>
        <circle cx={x(now)} cy={y(done)} r={4.5} fill={color} stroke="#0a0a12" strokeWidth={2} />
        <text x={x(doom)} y={y(total) - 10} textAnchor="end" className="axis strong">
          Doomsday
        </text>

        {hoverX !== null && readout && (
          <g pointerEvents="none">
            <line x1={hoverX} x2={hoverX} y1={PAD.t} y2={H - PAD.b} className="crosshair" />
            {readout.actual !== null && <circle cx={hoverX} cy={y(readout.actual)} r={4} fill={color} stroke="#0a0a12" strokeWidth={2} />}
            {readout.needed !== null && <circle cx={hoverX} cy={y(readout.needed)} r={4} fill="#fff" stroke="#0a0a12" strokeWidth={2} />}
          </g>
        )}
      </svg>
      {readout && (
        <div
          className="chart-tip"
          style={{ left: `${(hoverX! / W) * 100}%` }}
        >
          <div className="tip-date">{formatDate(readout.t, { weekday: "short", month: "short", day: "numeric" })}</div>
          {readout.actual !== null && <div>{readout.actual} watched</div>}
          {readout.needed !== null && <div>{Math.ceil(readout.needed)} needed by now</div>}
        </div>
      )}
    </figure>
  );
}
