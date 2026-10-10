"use client";

import { burstPoints, layoutPages, sfxFor, tiltFor } from "@/lib/comic";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import Wordmark from "./Wordmark";

/**
 * The movies as a comic book: one issue per phase (villain on the splash),
 * each issue's stories laid out as pages of mixed-size panels in reading
 * order.  Panels start as pencils, get inked when they're up next and are
 * coloured in once watched.  Doomsday is the final issue, not yet on sale.
 */

const SFX_BURST = burstPoints(11, 0.62, 7);
const DEFEAT_BURST = burstPoints(18, 0.74, 9);

type PanelState = "sketch" | "next" | "read";

interface Issue {
  key: string;
  phase?: number;
  entries: Entry[];
}

function splitLabel(phase: number) {
  const [main, sub] = PHASE_LABELS[phase].split("—").map((s) => s.trim());
  return { main, sub };
}

function buildIssues(entries: Entry[], byPhase: boolean): Issue[] {
  if (!byPhase) return [{ key: "omnibus", entries }];
  const issues: Issue[] = [];
  for (const e of entries) {
    const last = issues[issues.length - 1];
    if (last && last.phase === e.phase) last.entries.push(e);
    else issues.push({ key: `phase-${e.phase}`, phase: e.phase, entries: [e] });
  }
  return issues;
}

interface Props {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  showPhases: boolean;
  finaleId: string;
  doomGlow: number;
  cols: 6 | 2;
  wordmarkBase: number;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

export default function ComicBook({
  entries,
  watched,
  upNextId,
  showPhases,
  finaleId,
  doomGlow,
  cols,
  wordmarkBase,
  onSelect,
  onQuickToggle,
}: Props) {
  const finale = entries.find((e) => e.id === finaleId);
  const stories = entries.filter((e) => e.id !== finaleId);
  const issues = buildIssues(stories, showPhases);
  const readingNo = new Map(stories.map((e, i) => [e.id, i + 1]));
  const remaining = stories.filter((e) => !watched[e.id]).length;

  const isDefeated = (phase?: number) =>
    phase !== undefined && entries.filter((e) => e.phase === phase).every((e) => watched[e.id]);

  let pageNo = 0;

  return (
    <div className="comic-book">
      {showPhases && (
        <nav className="shelf" aria-label="Jump to issue">
          {issues.map((issue, n) => {
            const done = issue.entries.filter((e) => watched[e.id]).length;
            const phase = issue.phase as number;
            const boss = PHASE_BOSSES[phase];
            return (
              <a
                key={issue.key}
                href={`#${issue.key}`}
                className={`mini-cover ${isDefeated(phase) ? "complete" : ""}`}
                style={{ "--phase-color": PHASE_COLORS[phase], "--tilt": `${tiltFor(issue.key, 3).toFixed(1)}deg` } as React.CSSProperties}
              >
                <span className="mc-mast">
                  <span>Doomsday</span>
                  <b>#{n + 1}</b>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {boss && <img className="mc-villain" src={boss.img} alt="" draggable={false} />}
                <span className="mc-title">{splitLabel(phase).main}</span>
                <span className="mc-prog">
                  {done}/{issue.entries.length}
                </span>
                {isDefeated(phase) && <span className="mc-stamp">Complete!</span>}
              </a>
            );
          })}
          {finale && (
            <a
              href="#final-issue"
              className={`mini-cover final ${watched[finale.id] ? "complete" : ""}`}
              style={{ "--phase-color": "#2bd456", "--tilt": "2deg" } as React.CSSProperties}
            >
              <span className="mc-mast">
                <span>Final issue</span>
                <b>★</b>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mc-villain" src={PHASE_BOSSES[6].img} alt="" draggable={false} />
              <span className="mc-title">Doomsday</span>
              <span className="mc-prog">Dec 18</span>
            </a>
          )}
        </nav>
      )}

      {issues.map((issue, n) => {
        const defeated = isDefeated(issue.phase);
        const pages = layoutPages(issue.entries, cols);
        return (
          <section key={issue.key} id={issue.key} className="issue">
            <IssueSplash
              issue={issue}
              number={n + 1}
              defeated={defeated}
              done={issue.entries.filter((e) => watched[e.id]).length}
            />
            {pages.map((page) => {
              pageNo++;
              return (
                <div key={pageNo} className={`comic-page cols-${cols}`}>
                  <div className="page-grid">
                    {page.map(({ item: e, span, tall }) => {
                      const state: PanelState = watched[e.id] ? "read" : e.id === upNextId ? "next" : "sketch";
                      return (
                        <Panel
                          key={e.id}
                          entry={e}
                          number={readingNo.get(e.id) ?? 0}
                          span={span}
                          tall={tall}
                          state={state}
                          wordmarkBase={wordmarkBase * (span >= 4 ? 1.2 : 1)}
                          onSelect={onSelect}
                          onQuickToggle={onQuickToggle}
                        />
                      );
                    })}
                  </div>
                  <div className="page-foot">
                    <span>Road to Doomsday</span>
                    <span>pg. {pageNo}</span>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {finale && (
        <FinalIssue
          entry={finale}
          read={Boolean(watched[finale.id])}
          remaining={remaining}
          doomGlow={doomGlow}
          onSelect={onSelect}
          onQuickToggle={onQuickToggle}
        />
      )}
    </div>
  );
}

function IssueSplash({ issue, number, defeated, done }: { issue: Issue; number: number; defeated: boolean; done: number }) {
  const phase = issue.phase;
  const boss = phase !== undefined ? PHASE_BOSSES[phase] : undefined;
  const label = phase !== undefined ? splitLabel(phase) : { main: "The Timeline", sub: "In-Universe Omnibus" };
  const total = issue.entries.length;
  return (
    <header
      className={`issue-splash ${defeated ? "defeated" : ""}`}
      style={{ "--phase-color": phase !== undefined ? PHASE_COLORS[phase] : "#ffd23f" } as React.CSSProperties}
    >
      <div className="splash-lines" />
      {boss && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="splash-villain" src={boss.img} alt="" draggable={false} />
      )}
      <div className="splash-text">
        <div className="splash-kicker">
          Issue #{number} · {total} stories
        </div>
        <h3 className="splash-title">{label.main}</h3>
        {label.sub && <div className="splash-sub">{label.sub}</div>}
        {boss && (
          <div className="splash-villain-tag">
            {defeated ? "Defeated:" : "Villain:"} <b>{boss.name}</b>
          </div>
        )}
        <div className="splash-progress">
          {total <= 12 && (
            <span className="pips" aria-hidden="true">
              {issue.entries.map((e, i) => (
                <i key={e.id} className={i < done ? "on" : ""} />
              ))}
            </span>
          )}
          <span>
            {done}/{total} read
          </span>
        </div>
      </div>
      {defeated && (
        <div className="splash-defeated" aria-label={`${boss?.name ?? "Issue"} defeated`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={DEFEAT_BURST} />
          </svg>
          <span>{boss ? "Defeated!" : "Complete!"}</span>
        </div>
      )}
    </header>
  );
}

interface PanelProps {
  entry: Entry;
  number: number;
  span: number;
  tall: boolean;
  state: PanelState;
  wordmarkBase: number;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}

function Panel({ entry: e, number, span, tall, state, wordmarkBase, onSelect, onQuickToggle }: PanelProps) {
  return (
    <div
      data-entry={e.id}
      className={`panel ${state} ${tall ? "tall" : ""}`}
      style={{ gridColumn: `span ${span}`, "--aura": e.wm.aura } as React.CSSProperties}
      onClick={() => onSelect(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onSelect(e);
        }
      }}
      aria-label={`${number}. ${e.sub ? e.sub + " " : ""}${e.title} (${e.year})${state === "read" ? ", watched" : state === "next" ? ", up next" : ""}`}
    >
      <span className="panel-num">{number}</span>
      <span className="panel-year">{e.year}</span>
      {state === "next" && <span className="next-caption">Up next!</span>}
      <div className="panel-body">
        {e.sub && <span className="sub-label">{e.sub}</span>}
        <Wordmark entry={e} base={wordmarkBase} />
        {state === "sketch" && <span className="pencil-note">pencils only — watch to ink</span>}
      </div>
      {state === "read" && (
        <span className="sfx" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <polygon points={SFX_BURST} />
          </svg>
          <span>{sfxFor(e.id)}</span>
        </span>
      )}
      <CornerFold read={state === "read"} onClick={() => onQuickToggle(e)} />
    </div>
  );
}

/** dog-eared corner — fold it to mark a story read */
export function CornerFold({ read, onClick }: { read: boolean; onClick: () => void }) {
  return (
    <button
      className="corner-fold"
      title={read ? "Mark as unwatched" : "Mark as watched"}
      aria-label={read ? "Mark as unwatched" : "Mark as watched"}
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
    >
      <span>{read ? "↺" : "✓"}</span>
    </button>
  );
}

function FinalIssue({
  entry,
  read,
  remaining,
  doomGlow,
  onSelect,
  onQuickToggle,
}: {
  entry: Entry;
  read: boolean;
  remaining: number;
  doomGlow: number;
  onSelect: (entry: Entry) => void;
  onQuickToggle: (entry: Entry) => void;
}) {
  const ready = remaining === 0;
  return (
    <section id="final-issue" className="final-issue" style={{ "--doom-glow": doomGlow } as React.CSSProperties}>
      <div className="fi-rays" />
      <div
        data-entry={entry.id}
        className={`fi-cover ${read ? "read" : ready ? "ready" : "locked"}`}
        onClick={() => onSelect(entry)}
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onSelect(entry);
          }
        }}
        aria-label={`Final issue: Avengers: Doomsday (${entry.year})`}
      >
        <div className="fi-mast">
          <span className="fi-kicker">The final issue</span>
          <span className="fi-price">
            <small>DEC</small>
            <b>18</b>
          </span>
        </div>
        <div className="fi-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fi-doom" src={PHASE_BOSSES[6].img} alt="" draggable={false} />
          <div className="fi-title">
            {entry.sub && <span className="sub-label">{entry.sub}</span>}
            <Wordmark entry={entry} base={2.6} />
          </div>
        </div>
        <div className="fi-foot">
          {read ? "Read! The road ends here." : ready ? "All caught up — ready to read!" : `${remaining} stories to go before it hits shelves`}
        </div>
        {!read && !ready && <span className="fi-banner">Coming soon</span>}
        {read && (
          <span className="sfx big" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <polygon points={SFX_BURST} />
            </svg>
            <span>DOOM!</span>
          </span>
        )}
        <CornerFold read={read} onClick={() => onQuickToggle(entry)} />
      </div>
    </section>
  );
}
