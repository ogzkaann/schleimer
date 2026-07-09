/**
 * Mock boss — deterministic canned dialogue. The default mode, the offline
 * mode, and the fallback whenever the AI boss fails. No key, no network.
 */
import type { AiMood, BossDialogue, DialogueContext } from "./bossBrain";

const IMPATIENT_LINES = [
  "My patience is a nonrenewable resource, and you are strip-mining it.",
  "I've sat through fire drills with more substance than that answer.",
  "Every second of that reply will be deducted from your lunch break.",
];

const SUSPICIOUS_LINES = [
  "Flattery. How... generous of you. Moving on.",
  "You're laying it on thicker than the Q4 spin deck.",
  "I can smell the LinkedIn on that answer.",
];

const IMPRESSED_LINES = [
  "Hm. That was almost impressive. Don't let it go to your head.",
  "Interesting. I'm noting that down — in pencil, but still.",
  "Fine. That one goes in the 'maybe' pile. The pile is small.",
];

const NEUTRAL_LINES = [
  "Acceptable. Barely. Next question.",
  "Noted. Filed. Possibly shredded. We proceed.",
  "That was a sentence. Words were in it. Moving on.",
];

function deriveMood(ctx: DialogueContext): AiMood {
  const { stats, delta, boss } = ctx;
  if (delta.bossPatience <= -8 || stats.bossPatience <= 25) return "furious";
  if (stats.schleimLevel > boss.schleimTolerance) return "suspicious";
  if (delta.hireChance >= 10) return "impressed";
  if (delta.hireChance <= -4) return "annoyed";
  return "neutral";
}

function pickLine(lines: string[], turn: number): string {
  return lines[turn % lines.length];
}

export function mockBossDialogue(ctx: DialogueContext): BossDialogue {
  const { boss, position, turnNumber } = ctx;
  const mood = deriveMood(ctx);

  let reaction: string;
  switch (mood) {
    case "furious":
    case "annoyed":
      reaction = pickLine(IMPATIENT_LINES, turnNumber);
      break;
    case "suspicious":
      reaction = pickLine(SUSPICIOUS_LINES, turnNumber);
      break;
    case "impressed":
      reaction = pickLine(IMPRESSED_LINES, turnNumber);
      break;
    default:
      // Alternate between neutral filler and the boss's own catchphrases.
      reaction =
        turnNumber % 2 === 0
          ? pickLine(NEUTRAL_LINES, turnNumber)
          : boss.catchphrases[turnNumber % boss.catchphrases.length];
  }

  return {
    reaction,
    // Next question comes from the position's pool, in order.
    nextQuestion:
      position.questionPool[turnNumber % position.questionPool.length],
    mood,
  };
}
