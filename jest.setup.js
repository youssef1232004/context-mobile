import '@testing-library/jest-native/extend-expect';
import { server } from './src/mocks/server';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock Expo constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '127.0.0.1:8081',
  },
}));

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(View, { testID: 'mock-ionicons', ...props }),
    MaterialIcons: (props: any) => React.createElement(View, { testID: 'mock-material-icons', ...props }),
  };
});
