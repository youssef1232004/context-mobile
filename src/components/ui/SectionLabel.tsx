import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../../theme';

interface SectionLabelProps extends TextProps {
  text: string;
  color?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ text, color, style, ...rest }) => {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        {
          fontFamily: Typography.families.mono,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.bold,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: color || colors.primary,
        },
        style,
      ]}
      {...rest}
    >
      {text}
    </Text>
  );
};
