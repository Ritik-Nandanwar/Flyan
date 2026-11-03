import React, { useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import { useFeedbackColor } from "../../hooks/useFeedbackColor";
import { Mark } from "../../games/engines";
import { s } from "../../theme/styles";

/** Keyboard key that animates to its highest-priority letter feedback color. */
export function FeedbackKey({
  label,
  mark,
  onPress,
  wide,
  reduceMotion,
}: {
  label: string;
  mark?: Mark;
  onPress: () => void;
  wide: boolean;
  reduceMotion: boolean;
}) {
  const backgroundColor = useFeedbackColor(mark, reduceMotion);
  const [pressScale] = useState(() => new Animated.Value(1));
  const animatePress = (toValue: number) => {
    if (reduceMotion) return;
    Animated.spring(pressScale, {
      toValue,
      speed: 30,
      bounciness: 3,
      // Keep key press and feedback animations on the same JS driver. The key
      // view also animates its background color, which cannot use the native driver.
      useNativeDriver: false,
    }).start();
  };
  return (
    <Pressable
      accessibilityLabel={
        label === "⌫" ? "Delete" : `${label}${mark ? `, ${mark}` : ""}`
      }
      android_ripple={{ color: "#00000018" }}
      onPressIn={() => animatePress(0.95)}
      onPressOut={() => animatePress(1)}
      onPress={onPress}
    >
      <Animated.View
        style={[
          s.key,
          wide && s.keyWide,
          label === "Enter" && s.keyEnter,
          { backgroundColor },
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <Text
          style={[
            s.keyText,
            label === "Enter" && s.keyTextAction,
            mark && s.keyTextMarked,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
