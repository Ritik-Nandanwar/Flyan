import React from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useFeedbackColor } from "../../hooks/useFeedbackColor";
import { Mark } from "../../games/engines";

/** Displays a Wordle feedback tile with the app's eased color transition. */
export function FeedbackCell({
  mark,
  style,
  children,
  reduceMotion,
}: {
  mark?: Mark;
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
  reduceMotion: boolean;
}) {
  const backgroundColor = useFeedbackColor(mark, reduceMotion);
  return (
    <Animated.View style={[style, { backgroundColor }]}>
      {children}
    </Animated.View>
  );
}
