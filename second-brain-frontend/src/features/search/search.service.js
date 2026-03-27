import apiClient from '../../api/client';

const defaultTopK = 8;

// Calls the backend semantic search API and normalizes the response into chunk-level UI results.
// Input: natural-language query and optional topK.
// Output: array of normalized semantic search matches.
export async function semanticSearchService({ query, topK = defaultTopK }) {
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    return [];
  }

  const response = await apiClient.post('/search/semantic', {
    query: normalizedQuery,
    topK,
  });

  const payload = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return normalizeSemanticResults(payload);
}

// Converts different backend result shapes into one consistent frontend-friendly result format.
// Input: raw array from the semantic search API.
// Output: normalized semantic search items.
export function normalizeSemanticResults(results = []) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((result, index) => normalizeSemanticResult(result, index))
    .filter(Boolean);
}

function normalizeSemanticResult(result, index) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const metadata = result.metadata && typeof result.metadata === 'object'
    ? result.metadata
    : null;
  const contentId = String(
    metadata?.contentId
    || result.contentId
    || result._id
    || result.id
    || `semantic-result-${index}`,
  ).trim();
  const title = String(metadata?.title || result.title || 'Untitled Content').trim();
  const type = String(metadata?.type || result.type || 'article').trim().toLowerCase() || 'article';
  const image = String(metadata?.image || result.image || '').trim();
  const url = String(metadata?.url || result.url || '').trim();
  const createdAt = String(metadata?.createdAt || result.createdAt || '').trim();
  const matchedChunkText = normalizeSnippet(
    metadata?.text
    || result.matchedChunkText
    || result.matchText
    || result.description
    || result.summary
    || '',
  );
  const score = normalizeScore(result.score ?? result.matchScore);

  return {
    id: `${contentId}-${index}`,
    contentId,
    title,
    type,
    image,
    url,
    createdAt,
    matchedChunkText,
    description: String(result.description || result.summary || '').trim(),
    tags: Array.isArray(result.tags) ? result.tags : [],
    score,
    metadata: metadata || {
      contentId,
      title,
      type,
      image,
      url,
      createdAt,
      text: matchedChunkText,
    },
    raw: result,
  };
}

function normalizeSnippet(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
}

function normalizeScore(value) {
  const numericScore = Number(value);
  return Number.isFinite(numericScore) ? numericScore : null;
}
