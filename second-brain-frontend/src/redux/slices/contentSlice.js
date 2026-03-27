import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
  isViewerOpen: false,
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setContentLoading: (state, action) => {
      state.loading = action.payload;
      state.error = null;
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
    openContentViewer: (state, action) => {
      state.selectedItem = action.payload || null;
      state.isViewerOpen = Boolean(action.payload);
    },
    closeContentViewer: (state) => {
      state.selectedItem = null;
      state.isViewerOpen = false;
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

      if (matchesSelectedItem(state.selectedItem, action.payload)) {
        state.selectedItem = null;
        state.isViewerOpen = false;
      }
    },
    clearContentState: () => ({ ...initialState }),
  },
});

export const {
  setContentLoading,
  setContentError,
  setContentData,
  openContentViewer,
  closeContentViewer,
  addContentItem,
  removeContentItem,
  clearContentState,
} = contentSlice.actions;
export default contentSlice.reducer;

function matchesSelectedItem(item, id) {
  if (!item || !id) {
    return false;
  }

  const normalizedId = String(id).trim();
  const candidateIds = [
    item?._id,
    item?.id,
    item?.deleteId,
    item?.contentId,
    item?.raw?._id,
    item?.raw?.id,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return candidateIds.includes(normalizedId);
}
