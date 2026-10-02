import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileWarning,
  Info,
  RotateCcw,
  ShieldCheck,
  Timer,
  Wrench,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    className: 'border-sky-200 bg-sky-100 text-sky-700',
    icon: FileWarning,
  },
  under_review: {
    label: 'Under Review',
    className: 'border-violet-200 bg-violet-100 text-violet-700',
    icon: Clock3,
  },
  more_information_required: {
    label: 'More Info Needed',
    className: 'border-amber-200 bg-amber-100 text-amber-800',
    icon: Info,
  },
  info_requested: {
    label: 'More Info Needed',
    className: 'border-amber-200 bg-amber-100 text-amber-800',
    icon: Info,
  },
  verified: {
    label: 'Verified',
    className: 'border-blue-200 bg-blue-100 text-blue-700',
    icon: ShieldCheck,
  },
  assigned: {
    label: 'Assigned',
    className: 'border-teal-200 bg-teal-100 text-teal-700',
    icon: CircleDot,
  },
  in_progress: {
    label: 'In Progress',
    className: 'border-cyan-200 bg-cyan-100 text-cyan-700',
    icon: Wrench,
  },
  waiting_for_materials: {
    label: 'Waiting for Materials',
    className: 'border-amber-200 bg-amber-100 text-amber-800',
    icon: Timer,
  },
  resolved_verification_pending: {
    label: 'Verification Pending',
    className: 'border-green-200 bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  resolved_confirmed: {
    label: 'Resolved & Confirmed',
    className: 'border-green-200 bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: CheckCircle2,
  },
  reopened: {
    label: 'Reopened',
    className: 'border-rose-200 bg-rose-100 text-rose-700',
    icon: RotateCcw,
  },
  rejected: {
    label: 'Rejected',
    className: 'border-red-200 bg-red-100 text-red-700',
    icon: XCircle,
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
    icon: XCircle,
  },
  duplicate: {
    label: 'Duplicate',
    className: 'border-purple-200 bg-purple-100 text-purple-700',
    icon: FileWarning,
  },
  escalated: {
    label: 'Escalated',
    className: 'border-orange-200 bg-orange-100 text-orange-700',
    icon: AlertTriangle,
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Info,
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${config.className}`}
    >
      <Icon size={isSm ? 11 : 13} strokeWidth={2.25} />
      <span>{config.label}</span>
    </span>
  );
}
