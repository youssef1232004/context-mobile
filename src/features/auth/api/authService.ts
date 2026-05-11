import { api } from '../../../services/api';
import type {
  LoginFormValues,
  RegisterFormValues,
  AuthResponse,
  ProfileUpdateData,
} from '../schemas/auth.schema';

export const authService = {
  login: async (credentials: LoginFormValues): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterFormValues): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData: ProfileUpdateData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  uploadAvatar: async (formData: FormData) => {
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
