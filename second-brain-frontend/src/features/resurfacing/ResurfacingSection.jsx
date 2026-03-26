import React from 'react';
import { motion } from 'framer-motion';
import ResurfacedCard from './ResurfacedCard';
import { useResurfacing } from './useResurfacing';

// Lightweight resurfacing strip that keeps the time context inside each card instead of a large separate UI.
// Input: none. Internally loads the primary resurfacing window for the authenticated user.
// Output: compact card grid or nothing when there is no resurfaced content.
export default function ResurfacingSection() {
  const testingDebugEnabled = resolveResurfacingDebugMode();
  const { data, loading, error } = useResurfacing(2, { debug: testingDebugEnabled });
  const MotionDiv = motion.div;

  if (error || (!loading && !data.length)) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && !data.length
          ? Array.from({ length: 3 }, (_, index) => <ResurfacedCardSkeleton key={index} />)
          : data.slice(0, 3).map((item, index) => (
            <MotionDiv
              key={item._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.05 }}
            >
              <ResurfacedCard item={item} />
            </MotionDiv>
          ))}
      </div>
    </section>
  );
}

function ResurfacedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(23,18,15,0.88)]">
      <div className="h-44 animate-pulse bg-[rgba(255,255,255,0.04)]" />
      <div className="space-y-3 p-4">
        <div className="h-7 w-1/2 rounded-full bg-[rgba(255,255,255,0.05)]" />
        <div className="h-3 w-1/3 rounded-full bg-[rgba(255,255,255,0.05)]" />
        <div className="h-6 w-3/4 rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="h-4 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
      </div>
    </div>
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

  return Boolean(import.meta.env.DEV);
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
