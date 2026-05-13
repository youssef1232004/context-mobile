import { api } from '../../../services/api';

export interface SearchResult {
  _id: string;
  title: string;
  fileType: string;
  cognitiveLoad?: string;
  aiStatus?: string;
  tags?: string[];
  summary?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  success: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  data: SearchResult[];
}

export const searchService = {
  /** GET /documents/search?q=...&page=&limit= */
  search: async (query: string, options?: { page?: number; limit?: number }): Promise<SearchResponse> => {
    const response = await api.get('/documents/search', {
      params: { q: query, ...options },
    });
    return response.data;
  },
};
