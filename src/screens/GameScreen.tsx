import React from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { SudokuBoard } from "../components/games/SudokuBoard";
import { WordPuzzle } from "../components/games/WordPuzzle";
import { WorldleGame } from "../components/games/WorldleGame";
import { FEATURE_FLAGS } from "../config/featureFlags";
import { GAME_LOGOS } from "../config/gameAssets";
import { GAME_LABELS } from "../config/gameConstants";
import { Attempt } from "../types/app";
import {
  answerForDate,
  COUNTRIES,
  GameType,
  verticleAnswerForDate,
} from "../games/engines";
import { s } from "../theme/styles";

type GameScreenProps = {
  screen: "game" | "result";
  selected: GameType;
  attempt: Attempt;
  entry: string;
  seconds: number;
  sudokuErrorCountdown: number | null;
  reduceMotion: boolean;
  selectedSudokuCell: [number, number] | null;
  suggestions: typeof COUNTRIES;
  onBack: () => void;
  onWordSubmit: () => void;
  onVerticleSubmit: () => void;
  onPressKey: (key: string) => void;
  onSelectSudokuCell: (row: number, column: number) => void;
  onSudokuNumber: (value: number) => void;
  onSudokuUndo: () => void;
  onSudokuRedo: () => void;
  onSudokuClear: () => void;
  onEntryChange: (value: string) => void;
  onWorldleGuess: () => void;
  onReplay: () => void;
};

/** Routes the active puzzle to its game UI and renders the shared result state. */
export function GameScreen({
  screen,
  selected,
  attempt,
  entry,
  seconds,
  sudokuErrorCountdown,
  reduceMotion,
  selectedSudokuCell,
  suggestions,
  onBack,
  onWordSubmit,
  onVerticleSubmit,
  onPressKey,
  onSelectSudokuCell,
  onSudokuNumber,
  onSudokuUndo,
  onSudokuRedo,
  onSudokuClear,
  onEntryChange,
  onWorldleGuess,
  onReplay,
}: GameScreenProps) {
  const country = attempt.answer
    ? COUNTRIES.find((item) => item.name === attempt.answer)
    : undefined;

  const avoidKeyboard = selected === "worldle" && screen === "game";

  return (
    <KeyboardAvoidingView
      style={s.keyboardAvoidingContainer}
      enabled={avoidKeyboard}
      behavior={
        avoidKeyboard
          ? Platform.OS === "ios"
            ? "padding"
            : "height"
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          s.page,
          (selected === "wordle" || selected === "verticle") && s.wordGamePage,
        ]}
      >
        <View
          style={[
            s.topline,
            (selected === "wordle" || selected === "verticle") && s.wordTopline,
          ]}
        >
          <Button small label="← HOME" onPress={onBack} />
          <View style={s.gameBrand}>
            <Image
              source={GAME_LOGOS[selected]}
              style={s.headerLogo}
              resizeMode="contain"
              accessibilityLabel={`${GAME_LABELS[selected]} logo`}
            />
            <Text style={s.gameHeading}>{GAME_LABELS[selected]}</Text>
          </View>
          {FEATURE_FLAGS.gameHelp && (
            <Button
              small
              label="?"
              onPress={() =>
                Alert.alert(
                  `${GAME_LABELS[selected]} RULES`,
                  getHelpText(selected),
                )
              }
            />
          )}
        </View>
        <View style={s.meta}>
          <Label>
            {attempt.mode === "archive" ? "ARCHIVE" : "DAILY"} · {attempt.date}
          </Label>
          {FEATURE_FLAGS.gameTimer && (
            <Text style={s.timer}>{formatTime(seconds)}</Text>
          )}
        </View>
        {screen === "result" ? (
          <ScrollView style={s.flexFill} contentContainerStyle={s.gameContent}>
            <Card
              style={[
                s.resultCard,
                attempt.status === "won" ? s.wonCard : s.lostCard,
              ]}
            >
              <Label>
                {attempt.status === "won"
                  ? "DAILY FOUR COMPLETE"
                  : "PUZZLE COMPLETE"}
              </Label>
              <Text style={s.resultTitle}>
                {attempt.status === "won"
                  ? "Congratulations!"
                  : "Better luck next time."}
              </Text>
              <Text style={s.body}>
                {GAME_LABELS[selected]} · {attempt.date}
              </Text>
              {FEATURE_FLAGS.gameTimer && (
                <Text style={s.resultTime}>TIME {formatTime(seconds)}</Text>
              )}
              <Label>
                {attempt.moves} {selected === "sudoku" ? "MOVES" : "GUESSES"}
              </Label>
              {(selected === "wordle" || selected === "verticle") &&
                attempt.status === "lost" && (
                  <Text style={s.body}>
                    The word was{" "}
                    <Text style={s.answerText}>
                      {selected === "verticle"
                        ? verticleAnswerForDate(attempt.date)
                        : answerForDate(attempt.date)}
                    </Text>
                  </Text>
                )}
              {selected === "worldle" && attempt.status === "lost" && (
                <Text style={s.body}>
                  The country was{" "}
                  <Text style={s.answerTextRegular}>{attempt.answer}</Text>
                </Text>
              )}
            </Card>
            <View style={s.resultActions}>
              {FEATURE_FLAGS.replay && (
                <Button
                  small
                  label="PLAY AGAIN"
                  invert
                  style={s.resultActionButton}
                  onPress={onReplay}
                />
              )}
              <Button
                small
                label="BACK TO GAMES"
                style={[
                  s.resultActionButton,
                  !FEATURE_FLAGS.replay && s.resultActionButtonFull,
                ]}
                onPress={onBack}
              />
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={s.flexFill}
            automaticallyAdjustKeyboardInsets={selected === "worldle"}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              s.gameContent,
              (selected === "wordle" || selected === "verticle") &&
                s.wordGameContent,
            ]}
          >
            {(selected === "wordle" || selected === "verticle") && (
              <WordPuzzle
                variant={selected}
                guesses={attempt.guesses}
                marks={attempt.marks}
                entry={entry}
                reduceMotion={reduceMotion}
                onPressKey={onPressKey}
                onSubmit={
                  selected === "wordle" ? onWordSubmit : onVerticleSubmit
                }
              />
            )}
            {selected === "sudoku" && (
              <SudokuBoard
                attempt={attempt}
                selectedCell={selectedSudokuCell}
                onFocusCell={onSelectSudokuCell}
                onEnterNumber={onSudokuNumber}
                onUndo={onSudokuUndo}
                onRedo={onSudokuRedo}
                onClear={onSudokuClear}
              />
            )}
            {selected === "worldle" && (
              <WorldleGame
                answer={country}
                date={attempt.date}
                guesses={attempt.guesses}
                entry={entry}
                suggestions={suggestions}
                onEntryChange={onEntryChange}
                onGuess={onWorldleGuess}
              />
            )}
          </ScrollView>
        )}
        <Modal
          visible={selected === "sudoku" && sudokuErrorCountdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => undefined}
        >
          <View style={s.errorOverlay}>
            <View style={s.errorDialog}>
              <Text style={s.errorTitle}>INCORRECT NUMBER</Text>
              <Text style={s.errorMessage}>
                Try again in {sudokuErrorCountdown ?? 0} seconds.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Formats elapsed game time as MM:SS. */
function formatTime(totalSeconds: number): string {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
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
