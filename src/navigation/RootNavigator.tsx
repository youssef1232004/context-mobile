import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { useAppDispatch } from '../store/hooks';
import { restoreSession } from '../store/authSlice';
import type { RootState } from '../store/store';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

export default function RootNavigator() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restore = async () => {
      await dispatch(restoreSession());
      setIsRestoring(false);
    };
    restore();
  }, [dispatch]);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
