import { useEffect, useState } from "react";
import { Animated, Easing } from "react-native";
import { C } from "../theme/colors";
import { Mark } from "../games/engines";

/** Shares the eased Wordle color transition between tiles and keyboard keys. */
export function useFeedbackColor(
  mark: Mark | undefined,
  reduceMotion: boolean,
) {
  const [progress] = useState(() => new Animated.Value(0));
  const colors: Record<Mark, string> = {
    correct: C.success,
    present: C.warning,
    absent: "#929292",
  };

  useEffect(() => {
    if (!mark) {
      progress.setValue(0);
      return;
    }
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mark, progress, reduceMotion]);

  return mark
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [C.paper, colors[mark]],
      })
    : C.paper;
}
