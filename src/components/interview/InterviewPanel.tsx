/**
 * InterviewPanel — placeholder for the interview chat.
 *
 * Will hold: boss questions, player answers, suggested-answer cards with an
 * edit affordance. For now it renders a static preview of that layout.
 */
import { motion } from "framer-motion";

export function InterviewPanel() {
  return (
    <section
      aria-label="Interview"
      className="flex min-h-0 flex-col rounded-card bg-cream-50 shadow-card"
    >
      <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          Interview in Progress
        </h2>
        <span className="text-xs text-ink-300">
          Position: Senior Synergy Evangelist
        </span>
      </div>

      {/* Chat transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-[85%] rounded-2xl rounded-tl-md bg-cream-200 px-4 py-3 text-sm"
        >
          So. Your CV says “results-oriented team player.” Fascinating. Everyone
          else's does too. Why should I waste a desk on you?
        </motion.div>

        <div className="pt-2 text-center text-xs text-ink-300">
          — game logic coming soon —
        </div>
      </div>

      {/* Answer choices */}
      <div className="border-t border-cream-200 p-4">
        <p className="mb-2 text-xs font-medium text-ink-500">
          Choose your response (editing before you speak is encouraged):
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "I don't need a desk. I sleep under one to save the company rent.",
            "Because my greatest weakness is caring too much about your KPIs.",
          ].map((answer) => (
            <button
              key={answer}
              type="button"
              disabled
              className="rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-left text-sm shadow-card transition hover:border-ember-400 hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
