import React, { forwardRef } from 'react';
import clsx from 'clsx';

const surfaceStyles = {
  dark: 'border-[rgba(255,204,102,0.08)] bg-[rgba(16,12,10,0.86)] text-obsidian-300 placeholder:text-obsidian-500 focus:border-[rgba(255,191,64,0.32)] focus:bg-[rgba(20,15,12,0.96)]',
  light: 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-primary/40 focus:bg-white',
};

// Shared input primitive for the dashboard shell and other polished surfaces.
// Input: standard input props plus optional icon, label, and right-side content.
// Output: styled input wrapper with consistent focus and spacing behavior.
const Input = forwardRef(({
  label,
  icon: Icon,
  rightSlot,
  surface = 'dark',
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  return (
    <label className={clsx('block', className)}>
      {label ? (
        <span className={clsx(
          'mb-2 block text-xs font-semibold uppercase tracking-[0.18em]',
          surface === 'dark' ? 'text-obsidian-500' : 'text-slate-500',
        )}
        >
          {label}
        </span>
      ) : null}

      <span
        className={clsx(
          'flex min-h-[3rem] items-center gap-3 rounded-2xl border px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-[rgba(255,191,64,0.14)]',
          surfaceStyles[surface],
        )}
      >
        {Icon ? <Icon className={clsx('h-4 w-4 shrink-0', surface === 'dark' ? 'text-obsidian-500' : 'text-slate-400')} /> : null}

        <input
          ref={ref}
          className={clsx(
            'w-full bg-transparent text-sm outline-none',
            surface === 'dark' ? 'text-obsidian-300' : 'text-slate-800',
            inputClassName,
          )}
          {...props}
        />

        {rightSlot ? <span className="shrink-0">{rightSlot}</span> : null}
      </span>
    </label>
  );
});

Input.displayName = 'Input';

export default Input;
