import React from "react";
import { Text, View } from "react-native";
import { FeedbackCell } from "./FeedbackCell";
import { FeedbackKey } from "./FeedbackKey";
import { Button } from "../ui/Button";
import { s } from "../../theme/styles";
import { FEATURE_FLAGS } from "../../config/featureFlags";
import { keyboardFeedback, Mark } from "../../games/engines";

export type WordPuzzleVariant = "wordle" | "verticle";

type WordPuzzleProps = {
  variant: WordPuzzleVariant;
  guesses: string[];
  marks: Mark[][];
  entry: string;
  reduceMotion: boolean;
  onPressKey: (key: string) => void;
  onSubmit: () => void;
};

/** Renders the shared Wordle-style board and keyboard for both word games. */
export function WordPuzzle({
  variant,
  guesses,
  marks,
  entry,
  reduceMotion,
  onPressKey,
  onSubmit,
}: WordPuzzleProps) {
  const rowCount = variant === "verticle" ? 5 : Math.max(6, guesses.length + 1);
  const columnCount = variant === "verticle" ? 6 : 5;
  const keyFeedback = keyboardFeedback(guesses, marks);

  return (
    <>
      <View style={s.wordGrid}>
        {Array.from({ length: rowCount }, (_, row) => (
          <View key={row} style={s.wordRow}>
            {Array.from({ length: columnCount }, (_, column) => {
              const guess =
                variant === "verticle"
                  ? guesses[column] || (column === guesses.length ? entry : "")
                  : guesses[row] || (row === guesses.length ? entry : "");
              const letter =
                variant === "verticle" ? guess[row] : guess[column];
              const mark =
                variant === "verticle"
                  ? marks[column]?.[row]
                  : marks[row]?.[column];
              return (
                <FeedbackCell
                  key={column}
                  mark={mark}
                  style={[
                    s.letterCell,
                    variant === "verticle" && s.verticleLetterCell,
                  ]}
                  reduceMotion={
                    reduceMotion || !FEATURE_FLAGS.wordFeedbackAnimations
                  }
                >
                  <TextLetter letter={letter || ""} marked={!!mark} />
                </FeedbackCell>
              );
            })}
          </View>
        ))}
      </View>
      <View style={s.keyboard}>
        {[
          [..."QWERTYUIOP"],
          [..."ASDFGHJKL"],
          ["Enter", ..."ZXCVBNM", "⌫"],
        ].map((row) => (
          <View key={row.join("")} style={s.keyRow}>
            {row.map((key) => (
              <FeedbackKey
                key={key}
                label={key}
                mark={keyFeedback[key]}
                wide={key === "⌫" || key === "Enter"}
                reduceMotion={
                  reduceMotion || !FEATURE_FLAGS.keyboardFeedbackAnimations
                }
                onPress={() => onPressKey(key === "Enter" ? "ENTER" : key)}
              />
            ))}
          </View>
        ))}
      </View>
      {variant === "verticle" && (
        <Button label="SUBMIT GUESS" onPress={onSubmit} />
      )}
    </>
  );
}

/** Renders one letter using the shared Wordle typography. */
function TextLetter({ letter, marked }: { letter: string; marked: boolean }) {
  return (
    <View>
      <Text style={[s.letterText, marked && s.letterTextMarked]}>{letter}</Text>
    </View>
  );
}
