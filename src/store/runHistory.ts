import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty, GameStats } from "../game/types";

export type AiRunMode = "Mock" | "Hybrid" | "Every Turn";

export interface RunHistoryItem {
  id: string;
  ending: string;
  position: string;
  boss: string;
  difficulty: Difficulty;
  finalScores: GameStats;
  date: string;
  dailyChallenge: boolean;
  aiMode: AiRunMode;
}

interface RunHistoryStore {
  runs: RunHistoryItem[];
  addRun: (run: Omit<RunHistoryItem, "id">) => void;
  clearHistory: () => void;
}

export const useRunHistory = create<RunHistoryStore>()(
  persist(
    (set) => ({
      runs: [],
      addRun: (run) =>
        set((state) => ({
          runs: [
            { ...run, id: `${run.date}-${run.position}-${run.ending}` },
            ...state.runs,
          ].slice(0, 10),
        })),
      clearHistory: () => set({ runs: [] }),
    }),
    {
      name: "schleimer-run-history",
      partialize: (state) => ({ runs: state.runs }),
    },
  ),
);

export function aiRunMode(
  aiAttemptedTurns: number,
  aiDialogueTurns: number,
  answeredTurns: number,
): AiRunMode {
  if (aiAttemptedTurns === 0) return "Mock";
  return aiDialogueTurns === answeredTurns ? "Every Turn" : "Hybrid";
}
