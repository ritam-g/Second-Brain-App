import apiClient from './client';

// Calls the backend RAG endpoint so Deep Focus can retrieve context and generate a grounded answer.
// Input: natural-language query and optional topK override.
// Output: backend JSON payload containing `answer` and `sources`.
export const askAI = async ({ query, topK } = {}) => {
  const response = await apiClient.post('/rag/query', {
    query,
    ...(topK ? { topK } : {}),
  });

  return response.data;
};

export default askAI;
