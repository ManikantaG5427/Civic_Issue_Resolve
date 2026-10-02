import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Building2,
  Tag,
  Download,
  Filter,
  RefreshCw,
  Zap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { adminAPI, configAPI } from '../services/api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedServiceArea, setSelectedServiceArea] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAreas() {
      try {
        const res = await configAPI.getServiceAreas();
        if (res.data) setServiceAreas(res.data);
      } catch (err) {
        console.error('Failed to load service areas', err);
      }
    }
    loadAreas();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getAnalytics({
        serviceArea: selectedServiceArea,
        timeRange: selectedTimeRange,
      });
      if (res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedServiceArea, selectedTimeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = () => {
    if (!analytics) return;

    const rows = [
      ['CivicResolve Municipal Analytics Export'],
      ['Generated At', new Date().toISOString()],
      ['Time Range', selectedTimeRange],
      ['Service Area', selectedServiceArea],
      [],
      ['KPI Overview'],
      ['Total Reported Issues', analytics.kpis?.totalReported || 0],
      ['Total Resolved Issues', analytics.kpis?.totalResolved || 0],
      ['Resolution Rate (%)', `${analytics.kpis?.resolutionRate || 0}%`],
      ['Avg Resolution Time (Hours)', analytics.kpis?.avgResolutionTimeHours || 0],
      ['SLA Compliance Rate (%)', `${analytics.kpis?.slaComplianceRate || 0}%`],
      ['Escalated Breaches', analytics.kpis?.escalatedCount || 0],
      ['Citizen Satisfaction (1-5)', analytics.kpis?.citizenSatisfactionScore || 5.0],
      [],
      ['Department Performance'],
      ['Department', 'Total Assigned', 'Total Resolved', 'Escalated', 'Completion Rate (%)'],
      ...(analytics.departmentPerformance || []).map((d) => [
        d.name,
        d.totalAssigned,
        d.totalResolved,
        d.escalatedCount,
        `${d.completionRate}%`,
      ]),
      [],
      ['Category Breakdown'],
      ['Category', 'Issue Count', 'Percentage (%)'],
      ...(analytics.categoriesBreakdown || []).map((c) => [c.name, c.count, `${c.percentage}%`]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CivicResolve_Analytics_${selectedTimeRange}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Municipal Intelligence
            </span>
            <span className="text-xs text-slate-500">Executive Performance Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 font-heading">
            <BarChart3 className="w-7 h-7 text-brand-700" />
            Civic Operations & Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Comprehensive resolution velocities, SLA compliance rates, department throughput, and worker leaderboards.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
            {[
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
              { label: '90D', value: '90d' },
              { label: 'All', value: 'all' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedTimeRange(t.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedTimeRange === t.value
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Service Area Filter */}
          <select
            value={selectedServiceArea}
            onChange={(e) => setSelectedServiceArea(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition shadow-sm font-medium"
          >
            <option value="all">All Service Areas</option>
            {serviceAreas.map((area) => (
              <option key={area._id} value={area._id}>
                {area.name} ({area.code})
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={!analytics || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition disabled:opacity-50 shadow-sm"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-brand-700" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 transition shadow-sm"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-700' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !analytics ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
            <div className="h-72 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Executive KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Reported */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 relative overflow-hidden group hover:border-slate-300 transition shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total Reported</span>
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
                {analytics?.kpis?.totalReported || 0}
              </div>
              <span className="text-xs text-slate-500 block">
                {analytics?.kpis?.pendingTriage || 0} pending initial triage
              </span>
            </div>

            {/* Resolution Rate */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 relative overflow-hidden group hover:border-slate-300 transition shadow-soft">
              <div className="flex items-center justify-between text-xs text-green-700 font-medium">
                <span>Resolution Rate</span>
                <div className="p-1.5 rounded-lg bg-green-50 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-700 tracking-tight font-heading">
                {analytics?.kpis?.resolutionRate || 0}%
              </div>
              <span className="text-xs text-green-800 block font-medium">
                {analytics?.kpis?.totalResolved || 0} total tickets resolved
              </span>
            </div>

            {/* SLA Compliance */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 relative overflow-hidden group hover:border-slate-300 transition shadow-soft">
              <div className="flex items-center justify-between text-xs text-brand-700 font-medium">
                <span>SLA Target Compliance</span>
                <div className="p-1.5 rounded-lg bg-brand-50 text-brand-700">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-brand-700 tracking-tight font-heading">
                {analytics?.kpis?.slaComplianceRate || 100}%
              </div>
              <span className="text-xs text-brand-800 block font-medium">
                Avg resolution: {analytics?.kpis?.avgResolutionTimeHours || 0}h
              </span>
            </div>

            {/* Citizen Satisfaction */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 relative overflow-hidden group hover:border-slate-300 transition shadow-soft">
              <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
                <span>Citizen Satisfaction</span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-900 tracking-tight flex items-baseline gap-1.5 font-heading">
                <span>{analytics?.kpis?.citizenSatisfactionScore || 5.0}</span>
                <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </div>
              <span className="text-xs text-amber-800 block font-medium">
                {analytics?.kpis?.escalatedCount || 0} escalated breaches
              </span>
            </div>
          </div>

          {/* Middle Row: Category Breakdown & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Progress */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-civic-50 text-civic-700">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">Issues by Category</h3>
                    <p className="text-xs text-slate-500">Distribution of civic incident types</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(analytics?.categoriesBreakdown || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No category data recorded.</p>
                ) : (
                  analytics?.categoriesBreakdown?.map((cat) => (
                    <div key={cat.categoryId || cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-semibold">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{cat.count} issues</span>
                          <span className="font-bold text-brand-700">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, cat.percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Distribution Grid */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">Lifecycle Status Pipeline</h3>
                    <p className="text-xs text-slate-500">Volume across current workflow states</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: 'Submitted (New)',
                    count: analytics?.statusDistribution?.submitted || 0,
                    color: 'text-sky-700 bg-sky-50 border-sky-200',
                  },
                  {
                    label: 'Under Review',
                    count: analytics?.statusDistribution?.in_review || 0,
                    color: 'text-violet-700 bg-violet-50 border-violet-200',
                  },
                  {
                    label: 'In Progress / Assigned',
                    count:
                      (analytics?.statusDistribution?.assigned || 0) +
                      (analytics?.statusDistribution?.in_progress || 0),
                    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
                  },
                  {
                    label: 'Verification Pending',
                    count: analytics?.statusDistribution?.resolved_verification_pending || 0,
                    color: 'text-green-700 bg-green-50 border-green-200',
                  },
                  {
                    label: 'Closed',
                    count: analytics?.statusDistribution?.closed || 0,
                    color: 'text-slate-700 bg-slate-100 border-slate-200',
                  },
                  {
                    label: 'Rejected',
                    count: analytics?.statusDistribution?.rejected || 0,
                    color: 'text-red-700 bg-red-50 border-red-200',
                  },
                ].map((st, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-1 ${st.color}`}
                  >
                    <span className="text-xs font-semibold">{st.label}</span>
                    <span className="text-xl font-bold tracking-tight font-heading">{st.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Department Performance & Worker Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Performance Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">Department Throughput</h3>
                  <p className="text-xs text-slate-500">Workload resolution rates by municipal branch</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {(analytics?.departmentPerformance || []).map((dept) => (
                  <div
                    key={dept._id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">{dept.name}</span>
                      <span className="text-xs text-slate-500 block">
                        Assigned: {dept.totalAssigned} · Resolved: {dept.totalResolved}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-bold text-brand-700">{dept.completionRate}%</span>
                      {dept.escalatedCount > 0 && (
                        <span className="text-xs text-red-600 font-semibold block">
                          ⚡ {dept.escalatedCount} escalated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Specialist Leaderboard */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">Field Specialist Leaderboard</h3>
                  <p className="text-xs text-slate-500">Top executing personnel by resolved count</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {(analytics?.workerLeaderboard || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No field workers found.</p>
                ) : (
                  analytics?.workerLeaderboard?.map((worker, index) => (
                    <div
                      key={worker._id}
                      className="py-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 block">{worker.name}</span>
                          <span className="text-xs text-slate-500">{worker.email}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="font-bold text-slate-900 block">
                          {worker.totalCompleted} tasks completed
                        </span>
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 justify-end">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {worker.rating} / 5.0
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
