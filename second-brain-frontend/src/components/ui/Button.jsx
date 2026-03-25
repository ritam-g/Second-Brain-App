import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const buttonVariants = {
  primary: 'bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-dark',
  amber: 'bg-accent text-obsidian-950 shadow-lg shadow-black/25 hover:bg-[#ffbd43]',
  surface: 'border border-[rgba(255,204,102,0.08)] bg-[rgba(28,22,18,0.92)] text-obsidian-300 hover:border-[rgba(255,191,64,0.18)] hover:bg-[rgba(35,27,22,0.98)]',
  outline: 'border border-slate-200 bg-transparent text-slate-700 hover:border-primary hover:text-primary',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  obsidianGhost: 'text-obsidian-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300',
  icon: 'h-10 w-10 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(23,18,15,0.92)] p-0 text-obsidian-300 hover:border-[rgba(255,191,64,0.18)] hover:text-[#fff2d7]',
  sidebar: 'justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-obsidian-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300',
  danger: 'border border-red-500/15 bg-red-500/10 text-red-200 hover:bg-red-500/16',
};

const Button = ({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  leadingIcon = null,
  trailingIcon = null,
  ...props
}) => {
  const isDisabled = loading || props.disabled;
  const MotionButton = motion.button;

  return (
    <MotionButton
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"></path>
        </svg>
      ) : leadingIcon}
      {children}
      {!loading ? trailingIcon : null}
    </MotionButton>
  );
};

export default Button;
