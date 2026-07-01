import { api } from '../../../services/api';
import type { ProfileUpdateData } from '../../auth/schemas/auth.schema';

export const userService = {
  /** GET /users/profile */
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /** PATCH /users/profile */
  updateProfile: async (payload: ProfileUpdateData) => {
    const response = await api.patch('/users/profile', payload);
    return response.data;
  },

  /** POST /users/avatar */
  uploadAvatar: async (formData: FormData) => {
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
