import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
