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
  FileCheck,
  Building,
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    className: 'border-sky-200 bg-sky-100 text-sky-700',
    icon: FileWarning,
  },
  in_review: {
    label: 'In Triage',
    className: 'border-violet-200 bg-violet-100 text-violet-700',
    icon: Clock3,
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
    label: 'Accepted & Verified',
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
  work_completed: {
    label: 'Work Complete (Pending Review)',
    className: 'border-indigo-200 bg-indigo-100 text-indigo-700',
    icon: FileCheck,
  },
  evidence_submitted: {
    label: 'Evidence Submitted',
    className: 'border-indigo-200 bg-indigo-100 text-indigo-700',
    icon: FileCheck,
  },
  rework_required: {
    label: 'Rework Required',
    className: 'border-amber-300 bg-amber-100 text-amber-900 font-bold',
    icon: RotateCcw,
  },
  resolved_verification_pending: {
    label: 'Awaiting Citizen Confirmation',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
  resolved_confirmed: {
    label: 'Resolved & Confirmed',
    className: 'border-green-200 bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
    icon: CheckCircle2,
  },
  reopened: {
    label: 'Reopened / Disputed',
    className: 'border-rose-200 bg-rose-100 text-rose-700 font-bold',
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

export function VerificationBadge({ status, size = 'sm' }) {
  if (!status || status === 'not_submitted') return null;

  const configs = {
    pending: { label: 'Inspection Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
    approved: { label: 'Inspector Verified', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
    rejected: { label: 'Inspection Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: RotateCcw },
    more_evidence_required: { label: 'More Evidence Needed', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Info },
    site_check_required: { label: 'Site Check Scheduled', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Building },
  };

  const cfg = configs[status] || { label: status, className: 'bg-slate-50 text-slate-600 border-slate-200', icon: Info };
  const Icon = cfg.icon;
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-medium ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} ${cfg.className}`}>
      <Icon size={isSm ? 10 : 12} />
      <span>{cfg.label}</span>
    </span>
  );
}

export function ClosureBasisBadge({ basis, size = 'sm' }) {
  if (!basis || basis === 'not_closed') return null;

  const configs = {
    citizen_confirmed: { label: 'Citizen Confirmed', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    reviewer_verified_no_response: { label: 'Verified (No Citizen Response)', className: 'bg-slate-100 text-slate-700 border-slate-300' },
    administrative_duplicate: { label: 'Merged Duplicate', className: 'bg-purple-100 text-purple-800 border-purple-300' },
    administrative_closure: { label: 'Administrative Closure', className: 'bg-slate-100 text-slate-700 border-slate-300' },
    withdrawn: { label: 'Citizen Withdrawn', className: 'bg-slate-100 text-slate-600 border-slate-300' },
  };

  const cfg = configs[basis] || { label: basis.replace(/_/g, ' '), className: 'bg-slate-100 text-slate-700 border-slate-200' };
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-medium ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} ${cfg.className}`}>
      <CheckCircle2 size={isSm ? 10 : 12} />
      <span>Basis: {cfg.label}</span>
    </span>
  );
}
