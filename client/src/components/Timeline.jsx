import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Wrench,
  XCircle,
  RotateCcw,
  HelpCircle,
  User,
  Shield,
  HardHat,
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    color: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200',
    icon: Clock,
  },
  in_review: {
    label: 'Under Review',
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200',
    icon: FileCheck2,
  },
  assigned: {
    label: 'Worker Assigned',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
    icon: HardHat,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200',
    icon: Wrench,
  },
  resolved_verification_pending: {
    label: 'Resolved (Pending Verification)',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed & Confirmed',
    color: 'text-slate-600',
    bg: 'bg-slate-100 border-slate-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
  reopened: {
    label: 'Reopened',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: RotateCcw,
  },
  info_requested: {
    label: 'Info Requested',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200',
    icon: HelpCircle,
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
    icon: XCircle,
  },
};

const getActorRoleIcon = (role) => {
  switch (role) {
    case 'administrator':
    case 'super_admin':
      return Shield;
    case 'field_worker':
      return HardHat;
    default:
      return User;
  }
};

export default function Timeline({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm">No timeline events recorded yet.</p>
      </div>
    );
  }

  // Display items in chronological order
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  );

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {sortedItems.map((event, index) => {
        const statusConfig = STATUS_CONFIG[event.status] || {
          label: event.action || 'Activity',
          color: 'text-slate-700',
          bg: 'bg-slate-100 border-slate-200',
          icon: Clock,
        };
        const StatusIcon = statusConfig.icon;
        const isLatest = index === sortedItems.length - 1;
        const ActorIcon = getActorRoleIcon(event.performedBy?.role);

        return (
          <div key={event._id || index} className="relative group">
            {/* Step Marker Dot */}
            <div
              className={`absolute -left-[30px] sm:-left-[38px] top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-transform duration-200 group-hover:scale-110 ${
                isLatest
                  ? 'bg-brand-700 border-brand-200 text-white shadow-sm ring-4 ring-brand-100'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>

            {/* Event Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-soft space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {event.action}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {event.timestamp
                    ? new Date(event.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Recent'}
                </div>
              </div>

              {/* Note Content */}
              {event.note && (
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {event.note}
                </p>
              )}

              {/* Performed By Info */}
              {event.performedBy && (
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                  <ActorIcon className="w-3.5 h-3.5 text-civic-700" />
                  <span>
                    Action by{' '}
                    <strong className="text-slate-800">
                      {event.performedBy.name || 'System'}
                    </strong>
                    {event.performedBy.role && (
                      <span className="ml-1 text-[11px] text-slate-400 uppercase font-semibold">
                        ({event.performedBy.role.replace('_', ' ')})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
