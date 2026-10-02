import React from 'react';

export default function PageHeader({
  title,
  description,
  badge,
  action,
  breadcrumbs,
  className = '',
}) {
  return (
    <div className={`mb-8 pb-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div>
        {breadcrumbs && <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4E705C]">{breadcrumbs}</div>}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112418] tracking-tight font-display">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="mt-1.5 text-xs sm:text-sm text-[#4E705C] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 flex-shrink-0">{action}</div>}
    </div>
  );
}

