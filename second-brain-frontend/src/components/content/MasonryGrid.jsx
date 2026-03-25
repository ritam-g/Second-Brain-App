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

// Responsive masonry grid wrapper with built-in loading skeletons.
// Input: data items, loading state, and a render callback for each card.
// Output: masonry layout that preserves the premium staggered gallery feel across breakpoints.
const MasonryGrid = ({ items = [], loading = false, renderItem }) => {
  const skeletonItems = Array.from({ length: 6 }, (_, index) => index);
  const MotionDiv = motion.div;

  return (
    <Masonry breakpointCols={breakpointColumns} className="obsidian-masonry-grid" columnClassName="obsidian-masonry-grid_column">
      {loading
        ? skeletonItems.map((index) => <ContentCardSkeleton key={index} index={index} />)
        : items.map((item, index) => (
          <MotionDiv
            key={item._id}
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

function ContentCardSkeleton({ index }) {
  const heightPresets = ['h-[280px]', 'h-[360px]', 'h-[320px]'];

  return (
    <GlassCard className="overflow-hidden">
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
