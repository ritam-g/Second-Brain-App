import { createSlice } from '@reduxjs/toolkit';

// ARCHITECTURAL CHANGE & BENEFIT:
// Moving away from `token` to strictly validating the presence of the `user` object.
// 1. Security: We don't rely on or parse localStorage tokens.
// 2. UX (User Experience): We introduce a `loading` state to check `/auth/me` on startup. 
//    This prevents unauthenticated flashes/flickers across the UI before validation completes.
const initialState = {
  user: null,
  loading: true, // initial state is loading since we need to securely check cookie validation
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
});

export const { loginSuccess, logout, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
