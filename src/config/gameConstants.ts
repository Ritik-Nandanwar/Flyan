import { GameType } from "../games/engines";

/** All supported games, independent of which ones are currently enabled. */
export const ALL_GAMES: GameType[] = [
  "worldle",
  "wordle",
  "sudoku",
  "verticle",
];

/** User-facing game names rendered in headers, cards, and results. */
export const GAME_LABELS: Record<GameType, string> = {
  worldle: "WORLDLE",
  wordle: "WORDLE",
  sudoku: "SUDOKU",
  verticle: "VERTICLE",
};
