import { useState } from "react";
import { DIFFICULTIES } from "../../game/difficulty";
import { useRunHistory } from "../../store/runHistory";

export function RecentRuns() {
  const [open, setOpen] = useState(false);
  const runs = useRunHistory((state) => state.runs);
  const clearHistory = useRunHistory((state) => state.clearHistory);

  return (
    <div className="rounded-card bg-cream-50 shadow-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-300 transition hover:text-ink-500"
      >
        <span>Recent Runs {runs.length > 0 && `(${runs.length})`}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          {runs.length === 0 ? (
            <p className="text-[11px] italic text-ink-300">
              No verdicts yet. HR remains cautiously optimistic.
            </p>
          ) : (
            <>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {runs.map((run) => (
                  <li key={run.id} className="rounded-xl bg-cream-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold">{run.ending}</p>
                        <p className="text-[10px] text-ink-500">{run.position}</p>
                      </div>
                      {run.dailyChallenge && (
                        <span className="rounded-full bg-ember-400/10 px-2 py-0.5 text-[9px] font-semibold text-ember-700">
                          Daily
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] tabular-nums text-ink-500">
                      H {run.finalScores.hireChance} · P {run.finalScores.bossPatience} · S{" "}
                      {run.finalScores.schleimLevel}
                    </p>
                    <p className="mt-0.5 text-[9px] text-ink-300">
                      {DIFFICULTIES[run.difficulty].label} · {run.aiMode} · {run.boss} ·{" "}
                      {new Date(run.date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={clearHistory}
                className="mt-3 text-[10px] font-semibold text-danger-500 transition hover:text-ember-700"
              >
                Clear history
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
