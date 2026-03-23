import React, { forwardRef } from 'react';

const InputField = forwardRef(({ label, error, className = '', containerClassName='', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} bg-slate-50 focus:bg-white transition-all outline-none focus:ring-4 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
