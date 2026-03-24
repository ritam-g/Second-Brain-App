import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthCheck } from './hooks/useAuth';

function App() {
  useAuthCheck();
  return <RouterProvider router={router} />;
}

export default App;
