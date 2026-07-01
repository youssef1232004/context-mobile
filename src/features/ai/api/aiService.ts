import { api } from '../../../services/api';

export const aiService = {
  generateFolderStructure: async (payload: { documents: any[]; folderIds?: string[] }) => {
    const response = await api.post('/ai/organize-folder', payload);
    return response.data;
  },

  proposeGlobalFolderStructure: async () => {
    const response = await api.post('/folders/propose');
    return response.data;
  },

  synthesize: async (documentIds: string[]) => {
    const response = await api.post('/ai/synthesize', { documentIds });
    return response.data;
  },

  applySemanticFolders: async (updates: { documentId: string, newPath: string }[]) => {
    const response = await api.put('/ai/apply-folders', { updates });
    return response.data;
  },
};
