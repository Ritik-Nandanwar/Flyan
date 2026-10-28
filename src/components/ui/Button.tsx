import React from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";
import { s } from "../../theme/styles";

/** Standard Flyan action button with optional inverse, compact, and disabled states. */
export function Button({
  label,
  onPress,
  invert = false,
  small = false,
  disabled = false,
  gray = false,
  style,
}: {
  label: string;
  onPress: () => void;
  invert?: boolean;
  small?: boolean;
  disabled?: boolean;
  gray?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        invert && s.buttonInvert,
        small && s.smallButton,
        gray && s.buttonGray,
        disabled && s.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          invert && s.buttonTextInvert,
          small && s.smallButtonText,
          disabled && s.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
