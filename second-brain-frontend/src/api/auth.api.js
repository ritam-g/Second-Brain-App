import apiClient from './client';

export const loginUserApi = async (data) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const registerUserApi = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};
