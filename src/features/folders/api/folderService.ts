import { api } from '../../../services/api';
import type { Document } from '../../documents/api/documentService';

export interface FolderData {
  _id: string;
  name: string;
  user: string;
  parentFolder: string | null;
  path: string;
  isPinned: boolean;
  color?: string;
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

  /** GET /folders/:id/download — download folder as zip */
  downloadFolder: async (folderId: string) => {
    const response = await api.get(`/folders/${folderId}/download`, { responseType: 'blob' });
    return response.data;
  },

  /** POST /folders — create a folder */
  create: async (payload: { name: string; parentFolder?: string; color?: string }) => {
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

  /** PUT /folders/:id/color */
  setColor: async (id: string, color: string) => {
    const response = await api.put(`/folders/${id}`, { color });
    return response.data;
  },

  /** PATCH /folders/:id/move */
  moveFolder: async (id: string, targetParentFolderId: string | null) => {
    const response = await api.patch(`/folders/${id}/move`, { targetParentFolderId });
    return response.data;
  },

  /** POST /folders/:id/copy */
  copyFolder: async (id: string, targetParentFolderId: string | null): Promise<FolderData> => {
    const response = await api.post(`/folders/${id}/copy`, { targetParentFolderId });
    return response.data.data;
  },
};
