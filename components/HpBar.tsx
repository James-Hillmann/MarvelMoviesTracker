/** chunky segmented life bar — one block per stage */
export default function HpBar({ total, left, color, label }: { total: number; left: number; color: string; label?: string }) {
  return (
    <div
      className="hp-bar"
      style={{ "--hp-color": color } as React.CSSProperties}
      aria-label={label}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={left}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < left ? "on" : ""} />
      ))}
    </div>
  );
}
