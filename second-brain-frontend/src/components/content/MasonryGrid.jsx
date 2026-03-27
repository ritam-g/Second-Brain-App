import React from 'react';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const breakpointColumns = {
  default: 3,
  1280: 3,
  1024: 2,
  768: 1,
};

/**
 * MasonryGrid Component
 * Responsibility: keeps variable-height cards aligned in one reusable layout shell.
 * Handles: animated card entry and skeleton placeholders for loading states.
 */
const MasonryGrid = ({ items = [], loading = false, renderItem, skeletonCount = 6 }) => {
  const skeletonItems = Array.from({ length: skeletonCount }, (_, index) => index);
  const MotionDiv = motion.div;

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="obsidian-masonry-grid debug-masonry-grid"
      columnClassName="obsidian-masonry-grid_column debug-masonry-column"
      data-debug="masonry-grid"
      data-loading={loading ? 'true' : 'false'}
      data-item-count={items.length}
    >
      {loading
        ? skeletonItems.map((index) => <ContentCardSkeleton key={index} index={index} />)
        : items.map((item, index) => (
          <MotionDiv
            key={item?._id || item?.contentId || item?.id || `masonry-item-${index}`}
            className="masonry-item debug-masonry-item"
            data-debug="masonry-item"
            data-id={item?._id || item?.contentId || item?.id || ''}
            data-type={item?.type || 'unknown'}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
          >
            {renderItem(item, index)}
          </MotionDiv>
        ))}
    </Masonry>
  );
};

/**
 * ContentCardSkeleton Component
 * Responsibility: preserves expected card rhythm while real content is still loading.
 */
function ContentCardSkeleton({ index }) {
  const heightPresets = ['h-[280px]', 'h-[360px]', 'h-[320px]'];

  return (
    <GlassCard
      className="content-card-skeleton debug-content-card-skeleton overflow-hidden"
      data-debug="content-card-skeleton"
    >
      <div className={`animate-pulse bg-[rgba(255,255,255,0.02)] ${heightPresets[index % heightPresets.length]}`}>
        <div className="h-40 bg-[rgba(255,255,255,0.04)]" />
        <div className="space-y-3 p-5">
          <div className="h-3 w-20 rounded-full bg-[rgba(255,255,255,0.05)]" />
          <div className="h-6 w-3/4 rounded-full bg-[rgba(255,255,255,0.06)]" />
          <div className="h-4 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
          <div className="h-4 w-2/3 rounded-full bg-[rgba(255,255,255,0.04)]" />
        </div>
      </div>
    </GlassCard>
  );
}

export default MasonryGrid;
