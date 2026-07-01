import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { documentService, type Document } from '../api/documentService';
import { aiService } from '../../ai/api/aiService';
import { prettifyService, isPrettifyLimitError, type PrettifyResult, type PrettifyLimitError } from '../../../services/prettify.service';
import { fetchFolderContents } from '../../folders/store/folderSlice';
import type { RootState } from '../../../store/store';

interface DocumentState {
  activeDocument: Document | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  isActionLoading: boolean;
  synthesisResult: string | null;
  prettifyState: {
    status: 'initial' | 'loading' | 'error' | 'result';
    result: PrettifyResult | null;
    limitError: PrettifyLimitError | null;
    genericError: string | null;
  };
}

const initialState: DocumentState = {
  activeDocument: null,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  isActionLoading: false,
  synthesisResult: null,
  prettifyState: {
    status: 'initial',
    result: null,
    limitError: null,
    genericError: null,
  },
};

export const prettifyDocument = createAsyncThunk(
  'document/prettify',
  async ({ documentId, force = false }: { documentId: string; force?: boolean }, { rejectWithValue }) => {
    try {
      const result = await prettifyService.prettifyDocument(documentId, force);
      return { documentId, result };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data || { message: e.message || 'Something went wrong' });
    }
  }
);

export const uploadFiles = createAsyncThunk(
  'document/uploadFiles',
  async (formData: FormData, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await documentService.uploadWithProgress(formData, (pct) => {
        dispatch(documentSlice.actions.setUploadProgress(pct));
      });
      
      const state = getState() as RootState;
      dispatch(fetchFolderContents({ folderId: state.folder.currentFolder?._id }));
      
      return response;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Upload failed');
    }
  }
);

export const uploadText = createAsyncThunk(
  'document/uploadText',
  async ({ text, title }: { text: string; title?: string }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await documentService.uploadText(text, title);
      const state = getState() as RootState;
      dispatch(fetchFolderContents({ folderId: state.folder.currentFolder?._id }));
      return response;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Upload text failed');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'document/delete',
  async (id: string, { dispatch, getState, rejectWithValue }) => {
    try {
      await documentService.delete(id);
      const state = getState() as RootState;
      dispatch(fetchFolderContents({ folderId: state.folder.currentFolder?._id }));
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Delete failed');
    }
  }
);

export const bulkDeleteDocuments = createAsyncThunk(
  'document/bulkDelete',
  async (ids: string[], { dispatch, getState, rejectWithValue }) => {
    try {
      await documentService.bulkDelete(ids);
      const state = getState() as RootState;
      dispatch(fetchFolderContents({ folderId: state.folder.currentFolder?._id }));
      return ids;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Bulk delete failed');
    }
  }
);

export const applySemanticFolders = createAsyncThunk(
  'document/applySemanticFolders',
  async (updates: { documentId: string, newPath: string }[], { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await aiService.applySemanticFolders(updates);
      const state = getState() as RootState;
      dispatch(fetchFolderContents({ folderId: state.folder.currentFolder?._id }));
      return res;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to apply folders');
    }
  }
);

export const synthesizeDocuments = createAsyncThunk(
  'document/synthesize',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const res = await aiService.synthesize(ids);
      let raw = res?.data?.synthesis ?? res?.synthesis ?? res?.data ?? null;
      if (typeof raw === 'object' && raw !== null) {
        raw = (raw as any).synthesis ?? (raw as any).summary ?? JSON.stringify(raw);
      }
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          raw = parsed.synthesis ?? parsed.summary ?? raw;
        } catch {}
      }
      return typeof raw === 'string' ? raw : 'Synthesis complete.';
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Synthesis failed');
    }
  }
);

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearSynthesisResult: (state) => {
      state.synthesisResult = null;
    },
    resetPrettifyState: (state) => {
      state.prettifyState = initialState.prettifyState;
    },
    updateDocumentPrettifiedJson: (state, action: PayloadAction<{ documentId: string; result: PrettifyResult }>) => {
      // Find the document in current folder's state if possible, though we might not need this if we don't store documents in this slice.
      // Since documents are mainly in folderSlice, we just update the prettify state.
      state.prettifyState.status = 'result';
      state.prettifyState.result = action.payload.result;
      state.prettifyState.limitError = null;
      state.prettifyState.genericError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFiles.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
      })
      .addCase(uploadFiles.fulfilled, (state) => {
        state.isUploading = false;
        state.uploadProgress = 100;
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadText.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(uploadText.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadText.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })
      .addCase(synthesizeDocuments.pending, (state) => {
        state.isActionLoading = true;
        state.synthesisResult = null;
      })
      .addCase(synthesizeDocuments.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.synthesisResult = action.payload;
      })
      .addCase(synthesizeDocuments.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(applySemanticFolders.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(applySemanticFolders.fulfilled, (state) => {
        state.isActionLoading = false;
      })
      .addCase(applySemanticFolders.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDocument.pending, (state) => { state.isActionLoading = true; })
      .addCase(deleteDocument.fulfilled, (state) => { state.isActionLoading = false; })
      .addCase(deleteDocument.rejected, (state) => { state.isActionLoading = false; })
      .addCase(bulkDeleteDocuments.pending, (state) => { state.isActionLoading = true; })
      .addCase(bulkDeleteDocuments.fulfilled, (state) => { state.isActionLoading = false; })
      .addCase(bulkDeleteDocuments.rejected, (state) => { state.isActionLoading = false; })
      .addCase(prettifyDocument.pending, (state) => {
        state.prettifyState.status = 'loading';
        state.prettifyState.limitError = null;
        state.prettifyState.genericError = null;
      })
      .addCase(prettifyDocument.fulfilled, (state, action) => {
        state.prettifyState.status = 'result';
        state.prettifyState.result = action.payload.result;
      })
      .addCase(prettifyDocument.rejected, (state, action) => {
        state.prettifyState.status = 'error';
        const payload = action.payload as any;
        if (isPrettifyLimitError(payload)) {
          state.prettifyState.limitError = payload;
        } else {
          state.prettifyState.genericError = payload?.message || 'Something went wrong. Please try again.';
        }
      });
  },
});

export const { setUploadProgress, clearSynthesisResult, resetPrettifyState, updateDocumentPrettifiedJson } = documentSlice.actions;
export default documentSlice.reducer;
