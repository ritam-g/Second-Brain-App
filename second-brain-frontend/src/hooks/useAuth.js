import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout, setAuthLoading } from '../redux/slices/authSlice';
import { clearContentState } from '../redux/slices/contentSlice';
import { resetGraphState } from '../redux/graphSlice';
import {
  changePasswordApi,
  checkAuthApi,
  deleteAccountApi,
  loginUserApi,
  logoutApi,
  registerUserApi,
  updateProfileApi,
} from '../api/auth.api';
import { getApiErrorMessage } from '../utils/api-error';
import { notify } from '../utils/toast';

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
      resetSessionState(dispatch);
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Logout failed') };
    } finally {
      setLoading(false);
    }
  };

  return { performLogout, loading };
};

export const useUpdateProfile = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await notify.promise(
        updateProfileApi(profileData),
        {
          pending: 'Updating your profile...',
          success: (result) => result?.message || 'Profile updated successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to update profile'),
        },
        { toastId: 'update-profile-request' },
      );

      if (response?.data?.user) {
        dispatch(loginSuccess(response.data.user));
      }

      return { success: true, data: response?.data?.user || null };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Failed to update profile') };
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading };
};

export const useChangePassword = () => {
  const [loading, setLoading] = useState(false);

  const changePassword = async (passwordData) => {
    setLoading(true);
    try {
      await notify.promise(
        changePasswordApi(passwordData),
        {
          pending: 'Updating your password...',
          success: (result) => result?.message || 'Password updated successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to update password'),
        },
        { toastId: 'change-password-request' },
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Failed to update password') };
    } finally {
      setLoading(false);
    }
  };

  return { changePassword, loading };
};

export const useDeleteAccount = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await notify.promise(
        deleteAccountApi(),
        {
          pending: 'Deleting your account...',
          success: (result) => result?.message || 'Account deleted successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to delete account'),
        },
        { toastId: 'delete-account-request' },
      );

      resetSessionState(dispatch);
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Failed to delete account') };
    } finally {
      setLoading(false);
    }
  };

  return { deleteAccount, loading };
};

function resetSessionState(dispatch) {
  dispatch(logout());
  dispatch(clearContentState());
  dispatch(resetGraphState());
}
