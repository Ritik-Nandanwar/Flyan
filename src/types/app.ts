import { Mark } from "../games/engines";

/** Tracks which top-level screen the app is currently showing. */
export type Screen =
  "splash" | "auth" | "home" | "archive" | "game" | "result" | "profile";

/** A saved board and move count used by Sudoku undo and redo. */
export type SudokuSnapshot = { board: number[][]; moves: number };

/** Persisted local play state for any one game and puzzle date. */
export type Attempt = {
  status: "in_progress" | "won" | "lost";
  startedAt: number;
  /** Time spent actively playing, excluding time away from the game screen. */
  elapsedMs?: number;
  finishedAt?: number;
  guesses: string[];
  marks: Mark[][];
  board: number[][];
  undoHistory?: SudokuSnapshot[];
  redoHistory?: SudokuSnapshot[];
  solution?: number[][];
  fixed?: boolean[][];
  difficulty?: string;
  moves: number;
  answer?: string;
  mode: "daily" | "archive";
  date: string;
};

/** Indexed collection of locally persisted game attempts. */
export type Save = Record<string, Attempt>;
