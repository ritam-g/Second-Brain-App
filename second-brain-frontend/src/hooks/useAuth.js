import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout, setAuthLoading } from '../redux/slices/authSlice';
import { loginUserApi, registerUserApi, checkAuthApi, logoutApi } from '../api/auth.api';

// BENEFIT of useAuthCheck: 
// Runs exactly once when the application mounts (inside App.jsx). It asks the backend if the secure cookie is valid.
// This completely removes the need to decode JWTs on the client-side or parse tokens out of localStorage.
export const useAuthCheck = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const checkAuth = async () => {
      dispatch(setAuthLoading(true));
      try {
        const response = await checkAuthApi();
        if (response.success && response.data?.user) {
          dispatch(loginSuccess(response.data.user));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        dispatch(logout());
      } finally {
        dispatch(setAuthLoading(false));
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

// BENEFIT of useLogin:
// We no longer extract and save the `jwtToken` to `localStorage`.
// We completely trust the backend to embed the `jwtToken` into an HTTP-Only cookie. We simply consume the generic user info it returns.
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const loginUser = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUserApi(credentials);
      const user = response.data?.user;
      
      if (!user) throw new Error("User data not found in response");
      
      dispatch(loginSuccess(user));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error, setError };
};

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await registerUserApi(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loading, error, setError };
};

// BENEFIT of useLogout:
// Since tokens aren't stored in React state/localStorage, logout MUST clear the cookie. 
// Calling the backend `/auth/logout` endpoint ensures the server removes the HTTP-only cookie reliably.
export const useLogout = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const performLogout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout API issue:', err);
    } finally {
      dispatch(logout());
      setLoading(false);
    }
  };

  return { performLogout, loading };
};
