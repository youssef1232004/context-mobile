import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import folderReducer from '../features/folders/store/folderSlice';
import documentReducer from '../features/documents/store/documentSlice';
import comparisonReducer from '../features/comparison/store/comparisonSlice';
import settingsReducer from '../features/settings/store/settingsSlice';

const appReducer = combineReducers({
  auth: authReducer,
  folder: folderReducer,
  document: documentReducer,
  comparison: comparisonReducer,
  settings: settingsReducer,
});

/**
 * Root reducer that resets ALL slice state when the user logs out.
 * This prevents one user's documents / folders / comparisons from
 * leaking into the next session on the same device.
 * Mirrors the same pattern used in the web frontend's store.ts.
 */
const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout') {
    state = undefined; // each slice returns its own initialState
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
