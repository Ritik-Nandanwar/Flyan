import React from "react";
import { Text, View } from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { s } from "../theme/styles";

type ProfileScreenProps = {
  completed: number;
  gameCount: number;
  guest: boolean;
  onBack: () => void;
  onSettings: () => void;
  onSignOut: () => void;
};

/** Shows local profile information and account actions. */
export function ProfileScreen({
  completed,
  gameCount,
  guest,
  onBack,
  onSettings,
  onSignOut,
}: ProfileScreenProps) {
  return (
    <View style={s.page}>
      <View style={s.topline}>
        <Button small label="← BACK" onPress={onBack} />
        <Label>PROFILE</Label>
      </View>
      <Text style={s.title}>YOUR RUN.</Text>
      <Card>
        <Text style={s.statBig}>
          {completed} / {gameCount}
        </Text>
        <Label>PUZZLES COMPLETED TODAY</Label>
        <Text style={s.body}>
          {guest ? "Guest account · this device only" : "Account linked"}
        </Text>
      </Card>
      <Button label="SETTINGS" invert onPress={onSettings} />
      {!guest && <Button label="SIGN OUT" invert onPress={onSignOut} />}
    </View>
  );
}
