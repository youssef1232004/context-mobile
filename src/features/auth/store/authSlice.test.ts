import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, logout, clearError } from './authSlice';
import { authService } from '../api/authService';

jest.mock('../api/authService');

describe('authSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('should handle clearError', () => {
    store.dispatch(clearError());
    const state = store.getState().auth;
    expect(state.error).toBeNull();
  });

  it('should handle loginUser.fulfilled', async () => {
    const mockResponse = {
      token: 'fake-token-123',
      user: { _id: '1', email: 'test@test.com', username: 'testuser' }
    };
    (authService.login as jest.Mock).mockResolvedValue(mockResponse);

    await store.dispatch(loginUser({ email: 'test@test.com', password: 'password123' } as any));
    const state = store.getState().auth;
    
    expect(state.status).toBe('succeeded');
    expect(state.token).toBe('fake-token-123');
    expect(state.user?.email).toBe('test@test.com');
    expect(state.error).toBeNull();
  });

  it('should handle logout', () => {
    store.dispatch(logout());
    const state = store.getState().auth;
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });
});
