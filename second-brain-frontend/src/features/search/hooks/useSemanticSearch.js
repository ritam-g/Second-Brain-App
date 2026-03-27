import { useCallback, useEffect, useRef, useState } from 'react';
import { semanticSearchService } from '../search.service';
import { getApiErrorMessage } from '../../../utils/api-error';

// Drives API-first semantic search with optional debounced auto-search behavior.
// Input: configuration for debounce timing, result count, and auto-search mode.
// Output: search state plus imperative and query-driven search controls.
export const useSemanticSearch = ({
  autoSearch = false,
  debounceMs = 350,
  topK = 8,
} = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const requestSequence = useRef(0);

  const runSearch = useCallback(async (nextQuery, options = {}) => {
    const normalizedQuery = String(nextQuery || '').trim();

    if (!normalizedQuery) {
      setResults([]);
      setError('');
      setLastQuery('');
      return { success: true, data: [] };
    }

    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setLoading(true);
    setError('');

    try {
      const searchResults = await semanticSearchService({
        query: normalizedQuery,
        topK: options.topK ?? topK,
      });

      if (requestId === requestSequence.current) {
        setResults(searchResults);
        setLastQuery(normalizedQuery);
      }

      return { success: true, data: searchResults };
    } catch (searchError) {
      const message = getApiErrorMessage(searchError, 'Semantic search failed');

      if (requestId === requestSequence.current) {
        setResults([]);
        setError(message);
        setLastQuery(normalizedQuery);
      }

      return { success: false, error: message };
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [topK]);

  const clearSearch = useCallback(() => {
    requestSequence.current += 1;
    setQuery('');
    setResults([]);
    setError('');
    setLastQuery('');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!autoSearch) {
      return undefined;
    }

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setResults([]);
      setError('');
      setLastQuery('');
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    setLastQuery(normalizedQuery);
    setResults([]);

    const handler = window.setTimeout(() => {
      runSearch(normalizedQuery);
    }, debounceMs);

    return () => {
      window.clearTimeout(handler);
    };
  }, [autoSearch, debounceMs, query, runSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    lastQuery,
    runSearch,
    searchContent: runSearch,
    clearSearch,
    isSearchActive: Boolean(query.trim()),
  };
};

export default useSemanticSearch;
