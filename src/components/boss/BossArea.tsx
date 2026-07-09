/**
 * BossArea — placeholder for the boss character.
 *
 * Designed to be replaceable: a future 3D animated boss (e.g. react-three-fiber)
 * only needs to render inside the "stage" div below and react to the same
 * `mood` prop. Nothing else in the app should care how the boss is drawn.
 */
import { motion } from "framer-motion";

export type BossMood = "neutral" | "pleased" | "suspicious" | "furious";

const MOOD_FACES: Record<BossMood, string> = {
  neutral: "😐",
  pleased: "😏",
  suspicious: "🤨",
  furious: "😡",
};

export function BossArea({ mood = "neutral" }: { mood?: BossMood }) {
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
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-cream-300 bg-cream-200 text-6xl shadow-card"
        >
          <span role="img" aria-label={`Boss looking ${mood}`}>
            {MOOD_FACES[mood]}
          </span>
        </motion.div>

        <div className="text-center">
          <p className="font-display text-lg font-bold">Herr Direktor</p>
          <p className="text-sm text-ink-500">
            Chief Everything Officer
          </p>
        </div>

        <p className="rounded-xl bg-cream-200 px-4 py-2 text-center text-xs italic text-ink-500">
          “I have three minutes. Impress me in two.”
        </p>
      </div>
    </section>
  );
}
