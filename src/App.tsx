import { useEffect } from "react";
import { motion } from "framer-motion";
import { BossArea } from "./components/boss/BossArea";
import { InterviewPanel } from "./components/interview/InterviewPanel";
import { HudPanel } from "./components/hud/HudPanel";
import { useGameStore } from "./store/gameStore";
import { useAiSettings } from "./ai/aiSettings";
import { StatusDot } from "./components/hud/AiSettingsCard";

function ModeBadge() {
  const mode = useAiSettings((s) => s.mode);
  const status = useAiSettings((s) => s.status);
  return (
    <span className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-200 px-3 py-1 text-xs font-medium text-ink-500">
      {mode === "ai" && <StatusDot status={status} />}
      {mode === "ai" ? "AI Boss" : "Mock Boss"}
    </span>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const hasDeal = useGameStore((s) => s.offeredSkills.length > 0);
  const startNewGame = useGameStore((s) => s.startNewGame);

  // Deal the opening hand once on load.
  useEffect(() => {
    if (phase === "pick-skills" && !hasDeal) startNewGame();
  }, [phase, hasDeal, startNewGame]);

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:overflow-hidden">
      <header className="flex items-center justify-between border-b border-cream-300 bg-cream-50/80 px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Schleimer<span className="text-ember-500">.</span>
          </h1>
          <p className="hidden text-sm text-ink-500 sm:block">
            The Interview Simulator — flatter your way to employment
          </p>
        </div>
        <ModeBadge />
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid flex-1 grid-cols-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)_260px]"
      >
        <BossArea />
        <InterviewPanel />
        <HudPanel />
      </motion.main>
    </div>
  );
}
