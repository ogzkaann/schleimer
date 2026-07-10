/**
 * Boss dialogue layer — shared types.
 *
 * Two implementations produce `BossDialogue`:
 *   - mockBoss.ts:     canned sarcastic lines, no API key needed (default)
 *   - provider clients: BYOK Gemini or Groq calls, enabled only when the
 *                       player switches to AI Boss and provides their key
 *
 * Hard rule: this layer generates *words only* — reactions, questions and a
 * mood label. All scoring (Hire Chance, Boss Patience, Schleim Level) and all
 * endings are computed deterministically in src/game and must never depend
 * on anything produced here.
 */
import type {
  BossPersonality,
  GameStats,
  Position,
  ScoreDelta,
} from "../game/types";

export const AI_MOODS = [
  "neutral",
  "impressed",
  "annoyed",
  "suspicious",
  "furious",
  "confused",
] as const;

export type AiMood = (typeof AI_MOODS)[number];

export interface BossDialogue {
  /** Boss's spoken reaction to the player's answer. Max 60 words. */
  reaction: string;
  /** Next interview question. Max 25 words. Ignored on the final turn. */
  nextQuestion: string;
  /** Display-only mood label for the boss avatar. */
  mood: AiMood;
}

/**
 * Compact, token-efficient context. Deliberately NOT the full conversation —
 * only the last exchange plus small labels. Hidden scoring internals stay
 * hidden except the short delta/reason labels.
 */
export interface DialogueContext {
  boss: BossPersonality;
  position: Position;
  /** Selected skill card labels only — no stats, no hidden tags. */
  skillLabels: string[];
  stats: GameStats;
  turnNumber: number;
  maxTurns: number;
  lastQuestion: string;
  playerAnswer: string;
  delta: ScoreDelta;
  /** Short reason labels from the deterministic scorer. */
  reasons: string[];
  isFinalTurn: boolean;
}
