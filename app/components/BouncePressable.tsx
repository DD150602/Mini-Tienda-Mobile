import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle> };

export function BouncePressable({ style, children, onPressIn, onPressOut, ...props }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn: NonNullable<PressableProps["onPressIn"]> = (event) => {
    Animated.spring(scale, {
      toValue: 0.96,
      damping: 12,
      stiffness: 320,
      useNativeDriver: true,
    }).start();
    onPressIn?.(event);
  };
  const pressOut: NonNullable<PressableProps["onPressOut"]> = (event) => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 7,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
    onPressOut?.(event);
  };

  return (
    <Pressable {...props} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
