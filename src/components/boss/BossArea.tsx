/**
 * BossArea — the boss character stage.
 *
 * Still designed to be replaceable: a future 3D animated boss only needs to
 * render inside the "stage" div and react to the same derived `mood`.
 * Everything here is presentation; mood is derived from deterministic stats.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/gameStore";
import type { AiMood } from "../../ai/bossBrain";

const MOOD_FACES: Record<AiMood, string> = {
  neutral: "😐",
  impressed: "😏",
  annoyed: "🙄",
  suspicious: "🤨",
  furious: "😡",
  confused: "🤔",
};

const MOOD_LABELS: Record<AiMood, string> = {
  neutral: "Professionally unimpressed",
  impressed: "Dangerously close to smiling",
  annoyed: "Practicing his disappointed sigh",
  suspicious: "Recalculating your salary downward",
  furious: "Composing your rejection in his head",
  confused: "Googling your buzzwords under the desk",
};

function useBossView() {
  const phase = useGameStore((s) => s.phase);
  const boss = useGameStore((s) => s.boss);
  const position = useGameStore((s) => s.position);
  const hireChance = useGameStore((s) => s.hireChance);
  const bossPatience = useGameStore((s) => s.bossPatience);
  const schleimLevel = useGameStore((s) => s.schleimLevel);
  const bossMoodLabel = useGameStore((s) => s.bossMoodLabel);

  // Dialogue layer's mood label wins; otherwise derive from stats.
  let mood: AiMood = "neutral";
  if (boss) {
    if (bossMoodLabel) mood = bossMoodLabel;
    else if (bossPatience <= 25) mood = "furious";
    else if (schleimLevel > boss.schleimTolerance || bossPatience <= 45) mood = "suspicious";
    else if (hireChance >= 65) mood = "impressed";
  }

  let statusLine = "HR is deciding which manager owes them a favor.";
  if (phase === "interview" && boss) {
    if (schleimLevel > boss.schleimTolerance) statusLine = "Danger: LinkedIn energy detected.";
    else if (bossPatience <= 25) statusLine = "The boss is checking his watch. It's not subtle.";
    else if (hireChance >= 70) statusLine = "Your confidence arrived before your CV. It's working.";
    else if (schleimLevel > boss.schleimTolerance * 0.7) statusLine = "Warning: flattery levels approaching LinkedIn.";
    else statusLine = "The boss is pretending to understand AI strategy.";
  } else if (phase === "verdict") {
    statusLine = "HR has marked this as 'interesting', which is legally different from 'good'.";
  }

  return { phase, boss, position, mood, statusLine };
}

export function BossArea() {
  const { phase, boss, position, mood, statusLine } = useBossView();

  return (
    <section
      aria-label="Your interviewer"
      className="flex min-h-0 flex-col rounded-card bg-cream-50 shadow-card"
    >
      <div className="border-b border-cream-200 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          Your Interviewer
        </h2>
      </div>

      {/* Boss stage — swap this block for the 3D boss later */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <motion.div
          animate={
            mood === "furious"
              ? { x: [0, -3, 3, -3, 0], y: 0 }
              : { y: [0, -6, 0], x: 0 }
          }
          transition={
            mood === "furious"
              ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }
          className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-cream-300 bg-cream-200 text-6xl shadow-card"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={boss ? mood : "empty"}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="img"
              aria-label={boss ? `Boss looking ${mood}` : "No boss assigned yet"}
            >
              {boss ? MOOD_FACES[mood] : "❓"}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="text-center">
          <p className="font-display text-lg font-bold">
            {boss ? boss.name : "To be assigned"}
          </p>
          <p className="text-sm text-ink-500">
            {boss ? boss.title : "Someone is being pulled out of a meeting for you."}
          </p>
        </div>

        {boss && (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-300">
              Current mood
            </p>
            <p className="text-sm text-ink-700">{MOOD_LABELS[mood]}</p>
          </div>
        )}

        {position && phase !== "pick-skills" && (
          <div className="rounded-xl bg-cream-200 px-4 py-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-300">
              Interviewing for
            </p>
            <p className="text-sm font-medium">{position.title}</p>
          </div>
        )}

        <p className="rounded-xl bg-cream-200 px-4 py-2 text-center text-xs italic text-ink-500">
          {statusLine}
        </p>
      </div>
    </section>
  );
}
