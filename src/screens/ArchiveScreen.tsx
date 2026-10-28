import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { GameType } from "../games/engines";
import { Attempt } from "../types/app";
import { s } from "../theme/styles";
import { GAME_LABELS } from "../config/gameConstants";

type ArchiveScreenProps = {
  date: string;
  today: string;
  games: GameType[];
  getAttempt: (game: GameType, date: string) => Attempt | undefined;
  onDateChange: (date: string) => void;
  onStartGame: (game: GameType, date: string, replay: boolean) => void;
  onBack: () => void;
};

/** Displays October's archive calendar and date-specific game launchers. */
export function ArchiveScreen({
  date,
  today,
  games,
  getAttempt,
  onDateChange,
  onStartGame,
  onBack,
}: ArchiveScreenProps) {
  const currentMonth = today.slice(0, 7);
  const oldestMonth = shiftMonth(currentMonth, -2);
  const [visibleMonth, setVisibleMonth] = useState(date.slice(0, 7));
  const monthStart = new Date(`${visibleMonth}-01T00:00:00Z`);
  const leadingDays = monthStart.getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(
      Number(visibleMonth.slice(0, 4)),
      Number(visibleMonth.slice(5, 7)),
      0,
    ),
  ).getUTCDate();
  const monthLabel = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  /** Moves the visible month and keeps the selected archive date in sync. */
  const navigateMonth = (offset: number) => {
    const nextMonth = shiftMonth(visibleMonth, offset);
    const [year, monthNumber] = nextMonth.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const day = Math.min(Number(date.slice(8, 10)), lastDay);
    const nextDate = `${nextMonth}-${String(day).padStart(2, "0")}`;
    setVisibleMonth(nextMonth);
    onDateChange(nextDate > today ? today : nextDate);
  };

  return (
    <ScrollView
      style={s.flexFill}
      contentContainerStyle={s.archivePage}
      showsVerticalScrollIndicator
    >
      <View style={s.topline}>
        <Button small label="← BACK" onPress={onBack} />
        <Label>PLAY ARCHIVE</Label>
      </View>
      <Text style={s.title}>PAST PUZZLES.</Text>
      <Text style={s.body}>
        Choose a date from the last three months and continue your games.
      </Text>
      <View style={s.monthNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={visibleMonth <= oldestMonth}
          onPress={() => navigateMonth(-1)}
          style={[
            s.monthArrow,
            visibleMonth <= oldestMonth && s.monthArrowDisabled,
          ]}
        >
          <Text style={s.monthArrowText}>‹</Text>
        </Pressable>
        <Text style={s.monthText}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={visibleMonth >= currentMonth}
          onPress={() => navigateMonth(1)}
          style={[
            s.monthArrow,
            visibleMonth >= currentMonth && s.monthArrowDisabled,
          ]}
        >
          <Text style={s.monthArrowText}>›</Text>
        </Pressable>
      </View>
      <View style={s.calendar}>
        {["S", "M", "T", "W", "T", "F", "S"].map((weekday, index) => (
          <Text key={`${weekday}-${index}`} style={s.weekday}>
            {weekday}
          </Text>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => (
          <View key={`blank-${index}`} style={s.dayEmpty} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dayDate = `${visibleMonth}-${String(day).padStart(2, "0")}`;
          const attempts = games.map((game) => getAttempt(game, dayDate));
          const hasAnyGame = attempts.some(Boolean);
          const allGamesPlayed =
            games.length > 0 &&
            attempts.every(
              (attempt) => !!attempt && attempt.status !== "in_progress",
            );
          const statusCircleStyle = allGamesPlayed
            ? s.dayStatusComplete
            : hasAnyGame
              ? s.dayStatusStarted
              : s.dayStatusNone;
          const isSelected = dayDate === date;
          const isFuture = dayDate > today;
          const disabled = isFuture || dayDate < `${oldestMonth}-01`;
          return (
            <Pressable
              key={day}
              disabled={disabled}
              onPress={() => onDateChange(dayDate)}
              style={[s.day, disabled && s.dayDisabled]}
            >
              <View style={[s.daySelection, isSelected && s.dayActive]}>
                {isFuture ? (
                  <Text style={s.dayTextFuture}>{day}</Text>
                ) : (
                  <View style={[s.dayStatusCircle, statusCircleStyle]}>
                    <Text style={[s.dayText, isSelected && s.dayTextActive]}>
                      {day}
                    </Text>
                    {allGamesPlayed && <Text style={s.dayCompleteTick}>✓</Text>}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Card style={{ marginTop: 20 }}>
        <View style={s.archiveDateTag}>
          <Text style={s.archiveDateText}>{date}</Text>
        </View>
        {games.map((game, index) => {
          const attempt = getAttempt(game, date);
          const isIncomplete = attempt?.status === "in_progress";
          const actionLabel = isIncomplete
            ? "Resume"
            : attempt
              ? "Replay"
              : "Play Now";
          return (
            <React.Fragment key={game}>
              <View style={s.archiveRow}>
                <Text style={s.archiveGameName}>{GAME_LABELS[game]}</Text>
                <View style={s.archiveActionSlot}>
                  <Button
                    small
                    label={actionLabel}
                    onPress={() =>
                      onStartGame(game, date, !!attempt && !isIncomplete)
                    }
                  />
                </View>
              </View>
              {index < games.length - 1 && <View style={s.archiveSeparator} />}
            </React.Fragment>
          );
        })}
      </Card>
    </ScrollView>
  );
}

/** Returns a calendar month key offset by the requested number of months. */
function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}
