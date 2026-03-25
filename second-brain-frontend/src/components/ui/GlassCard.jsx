import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// Shared frosted panel surface used by the sidebar, save panels, and content cards.
// Input: children plus visual flags such as `interactive` and additional class names.
// Output: motion-enabled card container with the dashboard's dark glass treatment.
const GlassCard = ({ children, className = '', interactive = false, ...props }) => {
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      className={clsx(
        'rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(25,19,16,0.88)] shadow-panel backdrop-blur-xl',
        interactive && 'transition-all duration-300 hover:border-[rgba(255,191,64,0.16)] hover:shadow-[0_28px_70px_rgba(0,0,0,0.4)]',
        className,
      )}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export default GlassCard;
