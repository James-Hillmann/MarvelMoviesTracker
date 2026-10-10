"use client";

import { useEffect, useMemo, useState } from "react";
import { celebrate } from "@/lib/confetti";
import { Entry } from "@/lib/timeline";
import { QuizResult, TriviaQuestion } from "@/lib/trivia";
import Wordmark from "./Wordmark";

interface Props {
  entry: Entry;
  questions: TriviaQuestion[];
  previous?: QuizResult;
  onSubmit: (answers: string[]) => void;
  onClose: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const VERDICTS = ["Back to the Quantum Realm.", "Not bad, recruit.", "Avenger material.", "Flawless. Worthy."];

export default function QuizModal({ entry, questions, previous, onSubmit, onClose }: Props) {
  // shuffle once per open so retakes aren't pure muscle memory
  const options = useMemo(() => questions.map((q) => shuffle([q.a, ...q.wrong])), [questions]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const picked = answers[step];
  const done = step >= questions.length;
  const score = answers.filter((a, i) => a === questions[i]?.a).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const pick = (opt: string) => {
    if (picked) return;
    setAnswers((a) => {
      const next = [...a];
      next[step] = opt;
      return next;
    });
  };

  const advance = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep >= questions.length) {
      onSubmit(answers);
      if (score === questions.length) celebrate(entry.wm.aura);
    }
  };

  const verdict = VERDICTS[Math.round((score / questions.length) * (VERDICTS.length - 1))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card quiz-card"
        style={{ "--aura": entry.wm.aura } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.title} pop quiz`}
      >
        <div className="relative overflow-hidden rounded-t-[1.25rem] px-5 pb-4 pt-5">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: entry.wm.gradient }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="quiz-kicker">Pop quiz</div>
              {entry.sub && <div className="sub-label mt-1">{entry.sub}</div>}
              <Wordmark entry={entry} base={1.6} />
            </div>
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-black/90 hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="quiz-pips relative mt-4" aria-hidden="true">
            {questions.map((q, i) => (
              <span
                key={i}
                className={
                  answers[i] === undefined ? (i === step ? "current" : "") : answers[i] === q.a ? "right" : "wrong"
                }
              />
            ))}
          </div>
        </div>

        {!done ? (
          <div className="px-5 pb-5 pt-2">
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">
              Question {step + 1} of {questions.length}
            </div>
            <p className="mt-2 text-lg leading-snug text-white/90">{questions[step].q}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {options[step].map((opt) => {
                const state = !picked
                  ? ""
                  : opt === questions[step].a
                    ? "right"
                    : opt === picked
                      ? "wrong"
                      : "dim";
                return (
                  <button key={opt} className={`quiz-opt ${state}`} onClick={() => pick(opt)} disabled={Boolean(picked)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex min-h-[40px] items-center justify-between gap-3">
              <span className="text-sm text-white/55">
                {picked ? (picked === questions[step].a ? "Correct!" : `Nope — it’s ${questions[step].a}.`) : ""}
              </span>
              {picked && (
                <button className="btn-watched" onClick={advance}>
                  {step + 1 < questions.length ? "Next →" : "See score"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-2 text-center">
            <div className="quiz-score">
              <b>{score}</b>
              <span>/{questions.length}</span>
            </div>
            <p className="mt-1 text-sm uppercase tracking-[0.25em] text-white/60">{verdict}</p>
            {previous && previous.best > score && (
              <p className="mt-2 text-xs text-white/40">
                Your best is still {previous.best}/{previous.total}.
              </p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                className="btn-watched is-watched"
                onClick={() => {
                  setAnswers([]);
                  setStep(0);
                }}
              >
                ↺ Retake
              </button>
              <button className="btn-watched" onClick={onClose}>
                Back to the board
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
