import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsService, type UserSettings } from '../api/settingsService';

interface SettingsState {
  data: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await settingsService.getSettings();
      return data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to load settings');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (updates: Partial<UserSettings>, { rejectWithValue }) => {
    try {
      const data = await settingsService.updateSettings(updates);
      return data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to update settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default settingsSlice.reducer;
