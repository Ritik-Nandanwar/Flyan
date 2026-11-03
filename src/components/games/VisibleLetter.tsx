import React from "react";
import { Text, View } from "react-native";
import { s } from "../../theme/styles";

/** Keeps capital I distinct from the tile border on iOS and Android. */
export function VisibleLetter({
  value,
  size = "tile",
  marked = false,
}: {
  value: string;
  size?: "tile" | "key";
  marked?: boolean;
}) {
  if (value === "I") {
    return (
      <View
        accessible={false}
        style={[s.capitalILetter, size === "key" && s.capitalIKey]}
      >
        <View
          style={[
            s.capitalIStroke,
            s.capitalIBar,
            size === "key" && s.capitalIKeyBar,
          ]}
        />
        <View
          style={[
            s.capitalIStroke,
            s.capitalIStem,
            size === "key" && s.capitalIKeyStem,
          ]}
        />
        <View
          style={[
            s.capitalIStroke,
            s.capitalIBar,
            size === "key" && s.capitalIKeyBar,
          ]}
        />
      </View>
    );
  }

  return (
    <Text
      style={
        size === "key"
          ? s.keyText
          : [s.letterText, marked && s.letterTextMarked]
      }
    >
      {value}
    </Text>
  );
}
