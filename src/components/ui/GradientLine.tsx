import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface GradientLineProps {
  direction?: 'horizontal' | 'vertical';
  height?: number;
  width?: number | string;
  style?: ViewStyle;
}

export const GradientLine: React.FC<GradientLineProps> = ({
  direction = 'horizontal',
  height = 3,
  width = '100%',
  style,
}) => {
  const { colors } = useTheme();

  // Frontend gradient: bg-gradient-to-r from-primary via-accent to-secondary
  // Primary, Accent are in theme. We'll use secondary/info color from theme for the end color.
  const gradientColors: [string, string, string] = [colors.primary, colors.accent, colors.info || '#8b5cf6'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={direction === 'horizontal' ? { x: 0, y: 0 } : { x: 0, y: 0 }}
      end={direction === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 }}
      style={[
        direction === 'horizontal' ? { height, width: width as import('react-native').DimensionValue } : { width: height as import('react-native').DimensionValue, height: width as import('react-native').DimensionValue },
        style,
      ]}
    />
  );
};
