import { GameType } from "../games/engines";

/**
 * Central build-time feature switches. Set a value to false to hide and disable
 * that game or capability without editing screen components.
 */
export const FEATURE_FLAGS = {
  authentication: true,
  guestPlay: true,
  profile: true,
  archiveCalendar: true,
  dailyStreaks: true,
  dailyCountdown: true,
  gameTimer: true,
  gameHelp: true,
  replay: true,
  wordle: true,
  verticle: true,
  sudoku: true,
  worldle: true,
  wordFeedbackAnimations: true,
  keyboardFeedbackAnimations: true,
  sudokuUndoRedo: true,
  sudokuCellClear: true,
  worldleSilhouette: true,
  worldleCountrySuggestions: true,
  worldleDistanceHints: true,
} as const;

/** Returns whether a named app capability is enabled. */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

/** Returns whether the requested game is included in app navigation. */
export function isGameEnabled(game: GameType): boolean {
  return FEATURE_FLAGS[game];
}
