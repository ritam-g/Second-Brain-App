import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MasonryGrid from '../../../components/content/MasonryGrid';
import ContentCard from '../../../components/content/ContentCard';
import { normalizeContentCollection } from '../../../components/content/utils';
import { useResurfacing } from '../hooks/useResurfacing';

/**
 * ResurfacingSection Component
 * Responsibility: injects time-based memory resurfacing into the dashboard without changing card UI.
 * Handles: resurfacing fetch state and card normalization for archived content.
 */
export default function ResurfacingSection() {
  const { items } = useSelector((state) => state.content);
  const testingDebugEnabled = resolveResurfacingDebugMode();
  const { data, loading, error } = useResurfacing(2, { debug: testingDebugEnabled });
  const availableContentIds = useMemo(
    () => new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item?._id || item?.id || '').trim())
        .filter(Boolean),
    ),
    [items],
  );
  // Only keep resurfaced cards that still exist in the current archive snapshot.
  const resurfacedItems = useMemo(
    () => normalizeContentCollection(data.slice(0, 3), { context: 'resurfacing' }).filter((item) => {
      if (!item?.deleteId || !availableContentIds.size) {
        return true;
      }

      return availableContentIds.has(String(item.deleteId).trim());
    }),
    [availableContentIds, data],
  );

  if (error || (!loading && !resurfacedItems.length)) {
    return null;
  }

  return (
    <section
      className="resurfacing-section debug-resurfacing-section mt-8"
      data-debug="resurfacing-section"
      data-count={resurfacedItems.length}
    >
      <MasonryGrid
        items={resurfacedItems}
        loading={loading && !resurfacedItems.length}
        skeletonCount={3}
        renderItem={(item, index) => <ContentCard content={item} index={index} />}
      />
    </section>
  );
}

function resolveResurfacingDebugMode() {
  const queryValue = readDebugQueryOverride();

  if (queryValue !== null) {
    return queryValue;
  }

  const envValue = String(import.meta.env.VITE_RESURFACING_DEBUG || '').trim().toLowerCase();

  if (envValue === 'true') {
    return true;
  }

  if (envValue === 'false') {
    return false;
  }

  return false;
}

function readDebugQueryOverride() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = new URLSearchParams(window.location.search).get('resurfacingDebug');

  if (rawValue === null) {
    return null;
  }

  const normalizedValue = String(rawValue).trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return null;
}
