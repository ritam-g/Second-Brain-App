import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';
import { loginUserApi, registerUserApi } from '../api/auth.api';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const loginUser = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUserApi(credentials);
      // Backend returns: { success: true, data: { user: {...}, token: "..." } }
      const token = response.data?.token || response.token; 
      
      if (!token) throw new Error("Token not found in response");
      
      localStorage.setItem('token', token);
      dispatch(loginSuccess(token));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
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
