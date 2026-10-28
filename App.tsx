import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, AppState, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  answerForDate,
  verticleAnswerForDate,
  COUNTRIES,
  GameType,
  getRandomSudoku,
  isFiveLetterWord,
  scoreWord,
  SudokuPuzzle,
  validSudokuEntry,
} from "./src/games/engines";
import { Button } from "./src/components/ui/Button";
import { BackGesture } from "./src/components/ui/BackGesture";
import { Label } from "./src/components/ui/Label";
import { ProcessingOverlay } from "./src/components/ui/ProcessingOverlay";
import { ReplayConfirmModal } from "./src/components/ui/ReplayConfirmModal";
import { s } from "./src/theme/styles";
import { FEATURE_FLAGS, isGameEnabled } from "./src/config/featureFlags";
import { ALL_GAMES } from "./src/config/gameConstants";
import { GameScreen } from "./src/screens/GameScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ArchiveScreen } from "./src/screens/ArchiveScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { Attempt, Save, Screen } from "./src/types/app";
import {
  attemptKey as key,
  createAttempt as fresh,
  dailyWinStreak,
} from "./src/games/attempts";
import { today, yesterday } from "./src/utils/dates";
import {
  auth,
  createAccount,
  loadUserAttempts,
  login,
  logout,
  resetPassword,
  saveUserAttempt,
  syncUserAttempts,
} from "./src/services/firebase";

const GAMES = ALL_GAMES.filter(isGameEnabled);

/** Merges local and cloud history, preferring the more advanced attempt. */
function mergeAttempts(local: Save, remote: Save): Save {
  const merged = { ...local };
  for (const [id, cloudAttempt] of Object.entries(remote)) {
    const localAttempt = merged[id];
    if (!localAttempt) {
      merged[id] = cloudAttempt;
      continue;
    }
    const localFinished = localAttempt.status !== "in_progress";
    const cloudFinished = cloudAttempt.status !== "in_progress";
    if (
      (cloudFinished && !localFinished) ||
      (cloudFinished === localFinished &&
        (cloudAttempt.moves > localAttempt.moves ||
          (cloudAttempt.moves === localAttempt.moves &&
            (cloudAttempt.finishedAt || cloudAttempt.startedAt) >
              (localAttempt.finishedAt || localAttempt.startedAt))))
    ) {
      merged[id] = cloudAttempt;
    }
  }
  return merged;
}

/** Coordinates persistent game state, navigation, and screen event handlers. */
function App() {
  const [screen, setScreen] = useState<Screen>("splash"),
    [save, setSave] = useState<Save>({}),
    [selected, setSelected] = useState<GameType>("wordle"),
    [mode, setMode] = useState<"daily" | "archive">("daily"),
    [archiveDate, setArchiveDate] = useState(yesterday()),
    [active, setActive] = useState<Attempt | null>(null),
    [entry, setEntry] = useState(""),
    [seconds, setSeconds] = useState(0),
    [appIsActive, setAppIsActive] = useState(
      AppState.currentState === "active",
    ),
    [authTab, setAuthTab] = useState<"login" | "signup">("login"),
    [guest, setGuest] = useState(true),
    [loading, setLoading] = useState(true),
    [loadingCaption, setLoadingCaption] = useState("LOADING YOUR SAVED GAMES…"),
    [localLoaded, setLocalLoaded] = useState(false),
    [firebaseUser, setFirebaseUser] = useState<User | null>(null),
    [replaySession, setReplaySession] = useState(false),
    [replayRequest, setReplayRequest] = useState<{
      game: GameType;
      date: string;
      mode: "daily" | "archive";
      status: "won" | "lost";
    } | null>(null),
    [loadingPuzzle, setLoadingPuzzle] = useState(false),
    [selectedSudokuCell, setSelectedSudokuCell] = useState<
      [number, number] | null
    >(null),
    [reduceMotion, setReduceMotion] = useState(false);
  const [wrongEntryCountdown, setWrongEntryCountdown] = useState<number | null>(
    null,
  );
  const [wrongEntryNonce, setWrongEntryNonce] = useState(0);
  const localSaveRef = useRef<Save>({});
  const activeAttemptRef = useRef<Attempt | null>(null);
  const timerStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    activeAttemptRef.current = active;
  }, [active]);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    (async () => {
      let local: Save = {};
      try {
        const v = await AsyncStorage.getItem("flyan-v1");
        if (v) local = JSON.parse(v);
      } catch {}
      if (cancelled) return;
      localSaveRef.current = local;
      setSave(local);
      setLocalLoaded(true);
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;
        setFirebaseUser(user);
        if (user) {
          setLoadingCaption("SYNCING YOUR ACCOUNT AND GAME HISTORY…");
          setLoading(true);
          setGuest(false);
          try {
            const remote = await loadUserAttempts(user.uid);
            if (cancelled) return;
            localSaveRef.current = mergeAttempts(localSaveRef.current, remote);
            setSave(localSaveRef.current);
            await syncUserAttempts(user.uid, localSaveRef.current);
          } catch (error) {
            console.warn("Unable to sync Flyan history with Firestore", error);
            Alert.alert(
              "History sync unavailable",
              "You are signed in, but game history could not be synced. Check Firestore setup and your connection.",
            );
          }
        } else {
          setGuest(true);
        }
        setLoading(false);
        setScreen(user || !FEATURE_FLAGS.authentication ? "home" : "auth");
      });
    })();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (localLoaded) {
      localSaveRef.current = save;
      AsyncStorage.setItem("flyan-v1", JSON.stringify(save)).catch(() => {});
    }
  }, [save, localLoaded]);
  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription?.remove();
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppIsActive(state === "active");
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const attempt = activeAttemptRef.current;
    if (!attempt || screen !== "game" || !appIsActive || loadingPuzzle) return;

    const attemptKey = key(selected, attempt.date, attempt.mode);
    const startedAt = Date.now();
    const baseElapsedMs = attempt.elapsedMs ?? 0;
    timerStartedAtRef.current = startedAt;
    const tick = () =>
      setSeconds(Math.floor((baseElapsedMs + Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      if (timerStartedAtRef.current !== startedAt) return;
      timerStartedAtRef.current = null;
      const elapsedMs = baseElapsedMs + Date.now() - startedAt;
      const current = activeAttemptRef.current;
      if (!current || key(selected, current.date, current.mode) !== attemptKey)
        return;
      const pausedAttempt = { ...current, elapsedMs };
      activeAttemptRef.current = pausedAttempt;
      setActive(pausedAttempt);
      setSeconds(Math.floor(elapsedMs / 1000));
      if (!replaySession) {
        setSave((previous) => ({ ...previous, [attemptKey]: pausedAttempt }));
        if (firebaseUser) {
          saveUserAttempt(firebaseUser.uid, selected, pausedAttempt).catch(
            (error) =>
              console.warn("Unable to save Flyan attempt to Firestore", error),
          );
        }
      }
    };
  }, [
    active?.date,
    active?.mode,
    appIsActive,
    firebaseUser,
    loadingPuzzle,
    replaySession,
    screen,
    selected,
  ]);
  useEffect(() => {
    if (wrongEntryCountdown === null) return;
    const timer = setTimeout(() => {
      setWrongEntryCountdown((count) =>
        count === null || count <= 1 ? null : count - 1,
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [wrongEntryCountdown, wrongEntryNonce]);

  /** Looks up the saved attempt for a game, date, and play mode. */
  const resultFor = (
    g: GameType,
    d = today(),
    m: "daily" | "archive" = "daily",
  ) => save[key(g, d, m)];
  const done = GAMES.filter(
    (g) => resultFor(g)?.status !== "in_progress" && !!resultFor(g),
  ).length;
  const streak = dailyWinStreak(save, today());
  /** Loads an existing attempt or starts a fresh game, fetching Sudoku when needed. */
  const start = async (
    g: GameType,
    d = today(),
    m: "daily" | "archive" = "daily",
    replay = false,
  ) => {
    if (!isGameEnabled(g)) return;
    setReplaySession(replay);
    const k = key(g, d, m);
    let a: Attempt | undefined = replay ? undefined : save[k];
    if (
      a &&
      g === "sudoku" &&
      a.status === "in_progress" &&
      (!a.solution || a.board.length !== 6)
    )
      a = undefined;
    if (!a) {
      setSelected(g);
      setMode(m);
      setActive(null);
      setEntry("");
      setSelectedSudokuCell(null);
      if (g === "sudoku") {
        setLoadingPuzzle(true);
        setScreen("game");
        try {
          const puzzle: SudokuPuzzle = await getRandomSudoku();
          a = {
            ...fresh(g, d, m),
            board: puzzle.board,
            solution: puzzle.solution,
            fixed: puzzle.board.map((row) => row.map((value) => value !== 0)),
            difficulty: puzzle.difficulty,
          };
        } catch {
          Alert.alert(
            "Sudoku unavailable",
            "Could not load a random puzzle. Check your connection and try again.",
          );
          setScreen(m === "archive" ? "archive" : "home");
          return;
        } finally {
          setLoadingPuzzle(false);
        }
      } else a = fresh(g, d, m);
      if (!replay) setSave((prev) => ({ ...prev, [k]: a! }));
      if (firebaseUser && !replay) {
        saveUserAttempt(firebaseUser.uid, g, a!).catch((error) =>
          console.warn("Unable to save Flyan attempt to Firestore", error),
        );
      }
    }
    setSelected(g);
    setMode(m);
    setActive(a);
    setSeconds(
      Math.floor(
        (a.elapsedMs ??
          (a.status === "in_progress"
            ? 0
            : Math.max(0, (a.finishedAt ?? a.startedAt) - a.startedAt))) / 1000,
      ),
    );
    setEntry("");
    setSelectedSudokuCell(null);
    if (a.status !== "in_progress") setScreen("result");
    else setScreen("game");
  };
  /** Prompts before replaying a terminal attempt so its saved status is preserved. */
  const requestReplay = (
    game: GameType,
    date: string,
    playMode: "daily" | "archive",
  ) => {
    const savedAttempt = resultFor(game, date, playMode);
    if (!savedAttempt || savedAttempt.status === "in_progress") {
      void start(game, date, playMode);
      return;
    }
    setReplayRequest({
      game,
      date,
      mode: playMode,
      status: savedAttempt.status,
    });
  };
  /** Starts the temporary replay after the user acknowledges the status warning. */
  const confirmReplay = () => {
    if (!replayRequest) return;
    const request = replayRequest;
    setReplayRequest(null);
    void start(request.game, request.date, request.mode, true);
  };
  /** Updates active play state and persists it under the current attempt key. */
  const update = (next: Attempt) => {
    setActive(next);
    if (replaySession) return;
    setSave((prev) => ({
      ...prev,
      [key(selected, next.date, next.mode)]: next,
    }));
    if (firebaseUser) {
      saveUserAttempt(firebaseUser.uid, selected, next).catch((error) =>
        console.warn("Unable to save Flyan attempt to Firestore", error),
      );
    }
  };
  /** Marks a game won or lost and opens its result screen. */
  const finish = (won: boolean, next?: Attempt) => {
    const status: Attempt["status"] = won ? "won" : "lost";
    const now = Date.now();
    const startedAt = timerStartedAtRef.current;
    timerStartedAtRef.current = null;
    const elapsedMs =
      (active?.elapsedMs ?? 0) + (startedAt === null ? 0 : now - startedAt);
    setSeconds(Math.floor(elapsedMs / 1000));
    const a: Attempt = {
      ...(next || active!),
      elapsedMs,
      status,
      finishedAt: now,
    };
    update(a);
    setActive(a);
    setScreen("result");
  };
  /** Validates and scores one five-letter guess for Wordle. */
  const wordSubmit = (word = entry) => {
    if (!active || active.status !== "in_progress") return;
    const g = word.toUpperCase();
    if (g.length !== 5 || !isFiveLetterWord(g)) {
      Alert.alert(
        "Not in word list",
        "Enter a valid five-letter English word.",
      );
      return;
    }
    const answer = answerForDate(active.date),
      m = scoreWord(g, answer),
      next = {
        ...active,
        guesses: [...active.guesses, g],
        marks: [...active.marks, m],
        moves: active.moves + 1,
      };
    setEntry("");
    if (g === answer) finish(true, next);
    else if (next.guesses.length >= 6) finish(false, next);
    else update(next);
  };
  /** Validates and scores one five-letter Verticle guess. */
  const verticleSubmit = () => {
    if (!active || active.status !== "in_progress") return;
    const g = entry.toUpperCase();
    if (g.length !== 5) {
      Alert.alert(
        "Five letters required",
        "Enter a five-letter word down the column.",
      );
      return;
    }
    if (!isFiveLetterWord(g)) {
      Alert.alert(
        "Not in word list",
        "Enter a valid five-letter English word.",
      );
      return;
    }
    const answer = verticleAnswerForDate(active.date),
      m = scoreWord(g, answer),
      next = {
        ...active,
        guesses: [...active.guesses, g],
        marks: [...active.marks, m],
        moves: active.moves + 1,
      };
    setEntry("");
    if (g === answer) finish(true, next);
    else if (next.guesses.length >= 6) finish(false, next);
    else update(next);
  };
  /** Applies a tap from the on-screen word-game keyboard. */
  const pressKey = (k: string) => {
    if (selected !== "wordle" && selected !== "verticle") return;
    if (k === "ENTER") {
      if (selected === "wordle") wordSubmit();
      else verticleSubmit();
    } else if (k === "⌫") setEntry(entry.slice(0, -1));
    else if (entry.length < 5) setEntry(entry + k);
  };
  /** Validates a Sudoku entry and records it for undo/redo. */
  const selectCell = (r: number, c: number, n: number) => {
    if (!active || !active.solution || active.fixed?.[r]?.[c]) return;
    if (!validSudokuEntry(active.board, r, c, n)) {
      setWrongEntryCountdown(3);
      setWrongEntryNonce((nonce) => nonce + 1);
      return;
    }
    if (active.solution[r][c] !== n) {
      setWrongEntryCountdown(3);
      setWrongEntryNonce((nonce) => nonce + 1);
      return;
    }
    const b = active!.board.map((row) => [...row]);
    b[r][c] = n;
    const next = {
      ...active,
      board: b,
      moves: active.moves + 1,
      undoHistory: [
        ...(active.undoHistory || []),
        { board: active.board.map((row) => [...row]), moves: active.moves },
      ],
      redoHistory: [],
    };
    if (
      b.every((row, i) => row.every((v, j) => v === active!.solution?.[i]?.[j]))
    )
      finish(true, next);
    else update(next);
  };
  /** Restores the previous Sudoku board snapshot and enables redo. */
  const undoSudoku = () => {
    if (!active?.undoHistory?.length) return;
    const previous = active.undoHistory.at(-1)!;
    update({
      ...active,
      board: previous.board.map((row) => [...row]),
      moves: previous.moves,
      undoHistory: active.undoHistory.slice(0, -1),
      redoHistory: [
        ...(active.redoHistory || []),
        { board: active.board.map((row) => [...row]), moves: active.moves },
      ],
    });
  };
  /** Reapplies the next Sudoku board snapshot and enables undo. */
  const redoSudoku = () => {
    if (!active?.redoHistory?.length) return;
    const nextState = active.redoHistory.at(-1)!;
    update({
      ...active,
      board: nextState.board.map((row) => [...row]),
      moves: nextState.moves,
      undoHistory: [
        ...(active.undoHistory || []),
        { board: active.board.map((row) => [...row]), moves: active.moves },
      ],
      redoHistory: active.redoHistory.slice(0, -1),
    });
  };
  /** Validates a country selection, records distance feedback, and checks the win limit. */
  const submitWorldle = () => {
    if (!active) return;
    const guess = COUNTRIES.find((c) =>
      [c.name, ...c.aliases].some(
        (a) => a.toLowerCase() === entry.trim().toLowerCase(),
      ),
    );
    if (!guess) {
      Alert.alert(
        "Country not found",
        "Choose a country from the suggestions.",
      );
      return;
    }
    const target = COUNTRIES.find((c) => c.name === active.answer);
    if (!target) return;
    const next = {
      ...active,
      guesses: [...active.guesses, guess.name],
      marks: [...active.marks, []],
      moves: active.moves + 1,
    };
    setEntry("");
    if (guess.name === target.name) finish(true, next);
    else if (next.guesses.length >= 6) finish(false, next);
    else update(next);
  };
  const suggestions =
    entry.trim().length >= 2
      ? COUNTRIES.filter((c) =>
          c.name.toLowerCase().startsWith(entry.trim().toLowerCase()),
        ).slice(0, 6)
      : [];
  /** Formats the time remaining until the next UTC daily puzzle. */
  const countDown = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    const n = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
    return `${String(Math.floor(n / 3600)).padStart(2, "0")}:${String(Math.floor((n % 3600) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  };
  if (loading || screen === "splash")
    return <ProcessingOverlay mode="screen" caption={loadingCaption} />;
  if (screen === "auth" && FEATURE_FLAGS.authentication)
    return (
      <AuthScreen
        tab={authTab}
        onTabChange={setAuthTab}
        onSubmit={(email, password, username) =>
          authTab === "signup"
            ? createAccount(email, password, username).then(() => undefined)
            : login(email, password).then(() => undefined)
        }
        onForgotPassword={resetPassword}
        onContinueAsGuest={() => {
          setGuest(true);
          setScreen("home");
        }}
      />
    );
  if (screen === "profile" && FEATURE_FLAGS.profile)
    return (
      <BackGesture onBack={() => setScreen("home")}>
        <ProfileScreen
          completed={done}
          gameCount={GAMES.length}
          guest={guest}
          onBack={() => setScreen("home")}
          onSettings={() =>
            Alert.alert(
              "Settings",
              "Daily rollover: UTC\nReduced motion: follows system settings",
            )
          }
          onSignOut={async () => {
            setLoadingCaption("SIGNING YOU OUT SECURELY…");
            setLoading(true);
            try {
              await logout();
              localSaveRef.current = {};
              setSave({});
              AsyncStorage.removeItem("flyan-v1").catch(() => {});
              setScreen(FEATURE_FLAGS.authentication ? "auth" : "home");
            } catch {
              Alert.alert("Sign out failed", "Please retry.");
            } finally {
              setLoading(false);
            }
          }}
        />
      </BackGesture>
    );
  if (screen === "archive" && FEATURE_FLAGS.archiveCalendar)
    return (
      <BackGesture onBack={() => setScreen("home")}>
        <ArchiveScreen
          date={archiveDate}
          today={today()}
          games={GAMES}
          getAttempt={(game, date) =>
            resultFor(game, date, date === today() ? "daily" : "archive")
          }
          onDateChange={setArchiveDate}
          onStartGame={(game, date, replay) => {
            const playMode = date === today() ? "daily" : "archive";
            if (replay) requestReplay(game, date, playMode);
            else void start(game, date, playMode);
          }}
          onBack={() => setScreen("home")}
        />
        <ReplayConfirmModal
          status={replayRequest?.status ?? null}
          onCancel={() => setReplayRequest(null)}
          onConfirm={confirmReplay}
        />
      </BackGesture>
    );
  if ((screen === "game" || screen === "result") && (loadingPuzzle || !active))
    return (
      <BackGesture
        onBack={() => setScreen(mode === "archive" ? "archive" : "home")}
      >
        <View style={s.page}>
          <View style={s.topline}>
            <Button
              small
              label="← HOME"
              onPress={() => setScreen(mode === "archive" ? "archive" : "home")}
            />
            <Label>SUDOKU</Label>
          </View>
          <ProcessingOverlay
            mode="inline"
            caption={
              loadingPuzzle
                ? "GENERATING A VALID SUDOKU BOARD…"
                : "PREPARING YOUR PUZZLE…"
            }
          />
        </View>
      </BackGesture>
    );

  if ((screen === "game" || screen === "result") && active)
    return (
      <BackGesture
        onBack={() => setScreen(active.mode === "archive" ? "archive" : "home")}
      >
        <GameScreen
          screen={screen}
          selected={selected}
          attempt={active}
          entry={entry}
          seconds={seconds}
          sudokuErrorCountdown={wrongEntryCountdown}
          reduceMotion={reduceMotion}
          selectedSudokuCell={selectedSudokuCell}
          suggestions={suggestions}
          onBack={() =>
            setScreen(active.mode === "archive" ? "archive" : "home")
          }
          onWordSubmit={() => wordSubmit()}
          onVerticleSubmit={verticleSubmit}
          onPressKey={pressKey}
          onSelectSudokuCell={(row, column) =>
            setSelectedSudokuCell([row, column])
          }
          onSudokuNumber={(number) =>
            selectedSudokuCell &&
            selectCell(selectedSudokuCell[0], selectedSudokuCell[1], number)
          }
          onSudokuUndo={undoSudoku}
          onSudokuRedo={redoSudoku}
          onSudokuClear={() => {
            if (!active || !selectedSudokuCell) return;
            const [row, column] = selectedSudokuCell;
            const board = active.board.map((line) => [...line]);
            board[row][column] = 0;
            update({
              ...active,
              board,
              moves: Math.max(0, active.moves - 1),
              undoHistory: [
                ...(active.undoHistory || []),
                {
                  board: active.board.map((line) => [...line]),
                  moves: active.moves,
                },
              ],
              redoHistory: [],
            });
          }}
          onEntryChange={setEntry}
          onWorldleGuess={submitWorldle}
          onReplay={() => requestReplay(selected, active.date, active.mode)}
        />
        <ReplayConfirmModal
          status={replayRequest?.status ?? null}
          onCancel={() => setReplayRequest(null)}
          onConfirm={confirmReplay}
        />
      </BackGesture>
    );

  return (
    <HomeScreen
      dateLabel={new Date()
        .toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        })
        .toUpperCase()}
      completed={done}
      streak={streak}
      games={GAMES}
      getAttempt={(game) => resultFor(game)}
      countdown={countDown()}
      onStartGame={(game) => start(game)}
      onOpenArchive={() => {
        setArchiveDate(yesterday());
        setScreen("archive");
      }}
      onOpenProfile={() => setScreen("profile")}
    />
  );
}

export default App;
