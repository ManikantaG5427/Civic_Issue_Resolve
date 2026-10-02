import React from 'react';
import { AlertCircle, AlertTriangle, ArrowDown, Minus } from 'lucide-react';

const PRIORITY_CONFIG = {
  low: {
    label: 'Low Priority',
    shortLabel: 'Low',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: ArrowDown,
  },
  medium: {
    label: 'Medium Priority',
    shortLabel: 'Medium',
    className: 'border-blue-200 bg-blue-100 text-blue-800',
    icon: Minus,
  },
  high: {
    label: 'High Priority',
    shortLabel: 'High',
    className: 'border-amber-200 bg-amber-100 text-amber-900',
    icon: AlertTriangle,
  },
  emergency: {
    label: 'Emergency',
    shortLabel: 'Emergency',
    className: 'border-red-200 bg-red-100 text-red-800 font-bold',
    icon: AlertCircle,
  },
  critical: {
    label: 'Critical',
    shortLabel: 'Critical',
    className: 'border-red-200 bg-red-100 text-red-800 font-bold',
    icon: AlertCircle,
  },
};

export default function PriorityBadge({ priority = 'medium', size = 'md', short = false }) {
  const normalized = priority ? priority.toLowerCase() : 'medium';
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${config.className}`}
    >
      <Icon size={isSm ? 11 : 13} strokeWidth={2.25} />
      <span>{short ? config.shortLabel : config.label}</span>
    </span>
  );
}
