import React, { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, helperText, icon: Icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
              Icon ? 'pl-10' : ''
            } ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
