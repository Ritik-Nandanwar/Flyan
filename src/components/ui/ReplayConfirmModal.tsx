import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Attempt } from "../../types/app";
import { s } from "../../theme/styles";

type ReplayConfirmModalProps = {
  status: Extract<Attempt["status"], "won" | "lost"> | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms replay while making clear that the saved result stays unchanged. */
export function ReplayConfirmModal({
  status,
  onCancel,
  onConfirm,
}: ReplayConfirmModalProps) {
  return (
    <Modal
      visible={status !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={s.processingBackdrop}>
        <View style={s.replayDialog}>
          <Text style={s.replayTitle}>REPLAY THIS PUZZLE?</Text>
          <Text style={s.replayBody}>
            Your saved status is {status === "won" ? "Solved" : "Failed"}. It
            will not change when you replay.
          </Text>
          <View style={s.replayActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[s.replayButton, s.replayCancel]}
            >
              <Text style={[s.replayButtonText, s.replayCancelText]}>
                CANCEL
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={s.replayButton}
            >
              <Text style={s.replayButtonText}>REPLAY</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
