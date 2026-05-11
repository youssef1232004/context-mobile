module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2021: true,
    'react-native/react-native': true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'react-native'],
  rules: {
    'react-native/no-unused-styles': 2,
    'react-native/split-platform-components': 2,
    'react-native/no-inline-styles': 1,
    'react-native/no-color-literals': 0,
    'react-native/no-raw-text': 0,
    'react-native/sort-styles': ['error', 'asc', { ignoreClassNames: false, ignoreStyleProperties: false }],
  },
};
