import React from 'react';

const VARIANTS = {
  primary:
    'bg-[#1D3627] text-white hover:bg-[#122419] focus:ring-4 focus:ring-emerald-100 shadow-md hover:shadow-lg border border-transparent disabled:bg-slate-300 disabled:text-slate-500',
  secondary:
    'bg-white border border-slate-200/90 text-[#112418] hover:bg-slate-50 hover:border-slate-300 focus:ring-4 focus:ring-slate-100 shadow-sm disabled:bg-slate-100 disabled:text-slate-400',
  civic:
    'bg-[#33684B] text-white hover:bg-[#234A34] focus:ring-4 focus:ring-emerald-100 shadow-md border border-transparent disabled:bg-slate-300 disabled:text-slate-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-4 focus:ring-rose-100 shadow-sm border border-transparent disabled:bg-slate-300 disabled:text-slate-500',
  ghost:
    'bg-transparent text-[#2C4D38] hover:bg-white/60 hover:text-[#112418] focus:ring-2 focus:ring-slate-200',
  outline:
    'bg-transparent border border-[#1D3627] text-[#1D3627] hover:bg-[#1D3627]/10 focus:ring-4 focus:ring-emerald-100',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5 tracking-wider uppercase font-bold',
  md: 'px-6 py-2.5 text-xs rounded-full gap-2 tracking-wider uppercase font-bold',
  lg: 'px-8 py-3.5 text-xs rounded-full gap-2.5 tracking-wider uppercase font-extrabold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none disabled:cursor-not-allowed disabled:hover:scale-100 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${SIZES[size] || SIZES.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

