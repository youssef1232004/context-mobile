import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { comparisonService, type ComparisonResult } from '../features/comparison/api/comparisonService';

interface ComparisonState {
  historyList: ComparisonResult[];
  activeComparison: ComparisonResult | null;
  activeChatMessages: any[];
  isComparing: boolean;
  isHistoryLoading: boolean;
  error: string | null;
}

const initialState: ComparisonState = {
  historyList: [],
  activeComparison: null,
  activeChatMessages: [],
  isComparing: false,
  isHistoryLoading: false,
  error: null,
};

export const fetchHistory = createAsyncThunk(
  'comparison/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await comparisonService.getHistory();
      return res.data || res;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to load history');
    }
  }
);

export const loadComparisonRecord = createAsyncThunk(
  'comparison/loadRecord',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await comparisonService.getHistoryRecord(id);
      const record = res.data || res;
      let chatMessages = [];
      const docAId = record.docIdA;
      const docBId = record.docIdB;
      if (docAId && docBId) {
        try {
          const chatRes = await comparisonService.getChatHistory(docAId, docBId);
          if (chatRes.data) chatMessages = chatRes.data;
        } catch {}
      }
      return { record, chatMessages };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to load comparison record');
    }
  }
);

export const renameHistoryRecord = createAsyncThunk(
  'comparison/renameHistory',
  async ({ id, titleA, titleB }: { id: string, titleA?: string, titleB?: string }, { rejectWithValue }) => {
    try {
      await comparisonService.updateHistory(id, { titleA, titleB });
      return { id, titleA, titleB };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to rename history');
    }
  }
);

export const deleteHistoryRecord = createAsyncThunk(
  'comparison/deleteHistory',
  async (id: string, { rejectWithValue }) => {
    try {
      await comparisonService.deleteHistory(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to delete history');
    }
  }
);

export const compareDocuments = createAsyncThunk(
  'comparison/compareDocuments',
  async (params: { selectedIds: string[], documents: any[] }, { rejectWithValue }) => {
    try {
      const res = await comparisonService.compare(params.selectedIds);
      const comparison = res.data.comparison;
      
      const docA = params.documents.find(d => d._id === params.selectedIds[0]);
      const docB = params.documents.find(d => d._id === params.selectedIds[1]);
      
      try {
        await comparisonService.saveHistory({
          docIdA: params.selectedIds[0],
          docIdB: params.selectedIds[1],
          titleA: docA?.title || 'Document A',
          titleB: docB?.title || 'Document B',
          comparison: {
            doc1: { _id: params.selectedIds[0], title: docA?.title || 'Document A' },
            doc2: { _id: params.selectedIds[1], title: docB?.title || 'Document B' },
            comparison: comparison
          } as any
        });
      } catch {}
      
      return comparison;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Comparison failed');
    }
  }
);

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState,
  reducers: {
    clearActiveComparison: (state) => {
      state.activeComparison = null;
      state.activeChatMessages = [];
      state.error = null;
    },
    addChatMessage: (state, action) => {
      state.activeChatMessages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.isHistoryLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isHistoryLoading = false;
        state.historyList = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isHistoryLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadComparisonRecord.pending, (state) => {
        state.isComparing = true;
        state.error = null;
      })
      .addCase(loadComparisonRecord.fulfilled, (state, action) => {
        state.isComparing = false;
        const actualResult = action.payload.record.comparison?.comparison ? action.payload.record.comparison.comparison : action.payload.record.comparison;
        state.activeComparison = actualResult;
        state.activeChatMessages = action.payload.chatMessages;
      })
      .addCase(loadComparisonRecord.rejected, (state, action) => {
        state.isComparing = false;
        state.error = action.payload as string;
      })
      .addCase(compareDocuments.pending, (state) => {
        state.isComparing = true;
        state.activeComparison = null;
        state.activeChatMessages = [];
        state.error = null;
      })
      .addCase(compareDocuments.fulfilled, (state, action) => {
        state.isComparing = false;
        state.activeComparison = action.payload;
      })
      .addCase(compareDocuments.rejected, (state, action) => {
        state.isComparing = false;
        state.error = action.payload as string;
      })
      .addCase(deleteHistoryRecord.fulfilled, (state, action) => {
        state.historyList = state.historyList.filter(h => h._id !== action.payload);
      })
      .addCase(renameHistoryRecord.fulfilled, (state, action) => {
        const index = state.historyList.findIndex(h => h._id === action.payload.id);
        if (index !== -1) {
          if (action.payload.titleA) (state.historyList[index] as any).titleA = action.payload.titleA;
          if (action.payload.titleB) (state.historyList[index] as any).titleB = action.payload.titleB;
        }
      });
  },
});

export const { clearActiveComparison, addChatMessage } = comparisonSlice.actions;
export default comparisonSlice.reducer;
