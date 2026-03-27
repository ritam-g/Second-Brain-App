import { useCallback, useEffect, useState } from 'react';
import { fetchResurfaced } from '../../../api/resurfacing.api';
import { getApiErrorMessage } from '../../../utils/api-error';

// Fetches one resurfacing time window for the dashboard memory feature.
// Input: month offset integer.
// Output: loading/error state, display label, and resurfaced content items.
export function useResurfacing(monthsAgo = 2, { debug = false } = {}) {
  const [data, setData] = useState([]);
  const [label, setLabel] = useState('');
  const [meta, setMeta] = useState(() => createDefaultMeta({ monthsAgo, debug }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResurfaced = useCallback(async ({ isMountedRef } = {}) => {
    if (!isMountedRef || isMountedRef.current) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await fetchResurfaced(monthsAgo, { debug });

      if (isMountedRef && !isMountedRef.current) {
        return;
      }

      setData(Array.isArray(response?.data) ? response.data : []);
      setLabel(String(response?.label || response?.meta?.requestedLabel || '').trim());
      setMeta(response?.meta || createDefaultMeta({ monthsAgo, debug }));
      setError('');
    } catch (requestError) {
      if (isMountedRef && !isMountedRef.current) {
        return;
      }

      setData([]);
      setLabel('');
      setMeta(createDefaultMeta({ monthsAgo, debug }));
      setError(getApiErrorMessage(requestError, 'Failed to load resurfaced memories'));
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [debug, monthsAgo]);

  useEffect(() => {
    const stateRef = { current: true };
    loadResurfaced({ isMountedRef: stateRef });

    return () => {
      stateRef.current = false;
    };
  }, [loadResurfaced]);

  return {
    data,
    label,
    meta,
    loading,
    error,
    refresh: async () => {
      setLoading(true);
      await loadResurfaced();
    },
  };
}

export default useResurfacing;

function createDefaultMeta({ monthsAgo, debug }) {
  return {
    debug: Boolean(debug),
    mode: debug ? 'debug_recent' : '',
    requestedMonthsAgo: Number.isFinite(Number(monthsAgo)) ? Number(monthsAgo) : 2,
    requestedLabel: '',
    effectiveLabel: debug ? 'last 7 days' : '',
    range: {
      start: '',
      end: '',
    },
    itemsFound: 0,
    returnedCount: 0,
    emptyReason: '',
  };
}
