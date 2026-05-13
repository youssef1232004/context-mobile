import { api } from '../../../services/api';

export interface ComparisonResult {
  _id?: string;
  documents: string[];
  summary?: string;
  similarities?: string[];
  differences?: string[];
  createdAt?: string;
}

export const comparisonService = {
  /** POST /comparison — compare two or more documents */
  compare: async (documentIds: string[]) => {
    const response = await api.post('/comparison', { documentIds });
    return response.data as { success: boolean; data: ComparisonResult };
  },

  /** GET /comparison/history */
  getHistory: async () => {
    const response = await api.get('/comparison/history');
    return response.data;
  },
};
