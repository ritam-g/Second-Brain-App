import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthCheck } from './hooks/useAuth';
import AppToastContainer from './components/ui/AppToastContainer';

function App() {
  useAuthCheck();
  return (
    <>
      <RouterProvider router={router} />
      <AppToastContainer />
    </>
  );
}

export default App;
