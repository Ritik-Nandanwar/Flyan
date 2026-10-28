const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
let buildDirectory;
let engine;
let featureFlags;
let attempts;
let dates;

before(() => {
  buildDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "flyan-engine-tests-"),
  );
  const compiler = path.join(
    projectRoot,
    "node_modules",
    "typescript",
    "bin",
    "tsc",
  );
  const result = spawnSync(
    process.execPath,
    [
      compiler,
      "--ignoreConfig",
      "--module",
      "commonjs",
      "--target",
      "es2020",
      "--moduleResolution",
      "bundler",
      "--esModuleInterop",
      "--resolveJsonModule",
      "--skipLibCheck",
      "--outDir",
      buildDirectory,
      path.join(projectRoot, "src", "games", "engines.ts"),
      path.join(projectRoot, "src", "games", "attempts.ts"),
      path.join(projectRoot, "src", "utils", "dates.ts"),
      path.join(projectRoot, "src", "config", "featureFlags.ts"),
    ],
    { cwd: projectRoot, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  engine = require(path.join(buildDirectory, "games", "engines.js"));
  featureFlags = require(
    path.join(buildDirectory, "config", "featureFlags.js"),
  );
  attempts = require(path.join(buildDirectory, "games", "attempts.js"));
  dates = require(path.join(buildDirectory, "utils", "dates.js"));
});

after(() => {
  if (buildDirectory)
    fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test("five-letter dictionary accepts valid entries and rejects wrong lengths", () => {
  assert.equal(engine.isFiveLetterWord("crane"), true);
  assert.equal(engine.isFiveLetterWord("Crane"), true);
  assert.equal(engine.isFiveLetterWord("cat"), false);
});

test("date-based word answers are stable valid five-letter words", () => {
  const first = engine.answerForDate("2026-10-27");
  assert.equal(engine.answerForDate("2026-10-27"), first);
  assert.equal(first.length, 5);
  assert.equal(engine.isFiveLetterWord(first), true);
});

test("word scoring handles exact, misplaced, absent, and duplicate letters", () => {
  assert.deepEqual(engine.scoreWord("ALLEY", "APPLE"), [
    "correct",
    "present",
    "absent",
    "present",
    "absent",
  ]);
});

test("keyboard feedback preserves the strongest mark for a repeated key", () => {
  const feedback = engine.keyboardFeedback(
    ["A", "A", "A"],
    [["absent"], ["present"], ["correct"]],
  );
  assert.equal(feedback.A, "correct");
});

test("6x6 Sudoku entries reject row, column, and 2x3 box conflicts", () => {
  const board = Array.from({ length: 6 }, () => Array(6).fill(0));
  board[0][0] = 1;
  assert.equal(engine.validSudokuEntry(board, 0, 1, 1), false);
  assert.equal(engine.validSudokuEntry(board, 1, 0, 1), false);
  assert.equal(engine.validSudokuEntry(board, 1, 2, 1), false);
  assert.equal(engine.validSudokuEntry(board, 2, 1, 1), true);
  assert.equal(engine.validSudokuEntry(board, 0, 0, 1), true);
});

test("random Sudoku boards are valid 6x6 puzzles with 2x3 regions", async () => {
  for (let round = 0; round < 4; round += 1) {
    const { board, solution } = await engine.getRandomSudoku();
    const digits = [1, 2, 3, 4, 5, 6];
    assert.equal(board.length, 6);
    assert.equal(solution.length, 6);
    for (let row = 0; row < 6; row += 1) {
      assert.deepEqual(
        [...solution[row]].sort((a, b) => a - b),
        digits,
      );
      assert.deepEqual(
        solution.map((line) => line[row]).sort((a, b) => a - b),
        digits,
      );
      for (let column = 0; column < 6; column += 1) {
        assert.ok(
          board[row][column] === 0 ||
            board[row][column] === solution[row][column],
        );
      }
    }
    for (let row = 0; row < 6; row += 2) {
      for (let column = 0; column < 6; column += 3) {
        const region = [];
        for (let y = row; y < row + 2; y += 1) {
          for (let x = column; x < column + 3; x += 1)
            region.push(solution[y][x]);
        }
        assert.deepEqual(
          region.sort((a, b) => a - b),
          digits,
        );
      }
    }
  }
});

test("geographic helpers return expected distance and direction", () => {
  assert.equal(engine.haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 }), 0);
  assert.equal(
    engine.directionHint(
      {
        lat: 0,
        lon: 0,
        name: "Origin",
        aliases: [],
        alpha2: "OR",
        alpha3: "ORG",
        path: "",
      },
      {
        lat: 0,
        lon: 90,
        name: "East",
        aliases: [],
        alpha2: "EA",
        alpha3: "EST",
        path: "",
      },
    ).direction,
    "EAST",
  );
  assert.ok(engine.haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }) > 100);
});

test("elapsed time is floored and never negative", () => {
  assert.equal(engine.elapsedSeconds(1_000, 3_999), 2);
  assert.equal(engine.elapsedSeconds(4_000, 3_000), 0);
});

test("attempt creation and keys preserve game, date, and mode", () => {
  assert.equal(
    attempts.attemptKey("wordle", "2026-10-27", "daily"),
    "daily:2026-10-27:wordle",
  );
  assert.equal(
    attempts.attemptKey("wordle", "2026-10-27", "archive"),
    "archive:2026-10-27:wordle",
  );
  const attempt = attempts.createAttempt("worldle", "2026-10-27", "daily");
  assert.equal(attempt.status, "in_progress");
  assert.equal(attempt.answer, engine.countryForDate("2026-10-27").name);
  assert.deepEqual(attempt.undoHistory, []);
  assert.deepEqual(attempt.redoHistory, []);
});

test("daily streak counts consecutive dates with any one game win", () => {
  const won = (date, game) => ({
    ...attempts.createAttempt(game, date, "daily"),
    status: "won",
  });
  const save = {
    firstGame: won("2026-10-26", "wordle"),
    anotherGameSameDay: won("2026-10-26", "worldle"),
    yesterday: won("2026-10-27", "sudoku"),
    today: won("2026-10-28", "verticle"),
    oldWin: won("2026-10-24", "verticle"),
    archiveWin: { ...won("2026-10-28", "worldle"), mode: "archive" },
  };
  assert.equal(attempts.dailyWinStreak(save, "2026-10-28"), 3);
  assert.equal(attempts.dailyWinStreak(save, "2026-10-27"), 2);
});

test("date helpers return ISO calendar strings", () => {
  assert.match(dates.today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(dates.yesterday(), /^\d{4}-\d{2}-\d{2}$/);
});

test("each supported game and app capability can be controlled by a boolean flag", () => {
  const flags = featureFlags.FEATURE_FLAGS;
  for (const name of ["wordle", "verticle", "sudoku", "worldle"]) {
    assert.equal(typeof flags[name], "boolean");
    assert.equal(featureFlags.isGameEnabled(name), flags[name]);
  }
  for (const value of Object.values(flags))
    assert.equal(typeof value, "boolean");

  const wordleWasEnabled = flags.wordle;
  flags.wordle = false;
  assert.equal(featureFlags.isGameEnabled("wordle"), false);
  flags.wordle = wordleWasEnabled;

  const profileWasEnabled = flags.profile;
  flags.profile = false;
  assert.equal(featureFlags.isFeatureEnabled("profile"), false);
  flags.profile = profileWasEnabled;
});
