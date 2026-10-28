import React from "react";
import { Text } from "react-native";
import { s } from "../../theme/styles";

/** Renders a short uppercase label using Flyan's shared typography. */
export function Label({ children }: any) {
  return <Text style={s.label}>{children}</Text>;
}
