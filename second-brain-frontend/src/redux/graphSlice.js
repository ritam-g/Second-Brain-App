import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchGraphData } from '../api/graph.api';
import { getApiErrorMessage } from '../utils/api-error';

export const getGraphData = createAsyncThunk(
  'graph/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchGraphData();
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load the knowledge graph'));
    }
  },
);

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    nodes: [],
    edges: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetGraphState: (state) => {
      state.nodes = [];
      state.edges = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGraphData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGraphData.fulfilled, (state, action) => {
        state.loading = false;
        state.nodes = Array.isArray(action.payload?.nodes) ? action.payload.nodes : [];
        state.edges = Array.isArray(action.payload?.edges) ? action.payload.edges : [];
        state.error = null;
      })
      .addCase(getGraphData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to load the knowledge graph';
      });
  },
});

export const { resetGraphState } = graphSlice.actions;
export default graphSlice.reducer;
