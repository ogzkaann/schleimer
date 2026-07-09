/**
 * Weighted position matching — deterministic scoring, small controlled
 * randomness only among the top 3 candidates.
 */
import type { Position, SkillCard, StatKey } from "./types";
import { STAT_KEYS } from "./types";

export interface PositionMatchCandidate {
  position: Position;
  score: number;
  tagScore: number;
  statScore: number;
  matchedTags: string[];
}

export interface PositionMatchResult {
  position: Position;
  /** All candidates sorted by score, for debug/dev display. */
  candidates: PositionMatchCandidate[];
  /** The top-3 pool the winner was drawn from. */
  topPool: PositionMatchCandidate[];
}

const TAG_WEIGHT = 12;
const STAT_WEIGHT = 1;

function scoreCandidate(
  position: Position,
  skills: SkillCard[],
): PositionMatchCandidate {
  const skillTags = new Set(skills.flatMap((skill) => skill.hiddenTags));
  const matchedTags = position.requiredTags.filter((tag) => skillTags.has(tag));
  const tagScore = matchedTags.length * TAG_WEIGHT;

  // Dot product of the position's stat weights with the summed skill stats.
  let statScore = 0;
  for (const key of STAT_KEYS) {
    const weight = position.preferredStats[key as StatKey] ?? 0;
    if (weight === 0) continue;
    const total = skills.reduce((sum, skill) => sum + skill.stats[key], 0);
    statScore += weight * total * STAT_WEIGHT;
  }

  return {
    position,
    score: tagScore + statScore,
    tagScore,
    statScore,
    matchedTags,
  };
}

/**
 * Match selected skills to a position. Deterministic ranking; the final
 * pick is weighted-random among the top 3 so runs stay varied.
 */
export function matchPosition(
  skills: SkillCard[],
  positions: Position[],
  rng: () => number = Math.random,
): PositionMatchResult {
  if (positions.length === 0) throw new Error("No positions to match against");

  const candidates = positions
    .map((position) => scoreCandidate(position, skills))
    .sort((a, b) => b.score - a.score);

  const topPool = candidates.slice(0, 3);

  // Weighted draw: better matches are proportionally more likely.
  const totalWeight = topPool.reduce((sum, c) => sum + c.score + 1, 0);
  let roll = rng() * totalWeight;
  let winner = topPool[0];
  for (const candidate of topPool) {
    roll -= candidate.score + 1;
    if (roll <= 0) {
      winner = candidate;
      break;
    }
  }

  return { position: winner.position, candidates, topPool };
}
