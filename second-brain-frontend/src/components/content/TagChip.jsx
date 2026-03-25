import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const toneClasses = {
  filter: 'border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] text-obsidian-400 hover:border-[rgba(255,191,64,0.18)] hover:text-[#fff1d5]',
  active: 'border border-[rgba(255,191,64,0.18)] bg-[rgba(248,174,29,0.14)] text-accent',
  muted: 'border border-[rgba(255,204,102,0.06)] bg-[rgba(255,255,255,0.02)] text-obsidian-500',
  accent: 'border border-[rgba(255,191,64,0.16)] bg-[rgba(248,174,29,0.08)] text-accent-soft',
};

// Reusable chip for tag filters and inline metadata pills.
// Input: label text plus optional click handler and tone/active state.
// Output: small rounded chip with motion feedback when interactive.
const TagChip = ({ label, tone = 'filter', active = false, onClick, className = '' }) => {
  const chipTone = active ? 'active' : tone;
  const MotionButton = motion.button;

  if (onClick) {
    return (
      <MotionButton
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={clsx(
          'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200',
          toneClasses[chipTone],
          className,
        )}
      >
        {label}
      </MotionButton>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold',
        toneClasses[chipTone],
        className,
      )}
    >
      {label}
    </span>
  );
};

export default TagChip;
