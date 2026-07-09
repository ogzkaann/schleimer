/**
 * Core domain types for Schleimer.
 *
 * Design constraints:
 * - Scoring is deterministic and local (see future src/game/scoring.ts).
 * - The AI layer only ever produces boss dialogue, never numbers.
 */

export interface SkillCard {
  id: string;
  name: string;
  /** Flavor text shown on the card. */
  description: string;
  /** Deterministic scoring tags, e.g. "flattery", "competence", "chaos". */
  tags: string[];
}

export interface JobPosition {
  id: string;
  /** e.g. "Senior Synergy Evangelist" */
  title: string;
  /** e.g. "GlobalCorp Dynamics GmbH" */
  company: string;
  /** What the boss secretly values in this role. */
  hiddenExpectations: string[];
}

export type BossMood = "neutral" | "pleased" | "suspicious" | "furious";

export interface GameStats {
  /** 0–100. Win when high enough at the final question. */
  hireChance: number;
  /** 0–100. Game over when it hits 0. */
  bossPatience: number;
  /** 0–100. Sycophancy meter — too high backfires. */
  schleimLevel: number;
}

export interface ChatMessage {
  id: string;
  author: "boss" | "player";
  text: string;
}

export type GamePhase = "pick-skills" | "interview" | "verdict";
