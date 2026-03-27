import apiClient from './client';

export const loginUserApi = async (data) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const registerUserApi = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const checkAuthApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logoutApi = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const updateProfileApi = async (data) => {
  const response = await apiClient.patch('/auth/profile', data);
  return response.data;
};

export const changePasswordApi = async (data) => {
  const response = await apiClient.patch('/auth/password', data);
  return response.data;
};

export const deleteAccountApi = async () => {
  const response = await apiClient.delete('/auth/account');
  return response.data;
};
