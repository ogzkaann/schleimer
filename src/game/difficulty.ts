import type { BossPersonality, Difficulty, GameStats } from "./types";

interface DifficultyConfig {
  label: string;
  description: string;
  startStats: GameStats;
  schleimToleranceModifier: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  intern: {
    label: "Intern",
    description: "Training wheels, but HR still documents the crash.",
    startStats: { hireChance: 40, bossPatience: 82, schleimLevel: 5 },
    schleimToleranceModifier: 15,
  },
  professional: {
    label: "Professional",
    description: "The standard amount of corporate suffering.",
    startStats: { hireChance: 30, bossPatience: 70, schleimLevel: 5 },
    schleimToleranceModifier: 0,
  },
  executive: {
    label: "Executive",
    description: "Less patience, more judgment, nicer stationery.",
    startStats: { hireChance: 20, bossPatience: 58, schleimLevel: 5 },
    schleimToleranceModifier: -15,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["intern", "professional", "executive"];

export function startingStatsFor(difficulty: Difficulty): GameStats {
  return { ...DIFFICULTIES[difficulty].startStats };
}

export function applyDifficultyToBoss(
  boss: BossPersonality,
  difficulty: Difficulty,
): BossPersonality {
  const modifier = DIFFICULTIES[difficulty].schleimToleranceModifier;
  return {
    ...boss,
    schleimTolerance: Math.max(0, Math.min(100, boss.schleimTolerance + modifier)),
  };
}
