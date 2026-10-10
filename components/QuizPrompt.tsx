"use client";

import { useEffect, useRef } from "react";
import { Entry } from "@/lib/timeline";

interface Props {
  entry: Entry;
  onStart: () => void;
  onDismiss: () => void;
}

/** little toast that slides up after checking a movie off */
export default function QuizPrompt({ entry, onStart, onDismiss }: Props) {
  // don't nag forever — it's still in the detail modal later
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    const t = setTimeout(() => dismiss.current(), 12_000);
    return () => clearTimeout(t);
  }, [entry.id]);

  const name = entry.sub ? `${entry.title} · ${entry.sub}` : entry.title;

  return (
    <div className="quiz-toast" style={{ "--aura": entry.wm.aura } as React.CSSProperties} role="status">
      <div className="min-w-0">
        <div className="quiz-kicker">Pop quiz unlocked</div>
        <div className="truncate text-sm text-white/85">3 questions on {name}</div>
      </div>
      <button className="btn-watched shrink-0" onClick={onStart}>
        Play
      </button>
      <button className="shrink-0 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white/80" onClick={onDismiss}>
        Later
      </button>
    </div>
  );
}
