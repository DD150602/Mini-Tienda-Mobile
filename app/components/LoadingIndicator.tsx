import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

export function LoadingIndicator({
  color = COLORS.primary,
  size = 22,
  style,
}: {
  color?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              rotate: rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="sync-outline" size={size} color={color} />
    </Animated.View>
  );
}
