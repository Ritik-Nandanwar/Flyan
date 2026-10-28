import React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";

type ProcessingOverlayProps = {
  caption: string;
  visible?: boolean;
  mode?: "screen" | "modal" | "inline";
};

/** Shows a shared, accessible progress spinner with a task-specific caption. */
export function ProcessingOverlay({
  caption,
  visible = true,
  mode = "modal",
}: ProcessingOverlayProps) {
  if (!visible) return null;

  const content = (
    <View style={s.processingCard}>
      <ActivityIndicator size="large" color={C.ink} />
      <Text style={s.processingCaption} accessibilityLiveRegion="polite">
        {caption}
      </Text>
    </View>
  );

  if (mode === "inline") {
    return <View style={s.processingInline}>{content}</View>;
  }

  if (mode === "screen") {
    return <View style={s.processingScreen}>{content}</View>;
  }

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={s.processingBackdrop}>{content}</View>
    </Modal>
  );
}
