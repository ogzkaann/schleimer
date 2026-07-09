/**
 * HudPanel — compact game HUD placeholder.
 *
 * Will show live meters (Hire Chance, Boss Patience, Schleim Level) and the
 * player's three hidden-skill cards. Values below are static previews.
 */
import { motion } from "framer-motion";

interface MeterProps {
  label: string;
  value: number; // 0–100
  color: string;
  hint: string;
}

function Meter({ label, value, color, hint }: MeterProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-700">{label}</span>
        <span className="text-xs tabular-nums text-ink-500">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-cream-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="mt-1 text-[11px] italic text-ink-300">{hint}</p>
    </div>
  );
}

export function HudPanel() {
  return (
    <section
      aria-label="Game status"
      className="flex min-h-0 flex-col gap-4 overflow-y-auto"
    >
      <div className="rounded-card bg-cream-50 p-5 shadow-card">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-300">
          Vital Statistics
        </h2>
        <div className="space-y-4">
          <Meter
            label="Hire Chance"
            value={35}
            color="bg-success-500"
            hint="Statistically better than the intern."
          />
          <Meter
            label="Boss Patience"
            value={70}
            color="bg-ember-500"
            hint="Depleting since you said hello."
          />
          <Meter
            label="Schleim Level"
            value={20}
            color="bg-danger-500"
            hint="Too much and he'll smell it."
          />
        </div>
      </div>

      <div className="rounded-card bg-cream-50 p-5 shadow-card">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-300">
          Hidden Skills
        </h2>
        <ul className="space-y-2">
          {[
            "Professional Nodder",
            "Meeting Survivor (Lvl 99)",
            "Printer Whisperer",
          ].map((skill) => (
            <li
              key={skill}
              className="rounded-xl border border-cream-300 bg-cream-100 px-3 py-2 text-sm font-medium"
            >
              {skill}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] italic text-ink-300">
          Deploy them wisely. Or desperately.
        </p>
      </div>
    </section>
  );
}
