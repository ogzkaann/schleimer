/**
 * Core domain types for Schleimer.
 *
 * Design constraints:
 * - Scoring is deterministic and local (src/game/scoring.ts).
 * - The AI layer only ever produces boss dialogue, never numbers.
 */

/* ---------------------------------- skills --------------------------------- */

export type StatKey =
  | "logic"
  | "confidence"
  | "technical"
  | "chaos"
  | "corporate"
  | "honesty"
  | "schleim"
  | "creativity";

export const STAT_KEYS: StatKey[] = [
  "logic",
  "confidence",
  "technical",
  "chaos",
  "corporate",
  "honesty",
  "schleim",
  "creativity",
];

/** Each stat ranges 0–10. */
export type SkillStats = Record<StatKey, number>;

export interface SkillCard {
  id: string;
  /** Card title, e.g. "I can look serious in meetings". */
  label: string;
  /** Short funny flavor text. */
  description: string;
  /** Matching tags, hidden from the player, e.g. "meetings", "excel". */
  hiddenTags: string[];
  stats: SkillStats;
}

/* --------------------------------- positions ------------------------------- */

export interface Position {
  id: string;
  /** e.g. "Excel Crisis Manager" */
  title: string;
  description: string;
  /** Tags this job secretly looks for in skill cards. */
  requiredTags: string[];
  /** Stat weights this job values (subset; higher = more important). */
  preferredStats: Partial<SkillStats>;
  bossPersonalityId: string;
  /** Sarcastic interview questions, drawn in order. */
  questionPool: string[];
}

/* ----------------------------------- boss ---------------------------------- */

export type BossMood = "neutral" | "pleased" | "suspicious" | "furious";

export interface BossPersonality {
  id: string;
  name: string;
  title: string;
  /** Short style description, later fed to the AI dialogue layer. */
  tone: string;
  catchphrases: string[];
  /**
   * -10..+10. Applied to patience changes: positive = forgiving,
   * negative = every answer costs extra patience.
   */
  patienceBias: number;
  /**
   * 0–100. Schleim Level above this threshold starts draining patience.
   */
  schleimTolerance: number;
}

/* --------------------------------- answers --------------------------------- */

export type AnswerType = "safe" | "bold" | "schleim" | "chaos" | "honest";

export interface AnswerOption {
  id: string;
  /** Button label shown to the player, e.g. "Safe", "Bold", "Schleimer". */
  label: string;
  type: AnswerType;
  text: string;
  /** Hidden scoring hints — which concepts this suggestion already uses. */
  hints?: {
    usedSkillIds: string[];
    keywords: string[];
  };
}

/* ------------------------------- conversation ------------------------------ */

export interface ChatMessage {
  id: string;
  author: "boss" | "player";
  text: string;
}

/* ---------------------------------- scoring -------------------------------- */

export interface GameStats {
  /** 0–100. Win when high enough at the end. */
  hireChance: number;
  /** 0–100. Fired when it hits 0. */
  bossPatience: number;
  /** 0–100. Sycophancy meter — 100 ends the interview in disgrace. */
  schleimLevel: number;
}

export interface ScoreDelta {
  hireChance: number;
  bossPatience: number;
  schleimLevel: number;
}

export interface ScoreResult {
  stats: GameStats;
  delta: ScoreDelta;
  /** Short labels explaining each contribution, for debug/dev use. */
  reasons: string[];
}

/* ---------------------------------- endings -------------------------------- */

export type EndingId =
  | "hired"
  | "internship-trap"
  | "rejected-pool"
  | "linkedin-disaster"
  | "corporate-legend"
  | "fired-mid-interview";

export interface Ending {
  id: EndingId;
  title: string;
  /** Sarcastic closing line shown on the verdict screen. */
  text: string;
}

/* --------------------------------- game state ------------------------------ */

export type GamePhase = "pick-skills" | "interview" | "verdict";

export const MAX_TURNS = 8;
export const SKILLS_TO_PICK = 3;
export const SKILLS_OFFERED = 10;

export interface GameState {
  phase: GamePhase;
  /** Cards dealt for this run; player picks SKILLS_TO_PICK of them. */
  offeredSkills: SkillCard[];
  selectedSkills: SkillCard[];
  position: Position | null;
  boss: BossPersonality | null;
  /** 1-based interview turn; game ends after MAX_TURNS. */
  turnNumber: number;
  maxTurns: typeof MAX_TURNS;
  hireChance: number;
  bossPatience: number;
  schleimLevel: number;
  conversation: ChatMessage[];
  ending: Ending | null;
}
