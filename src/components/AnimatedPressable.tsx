import React, { useRef } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp, Animated } from 'react-native';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedPressable: React.FC<Props> = ({ children, scaleTo = 0.96, onPress, onPressIn, onPressOut, style, ...props }) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedPress
      onPress={onPress}
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 20,
          bounciness: 5,
        }).start();
        if (onPressIn) onPressIn(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 5,
        }).start();
        if (onPressOut) onPressOut(e);
      }}
      style={[{ transform: [{ scale }] }, style]}
      {...props}
    >
      {children}
    </AnimatedPress>
  );
};
