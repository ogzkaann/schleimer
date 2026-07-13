/**
 * HudPanel — live game HUD. Meters, selected skills, position details,
 * turn count, last score delta and a debug accordion for the curious.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../../store/gameStore";
import { AiSettingsCard } from "./AiSettingsCard";
import { RecentRuns } from "./RecentRuns";

interface MeterProps {
  label: string;
  value: number;
  delta: number | undefined;
  color: string;
  hint: string;
}

function Meter({ label, value, delta, color, hint }: MeterProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-700">{label}</span>
        <span className="text-xs tabular-nums text-ink-500">
          {delta !== undefined && delta !== 0 && (
            <motion.span
              key={`${label}-${delta}-${value}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mr-1.5 font-semibold ${delta > 0 ? "text-success-500" : "text-danger-500"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </motion.span>
          )}
          {value}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-cream-200">
        <motion.div
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="mt-1 text-[11px] italic text-ink-300">{hint}</p>
    </div>
  );
}

function DebugAccordion() {
  const [open, setOpen] = useState(false);
  const matchDebug = useGameStore((s) => s.matchDebug);
  const lastScore = useGameStore((s) => s.lastScore);
  if (!matchDebug && !lastScore) return null;

  return (
    <div className="rounded-card bg-cream-50 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-300 transition hover:text-ink-500"
      >
        Dev Notes
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 px-5 pb-4">
          {matchDebug && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-ink-500">
                Position match (top {matchDebug.topPool.length})
              </p>
              <ul className="space-y-0.5">
                {matchDebug.topPool.map((candidate) => (
                  <li key={candidate.position.id} className="text-[11px] text-ink-300">
                    {candidate.position.title}: {candidate.score} pts
                    {candidate.matchedTags.length > 0 && ` (${candidate.matchedTags.join(", ")})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lastScore && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-ink-500">Last answer</p>
              <ul className="space-y-0.5">
                {lastScore.reasons.map((reason) => (
                  <li key={reason} className="text-[11px] text-ink-300">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HudPanel() {
  const phase = useGameStore((s) => s.phase);
  const hireChance = useGameStore((s) => s.hireChance);
  const bossPatience = useGameStore((s) => s.bossPatience);
  const schleimLevel = useGameStore((s) => s.schleimLevel);
  const selectedSkills = useGameStore((s) => s.selectedSkills);
  const position = useGameStore((s) => s.position);
  const boss = useGameStore((s) => s.boss);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const maxTurns = useGameStore((s) => s.maxTurns);
  const lastScore = useGameStore((s) => s.lastScore);

  const schleimHint =
    boss && schleimLevel > boss.schleimTolerance
      ? "Danger: LinkedIn energy detected."
      : "Too much and he'll smell it.";

  return (
    <section
      aria-label="Game status"
      className="flex min-h-0 flex-col gap-4 overflow-y-auto"
    >
      <div className="rounded-card bg-cream-50 p-5 shadow-card">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
            Vital Statistics
          </h2>
          {phase !== "pick-skills" && (
            <span className="text-xs tabular-nums text-ink-500">
              Turn {Math.min(turnNumber, maxTurns)}/{maxTurns}
            </span>
          )}
        </div>
        <div className="space-y-4">
          <Meter
            label="Hire Chance"
            value={hireChance}
            delta={lastScore?.delta.hireChance}
            color="bg-success-500"
            hint="Statistically better than the intern."
          />
          <Meter
            label="Boss Patience"
            value={bossPatience}
            delta={lastScore?.delta.bossPatience}
            color="bg-ember-500"
            hint="Depleting since you said hello."
          />
          <Meter
            label="Schleim Level"
            value={schleimLevel}
            delta={lastScore?.delta.schleimLevel}
            color="bg-danger-500"
            hint={schleimHint}
          />
        </div>
      </div>

      <div className="rounded-card bg-cream-50 p-5 shadow-card">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-300">
          Hidden Skills
        </h2>
        {selectedSkills.length === 0 ? (
          <p className="text-xs italic text-ink-300">
            None selected. Technically honest of you.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedSkills.map((skill) => (
              <motion.li
                key={skill.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-cream-300 bg-cream-100 px-3 py-2 text-sm font-medium"
              >
                {skill.label}
              </motion.li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] italic text-ink-300">
          Deploy them wisely. Or desperately.
        </p>
      </div>

      {position && (
        <div className="rounded-card bg-cream-50 p-5 shadow-card">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-300">
            The Position
          </h2>
          <p className="text-sm font-semibold">{position.title}</p>
          <p className="mt-1 text-xs text-ink-500">{position.description}</p>
        </div>
      )}

      <AiSettingsCard />

      <RecentRuns />

      <DebugAccordion />
    </section>
  );
}
