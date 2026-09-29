import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
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
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { adminAPI, configAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'triage', label: 'Actionable Triage (Pending Review)' },
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted (New)' },
  { value: 'in_review', label: 'Under Review' },
  { value: 'assigned', label: 'Worker Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved_verification_pending', label: 'Verification Pending' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: '🚨 Urgent' },
  { value: 'high', label: '⚠️ High' },
  { value: 'medium', label: '⚡ Medium' },
  { value: 'low', label: 'ℹ️ Low' },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', color: 'bg-sky-500/10 text-sky-300 border-sky-500/30' };
    case 'in_review':
      return { label: 'Under Review', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
    case 'assigned':
      return { label: 'Assigned', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    case 'resolved_verification_pending':
      return { label: 'Verification Pending', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    case 'closed':
      return { label: 'Closed', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    case 'rejected':
      return { label: 'Rejected', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
    default:
      return { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    case 'high':
      return { label: 'High', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    case 'medium':
      return { label: 'Medium', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    default:
      return { label: 'Low', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
};

export default function AdminReviewQueuePage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState({
    pendingTriage: 0,
    urgent: 0,
    high: 0,
    inProgress: 0,
    resolvedVerificationPending: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('triage');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load config catalogs for filters
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [deptRes, saRes] = await Promise.all([
          configAPI.getDepartments(),
          configAPI.getServiceAreas(),
        ]);
        if (deptRes.data) setDepartments(deptRes.data);
        if (saRes.data) setServiceAreas(saRes.data);
      } catch (err) {
        console.error('Failed to load filter catalogs', err);
      }
    }
    loadCatalogs();
  }, []);

  // Fetch Queue Data
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getReviewQueue({
        search,
        status: statusFilter,
        priority: priorityFilter,
        department: departmentFilter,
        serviceArea: serviceAreaFilter,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });

      if (response.data) {
        setIssues(response.data.issues || []);
        if (response.data.metrics) setMetrics(response.data.metrics);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalCount(response.data.pagination.total || 0);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator review queue');
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    priorityFilter,
    departmentFilter,
    serviceAreaFilter,
    sortBy,
    sortOrder,
    page,
  ]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Queue 8 · Administrator Triage
            </span>
            <span className="text-xs text-slate-400">Operational Review & Routing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-sky-400" />
            Civic Issue Review Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized intake and verification queue for municipal triage, department dispatch, and priority control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Triage Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={() => {
            setStatusFilter('triage');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'triage'
              ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <span>Pending Triage</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.pendingTriage}</div>
          <span className="text-[11px] text-slate-400">Needs Verification</span>
        </button>

        <button
          onClick={() => {
            setPriorityFilter('urgent');
            setStatusFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            priorityFilter === 'urgent'
              ? 'bg-rose-500/10 border-rose-500/40 ring-2 ring-rose-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold uppercase tracking-wider">
            <span>Urgent Priority</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.urgent}</div>
          <span className="text-[11px] text-slate-400">High Risk Hazards</span>
        </button>

        <button
          onClick={() => {
            setPriorityFilter('high');
            setStatusFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            priorityFilter === 'high'
              ? 'bg-orange-500/10 border-orange-500/40 ring-2 ring-orange-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-orange-400 font-semibold uppercase tracking-wider">
            <span>High Priority</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.high}</div>
          <span className="text-[11px] text-slate-400">Expedited Action</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('in_progress');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'in_progress'
              ? 'bg-sky-500/10 border-sky-500/40 ring-2 ring-sky-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 font-semibold uppercase tracking-wider">
            <span>In Progress</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.inProgress}</div>
          <span className="text-[11px] text-slate-400">Field Teams Active</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('resolved_verification_pending');
            setPriorityFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left col-span-2 sm:col-span-1 transition ${
            statusFilter === 'resolved_verification_pending'
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <span>Verification Pending</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {metrics.resolvedVerificationPending}
          </div>
          <span className="text-[11px] text-slate-400">Work Completed</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # (CIVIC-2026-...), title, landmark, or address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
              aria-label="Filter queue by status"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
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
              aria-label="Filter queue by priority"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter queue by department"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Service Area */}
            {user?.role === 'super_admin' && (
              <select
                value={serviceAreaFilter}
                onChange={(e) => {
                  setServiceAreaFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter queue by service area"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Service Areas</option>
                {serviceAreas.map((sa) => (
                  <option key={sa._id} value={sa._id}>
                    {sa.name} ({sa.code})
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('triage');
                setPriorityFilter('all');
                setDepartmentFilter('all');
                setServiceAreaFilter('all');
                setSortBy('createdAt');
                setSortOrder('desc');
                setPage(1);
              }}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Displaying <strong className="text-slate-200">{totalCount}</strong> issues in queue
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              aria-label="Sort issues queue"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="priority_desc">Priority (Urgent First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1">{error}</div>
          <button
            onClick={fetchQueue}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Review Queue Items List */}
      {loading && issues.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-slate-800 rounded"></div>
                <div className="h-5 w-24 bg-slate-800 rounded-full"></div>
              </div>
              <div className="h-6 w-1/2 bg-slate-800 rounded"></div>
              <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">Review Queue Clear!</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {statusFilter === 'triage'
              ? 'No pending reports currently require administrative verification in this service area.'
              : 'No issues match the selected search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const statusBadge = getStatusBadge(issue.status);
            const priorityBadge = getPriorityBadge(issue.priority);

            return (
              <div
                key={issue._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm"
              >
                {/* Left: Metadata & Title */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      {issue.issueNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityBadge.color}`}
                    >
                      {priorityBadge.label}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto lg:ml-0">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(issue.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white hover:text-sky-300 transition">
                      <Link to={`/issues/${issue.issueNumber || issue._id}`}>
                        {issue.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Context Info Pills */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      📂 {issue.category?.name || 'General Civic'}
                    </span>

                    <span className="flex items-center gap-1 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {issue.department?.name || 'Unassigned Dept'}
                    </span>

                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {issue.location?.landmark ? `${issue.location.landmark} · ` : ''}
                      {issue.serviceArea?.name || 'Kukatpally'}
                    </span>

                    {issue.reporter && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {issue.reporter.name} ({issue.reporter.phone || issue.reporter.email})
                      </span>
                    )}

                    {issue.evidence && issue.evidence.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                        <ImageIcon className="w-3 h-3" />
                        {issue.evidence.length} Photo{issue.evidence.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Direct Action Button */}
                <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  <Link
                    to={`/issues/${issue.issueNumber || issue._id}`}
                    className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-md shadow-sky-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Triage</span>
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-200">{page}</strong> of{' '}
            <strong className="text-slate-200">{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
