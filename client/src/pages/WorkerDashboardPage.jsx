import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Search,
  AlertTriangle,
  Clock,
  MapPin,
  Building2,
  User,
  ImageIcon,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  Flame,
  CheckCircle2,
  Navigation,
  Wrench,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { workerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active Operational Tasks (Assigned + In Progress)' },
  { value: 'all', label: 'All Tasks' },
  { value: 'assigned', label: 'New Assigned Tasks' },
  { value: 'in_progress', label: 'In Progress (Active Repairs)' },
  { value: 'resolved_verification_pending', label: 'Verification Pending' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: '🚨 Urgent Priority' },
  { value: 'high', label: '⚠️ High Priority' },
  { value: 'medium', label: '⚡ Medium Priority' },
  { value: 'low', label: 'ℹ️ Low Priority' },
];

const formatSlaCountdown = (deadlineStr) => {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return {
      text: `⚠️ OVERDUE by ${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'}`,
      isOverdue: true,
      color: 'bg-red-50 text-red-700 border-red-200',
    };
  } else if (diffHours <= 6) {
    return {
      text: `⏳ Due in ${diffHours} hour${diffHours === 1 ? '' : 's'} (Critical)`,
      isOverdue: false,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  } else {
    return {
      text: `⏱️ Due in ${diffHours} hours`,
      isOverdue: false,
      color: 'bg-brand-50 text-brand-700 border-brand-200',
    };
  }
};

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState({
    assigned: 0,
    inProgress: 0,
    resolvedVerificationPending: 0,
    urgent: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [startingTaskId, setStartingTaskId] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('slaDeadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workerAPI.getTasks({
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });

      if (res.data) {
        setTasks(res.data.tasks || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load assigned field tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleQuickStartWork = async (taskId, issueNumber) => {
    setStartingTaskId(taskId);
    setError(null);
    try {
      await workerAPI.startWork(taskId, {
        note: 'Field worker initiated on-site repair operations.',
      });
      setActionSuccess(`Work successfully marked In Progress for ${issueNumber || 'task'}.`);
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to start work on task');
    } finally {
      setStartingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Field Operations
            </span>
            <span className="text-xs text-slate-500">Live Repair Queue & Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 font-heading">
            <HardHat className="w-7 h-7 text-amber-600" />
            Field Task Queue · {user?.name || 'Field Specialist'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Assigned civic repair tickets, SLA countdowns, GPS navigation routes, and live progress updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh Tasks</span>
          </button>
        </div>
      </div>

      {/* KPI Workload Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={() => {
            setStatusFilter('assigned');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'assigned'
              ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-100'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-brand-700 font-bold uppercase tracking-wider font-heading">
            <span>New Assigned</span>
            <HardHat className="w-4 h-4 text-brand-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-heading">{metrics.assigned}</div>
          <span className="text-xs text-slate-500">Awaiting Start</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('in_progress');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'in_progress'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold uppercase tracking-wider font-heading">
            <span>In Progress</span>
            <Wrench className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-heading">{metrics.inProgress}</div>
          <span className="text-xs text-slate-500">Active On Site</span>
        </button>

        <button
          onClick={() => {
            setPriorityFilter('urgent');
            setStatusFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            priorityFilter === 'urgent'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-100'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-bold uppercase tracking-wider font-heading">
            <span>Urgent Hazards</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-heading">{metrics.urgent}</div>
          <span className="text-xs text-slate-500">Top Priority</span>
        </button>

        <div
          className={`p-4 rounded-2xl border text-left ${
            metrics.overdue > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-slate-200 shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-bold uppercase tracking-wider font-heading">
            <span>SLA Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-heading">{metrics.overdue}</div>
          <span className="text-xs text-slate-500">
            {metrics.overdue > 0 ? 'Urgent Attention' : 'All on Track'}
          </span>
        </div>

        <button
          onClick={() => {
            setStatusFilter('resolved_verification_pending');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left col-span-2 sm:col-span-1 transition ${
            statusFilter === 'resolved_verification_pending'
              ? 'bg-green-50 border-green-300 ring-2 ring-green-100'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-green-700 font-bold uppercase tracking-wider font-heading">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-heading">
            {metrics.resolvedVerificationPending}
          </div>
          <span className="text-xs text-slate-500">Verification Pending</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # (CIVIC-2026-...), title, landmark, or address..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter worker tasks by status"
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-brand-600"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter worker tasks by priority"
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-brand-600"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('active');
                setPriorityFilter('all');
                setSortBy('slaDeadline');
                setSortOrder('asc');
                setPage(1);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition shadow-sm"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Assigned tasks in queue: <strong className="text-slate-800 font-bold">{totalCount}</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              aria-label="Sort worker tasks"
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="slaDeadline_asc">SLA Target (Urgent First)</option>
              <option value="priority_desc">Priority (Highest First)</option>
              <option value="createdAt_desc">Newest Assigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-green-700 hover:text-green-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={fetchTasks}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold text-red-800 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-slate-200 rounded"></div>
                <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-6 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-civic-50 text-civic-700 flex items-center justify-center border border-civic-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">No active field tasks in your queue</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You are all caught up! New dispatch tickets assigned by municipal administrators will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const slaStatus = formatSlaCountdown(task.slaDeadline);
            const [lng, lat] = task.location?.coordinates || [78.3967, 17.4849];
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            return (
              <div
                key={task._id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-card transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-soft"
              >
                {/* Left: Metadata, SLA, Title */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {task.issueNumber}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />

                    {slaStatus && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${slaStatus.color}`}
                      >
                        {slaStatus.text}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 hover:text-brand-700 transition font-heading">
                      <Link to={`/issues/${task.issueNumber || task._id}`}>
                        {task.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Context Info Pills */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      📂 {task.category?.name || 'General Civic'}
                    </span>

                    <span className="flex items-center gap-1 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {task.department?.name || 'Department'}
                    </span>

                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {task.location?.landmark ? `${task.location.landmark} · ` : ''}
                      {task.location?.address || task.serviceArea?.name || 'Municipal Zone'}
                    </span>

                    {task.reporter && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {task.reporter.name}
                        {task.reporter.phone && (
                          <a
                            href={`tel:${task.reporter.phone}`}
                            className="text-brand-700 hover:underline ml-1 font-semibold"
                          >
                            ({task.reporter.phone})
                          </a>
                        )}
                      </span>
                    )}

                    {task.evidence && task.evidence.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200 text-xs font-semibold">
                        <ImageIcon className="w-3 h-3" />
                        {task.evidence.length} Photo{task.evidence.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: GPS Navigation & Direct Action */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                    title="Open Route Navigation in Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 text-civic-700" />
                    <span>Navigate</span>
                  </a>

                  {task.status === 'assigned' && (
                    <button
                      type="button"
                      disabled={startingTaskId === task._id}
                      onClick={() => handleQuickStartWork(task._id, task.issueNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{startingTaskId === task._id ? 'Starting...' : 'Start Work'}</span>
                    </button>
                  )}

                  <Link
                    to={`/issues/${task.issueNumber || task._id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs shadow-sm transition"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>View / Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
