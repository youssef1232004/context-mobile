import axios from 'axios';
import { secureStorage } from './secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: attach Bearer token from SecureStore before every request
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
