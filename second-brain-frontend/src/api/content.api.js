import apiClient from './client';

export const getContentApi = async () => {
  const response = await apiClient.get('/content/get-single-user');
  return response.data;
};

export const saveContentApi = async (data) => {
  const response = await apiClient.post('/content/save', data);
  return response.data;
};

export const deleteContentApi = async (id) => {
  const response = await apiClient.delete(`/content/delete/${id}`);
  return response.data;
};
