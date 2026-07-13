/**
 * Game store — the single source of truth the UI connects to.
 *
 * All numbers come from src/game (deterministic). Boss dialogue comes from
 * src/ai: the mock boss by default, or a BYOK provider when enabled — either way
 * only the words change, never the scores.
 */
import { create } from "zustand";
import type {
  AnswerOption,
  BossPersonality,
  ChatMessage,
  Difficulty,
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
import { applyDifficultyToBoss, startingStatsFor } from "../game/difficulty";
import { createSeededRandom, dailyChallengeSeed } from "../game/seededRandom";
import type { AiMood, BossDialogue, DialogueContext } from "../ai/bossBrain";
import { mockBossDialogue } from "../ai/mockBoss";
import { generateProviderBossDialogue } from "../ai/aiProvider";
import { useAiSettings, aiBossEnabled, defaultModelFor } from "../ai/aiSettings";
import { aiRunMode, useRunHistory } from "./runHistory";

const DAILY_MATCH_SALT = 0x9e3779b9;

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

export interface GameStore {
  phase: GamePhase;
  difficulty: Difficulty;
  dailyChallenge: boolean;
  dailySeed: number | null;
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
  /** True while boss dialogue is being generated — Send stays disabled. */
  bossThinking: boolean;
  /** Latest mood label from the dialogue layer (mock or AI). */
  bossMoodLabel: AiMood | null;
  /** True when the last turn fell back from AI to the mock boss. */
  aiFallback: boolean;
  /** Number of answered turns on which an AI provider call was attempted. */
  aiAttemptedTurns: number;
  /** Number of answered turns whose final wording came from the AI provider. */
  aiDialogueTurns: number;
  /** Debug info for dev tools. */
  lastScore: ScoreResult | null;
  matchDebug: PositionMatchResult | null;

  startNewGame: () => void;
  startDailyChallenge: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  chooseSkill: (skillId: string) => void;
  confirmSkills: () => void;
  selectAnswer: (answerId: string) => void;
  editAnswer: (text: string) => void;
  submitAnswer: () => Promise<void>;
  resetGame: () => void;
}

const INITIAL = {
  phase: "pick-skills" as GamePhase,
  difficulty: "professional" as Difficulty,
  dailyChallenge: false,
  dailySeed: null as number | null,
  offeredSkills: [] as SkillCard[],
  selectedSkills: [] as SkillCard[],
  position: null,
  boss: null,
  turnNumber: 0,
  maxTurns: MAX_TURNS as typeof MAX_TURNS,
  ...startingStatsFor("professional"),
  conversation: [] as ChatMessage[],
  ending: null,
  suggestions: [] as AnswerOption[],
  selectedAnswerId: null,
  draftText: "",
  bossThinking: false,
  bossMoodLabel: null,
  aiFallback: false,
  aiAttemptedTurns: 0,
  aiDialogueTurns: 0,
  lastScore: null,
  matchDebug: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  startNewGame: () => {
    const difficulty = get().difficulty;
    set({
      ...INITIAL,
      difficulty,
      ...startingStatsFor(difficulty),
      offeredSkills: shuffle(SKILLS, Math.random).slice(0, SKILLS_OFFERED),
    });
  },

  startDailyChallenge: () => {
    const difficulty = get().difficulty;
    const dailySeed = dailyChallengeSeed();
    set({
      ...INITIAL,
      difficulty,
      dailyChallenge: true,
      dailySeed,
      ...startingStatsFor(difficulty),
      offeredSkills: shuffle(SKILLS, createSeededRandom(dailySeed)).slice(0, SKILLS_OFFERED),
    });
  },

  setDifficulty: (difficulty) => {
    if (get().phase !== "pick-skills") return;
    set({ difficulty, ...startingStatsFor(difficulty) });
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
    const { phase, selectedSkills, difficulty, dailySeed } = get();
    if (phase !== "pick-skills" || selectedSkills.length !== SKILLS_TO_PICK) return;

    const matchRng =
      dailySeed === null ? Math.random : createSeededRandom(dailySeed ^ DAILY_MATCH_SALT);
    const match = matchPosition(selectedSkills, POSITIONS, matchRng);
    const position = match.position;
    const boss = applyDifficultyToBoss(
      getBossById(position.bossPersonalityId),
      difficulty,
    );
    const firstQuestion = position.questionPool[0];
    const startStats = startingStatsFor(difficulty);

    set({
      phase: "interview",
      position,
      boss,
      matchDebug: match,
      turnNumber: 1,
      bossMoodLabel: null,
      aiFallback: false,
      ...startStats,
      bossPatience: Math.max(
        0,
        Math.min(100, startStats.bossPatience + boss.patienceBias * 2),
      ),
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
    if (get().bossThinking) return;
    const option = get().suggestions.find((o) => o.id === answerId);
    if (option) set({ selectedAnswerId: option.id, draftText: option.text });
  },

  editAnswer: (text) => set({ draftText: text }),

  submitAnswer: async () => {
    const state = get();
    const { phase, position, boss, selectedSkills, turnNumber } = state;
    const option = state.suggestions.find((o) => o.id === state.selectedAnswerId);
    if (phase !== "interview" || state.bossThinking || !position || !boss || !option) return;
    const text = state.draftText.trim();
    if (!text) return;

    // 1) Deterministic scoring — always first, always local.
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
    const ending = evaluateEnding(score.stats, turnNumber, MAX_TURNS);
    const lastQuestion =
      [...state.conversation].reverse().find((m) => m.author === "boss")?.text ?? "";

    // Apply the scored answer immediately; dialogue arrives when it arrives.
    set({
      ...score.stats,
      conversation: [...state.conversation, msg("player", text)],
      lastScore: score,
      bossThinking: true,
      selectedAnswerId: null,
      draftText: "",
    });

    // 2) Boss dialogue — words only. AI if enabled, mock otherwise/on failure.
    const context: DialogueContext = {
      boss,
      position,
      skillLabels: selectedSkills.map((s) => s.label),
      stats: score.stats,
      turnNumber,
      maxTurns: MAX_TURNS,
      lastQuestion,
      playerAnswer: text,
      delta: score.delta,
      reasons: score.reasons,
      isFinalTurn: ending !== null,
    };

    let dialogue: BossDialogue | null = null;
    let fellBack = false;
    let aiSucceeded = false;
    const aiEnabled = aiBossEnabled();
    if (aiEnabled) {
      const { provider, apiKey, model } = useAiSettings.getState();
      try {
        dialogue = await generateProviderBossDialogue(
          provider,
          apiKey.trim(),
          model.trim() || defaultModelFor(provider),
          context,
        );
        aiSucceeded = true;
      } catch {
        // Any AI failure: shrug, fall back, keep the game moving.
        fellBack = true;
      }
    }
    if (!dialogue) dialogue = mockBossDialogue(context);

    // Guard against reset/restart while the boss was thinking.
    const now = get();
    if (now.phase !== "interview" || now.turnNumber !== turnNumber) return;

    const conversation = [...now.conversation, msg("boss", dialogue.reaction)];
    const aiAttemptedTurns = now.aiAttemptedTurns + (aiEnabled ? 1 : 0);
    const aiDialogueTurns = now.aiDialogueTurns + (aiSucceeded ? 1 : 0);

    if (ending) {
      useRunHistory.getState().addRun({
        ending: ending.title,
        position: position.title,
        boss: boss.name,
        difficulty: now.difficulty,
        finalScores: score.stats,
        date: new Date().toISOString(),
        dailyChallenge: now.dailyChallenge,
        aiMode: aiRunMode(aiAttemptedTurns, aiDialogueTurns, turnNumber),
      });
      set({
        conversation: [...conversation, msg("boss", ending.text)],
        ending,
        phase: "verdict",
        bossThinking: false,
        bossMoodLabel: dialogue.mood,
        aiFallback: fellBack,
        aiAttemptedTurns,
        aiDialogueTurns,
        suggestions: [],
      });
      return;
    }

    const nextTurn = turnNumber + 1;
    set({
      conversation: [...conversation, msg("boss", dialogue.nextQuestion)],
      turnNumber: nextTurn,
      bossThinking: false,
      bossMoodLabel: dialogue.mood,
      aiFallback: fellBack,
      aiAttemptedTurns,
      aiDialogueTurns,
      suggestions: buildSuggestions({
        question: dialogue.nextQuestion,
        position,
        selectedSkills,
        boss,
        turnNumber: nextTurn,
      }),
    });
  },

  resetGame: () => set({ ...INITIAL }),
}));
