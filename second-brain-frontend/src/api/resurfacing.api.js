import apiClient from './client';

// Fetches a resurfaced memory window for the authenticated user.
// Input: month offset integer such as 1, 2, or 12.
// Output: normalized payload with label and resurfaced content items.
export const fetchResurfaced = async (monthsAgo = 2, { debug = false } = {}) => {
  const params = new URLSearchParams({
    monthsAgo: String(monthsAgo),
  });

  if (debug) {
    params.set('debug', 'true');
  }

  const response = await apiClient.get(`/resurface?${params.toString()}`);
  const payload = response?.data ?? {};

  return {
    success: Boolean(payload?.success),
    label: String(payload?.label || '').trim(),
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: normalizeResurfacingMeta(payload?.meta),
  };
};

export default fetchResurfaced;

function normalizeResurfacingMeta(meta) {
  const range = meta && typeof meta === 'object' ? meta.range : null;

  return {
    debug: Boolean(meta?.debug),
    mode: String(meta?.mode || '').trim(),
    requestedMonthsAgo: Number.isFinite(Number(meta?.requestedMonthsAgo))
      ? Number(meta.requestedMonthsAgo)
      : 2,
    requestedLabel: String(meta?.requestedLabel || '').trim(),
    effectiveLabel: String(meta?.effectiveLabel || '').trim(),
    range: {
      start: String(range?.start || '').trim(),
      end: String(range?.end || '').trim(),
    },
    itemsFound: Number.isFinite(Number(meta?.itemsFound)) ? Number(meta.itemsFound) : 0,
    returnedCount: Number.isFinite(Number(meta?.returnedCount)) ? Number(meta.returnedCount) : 0,
    emptyReason: String(meta?.emptyReason || '').trim(),
  };
}
