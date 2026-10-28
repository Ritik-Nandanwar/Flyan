import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import { BackHandler, PanResponder, View } from "react-native";

/** Adds an iOS-style left-edge swipe to return to the previous app screen. */
export function BackGesture({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  // Android routes its system edge-back gesture through the hardware back event.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBackRef.current();
        return true;
      },
    );
    return () => subscription.remove();
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          gesture.x0 <= 72 &&
          gesture.dx > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.x0 <= 72 &&
          gesture.dx > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
        onPanResponderRelease: (_event, gesture) => {
          if (
            gesture.dx >= 76 &&
            Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3
          ) {
            onBackRef.current();
          }
        },
      }),
    [],
  );

  return (
    <View style={{ flex: 1 }} {...responder.panHandlers}>
      {children}
    </View>
  );
}
