import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';
import graphReducer from './graphSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    graph: graphReducer,
  },
});

export default store;
