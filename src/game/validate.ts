/**
 * Dev-only sanity checks for content and engine. Runs in the browser console
 * during development (see main.tsx); never shipped in production builds.
 */
import { SKILLS } from "../content/skills";
import { POSITIONS } from "../content/positions";
import { BOSSES, getBossById } from "../content/bosses";
import { matchPosition } from "./matching";
import { buildSuggestions } from "./suggestions";
import { scoreAnswer } from "./scoring";
import { evaluateEnding, ENDINGS } from "./endings";
import { MAX_TURNS, STAT_KEYS } from "./types";
import type { EndingId, GameStats } from "./types";

function check(condition: boolean, label: string, failures: string[]): void {
  if (!condition) failures.push(label);
}

export function runDevValidation(): void {
  const failures: string[] = [];
  const seededRng = () => 0.42; // deterministic checks

  /* --- content volume --- */
  check(SKILLS.length >= 60, `at least 60 skills (found ${SKILLS.length})`, failures);
  check(POSITIONS.length >= 8, `at least 8 positions (found ${POSITIONS.length})`, failures);
  check(BOSSES.length >= 3, `at least 3 bosses (found ${BOSSES.length})`, failures);

  /* --- content integrity --- */
  check(new Set(SKILLS.map((s) => s.id)).size === SKILLS.length, "skill ids unique", failures);
  check(new Set(POSITIONS.map((p) => p.id)).size === POSITIONS.length, "position ids unique", failures);
  for (const skill of SKILLS) {
    check(
      STAT_KEYS.every((k) => skill.stats[k] >= 0 && skill.stats[k] <= 10),
      `skill stats in 0-10 range (${skill.id})`,
      failures,
    );
    check(skill.hiddenTags.length > 0, `skill has hiddenTags (${skill.id})`, failures);
  }
  for (const position of POSITIONS) {
    check(
      position.questionPool.length >= MAX_TURNS,
      `question pool covers ${MAX_TURNS} turns (${position.id})`,
      failures,
    );
    try {
      getBossById(position.bossPersonalityId);
    } catch {
      failures.push(`boss exists for position ${position.id}`);
    }
  }

  /* --- matching returns a position --- */
  const picked = SKILLS.slice(0, 3);
  const match = matchPosition(picked, POSITIONS, seededRng);
  check(!!match.position, "matching returns a position", failures);
  check(match.topPool.length === 3, "matching exposes top-3 pool", failures);

  /* --- suggestions: 3 options incl. a schleim one --- */
  const boss = getBossById(match.position.bossPersonalityId);
  const options = buildSuggestions({
    question: match.position.questionPool[0],
    position: match.position,
    selectedSkills: picked,
    boss,
    turnNumber: 1,
    rng: seededRng,
  });
  check(options.length === 3, "3 suggestions generated", failures);
  check(options.some((o) => o.type === "schleim"), "a schleim option exists", failures);
  check(options.every((o) => o.text.length > 20), "suggestions have real text", failures);

  /* --- scoring clamps 0-100 --- */
  const nearMax: GameStats = { hireChance: 99, bossPatience: 1, schleimLevel: 99 };
  const clamped = scoreAnswer({
    answerType: "schleim",
    text: "You are a visionary, brilliant, inspiring thought leader. Synergy! Roadmap! " +
      "Win-win alignment with stakeholders and their holistic KPIs, ".repeat(6),
    selectedSkills: picked,
    position: match.position,
    boss,
    current: nearMax,
  });
  const inRange = (n: number) => n >= 0 && n <= 100;
  check(
    inRange(clamped.stats.hireChance) && inRange(clamped.stats.bossPatience) && inRange(clamped.stats.schleimLevel),
    "scoring clamps to 0-100",
    failures,
  );
  check(clamped.reasons.length > 0, "scoring returns debug reasons", failures);

  /* --- endings reachable --- */
  const endingChecks: Array<[EndingId, GameStats, number]> = [
    ["fired-mid-interview", { hireChance: 50, bossPatience: 0, schleimLevel: 20 }, 3],
    ["linkedin-disaster", { hireChance: 50, bossPatience: 50, schleimLevel: 100 }, 3],
    ["corporate-legend", { hireChance: 90, bossPatience: 50, schleimLevel: 20 }, MAX_TURNS],
    ["hired", { hireChance: 70, bossPatience: 50, schleimLevel: 60 }, MAX_TURNS],
    ["internship-trap", { hireChance: 45, bossPatience: 50, schleimLevel: 20 }, MAX_TURNS],
    ["rejected-pool", { hireChance: 10, bossPatience: 50, schleimLevel: 20 }, MAX_TURNS],
  ];
  for (const [expected, stats, turns] of endingChecks) {
    check(
      evaluateEnding(stats, turns, MAX_TURNS)?.id === expected,
      `ending reachable: ${expected}`,
      failures,
    );
  }
  check(
    evaluateEnding({ hireChance: 50, bossPatience: 50, schleimLevel: 20 }, 2, MAX_TURNS) === null,
    "no premature ending mid-game",
    failures,
  );
  check(Object.keys(ENDINGS).length === 6, "6 endings defined", failures);

  /* --- full simulated playthrough terminates --- */
  let stats: GameStats = { hireChance: 30, bossPatience: 70, schleimLevel: 5 };
  let turns = 0;
  let ended = false;
  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const suggestion = buildSuggestions({
      question: match.position.questionPool[turn - 1],
      position: match.position,
      selectedSkills: picked,
      boss,
      turnNumber: turn,
      rng: seededRng,
    })[0];
    stats = scoreAnswer({
      answerType: suggestion.type,
      text: suggestion.text,
      selectedSkills: picked,
      position: match.position,
      boss,
      current: stats,
    }).stats;
    turns = turn;
    if (evaluateEnding(stats, turn, MAX_TURNS)) {
      ended = true;
      break;
    }
  }
  check(ended && turns <= MAX_TURNS, "simulated game reaches an ending", failures);

  /* --- report --- */
  if (failures.length === 0) {
    console.info(
      `%c[schleimer] engine validation passed — ${SKILLS.length} skills, ${POSITIONS.length} positions, ${BOSSES.length} bosses, ${Object.keys(ENDINGS).length} endings`,
      "color: #5a8a4f; font-weight: bold",
    );
  } else {
    console.error(`[schleimer] engine validation FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
  }
}
