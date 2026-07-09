/**
 * Game store — the single source of truth the UI connects to.
 *
 * All numbers come from src/game (deterministic). Boss dialogue is currently
 * canned; the AI layer will replace only the words, never the scores.
 */
import { create } from "zustand";
import type {
  AnswerOption,
  BossPersonality,
  ChatMessage,
  Ending,
  GamePhase,
  Position,
  ScoreResult,
  SkillCard,
} from "../game/types";
import { MAX_TURNS, SKILLS_OFFERED, SKILLS_TO_PICK } from "../game/types";
import { SKILLS } from "../content/skills";
import { POSITIONS } from "../content/positions";
import { getBossById } from "../content/bosses";
import { matchPosition, type PositionMatchResult } from "../game/matching";
import { buildSuggestions } from "../game/suggestions";
import { scoreAnswer } from "../game/scoring";
import { evaluateEnding } from "../game/endings";

const START_STATS = { hireChance: 30, bossPatience: 70, schleimLevel: 5 };

let messageSeq = 0;
function msg(author: ChatMessage["author"], text: string): ChatMessage {
  return { id: `m${++messageSeq}`, author, text };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Placeholder boss reaction — replaced by the AI dialogue layer later. */
function localBossReaction(boss: BossPersonality, score: ScoreResult, turn: number): string {
  const { hireChance, bossPatience } = score.delta;
  if (bossPatience < -8) return "My patience is a nonrenewable resource, and you are strip-mining it.";
  if (score.stats.schleimLevel > boss.schleimTolerance) return "Flattery. How... generous of you. Moving on.";
  if (hireChance >= 10) return "Hm. That was almost impressive. Don't let it go to your head.";
  if (hireChance > 0) return "Acceptable. Barely. Next question.";
  return boss.catchphrases[turn % boss.catchphrases.length];
}

export interface GameStore {
  phase: GamePhase;
  offeredSkills: SkillCard[];
  selectedSkills: SkillCard[];
  position: Position | null;
  boss: BossPersonality | null;
  turnNumber: number;
  maxTurns: typeof MAX_TURNS;
  hireChance: number;
  bossPatience: number;
  schleimLevel: number;
  conversation: ChatMessage[];
  ending: Ending | null;

  /** Current question's suggested answers. */
  suggestions: AnswerOption[];
  selectedAnswerId: string | null;
  /** The (possibly edited) answer text that will be submitted. */
  draftText: string;
  /** Debug info for dev tools. */
  lastScore: ScoreResult | null;
  matchDebug: PositionMatchResult | null;

  startNewGame: () => void;
  chooseSkill: (skillId: string) => void;
  confirmSkills: () => void;
  selectAnswer: (answerId: string) => void;
  editAnswer: (text: string) => void;
  submitAnswer: () => void;
  resetGame: () => void;
}

const INITIAL = {
  phase: "pick-skills" as GamePhase,
  offeredSkills: [] as SkillCard[],
  selectedSkills: [] as SkillCard[],
  position: null,
  boss: null,
  turnNumber: 0,
  maxTurns: MAX_TURNS as typeof MAX_TURNS,
  ...START_STATS,
  conversation: [] as ChatMessage[],
  ending: null,
  suggestions: [] as AnswerOption[],
  selectedAnswerId: null,
  draftText: "",
  lastScore: null,
  matchDebug: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  startNewGame: () => {
    set({
      ...INITIAL,
      offeredSkills: shuffle(SKILLS, Math.random).slice(0, SKILLS_OFFERED),
    });
  },

  chooseSkill: (skillId) => {
    const { phase, offeredSkills, selectedSkills } = get();
    if (phase !== "pick-skills") return;
    if (selectedSkills.some((s) => s.id === skillId)) {
      set({ selectedSkills: selectedSkills.filter((s) => s.id !== skillId) });
      return;
    }
    if (selectedSkills.length >= SKILLS_TO_PICK) return;
    const skill = offeredSkills.find((s) => s.id === skillId);
    if (skill) set({ selectedSkills: [...selectedSkills, skill] });
  },

  confirmSkills: () => {
    const { phase, selectedSkills } = get();
    if (phase !== "pick-skills" || selectedSkills.length !== SKILLS_TO_PICK) return;

    const match = matchPosition(selectedSkills, POSITIONS);
    const position = match.position;
    const boss = getBossById(position.bossPersonalityId);
    const firstQuestion = position.questionPool[0];

    set({
      phase: "interview",
      position,
      boss,
      matchDebug: match,
      turnNumber: 1,
      bossPatience: Math.max(0, Math.min(100, START_STATS.bossPatience + boss.patienceBias * 2)),
      conversation: [
        msg("boss", `${boss.name}, ${boss.title}. Sit. You're here for the ${position.title} role, apparently.`),
        msg("boss", firstQuestion),
      ],
      suggestions: buildSuggestions({
        question: firstQuestion,
        position,
        selectedSkills,
        boss,
        turnNumber: 1,
      }),
      selectedAnswerId: null,
      draftText: "",
    });
  },

  selectAnswer: (answerId) => {
    const option = get().suggestions.find((o) => o.id === answerId);
    if (option) set({ selectedAnswerId: option.id, draftText: option.text });
  },

  editAnswer: (text) => set({ draftText: text }),

  submitAnswer: () => {
    const state = get();
    const { phase, position, boss, selectedSkills, turnNumber } = state;
    const option = state.suggestions.find((o) => o.id === state.selectedAnswerId);
    if (phase !== "interview" || !position || !boss || !option) return;
    const text = state.draftText.trim();
    if (!text) return;

    const score = scoreAnswer({
      answerType: option.type,
      text,
      selectedSkills,
      position,
      boss,
      current: {
        hireChance: state.hireChance,
        bossPatience: state.bossPatience,
        schleimLevel: state.schleimLevel,
      },
    });

    const conversation = [
      ...state.conversation,
      msg("player", text),
      msg("boss", localBossReaction(boss, score, turnNumber)),
    ];
    const ending = evaluateEnding(score.stats, turnNumber, MAX_TURNS);

    if (ending) {
      set({
        ...score.stats,
        conversation: [...conversation, msg("boss", ending.text)],
        ending,
        phase: "verdict",
        lastScore: score,
        suggestions: [],
        selectedAnswerId: null,
        draftText: "",
      });
      return;
    }

    const nextTurn = turnNumber + 1;
    const nextQuestion =
      position.questionPool[(nextTurn - 1) % position.questionPool.length];
    set({
      ...score.stats,
      conversation: [...conversation, msg("boss", nextQuestion)],
      turnNumber: nextTurn,
      lastScore: score,
      suggestions: buildSuggestions({
        question: nextQuestion,
        position,
        selectedSkills,
        boss,
        turnNumber: nextTurn,
      }),
      selectedAnswerId: null,
      draftText: "",
    });
  },

  resetGame: () => set({ ...INITIAL }),
}));
