import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setContentLoading: (state, action) => {
      state.loading = action.payload;
    },
    setContentError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setContentData: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addContentItem: (state, action) => {
      state.items.unshift(action.payload);
      state.loading = false;
      state.error = null;
    },
    removeContentItem: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setContentLoading, setContentError, setContentData, addContentItem, removeContentItem } = contentSlice.actions;
export default contentSlice.reducer;
