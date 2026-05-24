import { api } from '../../../services/api';

export interface ComparisonResult {
  _id?: string;
  documents: any[];
  // Legacy fields (from history records)
  summary?: string;
  differences?: string[];
  createdAt?: string;
  // Current backend response shape (from POST /comparison/compare)
  synthesis?: string;
  similarityPercentage?: number;
  similarities?: string[];   // → "Shared Concepts"
  uniqueToA?: string[];      // → "Unique to Base"
  uniqueToB?: string[];      // → "Unique to Comparison"
}

export interface SaveHistoryPayload {
  docIdA: string;
  docIdB: string;
  titleA: string;
  titleB: string;
  comparison: any;
}

export const comparisonService = {
  /** POST /comparison/compare — compare two or more documents */
  compare: async (documentIds: string[]) => {
    const response = await api.post('/comparison/compare', { documentIds });
    return response.data as { success: boolean; data: { comparison: ComparisonResult } };
  },

  /** GET /comparison/history */
  getHistory: async () => {
    const response = await api.get('/comparison/history');
    return response.data;
  },

  /** GET /comparison/history/:id */
  getHistoryRecord: async (id: string) => {
    const response = await api.get(`/comparison/history/${id}`);
    return response.data;
  },

  /** POST /comparison/history */
  saveHistory: async (data: SaveHistoryPayload) => {
    const response = await api.post('/comparison/history', data);
    return response.data;
  },

  /** PATCH /comparison/history/:id */
  updateHistory: async (id: string, updates: { titleA?: string; titleB?: string }) => {
    const response = await api.patch(`/comparison/history/${id}`, updates);
    return response.data;
  },

  /** DELETE /comparison/history/:id */
  deleteHistory: async (id: string) => {
    const response = await api.delete(`/comparison/history/${id}`);
    return response.data;
  },

  /** GET /comparison/:docIdA/:docIdB/chat */
  getChatHistory: async (docIdA: string, docIdB: string) => {
    const response = await api.get(`/comparison/${docIdA}/${docIdB}/chat`);
    return response.data;
  },
};
