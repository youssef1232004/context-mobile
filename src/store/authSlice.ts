import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../features/auth/api/authService';
import type {
  LoginFormValues,
  RegisterFormValues,
  AuthUser,
  ProfileUpdateData,
} from '../features/auth/schemas/auth.schema';

// State shape
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const e = error as { response?: { data?: { message?: string; error?: string } } };
    return e.response?.data?.message || e.response?.data?.error || fallback;
  }
  return fallback;
};

// Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginFormValues, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      await AsyncStorage.setItem('context_token', data.token);
      await AsyncStorage.setItem('context_user', JSON.stringify(data.user));
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterFormValues, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      await AsyncStorage.setItem('context_token', data.token);
      await AsyncStorage.setItem('context_user', JSON.stringify(data.user));
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Registration failed'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: ProfileUpdateData, { rejectWithValue }) => {
    try {
      const data = await authService.updateProfile(userData);
      const updatedUser = data.data;
      await AsyncStorage.setItem('context_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update profile'));
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('context_token');
      const userStr = await AsyncStorage.getItem('context_user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        return { token, user };
      }
      return null;
    } catch {
      return rejectWithValue('Failed to restore session');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      AsyncStorage.removeItem('context_token');
      AsyncStorage.removeItem('context_user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Restore Session
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
