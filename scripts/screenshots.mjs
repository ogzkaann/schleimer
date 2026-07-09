/**
 * Capture README screenshots into docs/assets/.
 *
 * Usage: start the dev server, then
 *   node scripts/screenshots.mjs [devServerUrl]
 *
 * Uses puppeteer-core with a locally installed Edge/Chrome — no browser
 * download. Drives the game through the dev-only window.__schleimer handle.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.argv[2] ?? "http://localhost:5173";
const OUT_DIR = resolve(import.meta.dirname, "../docs/assets");

const BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const executablePath = BROWSER_CANDIDATES.find((path) => existsSync(path));
if (!executablePath) {
  console.error("No Chrome/Edge found. Edit BROWSER_CANDIDATES in this script.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: "shell",
  defaultViewport: { width: 1400, height: 850, deviceScaleFactor: 1.5 },
});

try {
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.__schleimer !== undefined");
  // Let fonts/animations settle.
  const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms));

  // Headless throttles framer-motion's rAF mid-remount, which can freeze the
  // boss emoji at opacity 0. Finish the animation's end state before shooting.
  const finishAnimations = () =>
    page.evaluate(() => {
      const face = document.querySelector('section[aria-label="Your interviewer"] span[role="img"]');
      if (face) {
        face.style.opacity = "1";
        face.style.transform = "none";
      }
    });

  const game = (fn) =>
    page.evaluate(
      (body) => new Function("s", "a", `return (${body})(s, a)`)(
        window.__schleimer.game.getState(),
        window.__schleimer.ai.getState(),
      ),
      fn.toString(),
    );

  /* --- 1. skill picker with two cards selected --- */
  await game((s) => {
    s.startNewGame();
  });
  await settle(400);
  await game((s) => {
    const ids = s.offeredSkills.map((k) => k.id);
    s.chooseSkill(ids[1]);
    s.chooseSkill(ids[4]);
  });
  await settle();
  await finishAnimations();
  await page.screenshot({ path: `${OUT_DIR}/skill-picker.png` });
  console.log("✓ skill-picker.png");

  /* --- 2. active interview with AI settings visible --- */
  await game((s, a) => {
    a.setMode("ai");
    const ids = s.offeredSkills.map((k) => k.id);
    s.chooseSkill(ids[7]);
    s.confirmSkills();
  });
  await settle(400);
  // Play two turns so the chat shows a real exchange.
  for (const pick of [2, 1]) {
    await page.evaluate(async (index) => {
      const s = window.__schleimer.game.getState();
      s.selectAnswer(s.suggestions[index].id);
      await s.submitAnswer();
    }, pick);
    await settle(600);
  }
  await settle();
  await finishAnimations();
  await page.screenshot({ path: `${OUT_DIR}/interview-ai-status.png` });
  console.log("✓ interview-ai-status.png");

  /* --- 3. ending screen --- */
  await page.evaluate(async () => {
    const s = () => window.__schleimer.game.getState();
    let guard = 0;
    while (s().phase === "interview" && guard++ < 12) {
      s().selectAnswer(s().suggestions[guard % 3].id);
      await s().submitAnswer();
    }
  });
  await settle(2500);
  await finishAnimations();
  await page.screenshot({ path: `${OUT_DIR}/ending-screen.png` });
  console.log("✓ ending-screen.png");
} finally {
  await browser.close();
}
