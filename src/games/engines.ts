import FIVE_LETTER_WORDS from "./data/five-letter-words.json";
import COUNTRY_DATA from "./data/countries.json";

export type GameType = "wordle" | "sudoku" | "verticle" | "worldle";
export type Mark = "correct" | "present" | "absent";
export type Country = {
  name: string;
  aliases: string[];
  alpha2: string;
  alpha3: string;
  lat: number;
  lon: number;
  path: string;
};
export type SudokuPuzzle = {
  board: number[][];
  solution: number[][];
  difficulty: string;
};
export const WORDS = FIVE_LETTER_WORDS;
const WORD_SET = new Set<string>(WORDS);
export const COUNTRIES = COUNTRY_DATA as Country[];

/** Checks whether a value is present in the bundled five-letter dictionary. */
export function isFiveLetterWord(word: string): boolean {
  return WORD_SET.has(word.toLowerCase());
}

/** Produces a stable non-cryptographic index from a text seed. */
function seededIndex(seed: string, length: number): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

// A stable pseudo-random choice gives every client the same shared daily word.
export function answerForDate(puzzleDate: string): string {
  return WORDS[
    seededIndex(`flyan-word:${puzzleDate}`, WORDS.length)
  ].toUpperCase();
}

/** Returns a stable Verticle answer that is guaranteed to differ from Wordle. */
export function verticleAnswerForDate(puzzleDate: string): string {
  const wordleIndex = seededIndex(`flyan-word:${puzzleDate}`, WORDS.length);
  let verticleIndex = seededIndex(`flyan-verticle:${puzzleDate}`, WORDS.length);
  if (verticleIndex === wordleIndex)
    verticleIndex = (verticleIndex + 1) % WORDS.length;
  return WORDS[verticleIndex].toUpperCase();
}

/** Selects the same bundled country for a given archive or daily date. */
export function countryForDate(puzzleDate: string): Country {
  return COUNTRIES[
    seededIndex(`flyan-country:${puzzleDate}`, COUNTRIES.length)
  ];
}

/** Scores exact and misplaced letters while accounting for duplicates. */
export function scoreWord(guess: string, answer: string): Mark[] {
  const result: Mark[] = Array(guess.length).fill("absent");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) result[i] = "correct";
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++)
    if (result[i] !== "correct" && (remaining[guess[i]] || 0) > 0) {
      result[i] = "present";
      remaining[guess[i]]--;
    }
  return result;
}

/** Merges guess marks, keeping each key's strongest feedback state. */
export function keyboardFeedback(
  guesses: string[],
  marks: Mark[][],
): Record<string, Mark> {
  const rank: Record<Mark, number> = { absent: 1, present: 2, correct: 3 };
  const feedback: Record<string, Mark> = {};
  guesses.forEach((guess, row) => {
    [...guess].forEach((letter, column) => {
      const mark = marks[row]?.[column];
      if (mark && (!feedback[letter] || rank[mark] > rank[feedback[letter]]))
        feedback[letter] = mark;
    });
  });
  return feedback;
}

/** Checks whether a digit fits a Sudoku row, column, and box. */
export function validSudokuEntry(
  board: number[][],
  row: number,
  col: number,
  value: number,
): boolean {
  const size = board.length;
  const boxHeight = size === 6 ? 2 : size === 9 ? 3 : 0;
  const boxWidth = 3;
  if (
    !boxHeight ||
    board.some((line) => line.length !== size) ||
    row < 0 ||
    row >= size ||
    col < 0 ||
    col >= size ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > size
  )
    return false;
  for (let i = 0; i < size; i++)
    if (i !== col && board[row][i] === value) return false;
  for (let i = 0; i < size; i++)
    if (i !== row && board[i][col] === value) return false;
  const r0 = Math.floor(row / boxHeight) * boxHeight,
    c0 = Math.floor(col / boxWidth) * boxWidth;
  for (let r = r0; r < r0 + boxHeight; r++)
    for (let c = c0; c < c0 + boxWidth; c++)
      if ((r !== row || c !== col) && board[r][c] === value) return false;
  return true;
}

/** Generates a randomized valid 6×6 Sudoku solution and clue board. */
export async function getRandomSudoku(): Promise<SudokuPuzzle> {
  // Build a shuffled 6×6 solution with 2×3 regions, then remove clues.
  const shuffled = (values: number[]) =>
    [...values].sort(() => Math.random() - 0.5);
  const bands = shuffled([0, 1, 2]).flatMap((band) =>
    shuffled([0, 1]).map((row) => band * 2 + row),
  );
  const stacks = shuffled([0, 1]).flatMap((stack) =>
    shuffled([0, 1, 2]).map((col) => stack * 3 + col),
  );
  const symbols = shuffled([1, 2, 3, 4, 5, 6]);
  const solution = bands.map((r) =>
    stacks.map((c) => symbols[(r * 3 + Math.floor(r / 2) + c) % 6]),
  );
  const board = solution.map((row) =>
    row.map((value) => (Math.random() < 0.48 ? 0 : value)),
  );
  return { board, solution, difficulty: "Random" };
}
/** Returns the great-circle distance between two geographic points. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = (n: number) => (n * Math.PI) / 180,
    dLat = rad(b.lat - a.lat),
    dLon = rad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Converts a bearing from one country point to another into an eight-way arrow. */
export function directionHint(
  from: Country,
  to: Country,
): { direction: string; arrow: string } {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const p1 = toRad(from.lat),
    p2 = toRad(to.lat),
    dl = toRad(to.lon - from.lon);
  const y = Math.sin(dl) * Math.cos(p2);
  const x =
    Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const points = [
    { direction: "NORTH", arrow: "↑" },
    { direction: "NORTHEAST", arrow: "↗" },
    { direction: "EAST", arrow: "→" },
    { direction: "SOUTHEAST", arrow: "↘" },
    { direction: "SOUTH", arrow: "↓" },
    { direction: "SOUTHWEST", arrow: "↙" },
    { direction: "WEST", arrow: "←" },
    { direction: "NORTHWEST", arrow: "↖" },
  ];
  return points[Math.round(bearing / 45) % 8];
}
/** Returns whole elapsed seconds without allowing negative durations. */
export function elapsedSeconds(startedAt: number, now = Date.now()) {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}
