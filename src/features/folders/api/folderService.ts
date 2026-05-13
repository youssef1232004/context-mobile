import { api } from '../../../services/api';
import type { Document } from '../../documents/api/documentService';

export interface FolderData {
  _id: string;
  name: string;
  user: string;
  parentFolder: string | null;
  path: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderContentsResponse {
  success: boolean;
  data: {
    currentFolder: FolderData | null;
    breadcrumbs: FolderData[];
    folders: FolderData[];
    documents: Document[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

export const folderService = {
  /** GET /folders or GET /folders/:id — get folder contents */
  getContents: async (params?: {
    folderId?: string;
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<FolderContentsResponse> => {
    const { folderId, ...queryParams } = params || {};
    const endpoint = folderId ? `/folders/${folderId}` : '/folders';
    const response = await api.get(endpoint, { params: queryParams });
    return response.data;
  },

  /** GET /folders/tree — flat list of all user folders */
  getTree: async (): Promise<{ success: boolean; data: FolderData[] }> => {
    const response = await api.get('/folders/tree');
    return response.data;
  },

  /** POST /folders — create a folder */
  create: async (payload: { name: string; parentFolder?: string }) => {
    const response = await api.post('/folders', payload);
    return response.data;
  },

  /** PUT /folders/:id/rename */
  rename: async (id: string, newName: string) => {
    const response = await api.put(`/folders/${id}/rename`, { newName });
    return response.data;
  },

  /** DELETE /folders/:id — delete folder and all contents */
  delete: async (id: string) => {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },
};
