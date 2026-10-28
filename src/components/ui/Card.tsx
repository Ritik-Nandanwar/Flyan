import React from "react";
import { View } from "react-native";
import { s } from "../../theme/styles";

/** Adds the shared card surface and accepts screen-specific style extensions. */
export function Card({ children, style }: any) {
  return <View style={[s.card, style]}>{children}</View>;
}
