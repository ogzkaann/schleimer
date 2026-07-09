/**
 * Deterministic local scoring. No AI, no randomness — the same answer in the
 * same situation always scores the same. AI only ever narrates; this decides.
 */
import type {
  AnswerType,
  BossPersonality,
  GameStats,
  Position,
  ScoreResult,
  SkillCard,
} from "./types";

/** Corporate jargon that pumps the Schleim meter. */
const JARGON = [
  "synergy",
  "synergies",
  "leverage",
  "alignment",
  "aligned",
  "stakeholder",
  "stakeholders",
  "roadmap",
  "holistic",
  "ideate",
  "paradigm",
  "disrupt",
  "disruptive",
  "kpi",
  "kpis",
  "circle back",
  "touch base",
  "low-hanging",
  "win-win",
  "value-add",
  "best-in-class",
  "thought leader",
  "deep dive",
  "move the needle",
  "core competency",
  "bandwidth",
];

/** Direct flattery — even schleimier than jargon. */
const FLATTERY = [
  "visionary",
  "brilliant",
  "genius",
  "inspiring",
  "legendary",
  "an honor",
  "privilege",
  "amazing leader",
  "incredible company",
  "dream company",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "have",
  "will",
  "your",
  "from",
  "when",
  "what",
  "about",
  "would",
  "could",
  "into",
  "them",
  "then",
  "than",
  "very",
]);

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countOccurrences(haystack: string, needles: string[]): number {
  return needles.reduce(
    (count, needle) => (haystack.includes(needle) ? count + 1 : count),
    0,
  );
}

/** Significant words from a phrase (for fuzzy "did they mention the job" checks). */
function significantWords(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/[^a-zäöüß]+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
}

function avgStat(skills: SkillCard[], key: keyof SkillCard["stats"]): number {
  if (skills.length === 0) return 0;
  return skills.reduce((sum, s) => sum + s.stats[key], 0) / skills.length;
}

export interface ScoreAnswerInput {
  answerType: AnswerType;
  /** The final (possibly player-edited) answer text. */
  text: string;
  selectedSkills: SkillCard[];
  position: Position;
  boss: BossPersonality;
  current: GameStats;
}

export function scoreAnswer(input: ScoreAnswerInput): ScoreResult {
  const { answerType, selectedSkills, position, boss, current } = input;
  const text = input.text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const reasons: string[] = [];

  let hire = 0;
  let patience = 0;
  let schleim = 0;

  /* --- position relevance: job tags + title words mentioned in the answer --- */
  const positionKeywords = [
    ...position.requiredTags,
    ...significantWords(position.title),
  ];
  const keywordHits = Math.min(3, countOccurrences(text, positionKeywords));
  if (keywordHits > 0) {
    hire += keywordHits * 4;
    reasons.push(`+${keywordHits * 4} hire: on-topic for the job (${keywordHits} keyword${keywordHits > 1 ? "s" : ""})`);
  }

  /* --- skill usage: player weaves their selected skills into the answer --- */
  let skillHits = 0;
  for (const skill of selectedSkills) {
    const concepts = [...skill.hiddenTags, ...significantWords(skill.label)];
    if (countOccurrences(text, concepts) > 0) skillHits += 1;
  }
  if (skillHits > 0) {
    hire += skillHits * 5;
    reasons.push(`+${skillHits * 5} hire: used ${skillHits} selected skill${skillHits > 1 ? "s" : ""}`);
  }

  /* --- jargon & flattery pump the Schleim meter --- */
  const jargonHits = Math.min(4, countOccurrences(text, JARGON));
  if (jargonHits > 0) {
    schleim += jargonHits * 4;
    reasons.push(`+${jargonHits * 4} schleim: corporate jargon (${jargonHits})`);
  }
  const flatteryHits = Math.min(3, countOccurrences(text, FLATTERY));
  if (flatteryHits > 0) {
    schleim += flatteryHits * 6;
    reasons.push(`+${flatteryHits * 6} schleim: direct flattery (${flatteryHits})`);
  }

  /* --- length: bosses are busy people --- */
  if (wordCount > 60) {
    patience -= 12;
    reasons.push("-12 patience: answer far too long");
  } else if (wordCount > 35) {
    patience -= 6;
    reasons.push("-6 patience: answer dragging on");
  }

  /* --- answer-type character --- */
  switch (answerType) {
    case "safe": {
      hire += 6;
      patience += 2;
      reasons.push("+6 hire, +2 patience: safe and inoffensive");
      break;
    }
    case "bold": {
      const confidenceBonus = Math.floor(avgStat(selectedSkills, "confidence") / 3);
      hire += 10 + confidenceBonus;
      patience -= 4;
      reasons.push(`+${10 + confidenceBonus} hire, -4 patience: bold move${confidenceBonus > 0 ? " (confidence pays off)" : ""}`);
      break;
    }
    case "schleim": {
      schleim += 14;
      if (current.schleimLevel + schleim <= boss.schleimTolerance) {
        hire += 5;
        reasons.push("+14 schleim, +5 hire: flattery still landing");
      } else {
        patience -= 6;
        reasons.push("+14 schleim, -6 patience: boss saw through the flattery");
      }
      break;
    }
    case "honest": {
      patience += 6;
      if (keywordHits + skillHits > 0) {
        hire += 6;
        reasons.push("+6 hire, +6 patience: honest and substantial");
      } else {
        hire -= 4;
        reasons.push("-4 hire, +6 patience: honest but weak");
      }
      break;
    }
    case "chaos": {
      const chaosPower = avgStat(selectedSkills, "chaos");
      if (chaosPower >= 4) {
        hire += 12;
        patience -= boss.patienceBias >= 2 ? 2 : 6;
        reasons.push("+12 hire: chaos landed — memorable candidate");
      } else {
        hire -= 8;
        patience -= 8;
        reasons.push("-8 hire, -8 patience: chaos flopped badly");
      }
      break;
    }
  }

  /* --- interviews are exhausting: baseline patience decay every turn --- */
  patience -= 2;
  reasons.push("-2 patience: baseline interview fatigue");

  /* --- boss personality bias on patience --- */
  const bias = Math.round(boss.patienceBias / 3);
  if (bias !== 0) {
    patience += bias;
    reasons.push(`${bias > 0 ? "+" : ""}${bias} patience: boss temperament`);
  }

  /* --- schleim overdose: past the boss's tolerance, patience drains --- */
  const projectedSchleim = clamp(current.schleimLevel + schleim);
  if (projectedSchleim > boss.schleimTolerance) {
    const overdose = Math.ceil((projectedSchleim - boss.schleimTolerance) / 8);
    patience -= overdose;
    reasons.push(`-${overdose} patience: schleim level above boss tolerance`);
  }

  const stats: GameStats = {
    hireChance: clamp(current.hireChance + hire),
    bossPatience: clamp(current.bossPatience + patience),
    schleimLevel: projectedSchleim,
  };

  return {
    stats,
    delta: {
      hireChance: stats.hireChance - current.hireChance,
      bossPatience: stats.bossPatience - current.bossPatience,
      schleimLevel: stats.schleimLevel - current.schleimLevel,
    },
    reasons,
  };
}
