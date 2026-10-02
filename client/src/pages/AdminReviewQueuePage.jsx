import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
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
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { adminAPI, configAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import EmptyState from '../components/feedback/EmptyState';

const STATUS_OPTIONS = [
  { value: 'triage', label: 'Actionable Triage (Pending Review)' },
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted (New)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Worker Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved_verification_pending', label: 'Verification Pending' },
  { value: 'closed', label: 'Closed' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: '🚨 Urgent' },
  { value: 'high', label: '⚠️ High' },
  { value: 'medium', label: '⚡ Medium' },
  { value: 'low', label: 'ℹ️ Low' },
];

export default function AdminReviewQueuePage() {
  const { subscribeToEvent } = useSocket();
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
  const [slaSweepRunning, setSlaSweepRunning] = useState(false);
  const [slaSuccessMessage, setSlaSuccessMessage] = useState(null);

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('triage');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [deptRes, saRes] = await Promise.all([
          configAPI.getDepartments(),
          configAPI.getServiceAreas(),
        ]);
        if (deptRes.data) setDepartments(deptRes.data);
        if (saRes.data) setServiceAreas(saRes.data);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    }
    loadMetadata();
  }, []);

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
        page,
        limit: 10,
      });

      if (response.data) {
        setIssues(response.data.issues || []);
        setMetrics(response.data.metrics || {});
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
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
    page,
  ]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time socket updates
  useEffect(() => {
    if (subscribeToEvent) {
      const unsubscribe = subscribeToEvent('issue_created', () => {
        fetchQueue();
      });
      return () => unsubscribe && unsubscribe();
    }
  }, [subscribeToEvent, fetchQueue]);

  const handleRunSlaSweep = async () => {
    try {
      setSlaSweepRunning(true);
      setSlaSuccessMessage(null);
      const res = await adminAPI.triggerSlaCheck();
      setSlaSuccessMessage(
        res.message || `SLA sweep evaluated ${res.data?.evaluatedCount || 0} issues.`
      );
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Failed to execute SLA check.');
    } finally {
      setSlaSweepRunning(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Admin Triage & Review Queue"
        description="Verify submitted citizen reports, enforce SLA deadlines, reject invalid claims, and dispatch field crews."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRunSlaSweep}
              loading={slaSweepRunning}
              icon={Zap}
            >
              Run SLA Sweep
            </Button>

            <Link to="/admin/analytics">
              <Button variant="civic" size="md">
                View Analytics
              </Button>
            </Link>
          </div>
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

      {slaSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{slaSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSlaSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Triage Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Triage
            </span>
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
            {metrics.pendingTriage || 0}
          </div>
          <div className="text-xs text-brand-700 font-semibold mt-1">Requires review</div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Urgent / High
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-heading mt-1">
            {(metrics.urgent || 0) + (metrics.high || 0)}
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1">Priority dispatch</div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-800 font-heading mt-1">
            {metrics.inProgress || 0}
          </div>
          <div className="text-xs text-cyan-700 font-semibold mt-1">Field operations</div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Confirm
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-heading mt-1">
            {metrics.resolvedVerificationPending || 0}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Awaiting citizen rating</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket #, reporter name, title, or landmark..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={serviceAreaFilter}
              onChange={(e) => {
                setServiceAreaFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-none"
            >
              <option value="all">All Service Zones</option>
              {serviceAreas.map((sa) => (
                <option key={sa._id} value={sa._id}>
                  {sa.name}
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
                setStatusFilter('triage');
                setPriorityFilter('all');
                setDepartmentFilter('all');
                setServiceAreaFilter('all');
                setSortBy('createdAt_desc');
                setPage(1);
              }}
              className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>
            Found <strong className="text-slate-900 font-bold">{totalCount}</strong> queue items
          </span>
          {loading && (
            <span className="text-brand-700 font-medium flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
            </span>
          )}
        </div>
      </Card>

      {/* Review Queue Items List */}
      {loading && issues.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-6 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-slate-200 rounded"></div>
                <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-6 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Review Queue Clear!"
          description={
            statusFilter === 'triage'
              ? 'No pending reports currently require administrative verification in this service area.'
              : 'No issues match the selected search or filter criteria.'
          }
        />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Card
              key={issue._id}
              hover
              className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
              {/* Left: Metadata & Title */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                    {issue.issueNumber}
                  </span>
                  <PriorityBadge priority={issue.priority} size="sm" short />
                  <StatusBadge status={issue.status} size="sm" />
                  {issue.isEscalated && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-red-600" />
                      <span>SLA ESCALATED</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto lg:ml-0">
                    <Clock className="w-3 h-3" />
                    {new Date(issue.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading hover:text-brand-700 transition">
                    <Link to={`/issues/${issue.issueNumber || issue._id}`}>
                      {issue.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Context Info Pills */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">
                    📂 {issue.category?.name || 'General Civic'}
                  </span>

                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {issue.department?.name || 'Unassigned Dept'}
                  </span>

                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {issue.location?.landmark ? `${issue.location.landmark} · ` : ''}
                    {issue.location?.address || issue.serviceArea?.name || 'Municipal Zone'}
                  </span>

                  {issue.reporter && (
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {issue.reporter.name}
                    </span>
                  )}

                  {issue.evidence && issue.evidence.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-[11px] font-semibold">
                      <ImageIcon className="w-3 h-3" />
                      {issue.evidence.length} Photo{issue.evidence.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Direct Action Button */}
              <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                <Link
                  to={`/issues/${issue.issueNumber || issue._id}`}
                  className="w-full lg:w-auto"
                >
                  <Button size="md" icon={Eye} className="w-full lg:w-auto">
                    <span>Review & Triage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
}
