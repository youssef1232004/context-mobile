import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import folderReducer from './folderSlice';
import documentReducer from './documentSlice';
import comparisonReducer from './comparisonSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    folder: folderReducer,
    document: documentReducer,
    comparison: comparisonReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
