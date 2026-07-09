/**
 * Boss AI adapter boundary.
 *
 * The game talks to a `BossBrain` and never to a provider directly. Two
 * implementations are planned:
 *   - mockBossBrain: canned sarcastic lines, no API key needed (default)
 *   - apiBossBrain:  real LLM calls, enabled only when a key is configured
 *
 * The brain generates *dialogue only* — questions and reactions. All scoring
 * (Hire Chance, Boss Patience, Schleim Level) is computed deterministically
 * in src/game and must never depend on AI output.
 */
import type { BossMood, BossPersonality, Position } from "../game/types";

export interface BossReactionRequest {
  position: Position;
  boss: BossPersonality;
  mood: BossMood;
  playerAnswer: string;
}

export interface BossBrain {
  /** The boss's next interview question. */
  nextQuestion(position: Position, questionIndex: number): Promise<string>;
  /** The boss's spoken reaction to the player's answer. */
  reactTo(request: BossReactionRequest): Promise<string>;
}
