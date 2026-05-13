import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'context_token';
const USER_KEY = 'context_user';

export const secureStorage = {
  // Token
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  removeToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),

  // User
  setUser: (user: object) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  getUser: async <T = unknown>(): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  removeUser: () => SecureStore.deleteItemAsync(USER_KEY),

  // Clear everything
  clearAll: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
