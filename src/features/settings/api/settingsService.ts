import { api } from '../../../services/api';

export interface UserSettings {
  aiPersona: 'Concise' | 'Detailed';
  theme?: 'light' | 'dark' | 'system';
  aiUsage?: {
    tokensUsed: number;
    dailyLimit: number;
    remaining: number;
  };
}

export const settingsService = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data?.data || res.data;
  },
  updateSettings: async (updates: Partial<UserSettings>) => {
    const res = await api.patch('/settings', updates);
    return res.data?.data || res.data;
  }
};
