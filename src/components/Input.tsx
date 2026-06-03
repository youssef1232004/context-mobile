import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';
import { SectionLabel } from './SectionLabel';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  labelStyle,
  style,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = error
    ? colors.error
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary],
      });
      
  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const isPasswordField = rest.secureTextEntry !== undefined;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <SectionLabel text={label} style={[{ marginLeft: 4 }, labelStyle]} />
      )}
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? colors.inputBg : colors.surface,
          borderWidth: 1,
          borderColor,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.base,
          overflow: 'hidden',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          shadowRadius: 8,
          // elevation removed to prevent dark shadow bleed through transparent backgrounds on Android
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
          secureTextEntry={isPasswordField ? !isPasswordVisible : undefined}
        />
        {isPasswordField && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ padding: Spacing.xs, marginLeft: Spacing.xs }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
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
