"use client";

import { useState } from "react";

interface Props {
  /** 1..10, half-stars out of 5 */
  value: number | undefined;
  onChange?: (v: number | null) => void;
  size?: number;
  label?: string;
}

/** Five stars, each split into a left/right half for half-star precision. */
export default function StarRating({ value, onChange, size = 22, label = "Your rating" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const readOnly = !onChange;

  return (
    <div
      className={`stars ${readOnly ? "read-only" : ""}`}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `${(value ?? 0) / 2} out of 5 stars` : label}
      onMouseLeave={() => setHover(null)}
      style={{ "--star-size": `${size}px` } as React.CSSProperties}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = shown >= star * 2 ? 1 : shown === star * 2 - 1 ? 0.5 : 0;
        return (
          <span key={star} className="star">
            <span className="star-bg">★</span>
            <span className="star-fg" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
            {!readOnly &&
              [star * 2 - 1, star * 2].map((v) => (
                <button
                  key={v}
                  className={`star-hit ${v % 2 ? "left" : "right"}`}
                  role="radio"
                  aria-checked={value === v}
                  aria-label={`${v / 2} stars`}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onBlur={() => setHover(null)}
                  // tapping your current rating clears it
                  onClick={() => onChange?.(value === v ? null : v)}
                />
              ))}
          </span>
        );
      })}
    </div>
  );
}
