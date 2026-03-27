import React from 'react';
import clsx from 'clsx';
import GlassCard from '../ui/GlassCard';

// Shared settings section container for account, preference, and data-control groups.
const SettingsSection = ({
  eyebrow = 'Settings',
  title,
  description,
  className = '',
  children,
}) => (
  <GlassCard
    className={clsx('p-6 sm:p-7', className)}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
  >
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold text-[#fff1d5]">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-7 text-obsidian-400">{description}</p>
      ) : null}
    </div>

    <div className="mt-6">{children}</div>
  </GlassCard>
);

export default SettingsSection;
