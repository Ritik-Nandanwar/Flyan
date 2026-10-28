import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../ui/Button";
import { s } from "../../theme/styles";
import { Attempt } from "../../types/app";
import { FEATURE_FLAGS } from "../../config/featureFlags";

type SudokuBoardProps = {
  attempt: Attempt;
  selectedCell: [number, number] | null;
  onFocusCell: (row: number, column: number) => void;
  onEnterNumber: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
};

/** Renders the 6×6 Sudoku board, number pad, and optional history controls. */
export function SudokuBoard({
  attempt,
  selectedCell,
  onFocusCell,
  onEnterNumber,
  onUndo,
  onRedo,
  onClear,
}: SudokuBoardProps) {
  return (
    <>
      <View style={s.sudoku}>
        {attempt.board.map((row, rowIndex) => (
          <View key={rowIndex} style={s.sudokuRow}>
            {row.map((value, columnIndex) => {
              const fixed = !!attempt.fixed?.[rowIndex]?.[columnIndex];
              const selected =
                selectedCell?.[0] === rowIndex &&
                selectedCell?.[1] === columnIndex;
              return (
                <Pressable
                  key={columnIndex}
                  accessibilityRole="button"
                  accessibilityLabel={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${fixed ? "given" : value ? `value ${value}` : "empty"}`}
                  disabled={fixed}
                  onPress={() => onFocusCell(rowIndex, columnIndex)}
                  style={[
                    s.sudokuCell,
                    columnIndex % 3 === 2 && columnIndex < 5 && s.boxRight,
                    rowIndex % 2 === 1 && rowIndex < 5 && s.boxBottom,
                    selected && s.sudokuSelected,
                  ]}
                >
                  <Text style={[s.sudokuText, fixed && s.fixedText]}>
                    {value || ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={s.caption}>
        {attempt.difficulty?.toUpperCase() || "RANDOM"} · 6 × 6 · 2 × 3 BOXES ·{" "}
        {attempt.moves} MOVES
      </Text>
      {FEATURE_FLAGS.sudokuUndoRedo && (
        <View style={s.historyControls}>
          <Button
            small
            label="↶ UNDO"
            invert
            disabled={!attempt.undoHistory?.length}
            onPress={onUndo}
          />
          <Button
            small
            label="REDO ↷"
            invert
            disabled={!attempt.redoHistory?.length}
            onPress={onRedo}
          />
        </View>
      )}
      <View style={s.numberPad}>
        {[
          [1, 2, 3],
          [4, 5, 6],
        ].map((numbers, rowIndex) => (
          <View key={rowIndex} style={s.padRow}>
            {numbers.map((number) => (
              <Pressable
                key={number}
                accessibilityRole="button"
                accessibilityLabel={`Enter ${number}`}
                disabled={!selectedCell}
                onPress={() => selectedCell && onEnterNumber(number)}
                style={[
                  s.numberButton,
                  !selectedCell && s.numberButtonDisabled,
                ]}
              >
                <Text style={s.numberButtonText}>{number}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      {FEATURE_FLAGS.sudokuCellClear && selectedCell && (
        <Button
          small
          label="CLEAR CELL"
          invert
          disabled={
            !attempt.board[selectedCell[0]]?.[selectedCell[1]] ||
            !!attempt.fixed?.[selectedCell[0]]?.[selectedCell[1]]
          }
          onPress={onClear}
        />
      )}
    </>
  );
}
