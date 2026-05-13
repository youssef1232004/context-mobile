import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout, clearError } from '../store/authSlice';
import type { RootState } from '../store/store';

/**
 * Convenience hook — exposes the auth state slice + common actions.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, status, error } = useAppSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    token,
    isAuthenticated,
    isLoading: status === 'loading',
    status,
    error,
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  };
}
