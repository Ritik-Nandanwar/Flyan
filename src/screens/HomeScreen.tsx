import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { FEATURE_FLAGS } from "../config/featureFlags";
import { GAME_LOGOS, PROFILE_ICON } from "../config/gameAssets";
import { GAME_LABELS } from "../config/gameConstants";
import { GameType } from "../games/engines";
import { Attempt } from "../types/app";
import { s } from "../theme/styles";

type HomeScreenProps = {
  dateLabel: string;
  completed: number;
  streak: number;
  games: GameType[];
  getAttempt: (game: GameType) => Attempt | undefined;
  countdown: string;
  onStartGame: (game: GameType) => void;
  onOpenArchive: () => void;
  onOpenProfile: () => void;
};

/** Displays the post-login landing page and enabled games. */
export function HomeScreen({
  dateLabel,
  completed,
  streak,
  games,
  getAttempt,
  countdown,
  onStartGame,
  onOpenArchive,
  onOpenProfile,
}: HomeScreenProps) {
  return (
    <View style={s.page}>
      <View style={s.topline}>
        <View>
          <Label>{dateLabel}</Label>
          <Text style={s.title}>FLYAN.</Text>
        </View>
        {FEATURE_FLAGS.profile && (
          <Pressable
            accessibilityLabel="Profile"
            onPress={onOpenProfile}
            style={s.profile}
          >
            <Image
              source={PROFILE_ICON}
              style={s.profileIcon}
              resizeMode="contain"
              accessibilityLabel="Profile"
            />
          </Pressable>
        )}
      </View>
      {FEATURE_FLAGS.dailyStreaks && (
        <Card style={s.streak}>
          <View style={s.streakCopy}>
            <Label>STREAK</Label>
            <Text style={s.streakBig}>
              {streak} {streak === 1 ? "DAY" : "DAYS"}
            </Text>
            <Text style={s.streakCaption}>in a row.</Text>
          </View>
          <View style={s.doneBadge}>
            <Text style={s.doneText}>
              {completed} / {games.length} DONE
            </Text>
          </View>
        </Card>
      )}
      {games.length ? (
        <View style={s.tiles}>
          {games.map((game, index) => {
            const attempt = getAttempt(game);
            const completedGame =
              attempt?.status === "won" || attempt?.status === "lost";
            const status =
              attempt?.status === "won"
                ? "Solved"
                : attempt?.status === "lost"
                  ? "Failed"
                  : "Play!";
            const statusStyle =
              attempt?.status === "won"
                ? s.statusSolved
                : attempt?.status === "lost"
                  ? s.statusFailed
                  : s.statusOpen;
            return (
              <Pressable
                key={game}
                onPress={() => onStartGame(game)}
                style={[
                  s.tile,
                  attempt?.status === "won" && s.tileWon,
                  attempt?.status === "lost" && s.tileLost,
                ]}
              >
                <View style={s.tileHeader}>
                  <Text style={s.tileMeta}>0{index + 1}</Text>
                  <View style={[s.tileStatus, statusStyle]}>
                    <Text
                      style={[
                        s.tileStatusText,
                        attempt?.status === "lost" && s.tileStatusFailedText,
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
                <Image
                  source={GAME_LOGOS[game]}
                  style={s.tileLogo}
                  resizeMode="contain"
                  accessibilityLabel={`${GAME_LABELS[game]} logo`}
                />
                <Text style={[s.tileTitle, completedGame && s.tileTitleDark]}>
                  {GAME_LABELS[game]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={s.body}>All games are currently disabled.</Text>
      )}
      {FEATURE_FLAGS.archiveCalendar && (
        <View style={s.homeActions}>
          <Button small gray label="PLAY ARCHIVE" onPress={onOpenArchive} />
        </View>
      )}
      {FEATURE_FLAGS.dailyCountdown && (
        <View style={s.countdown}>
          <Text style={s.countdownText}>NEXT PUZZLES IN {countdown}</Text>
        </View>
      )}
    </View>
  );
}
