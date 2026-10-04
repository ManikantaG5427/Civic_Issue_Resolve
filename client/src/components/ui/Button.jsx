import React from 'react';

const VARIANTS = {
  primary:
    'bg-[#0071E3] text-white hover:bg-[#0077ED] active:bg-[#005BB5] shadow-sm hover:shadow border border-transparent disabled:bg-[#D2D2D7] disabled:text-[#86868B]',
  secondary:
    'bg-[#E8E8ED] border border-black/[0.04] text-[#1D1D1F] hover:bg-[#DEDEE3] active:bg-[#D2D2D7] shadow-sm disabled:bg-[#F5F5F7] disabled:text-[#86868B]',
  dark:
    'bg-[#1D1D1F] text-white hover:bg-[#2D2D30] active:bg-[#000000] shadow-sm disabled:bg-[#D2D2D7] disabled:text-[#86868B]',
  civic:
    'bg-[#34C759] text-white hover:bg-[#2FB350] active:bg-[#248A3D] shadow-sm border border-transparent disabled:bg-[#D2D2D7] disabled:text-[#86868B]',
  danger:
    'bg-[#FF3B30] text-white hover:bg-[#E0352A] active:bg-[#C92A20] shadow-sm border border-transparent disabled:bg-[#D2D2D7] disabled:text-[#86868B]',
  ghost:
    'bg-transparent text-[#1D1D1F] hover:bg-black/[0.05] active:bg-black/[0.08]',
  outline:
    'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:border-[#86868B] hover:bg-black/[0.02]',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5 font-semibold tracking-tight',
  md: 'px-5 py-2.5 text-xs sm:text-sm rounded-full gap-2 font-semibold tracking-tight',
  lg: 'px-7 py-3.5 text-sm rounded-full gap-2.5 font-semibold tracking-tight',
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

