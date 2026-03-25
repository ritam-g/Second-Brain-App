import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout, setAuthLoading } from '../redux/slices/authSlice';
import { loginUserApi, registerUserApi, checkAuthApi, logoutApi } from '../api/auth.api';
import { getApiErrorMessage } from '../lib/api-error';
import { notify } from '../lib/toast';

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
      } catch {
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
  const dispatch = useDispatch();

  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      const loginRequest = loginUserApi(credentials).then((result) => {
        if (!result?.data?.user) {
          throw new Error('User data not found in response');
        }

        return result;
      });

      const response = await notify.promise(
        loginRequest,
        {
          pending: 'Signing you in...',
          success: (result) => result?.message || 'Welcome back.',
          error: (error) => getApiErrorMessage(error, 'Login failed'),
        },
        { toastId: 'login-request' },
      );
      dispatch(loginSuccess(response.data.user));
      return { success: true };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Login failed');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading };
};

export const useRegister = () => {
  const [loading, setLoading] = useState(false);

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      await notify.promise(
        registerUserApi(userData),
        {
          pending: 'Creating your account...',
          success: (result) => result?.message || 'Account created successfully.',
          error: (error) => getApiErrorMessage(error, 'Registration failed'),
        },
        { toastId: 'register-request' },
      );
      return { success: true };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Registration failed');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loading };
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
      await notify.promise(
        logoutApi(),
        {
          pending: 'Signing you out...',
          success: (result) => result?.message || 'Logged out successfully.',
          error: (error) => getApiErrorMessage(error, 'Logout failed'),
        },
        { toastId: 'logout-request' },
      );
      dispatch(logout());
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Logout failed') };
    } finally {
      setLoading(false);
    }
  };

  return { performLogout, loading };
};
