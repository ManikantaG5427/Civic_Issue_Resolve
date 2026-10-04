import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  PlusCircle,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ImageIcon,
  Eye,
  Trash2,
  AlertTriangle,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { issueAPI, configAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import EmptyState from '../components/feedback/EmptyState';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Worker Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved_verification_pending', label: 'Verification Pending' },
  { value: 'closed', label: 'Resolved & Closed' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'rejected', label: 'Rejected' },
];

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

  // Delete State
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteReport = async () => {
    if (!issueToDelete) return;
    setDeleting(true);
    try {
      await issueAPI.deleteIssue(issueToDelete.issueNumber || issueToDelete._id);
      setIssues((prev) =>
        prev.filter(
          (i) => i._id !== issueToDelete._id && i.issueNumber !== issueToDelete.issueNumber
        )
      );
      setTotalCount((c) => Math.max(0, c - 1));
      setIssueToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete issue report');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Civic Reports"
        description="Track real-time progress, worker dispatches, and full resolution timelines for your submitted issues."
        action={
          <Link to="/report-issue">
            <Button icon={PlusCircle}>Report New Issue</Button>
          </Link>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Card */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # (CIVIC-2026-...), title, or landmark..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 font-semibold focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
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
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 font-semibold focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setPage(1);
              }}
              className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3">
          <span>
            Found <strong className="text-slate-900 font-bold">{totalCount}</strong> submitted issue{totalCount === 1 ? '' : 's'}
          </span>
          {loading && (
            <span className="text-brand-700 font-medium flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
            </span>
          )}
        </div>
      </Card>

      {/* Reports Grid */}
      {loading && issues.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-6 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 bg-slate-200 rounded-md"></div>
                <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-8 w-full bg-slate-100 rounded-xl"></div>
            </Card>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Civic Issues Found"
          description={
            search || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No reports match your selected search or filter criteria. Try adjusting your filters.'
              : "You haven't reported any civic issues yet. Spot an issue in your locality? File a report now."
          }
          actionText="Report Your First Issue"
          onAction={() => (window.location.href = '/report-issue')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {issues.map((issue) => (
            <Card
              key={issue._id}
              hover
              className="p-5 flex flex-col justify-between space-y-4"
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {issue.issueNumber}
                    </span>
                    <PriorityBadge priority={issue.priority} size="sm" short />
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={issue.status} size="sm" />
                    {issue.feedback?.rating && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{issue.feedback.rating}/5</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading line-clamp-1">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>
              </div>

              {/* Card Middle */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700 truncate">
                    📂 {issue.category?.name || 'General Civic'}
                  </span>
                  {issue.evidence && issue.evidence.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium">
                      <ImageIcon className="w-3 h-3 text-brand-700" />
                      {issue.evidence.length} photo{issue.evidence.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">
                    {issue.location?.landmark ? `${issue.location.landmark} · ` : ''}
                    {issue.location?.address || issue.serviceArea?.name || 'Hyderabad'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Reported {new Date(issue.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {issue.department?.name && (
                    <span className="text-slate-600 font-semibold">
                      {issue.department.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Bottom Links & Actions */}
              <div className="space-y-2 pt-1">
                {issue.status === 'resolved_verification_pending' && !issue.feedback?.rating && (
                  <Link
                    to={`/issues/${issue.issueNumber || issue._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rate Work & Confirm Closure →</span>
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    to={`/issues/${issue.issueNumber || issue._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 hover:bg-brand-700 hover:text-white text-slate-700 text-xs font-bold transition border border-slate-200 shadow-soft"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Timeline & Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIssueToDelete(issue)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-700 border border-slate-200 hover:border-red-300 transition shadow-soft"
                    title="Delete this issue report"
                  >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-900 font-bold">{page}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{totalPages}</strong>
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {issueToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Delete Civic Report
              </h3>
              <button
                onClick={() => setIssueToDelete(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete ticket{' '}
                <strong className="font-mono text-slate-900">{issueToDelete.issueNumber}</strong>: "
                <span className="text-slate-800 font-medium">{issueToDelete.title}</span>"?
              </p>
              <p className="text-xs text-red-600 font-medium">
                This report and all attached evidence will be removed from your civic dashboard immediately.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIssueToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReport}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
