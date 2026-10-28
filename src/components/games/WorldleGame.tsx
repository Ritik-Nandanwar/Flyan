import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  Country,
  COUNTRIES,
  directionHint,
  haversineKm,
} from "../../games/engines";
import { FEATURE_FLAGS } from "../../config/featureFlags";
import { s } from "../../theme/styles";
import { C } from "../../theme/colors";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";

type WorldleGameProps = {
  answer?: Country;
  date: string;
  guesses: string[];
  entry: string;
  suggestions: Country[];
  onEntryChange: (value: string) => void;
  onGuess: () => void;
};

/** Renders the Worldle silhouette, country guesses, suggestions, and input. */
export function WorldleGame({
  answer,
  date,
  guesses,
  entry,
  suggestions,
  onEntryChange,
  onGuess,
}: WorldleGameProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  return (
    <>
      <Text style={s.worldPrompt}>GUESS THE COUNTRY</Text>
      <Card style={s.mapPanel}>
        <View style={s.countrySilhouette}>
          {FEATURE_FLAGS.worldleSilhouette && answer && (
            <Svg
              width={260}
              height={180}
              viewBox="0 0 320 220"
              style={s.countrySvg}
            >
              <Path d={answer.path} fill={C.ink} />
            </Svg>
          )}
        </View>
        <Text style={s.tileTitle}>
          COUNTRY #{new Date(`${date}T00:00:00Z`).getUTCDate()}
        </Text>
      </Card>
      {guesses.map((guessName, index) => {
        const guess = COUNTRIES.find((country) => country.name === guessName);
        if (!guess || !answer) return null;
        const isCorrect = guessName === answer.name;
        const hint = directionHint(guess, answer);
        return (
          <View
            key={`${guessName}-${index}`}
            style={[s.guessLine, !isCorrect && s.wrongGuess]}
          >
            <Text style={[s.tileTitle, s.guessCountryText]}>{guessName}</Text>
            {FEATURE_FLAGS.worldleDistanceHints && (
              <Text style={s.label}>
                {Math.round(haversineKm(guess, answer)).toLocaleString()} KM ·{" "}
                {hint.arrow} {hint.direction}
              </Text>
            )}
          </View>
        );
      })}
      {FEATURE_FLAGS.worldleCountrySuggestions &&
        showSuggestions &&
        entry.trim().length >= 2 && (
          <View style={s.suggestions}>
            {suggestions.length ? (
              suggestions.map((country) => (
                <Pressable
                  key={country.alpha2}
                  accessibilityRole="button"
                  onPress={() => {
                    setShowSuggestions(false);
                    onEntryChange(country.name);
                  }}
                  style={s.suggestion}
                >
                  <Text style={s.suggestionText}>{country.name}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={s.caption}>NO MATCHES</Text>
            )}
          </View>
        )}
      <View style={s.worldEntryRow}>
        <TextInput
          value={entry}
          onChangeText={(value) => {
            setShowSuggestions(true);
            onEntryChange(value);
          }}
          placeholder="TYPE A COUNTRY"
          autoCapitalize="words"
          style={s.worldInput}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onGuess}
          style={s.guessButton}
        >
          <Text style={s.guessButtonText}>GUESS</Text>
        </Pressable>
      </View>
      <Label>{guesses.length} / 6 GUESSES</Label>
    </>
  );
}
