import React from "react";
import { Pressable, Text, View } from "react-native";
import { GameType } from "../../games/engines";
import { GAME_LABELS } from "../../config/gameConstants";
import { s } from "../../theme/styles";

type GameHelpPanelProps = {
  game: GameType;
  onClose: () => void;
};

/** Shows game instructions inline above the board so the help is always visible. */
export function GameHelpPanel({ game, onClose }: GameHelpPanelProps) {
  return (
    <View style={s.gameHelpPanel} accessibilityRole="summary">
      <View style={s.gameHelpHeader}>
        <Text style={s.gameHelpTitle}>HOW TO PLAY {GAME_LABELS[game]}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close game instructions"
          hitSlop={12}
          onPress={onClose}
          style={s.gameHelpClose}
        >
          <Text style={s.gameHelpCloseText}>×</Text>
        </Pressable>
      </View>
      <Text style={s.gameHelpText}>{getHelpText(game)}</Text>
    </View>
  );
}

/** Provides concise rules text for the selected game. */
function getHelpText(game: GameType): string {
  if (game === "sudoku") {
    return "Fill the random 6×6 board. Each row, column and 2×3 box uses digits 1–6.";
  }
  if (game === "verticle") {
    return "Enter five-letter guesses. Green is exact, yellow is in the word, and grey is absent.";
  }
  if (game === "wordle") {
    return "Keep guessing the five-letter word. Green is exact, yellow is in the word, and grey is absent.";
  }
  return "Name the country. Each wrong guess shows distance and direction to the answer.";
}
