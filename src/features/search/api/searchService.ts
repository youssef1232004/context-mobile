import { api } from '../../../services/api';

/**
 * Matches the exact shape returned by GET /ai/search
 * Backend (AIService.searchDocuments) returns chunk-level vector hits, NOT document-level objects.
 * Each item is a single matched text chunk from the vector store.
 */
export interface SemanticSearchResult {
  /** The raw text content of the matched chunk */
  text: string;
  /** Similarity score as a percentage (0–100) */
  confidenceScore: number;
  /** Parent document _id — used to navigate to the reader */
  documentId: string;
  /** Human-readable document title */
  documentTitle: string;
  /** e.g. 'PDF', 'Word', 'Image', 'TextSnippet' */
  documentType: string;
  /** Cloudinary URL for the source file (may be null) */
  documentUrl: string | null;
  /** Which chunk within the document this hit came from (0-indexed) */
  chunkIndex: number;
}

export interface SearchResponse {
  success: boolean;
  count: number;
  data: SemanticSearchResult[];
}

export const searchService = {
  /** GET /ai/search?q=...&limit= */
  search: async (query: string, limit = 8): Promise<SearchResponse> => {
    const response = await api.get('/ai/search', {
      params: { q: query, limit },
    });
    return response.data;
  },
};
