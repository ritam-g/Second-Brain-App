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

export const clearAllContentApi = async () => {
  const response = await apiClient.delete('/content/clear-all');
  return response.data;
};

export const uploadContentApi = async (formData) => {
  const response = await apiClient.post('/content/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Alias that matches the newer backend/frontend naming without breaking existing imports.
export const uploadContent = uploadContentApi;

export const semanticSearchContentApi = async (payload) => {
  const response = await apiClient.post('/search/semantic', payload);
  return response.data;
};

export const semanticSearchContent = semanticSearchContentApi;
