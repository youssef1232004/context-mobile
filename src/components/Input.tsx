import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  style,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: Typography.sizes.xs,
            fontWeight: Typography.weights.bold,
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? colors.inputBg : colors.surface,
          borderWidth: 1,
          borderColor,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.base,
          overflow: 'hidden',
        }}
      >
        {icon && <View style={{ marginRight: Spacing.sm }}>{icon}</View>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            {
              flex: 1,
              paddingVertical: 14,
              fontSize: Typography.sizes.base,
              color: colors.text,
            },
            style,
          ]}
          {...rest}
        />
      </View>
      {error && (
        <Text
          style={{
            fontSize: Typography.sizes.xs,
            color: colors.error,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
