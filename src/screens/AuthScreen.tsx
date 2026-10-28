import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { ProcessingOverlay } from "../components/ui/ProcessingOverlay";
import { FEATURE_FLAGS } from "../config/featureFlags";
import { s } from "../theme/styles";

type AuthScreenProps = {
  tab: "login" | "signup";
  onTabChange: (tab: "login" | "signup") => void;
  onSubmit: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onContinueAsGuest: () => void;
};

/** Shows the placeholder authentication and local guest entry screen. */
export function AuthScreen({
  tab,
  onTabChange,
  onSubmit,
  onForgotPassword,
  onContinueAsGuest,
}: AuthScreenProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [processingCaption, setProcessingCaption] = useState("");

  /** Validates form fields and delegates account creation or login. */
  const submit = async () => {
    if (tab === "signup" && password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter your password.");
      return;
    }
    if (!email.trim() || !password || (tab === "signup" && !username.trim())) {
      Alert.alert("Missing details", "Complete all required fields first.");
      return;
    }
    setProcessingCaption(
      tab === "login" ? "SIGNING YOU IN SECURELY…" : "CREATING YOUR ACCOUNT…",
    );
    setBusy(true);
    try {
      await onSubmit(email, password, username);
    } catch (error) {
      Alert.alert("Unable to authenticate", authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  /** Requests a password reset for the entered email address. */
  const forgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your email address first.");
      return;
    }
    setProcessingCaption("SENDING YOUR RESET LINK…");
    setBusy(true);
    try {
      await onForgotPassword(email);
      Alert.alert("Check your email", "A password reset link has been sent.");
    } catch (error) {
      Alert.alert("Unable to reset password", authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={s.flexFill}
        contentContainerStyle={s.authContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <Label>DAILY PUZZLES / EST. 2026</Label>
        <Text style={s.title}>PLAY YOUR{"\n"}DAILY FOUR.</Text>
        <Text style={s.body}>A fresh set of puzzles. One shot each day.</Text>
        <View style={s.segment}>
          <Pressable
            onPress={() => onTabChange("login")}
            style={[s.segmentItem, tab === "login" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, tab === "login" && s.segmentTextActive]}
            >
              LOG IN
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onTabChange("signup")}
            style={[s.segmentItem, tab === "signup" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, tab === "signup" && s.segmentTextActive]}
            >
              SIGN UP
            </Text>
          </Pressable>
        </View>
        {tab === "signup" && (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="USERNAME"
            autoCapitalize="none"
            style={s.input}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="EMAIL"
          autoCapitalize="none"
          keyboardType="email-address"
          style={s.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="PASSWORD"
          secureTextEntry
          autoCapitalize="none"
          style={s.input}
        />
        {tab === "signup" && (
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="CONFIRM PASSWORD"
            secureTextEntry
            autoCapitalize="none"
            style={s.input}
          />
        )}
        <Button
          label={
            busy
              ? "PLEASE WAIT…"
              : tab === "login"
                ? "LOG IN"
                : "CREATE ACCOUNT"
          }
          disabled={busy}
          onPress={submit}
        />
        {FEATURE_FLAGS.guestPlay && (
          <Button
            label="CONTINUE AS GUEST"
            invert
            onPress={onContinueAsGuest}
          />
        )}
        <Text style={s.caption}>
          Guest progress stays on this device. Sign in for synced history.
        </Text>
        <Pressable onPress={forgotPassword}>
          <Text style={s.link}>FORGOT PASSWORD?</Text>
        </Pressable>
      </ScrollView>
      <ProcessingOverlay
        visible={busy}
        caption={processingCaption}
        mode="modal"
      />
    </KeyboardAvoidingView>
  );
}

/** Converts common Firebase authentication errors into readable guidance. */
function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account already uses this email.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Check your internet connection and retry.",
    "auth/operation-not-allowed":
      "Enable Email/Password sign-in in Firebase Authentication settings.",
  };
  return messages[code] || "Please check your details and try again.";
}
