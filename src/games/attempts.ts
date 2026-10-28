import { countryForDate, GameType } from "./engines";
import { Attempt, Save } from "../types/app";

/** Creates the persistence key for one game, date, and daily/archive mode. */
export function attemptKey(
  game: GameType,
  date: string,
  mode: "daily" | "archive",
): string {
  return `${mode}:${date}:${game}`;
}

/** Creates an empty attempt record with game-specific starting data. */
export function createAttempt(
  game: GameType,
  date: string,
  mode: "daily" | "archive",
): Attempt {
  return {
    status: "in_progress",
    startedAt: Date.now(),
    elapsedMs: 0,
    guesses: [],
    marks: [],
    board: [],
    moves: 0,
    mode,
    date,
    undoHistory: [],
    redoHistory: [],
    answer: game === "worldle" ? countryForDate(date).name : undefined,
  };
}

/** Counts consecutive UTC dates with at least one daily game win. */
export function dailyWinStreak(save: Save, currentDate: string): number {
  const wonDates = new Set(
    Object.values(save)
      .filter((attempt) => attempt.mode === "daily" && attempt.status === "won")
      .map((attempt) => attempt.date),
  );
  let date = currentDate;
  if (!wonDates.has(date)) date = shiftUtcDate(date, -1);
  let streak = 0;
  while (wonDates.has(date)) {
    streak++;
    date = shiftUtcDate(date, -1);
  }
  return streak;
}

/** Moves an ISO calendar date by whole UTC days without local timezone drift. */
function shiftUtcDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
