import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { folderService, type FolderData, type FolderContentsResponse } from '../api/folderService';
import { documentService, type Document } from '../../documents/api/documentService';
import { savePersistentLibraryCache } from '../../../hooks/useLibraryCache';

interface FolderState {
  currentFolder: FolderData | null;
  breadcrumbs: FolderData[];
  folders: FolderData[];
  documents: Document[];
  tree: FolderData[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  } | null;
  lastFetchParams: {
    folderId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  };
  isRevalidating: boolean;
  folderCache: Record<string, {
    currentFolder: FolderData | null;
    breadcrumbs: FolderData[];
    folders: FolderData[];
    documents: Document[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    } | null;
    timestamp: number;
  }>;
}

const initialState: FolderState = {
  currentFolder: null,
  breadcrumbs: [],
  folders: [],
  documents: [],
  tree: [],
  loading: false,
  error: null,
  pagination: null,
  lastFetchParams: { limit: 10 },
  isRevalidating: false,
  folderCache: {},
};

const generateCacheKey = (p: any): string => {
  return [
    p?.folderId || 'root',
    p?.search || '',
    p?.sortBy || 'updatedAt',
    p?.sortOrder || 'desc',
    p?.page || 1,
    p?.limit || 10,
  ].join('|');
};

export const fetchFolderContents = createAsyncThunk(
  'folder/fetchContents',
  async (params: { folderId?: string; search?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await folderService.getContents(params);
      const data = { ...response, _requestPage: params?.page || 1 };
      
      // Save to persistent cache
      if (data._requestPage === 1) {
        savePersistentLibraryCache(params || {}, {
          currentFolder: data.data?.currentFolder || null,
          breadcrumbs: data.data?.breadcrumbs || [],
          folders: data.data?.folders || [],
          documents: data.data?.documents || [],
          pagination: data.pagination || null
        });
      }
      
      return data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch folder contents');
    }
  }
);

export const fetchFolderTree = createAsyncThunk(
  'folder/fetchTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await folderService.getTree();
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch folder tree');
    }
  }
);

export const createFolderThunk = createAsyncThunk(
  'folder/createFolder',
  async (payload: { name: string; parentFolderId: string | null; color?: string }, { dispatch }) => {
    const response = await folderService.create({ name: payload.name, parentFolder: payload.parentFolderId || undefined, color: payload.color });
    dispatch(fetchFolderTree());
    return response;
  }
);

export const moveItemsThunk = createAsyncThunk(
  'folder/moveItems',
  async (payload: { documentIds: string[]; folderIds: string[]; targetFolderId: string | null }, { dispatch }) => {
    const { documentIds, folderIds, targetFolderId } = payload;
    if (documentIds.length > 0) {
      await Promise.all(documentIds.map(id => documentService.moveDocument(id, targetFolderId)));
    }
    if (folderIds.length > 0) {
      await Promise.all(folderIds.map(id => folderService.moveFolder(id, targetFolderId)));
    }
    dispatch(fetchFolderTree());
    return payload;
  }
);

export const copyItemsThunk = createAsyncThunk(
  'folder/copyItems',
  async (payload: { documentIds: string[]; folderIds: string[]; targetFolderId: string | null }, { dispatch }) => {
    const { documentIds, folderIds, targetFolderId } = payload;
    if (documentIds.length > 0) {
      await Promise.all(documentIds.map(id => documentService.copyDocument(id, targetFolderId)));
    }
    if (folderIds.length > 0) {
      await Promise.all(folderIds.map(id => folderService.copyFolder(id, targetFolderId)));
    }
    dispatch(fetchFolderTree());
    return payload;
  }
);

export const setFolderColorThunk = createAsyncThunk(
  'folder/setColor',
  async (payload: { folderId: string; color: string }, { dispatch }) => {
    await folderService.setColor(payload.folderId, payload.color);
    dispatch(fetchFolderTree());
    return payload;
  }
);

const folderSlice = createSlice({
  name: 'folder',
  initialState,
  reducers: {
    clearFolderData: (state) => {
      state.currentFolder = null;
      state.breadcrumbs = [];
      state.folders = [];
      state.documents = [];
    },
    hydrateFolderCache: (state, action: PayloadAction<{ cacheKey: string; data: any }>) => {
      const { cacheKey, data } = action.payload;
      state.folderCache[cacheKey] = {
        currentFolder: data.currentFolder || null,
        breadcrumbs: data.breadcrumbs || [],
        folders: data.folders || [],
        documents: data.documents || [],
        pagination: data.pagination || null,
        timestamp: Date.now()
      };
      
      // If the currently requested key matches the hydrated cache key, apply it instantly
      const currentCacheKey = generateCacheKey(state.lastFetchParams);
      if (cacheKey === currentCacheKey) {
        state.currentFolder = data.currentFolder || null;
        state.breadcrumbs = data.breadcrumbs || [];
        state.folders = data.folders || [];
        state.documents = data.documents || [];
        state.pagination = data.pagination || null;
      }
    },
    updateDocumentStatus: (state, action: PayloadAction<{ id: string; status: any }>) => {
      const doc = state.documents.find(d => d._id === action.payload.id);
      if (doc) {
        doc.aiStatus = action.payload.status;
      }
    },
    updateDocumentStatuses: (state, action: PayloadAction<any>) => {
      const statuses = action.payload; // array or record
      if (Array.isArray(statuses)) {
        statuses.forEach(s => {
          const doc = state.documents.find(d => d._id === s._id);
          if (doc) doc.aiStatus = s.aiStatus;
        });
      } else {
        Object.entries(statuses).forEach(([id, status]) => {
          const doc = state.documents.find(d => d._id === id);
          if (doc) doc.aiStatus = status as any;
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderContents.pending, (state, action) => {
        const p = action.meta.arg || {};
        
        const targetFolderId = p.folderId || 'root';
        const isContextChange = 
          targetFolderId !== (state.currentFolder?._id || 'root');

        state.lastFetchParams = {
          folderId: p.folderId,
          search: p.search,
          sortBy: p.sortBy,
          sortOrder: p.sortOrder,
          page: p.page || 1,
          limit: p.limit || 10,
        };

        const cacheKey = generateCacheKey(p);
        const cached = state.folderCache[cacheKey];
        const CACHE_TTL_MS = 60_000;
        const isCacheValid = cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS;

        if (isCacheValid) {
          if (!p.page || p.page === 1) {
            state.currentFolder = cached.currentFolder;
            state.breadcrumbs = cached.breadcrumbs;
            state.folders = cached.folders;
            state.documents = cached.documents;
          }
          state.pagination = cached.pagination;
          state.loading = false;
          state.isRevalidating = true;
          state.error = null;
        } else if (isContextChange) {
          // Pre-set the currentFolder to route useLibraryCache to the right async cache key
          state.currentFolder = p.folderId ? { _id: p.folderId } as any : null;
          state.breadcrumbs = [];
          state.folders = [];
          state.documents = [];
          state.loading = true;
          state.error = null;
        } else {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchFolderContents.fulfilled, (state, action) => {
        state.loading = false;
        state.isRevalidating = false;
        
        const p = action.meta.arg || {};
        const { data, pagination, _requestPage } = action.payload as any;

        const requestedFolderId = p.folderId || 'root';
        const latestFolderId = state.lastFetchParams?.folderId || 'root';
        const cacheKey = generateCacheKey(p);

        if (!state.folderCache) state.folderCache = {};
        
        // Always save to cache
        state.folderCache[cacheKey] = {
          currentFolder: data.currentFolder,
          breadcrumbs: data.breadcrumbs,
          folders: data.folders,
          documents: data.documents,
          pagination: pagination || null,
          timestamp: Date.now()
        };

        // Ignore out-of-order responses for current view
        if (requestedFolderId !== latestFolderId) return;
        
        state.currentFolder = data.currentFolder;
        state.breadcrumbs = data.breadcrumbs;
        state.folders = data.folders;
        
        if (_requestPage > 1) {
          // append unique docs
          const existingIds = new Set(state.documents.map(d => d._id));
          const newDocs = data.documents.filter((d: any) => !existingIds.has(d._id));
          state.documents = [...state.documents, ...newDocs];
        } else {
          state.documents = data.documents;
        }
        state.pagination = pagination || null;
      })
      .addCase(fetchFolderContents.rejected, (state, action) => {
        state.loading = false;
        state.isRevalidating = false;
        state.error = action.error.message || 'Failed to fetch contents';
      })
      .addCase(fetchFolderTree.fulfilled, (state, action) => {
        state.tree = action.payload;
      })
      .addCase(setFolderColorThunk.fulfilled, (state, action) => {
        const { folderId, color } = action.payload;
        // Optimistic update in tree and current view
        const treeFolder = state.tree.find(f => f._id === folderId);
        if (treeFolder) treeFolder.color = color;

        const viewFolder = state.folders.find(f => f._id === folderId);
        if (viewFolder) viewFolder.color = color;
        
        if (state.currentFolder?._id === folderId) {
          state.currentFolder.color = color;
        }
      });
  },
});

export const { clearFolderData, hydrateFolderCache, updateDocumentStatus, updateDocumentStatuses } = folderSlice.actions;

export { generateCacheKey };
export default folderSlice.reducer;
