import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  elevated = false,
  glass = false,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`rounded-3xl border ${
        glass
          ? 'bg-white/80 backdrop-blur-xl border-white/90 shadow-glass'
          : 'bg-white/90 backdrop-blur-md border-slate-200/80'
      } ${
        elevated ? 'shadow-card' : 'shadow-soft'
      } ${
        hover
          ? 'transition-all duration-300 hover:border-sage-400 hover:shadow-card hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

