import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { folderService, type FolderData, type FolderContentsResponse } from '../features/folders/api/folderService';
import type { Document } from '../features/documents/api/documentService';

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
};

export const fetchFolderContents = createAsyncThunk(
  'folder/fetchContents',
  async (params: { folderId?: string; search?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await folderService.getContents(params);
      return { ...response, _requestPage: params?.page || 1 };
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
      .addCase(fetchFolderContents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolderContents.fulfilled, (state, action) => {
        state.loading = false;
        const { data, pagination, _requestPage } = action.payload as any;
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
        state.error = action.payload as string;
      })
      .addCase(fetchFolderTree.fulfilled, (state, action) => {
        state.tree = action.payload;
      });
  },
});

export const { clearFolderData, updateDocumentStatus, updateDocumentStatuses } = folderSlice.actions;
export default folderSlice.reducer;
