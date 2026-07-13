/**
 * InterviewPanel — the center of the game. Renders one of three phase views:
 * skill selection → interview chat → ending screen. All data comes from the
 * store; this file contains zero game logic.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/gameStore";
import { SKILLS_TO_PICK } from "../../game/types";
import type { AnswerOption, ChatMessage, Difficulty, SkillCard } from "../../game/types";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../../game/difficulty";

/* ------------------------------ skill selection ---------------------------- */

const dealVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

function SkillPickerCard({
  skill,
  selected,
  index,
}: {
  skill: SkillCard;
  selected: boolean;
  index: number;
}) {
  const chooseSkill = useGameStore((s) => s.chooseSkill);
  return (
    <motion.button
      type="button"
      custom={index}
      variants={dealVariants}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.97 }}
      onClick={() => chooseSkill(skill.id)}
      className={`rounded-xl border px-4 py-3 text-left shadow-card transition hover:shadow-card-hover ${
        selected
          ? "border-ember-500 bg-ember-400/10 ring-1 ring-ember-500"
          : "border-cream-300 bg-cream-50 hover:border-ember-400"
      }`}
    >
      <motion.div animate={selected ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 0.25 }}>
        <p className="text-sm font-semibold">{skill.label}</p>
        <p className="mt-1 text-xs text-ink-500">{skill.description}</p>
      </motion.div>
    </motion.button>
  );
}

function SkillPicker() {
  const offeredSkills = useGameStore((s) => s.offeredSkills);
  const selectedSkills = useGameStore((s) => s.selectedSkills);
  const difficulty = useGameStore((s) => s.difficulty);
  const dailyChallenge = useGameStore((s) => s.dailyChallenge);
  const confirmSkills = useGameStore((s) => s.confirmSkills);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const ready = selectedSkills.length === SKILLS_TO_PICK;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-1 font-display text-lg font-bold">
          Choose your {SKILLS_TO_PICK} hidden talents
        </p>
        <p className="mb-4 text-sm text-ink-500">
          Pick the lies you can defend for eight consecutive questions.
        </p>
        <div className="mb-4 rounded-xl border border-cream-300 bg-cream-100 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-300">
              Difficulty
            </p>
            <button
              type="button"
              onClick={dailyChallenge ? startNewGame : startDailyChallenge}
              className="rounded-full border border-ember-400/40 bg-ember-400/10 px-3 py-1 text-[11px] font-semibold text-ember-700 transition hover:bg-ember-400/20"
            >
              {dailyChallenge ? "Switch to random deal" : "Daily Challenge"}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {DIFFICULTY_ORDER.map((value: Difficulty) => {
              const config = DIFFICULTIES[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDifficulty(value)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    difficulty === value
                      ? "border-ember-500 bg-cream-50 ring-1 ring-ember-500"
                      : "border-cream-300 hover:border-ember-400"
                  }`}
                >
                  <span className="block text-xs font-semibold">{config.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-ink-500">
                    {config.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {offeredSkills.map((skill, index) => (
            <SkillPickerCard
              key={skill.id}
              skill={skill}
              index={index}
              selected={selectedSkills.some((s) => s.id === skill.id)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-cream-200 p-4">
        <p className="text-sm text-ink-500">
          {selectedSkills.length}/{SKILLS_TO_PICK} selected
          {ready ? " — HR is already judging you." : ""}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={confirmSkills}
          className="rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-card transition hover:bg-ember-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start interview
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- chat view ------------------------------- */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isBoss = message.author === "boss";
  return (
    <motion.div
      initial={{ opacity: 0, x: isBoss ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        isBoss
          ? "rounded-tl-md bg-cream-200"
          : "ml-auto rounded-tr-md bg-ember-500/10 ring-1 ring-ember-400/30"
      }`}
    >
      {message.text}
    </motion.div>
  );
}

const SUGGESTION_HINTS: Record<AnswerOption["type"], string> = {
  safe: "Low risk, low glory.",
  honest: "Patience up. Respect... pending.",
  bold: "Big hire points, costs patience.",
  chaos: "Memorable. Possibly a security incident.",
  schleim: "Short-term gain, long-term LinkedIn.",
};

function AnswerComposer() {
  const suggestions = useGameStore((s) => s.suggestions);
  const selectedAnswerId = useGameStore((s) => s.selectedAnswerId);
  const draftText = useGameStore((s) => s.draftText);
  const bossThinking = useGameStore((s) => s.bossThinking);
  const aiFallback = useGameStore((s) => s.aiFallback);
  const selectAnswer = useGameStore((s) => s.selectAnswer);
  const editAnswer = useGameStore((s) => s.editAnswer);
  const submitAnswer = useGameStore((s) => s.submitAnswer);

  const wordCount = draftText.trim().split(/\s+/).filter(Boolean).length;
  const lengthWarning =
    wordCount > 60
      ? "The boss stopped listening 20 words ago."
      : wordCount > 35
        ? "Getting long. Bosses bill by the minute."
        : null;

  return (
    <div className="border-t border-cream-200 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-500">
          Pick a response, then edit it before you speak:
        </p>
        {aiFallback && (
          <span className="shrink-0 rounded-full border border-ember-400/40 bg-ember-400/10 px-2.5 py-0.5 text-[10px] font-medium text-ember-700">
            Boss lost Wi-Fi and continued manually.
          </span>
        )}
      </div>
      <div className={`grid gap-2 sm:grid-cols-3 ${bossThinking ? "pointer-events-none opacity-50" : ""}`}>
        {suggestions.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={bossThinking}
            onClick={() => selectAnswer(option.id)}
            className={`rounded-xl border px-3 py-2 text-left shadow-card transition hover:shadow-card-hover ${
              option.id === selectedAnswerId
                ? "border-ember-500 bg-ember-400/10 ring-1 ring-ember-500"
                : "border-cream-300 bg-cream-50 hover:border-ember-400"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-ember-600">
              {option.label}
            </p>
            <p className="mt-1 line-clamp-3 text-xs text-ink-700">{option.text}</p>
            <p className="mt-1 text-[10px] italic text-ink-300">
              {SUGGESTION_HINTS[option.type]}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <textarea
          value={draftText}
          onChange={(event) => editAnswer(event.target.value)}
          placeholder="Pick a suggestion above — then make it yours."
          disabled={!selectedAnswerId || bossThinking}
          rows={3}
          className="w-full resize-none rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm shadow-card outline-none transition focus:border-ember-400 disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs italic text-ink-300">
            {lengthWarning ?? `${wordCount} word${wordCount === 1 ? "" : "s"}`}
          </p>
          <button
            type="button"
            onClick={() => void submitAnswer()}
            disabled={!selectedAnswerId || draftText.trim().length === 0 || bossThinking}
            className="rounded-xl bg-ember-500 px-5 py-2 text-sm font-semibold text-cream-50 shadow-card transition hover:bg-ember-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {bossThinking ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tl-md bg-cream-200 px-4 py-3 text-sm text-ink-500"
    >
      <span className="italic">Boss is thinking</span>
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
          className="h-1 w-1 rounded-full bg-ink-500"
        />
      ))}
    </motion.div>
  );
}

function ChatView() {
  const conversation = useGameStore((s) => s.conversation);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const maxTurns = useGameStore((s) => s.maxTurns);
  const position = useGameStore((s) => s.position);
  const bossThinking = useGameStore((s) => s.bossThinking);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation.length, bossThinking]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-cream-200 px-5 py-2">
        <span className="text-xs text-ink-300">
          Position: {position?.title}
        </span>
        <span className="text-xs font-medium text-ink-500">
          Question {turnNumber} / {maxTurns}
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {conversation.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {bossThinking && <ThinkingBubble />}
      </div>
      <AnswerComposer />
    </div>
  );
}

/* -------------------------------- ending view ------------------------------ */

function EndingView() {
  const ending = useGameStore((s) => s.ending);
  const position = useGameStore((s) => s.position);
  const difficulty = useGameStore((s) => s.difficulty);
  const hireChance = useGameStore((s) => s.hireChance);
  const bossPatience = useGameStore((s) => s.bossPatience);
  const schleimLevel = useGameStore((s) => s.schleimLevel);
  const lastScore = useGameStore((s) => s.lastScore);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const [copied, setCopied] = useState(false);

  if (!ending || !position) return null;
  const bullets = (lastScore?.reasons ?? []).slice(0, 3);
  const shareResult = async () => {
    const text = [
      `Schleimer: ${ending.title}`,
      `Position: ${position.title}`,
      `Hire ${hireChance} · Patience ${bossPatience} · Schleim ${schleimLevel}`,
      `Difficulty: ${DIFFICULTIES[difficulty].label}`,
      "https://schleimer.vercel.app/",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-lg rounded-card border border-cream-300 bg-cream-50 p-8 text-center shadow-card-hover"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          Official verdict
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">
          {ending.title}
          <span className="text-ember-500">.</span>
        </h2>
        <p className="mt-3 text-sm text-ink-700">{ending.text}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Hire Chance", hireChance],
            ["Patience", bossPatience],
            ["Schleim", schleimLevel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-cream-200 px-3 py-2">
              <p className="text-lg font-bold tabular-nums">{value}%</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-500">{label}</p>
            </div>
          ))}
        </div>

        {bullets.length > 0 && (
          <div className="mt-5 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-300">
              What sealed your fate
            </p>
            <ul className="space-y-1">
              {bullets.map((reason) => (
                <li key={reason} className="text-xs text-ink-500">
                  • {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void shareResult()}
            className="rounded-xl border border-cream-300 bg-cream-100 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ember-400"
          >
            {copied ? "Copied" : "Share result"}
          </button>
          <button
            type="button"
            onClick={() => startNewGame()}
            className="rounded-xl bg-ember-500 px-6 py-2.5 text-sm font-semibold text-cream-50 shadow-card transition hover:bg-ember-600"
          >
            Apply somewhere else
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------------------- panel ---------------------------------- */

const PHASE_TITLES = {
  "pick-skills": "Application Materials",
  interview: "Interview in Progress",
  verdict: "Interview Concluded",
} as const;

export function InterviewPanel() {
  const phase = useGameStore((s) => s.phase);

  return (
    <section
      aria-label="Interview"
      className="flex min-h-0 flex-col rounded-card bg-cream-50 shadow-card"
    >
      <div className="border-b border-cream-200 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          {PHASE_TITLES[phase]}
        </h2>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {phase === "pick-skills" && <SkillPicker />}
          {phase === "interview" && <ChatView />}
          {phase === "verdict" && <EndingView />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
