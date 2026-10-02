import React from 'react';
import Button from '../ui/Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionVariant = 'primary',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4 border border-brand-100">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 font-heading">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-600 max-w-md leading-relaxed">{description}</p>
      )}
      {actionText && onAction && (
        <div className="mt-5">
          <Button variant={actionVariant} onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
