import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import DeepFocus from '../pages/DeepFocus';
import { ProtectedRoute, PublicRoute } from './RouteGuards';

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
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
