/**
 * Ending evaluation — pure function of the current stats and turn count.
 */
import type { Ending, EndingId, GameStats } from "./types";

export const ENDINGS: Record<EndingId, Ending> = {
  hired: {
    id: "hired",
    title: "Hired",
    text: "Congratulations. Your soul now belongs to the org chart. Onboarding starts Monday; bring your own optimism.",
  },
  "corporate-legend": {
    id: "corporate-legend",
    title: "Corporate Legend",
    text: "They didn't just hire you — they created a new title for you. Interns will whisper your name near the printer for generations.",
  },
  "internship-trap": {
    id: "internship-trap",
    title: "The Internship Trap",
    text: "'We'd love to keep working with you — unpaid, for exposure.' The exposure is to fluorescent lighting.",
  },
  "rejected-pool": {
    id: "rejected-pool",
    title: "The Talent Pool",
    text: "'We'll keep your CV on file.' The file is a shredder. The shredder is also in the talent pool.",
  },
  "linkedin-disaster": {
    id: "linkedin-disaster",
    title: "LinkedIn Disaster",
    text: "Your flattery reached toxic levels. The boss screenshotted your answer. It has 40,000 reactions and a crying-laughing emoji from your ex-boss.",
  },
  "fired-mid-interview": {
    id: "fired-mid-interview",
    title: "Fired Mid-Interview",
    text: "You weren't even hired yet, and somehow you're fired. Security says it's their first pre-emptive escort.",
  },
};

/**
 * Returns the ending if the game is over, otherwise null.
 * Early exits first; verdict endings only after the final turn was answered.
 */
export function evaluateEnding(
  stats: GameStats,
  answeredTurns: number,
  maxTurns: number,
): Ending | null {
  if (stats.bossPatience <= 0) return ENDINGS["fired-mid-interview"];
  if (stats.schleimLevel >= 100) return ENDINGS["linkedin-disaster"];
  if (answeredTurns < maxTurns) return null;

  if (stats.hireChance >= 85 && stats.schleimLevel <= 40) {
    return ENDINGS["corporate-legend"];
  }
  if (stats.hireChance >= 60) return ENDINGS.hired;
  if (stats.hireChance >= 35) return ENDINGS["internship-trap"];
  return ENDINGS["rejected-pool"];
}
