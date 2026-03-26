import apiClient from './client';

// Fetches the semantic relationship graph for the authenticated user's library.
// Input: none.
// Output: normalized graph payload containing `nodes` and `edges`.
export const fetchGraphData = async () => {
  const response = await apiClient.get('/graph');
  const payload = response?.data?.data ?? response?.data ?? {};

  return {
    nodes: Array.isArray(payload?.nodes) ? payload.nodes : [],
    edges: Array.isArray(payload?.edges) ? payload.edges : [],
  };
};
