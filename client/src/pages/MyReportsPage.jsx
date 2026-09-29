import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { issueAPI, configAPI } from '../services/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'Under Review' },
  { value: 'assigned', label: 'Worker Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved_verification_pending', label: 'Verification Pending' },
  { value: 'closed', label: 'Resolved & Closed' },
  { value: 'rejected', label: 'Rejected' },
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

export default function MyReportsPage() {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Categories for Filter Dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await configAPI.getCategories();
        if (res.data) setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Reports Callback
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await issueAPI.getMyReports({
        search,
        status: statusFilter,
        category: categoryFilter,
        page,
        limit: 8,
      });

      if (response.data) {
        setIssues(response.data.issues || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch your civic reports');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Queue 7 · Citizen Tracking
            </span>
            <span className="text-xs text-slate-400">Live Timeline & Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-teal-400" />
            My Civic Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track real-time progress, worker dispatches, and full resolution timelines for your submitted issues.
          </p>
        </div>

        <Link
          to="/report-issue"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-teal-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # (CIVIC-2026-...), title, or landmark..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter reports by status"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter reports by civic category"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
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
            Found <strong className="text-slate-200">{totalCount}</strong> submitted issue{totalCount === 1 ? '' : 's'}
          </span>
          {loading && <span className="text-teal-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Updating...</span>}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1">{error}</div>
          <button
            onClick={fetchReports}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Issue Cards Grid */}
      {loading && issues.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 bg-slate-800 rounded-md"></div>
                <div className="h-5 w-20 bg-slate-800 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-800 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
              <div className="h-8 w-full bg-slate-800/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-lg shadow-teal-500/10">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">No civic issues found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No reports match your selected search or filter criteria. Try adjusting your filters.'
                : "You haven't reported any civic issues yet. Spot an issue in your locality? Report it now."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/report-issue"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-teal-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report First Issue</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {issues.map((issue) => {
            const statusBadge = getStatusBadge(issue.status);
            const priorityBadge = getPriorityBadge(issue.priority);

            return (
              <div
                key={issue._id}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 transition duration-200 hover:shadow-xl hover:shadow-teal-500/5 flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Badges & Ticket Number */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                        {issue.issueNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge.color}`}
                      >
                        {priorityBadge.label}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-teal-300 transition line-clamp-1">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                </div>

                {/* Card Middle: Category, Location, Photos */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300 font-medium truncate">
                      📂 {issue.category?.name || 'General Civic'}
                    </span>
                    {issue.evidence && issue.evidence.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                        <ImageIcon className="w-3 h-3 text-teal-400" />
                        {issue.evidence.length} photo{issue.evidence.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">
                      {issue.location?.landmark ? `${issue.location.landmark} · ` : ''}
                      {issue.location?.address || 'Kukatpally, Hyderabad'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reported {new Date(issue.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {issue.department?.name && (
                      <span className="text-slate-400 font-medium">
                        {issue.department.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Link */}
                <Link
                  to={`/issues/${issue.issueNumber || issue._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition border border-slate-700/60 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Timeline & Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
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
