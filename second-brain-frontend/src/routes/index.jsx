import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import DeepFocus from '../pages/DeepFocus';
import { ProtectedRoute, PublicRoute } from './RouteGuards';

const GraphPage = lazy(() => import('../pages/GraphPage'));

// BENEFIT of utilizing User and Loading states:
// By using `loading`, we prevent a UX issue called "hydration flicker" where an authenticated user 
// gets violently redirected to /login for a millisecond while the cookie is being verified against the API.
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <Navigate to="/login" replace />
      </PublicRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/deep-focus',
    element: (
      <ProtectedRoute>
        <DeepFocus />
      </ProtectedRoute>
    ),
  },
  {
    path: '/graph',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteLoadingFallback />}>
          <GraphPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-900 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian-500">
      Loading workspace...
    </div>
  );
}
