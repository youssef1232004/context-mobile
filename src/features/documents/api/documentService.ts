import { api } from '../../../services/api';
import type { PrettifyResult } from '../../../services/prettify.service';

export type DocumentType = 'PDF' | 'Word' | 'Image' | 'TextSnippet' | 'Excel';
export type AIStatus = 'Pending' | 'Processing' | 'Analyzed' | 'Failed';
export type CognitiveLoad = 'Light' | 'Medium' | 'Heavy';

export interface Document {
  _id: string;
  user: string;
  title: string;
  fileType: DocumentType;
  aiStatus: AIStatus;
  cognitiveLoad: CognitiveLoad;
  summary?: string;
  tags: string[];
  extractedText?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  folder: string | null;
  originalClientPath?: string;
  semanticPath?: string;
  /** Whether the user has opened this document since it was uploaded (used by SuggestedFocusService scoring) */
  isUnread?: boolean;
  isOrganized?: boolean;
  prettifiedJson?: PrettifyResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string;
  fileType?: string;
  cognitiveLoad?: string;
}

export interface PaginatedResponse {
  success: boolean;
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  data: Document[];
}

export const documentService = {
  /** GET /documents — list with filters, sort, pagination */
  getAll: async (params?: GetDocumentsParams): Promise<PaginatedResponse> => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  /** GET /documents/:id */
  getById: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  /** POST /documents/upload — upload file(s) with progress tracking */
  upload: async (formData: FormData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** POST /documents/upload with Axios onUploadProgress */
  uploadWithProgress: async (formData: FormData, onProgress: (pct: number) => void) => {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return response.data;
  },

  /** POST /documents/upload — text snippet (JSON body) */
  uploadText: async (text: string, title?: string) => {
    const response = await api.post('/documents/upload', {
      fileType: 'TextSnippet',
      extractedText: text,
      title: title || undefined,
    });
    return response.data;
  },

  /** PUT /documents/:id — update title / tags etc */
  update: async (id: string, payload: Partial<Pick<Document, 'title' | 'tags' | 'cognitiveLoad'>>) => {
    const response = await api.put(`/documents/${id}`, payload);
    return response.data;
  },

  /** DELETE /documents/:id */
  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  /** DELETE /documents/bulk */
  bulkDelete: async (ids: string[]) => {
    const response = await api.delete('/documents/bulk', { data: { ids } });
    return response.data;
  },

  /**
   * GET /documents/suggested-focus
   * Returns the top-2 documents ranked by the backend's SuggestedFocusService (lowest score first):
   * score = cognitiveLoad (Heavy=3, Medium=2, Light=1) + recency decay (30-day window) + isUnread bonus (+2)
   * Only surfaces documents with aiStatus === 'Analyzed'.
   */
  getSuggestedFocus: async (): Promise<{ success: boolean; count: number; data: Document[] }> => {
    const response = await api.get('/documents/suggested-focus');
    return response.data;
  },

  reanalyze: async (id: string) => {
    const response = await api.post(`/documents/${id}/reanalyze`);
    return response.data;
  },

  getStatus: async (ids: string[]) => {
    const response = await api.get('/documents/status', { params: { ids: ids.join(',') } });
    return response.data;
  },

  moveDocument: async (id: string, targetFolderId: string | null) => {
    const response = await api.put(`/documents/${id}`, { folder: targetFolderId });
    return response.data;
  },

  copyDocument: async (id: string, targetFolderId: string | null) => {
    const response = await api.post(`/documents/${id}/copy`, { targetFolderId });
    return response.data;
  },

  downloadBulkZip: async (documentIds: string[], folderIds: string[]) => {
    const response = await api.post('/documents/download-bulk', { documentIds, folderIds }, {
      responseType: 'blob'
    });
    return response.data;
  },
};
