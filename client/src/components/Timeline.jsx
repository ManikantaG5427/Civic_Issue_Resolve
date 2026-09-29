import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Wrench,
  XCircle,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  User,
  Shield,
  HardHat,
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    icon: Clock,
  },
  in_review: {
    label: 'Under Review',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: FileCheck2,
  },
  assigned: {
    label: 'Worker Assigned',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    icon: HardHat,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: Wrench,
  },
  resolved_verification_pending: {
    label: 'Resolved (Pending Verification)',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed & Confirmed',
    color: 'text-slate-300',
    bg: 'bg-slate-800 border-slate-700',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    icon: XCircle,
  },
  reopened: {
    label: 'Reopened',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    icon: RotateCcw,
  },
  info_requested: {
    label: 'Info Requested',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: HelpCircle,
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
      <div className="p-6 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No timeline events recorded yet.</p>
      </div>
    );
  }

  // Display items in chronological order
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  );

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:via-slate-700 before:to-slate-800">
      {sortedItems.map((event, index) => {
        const statusConfig = STATUS_CONFIG[event.status] || {
          label: event.action || 'Activity',
          color: 'text-slate-300',
          bg: 'bg-slate-800 border-slate-700',
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
                  ? 'bg-teal-500 border-teal-300 text-slate-950 shadow-lg shadow-teal-500/40 ring-4 ring-teal-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>

            {/* Event Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {event.action}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
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
                <p className="text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                  {event.note}
                </p>
              )}

              {/* Performed By Info */}
              {event.performedBy && (
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <ActorIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    Action by{' '}
                    <strong className="text-slate-200">
                      {event.performedBy.name || 'System'}
                    </strong>
                    {event.performedBy.role && (
                      <span className="ml-1 text-[11px] text-slate-400 uppercase">
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
