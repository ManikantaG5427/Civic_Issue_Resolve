import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  User,
  Shield,
  Key,
  Mail,
  Calendar,
  Phone,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  HardHat,
  ShieldCheck,
  Crown,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(null);

  const testRbacAccess = async (endpoint, label) => {
    setTestingEndpoint(endpoint);
    setRbacTestResult(null);

    try {
      const response = await apiRequest(`/rbac/${endpoint}`);
      setRbacTestResult({
        endpoint: label,
        status: 'success',
        statusCode: 200,
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      setRbacTestResult({
        endpoint: label,
        status: 'error',
        statusCode: err.status || 403,
        message: err.message,
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Crown,
        };
      case 'administrator':
        return {
          label: 'Administrator',
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          icon: ShieldCheck,
        };
      case 'field_worker':
        return {
          label: 'Field Worker',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: HardHat,
        };
      default:
        return {
          label: 'Citizen',
          color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          icon: User,
        };
    }
  };

  const roleMeta = getRoleBadge(user?.role);
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20">
              <RoleIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome, {user?.name || 'User'}
                </h1>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleMeta.color}`}
                >
                  {roleMeta.label}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Role-Based Access Control is enforced by backend middleware and client guards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Operational Modules (Queue 2 Ready) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Role Authority: {roleMeta.label} Workspace
            </h3>
            <p className="text-xs text-slate-400">
              Module permissions available for your assigned role in the resolution platform
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'citizen' && (
            <>
              <Link
                to="/report-issue"
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-teal-500/50 space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    Citizen Reporting
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-medium text-white group-hover:text-teal-300 transition">
                  Report Civic Issues
                </div>
                <p className="text-xs text-slate-400">
                  Submit road, water, electricity, and sanitation issues with photo proof & GPS.
                </p>
              </Link>

              <Link
                to="/my-reports"
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-teal-500/50 space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    Issue Tracking
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-medium text-white group-hover:text-teal-300 transition">
                  My Reports Timeline
                </div>
                <p className="text-xs text-slate-400">
                  Track verification status, assigned departments, and field repair progress.
                </p>
              </Link>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Verification
                </div>
                <div className="text-sm font-medium text-white">Confirm / Reopen</div>
                <p className="text-xs text-slate-400">
                  Inspect after-work repair evidence and confirm resolution or reopen tickets.
                </p>
              </div>
            </>
          )}

          {user?.role === 'field_worker' && (
            <>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Field Queue
                </div>
                <div className="text-sm font-medium text-white">Assigned Tasks</div>
                <p className="text-xs text-slate-400">
                  Inspect assigned civic repairs, GPS routes, and priority deadlines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Work Progress
                </div>
                <div className="text-sm font-medium text-white">Live Updates</div>
                <p className="text-xs text-slate-400">
                  Start repairs, submit material notes, and notify citizens of timeline changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Resolution Proof
                </div>
                <div className="text-sm font-medium text-white">Evidence Upload</div>
                <p className="text-xs text-slate-400">
                  Upload mandatory after-repair photos before submitting tickets for closure.
                </p>
              </div>
            </>
          )}

          {user?.role === 'administrator' && (
            <>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Review Queue
                </div>
                <div className="text-sm font-medium text-white">Service Area Verification</div>
                <p className="text-xs text-slate-400">
                  Verify or reject submitted reports and request missing citizen information.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Dispatch
                </div>
                <div className="text-sm font-medium text-white">Worker & SLA Assignment</div>
                <p className="text-xs text-slate-400">
                  Assign tickets to responsible field departments and set resolution deadlines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Supervision
                </div>
                <div className="text-sm font-medium text-white">Audit & Escalation</div>
                <p className="text-xs text-slate-400">
                  Track overdue tickets, worker workload, and internal operational notes.
                </p>
              </div>
            </>
          )}

          {user?.role === 'super_admin' && (
            <>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Governance
                </div>
                <div className="text-sm font-medium text-white">System Configuration</div>
                <p className="text-xs text-slate-400">
                  Manage pilot service areas, departments, and civic issue categories.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Access Control
                </div>
                <div className="text-sm font-medium text-white">User & Role Management</div>
                <p className="text-xs text-slate-400">
                  Grant admin/worker privileges and manage service-area assignments.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Platform Analytics
                </div>
                <div className="text-sm font-medium text-white">Global Metrics</div>
                <p className="text-xs text-slate-400">
                  Cross-jurisdiction SLA compliance, resolution times, and audit histories.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Backend RBAC Permission Verifier */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Live Backend RBAC Policy Tester
            </h3>
            <p className="text-xs text-slate-400">
              Test how backend authorization middleware responds to your current active token
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => testRbacAccess('citizen-access', 'GET /api/rbac/citizen-access')}
            disabled={testingEndpoint !== null}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition text-xs space-y-1 disabled:opacity-50"
          >
            <div className="font-semibold text-teal-300">Test Citizen Endpoint</div>
            <div className="text-slate-400 text-[11px]">Requires: citizen, super_admin</div>
          </button>

          <button
            onClick={() => testRbacAccess('worker-access', 'GET /api/rbac/worker-access')}
            disabled={testingEndpoint !== null}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition text-xs space-y-1 disabled:opacity-50"
          >
            <div className="font-semibold text-amber-300">Test Worker Endpoint</div>
            <div className="text-slate-400 text-[11px]">Requires: field_worker, super_admin</div>
          </button>

          <button
            onClick={() => testRbacAccess('admin-access', 'GET /api/rbac/admin-access')}
            disabled={testingEndpoint !== null}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition text-xs space-y-1 disabled:opacity-50"
          >
            <div className="font-semibold text-sky-300">Test Admin Endpoint</div>
            <div className="text-slate-400 text-[11px]">Requires: administrator, super_admin</div>
          </button>
        </div>

        {rbacTestResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1 ${
              rbacTestResult.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>{rbacTestResult.endpoint}</span>
              <span className="font-mono uppercase font-bold">
                HTTP {rbacTestResult.statusCode} {rbacTestResult.status === 'success' ? 'OK' : 'FORBIDDEN'}
              </span>
            </div>
            <p className="opacity-90">{rbacTestResult.message}</p>
          </div>
        )}
      </div>

      {/* User Details & Session Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Profile & Identity</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Full Name</span>
              <span className="text-slate-200 font-medium">{user?.name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Email Address</span>
              <span className="text-slate-200 font-medium">{user?.email}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Assigned Role</span>
              <span className="text-teal-400 font-semibold uppercase text-xs font-mono">{user?.role}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Member Since</span>
              <span className="text-slate-200 font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Security & Token State</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Account Status</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Verified
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">RBAC Status</span>
              <span className="text-teal-400 font-medium">Enforced in Middleware</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Active Queue</span>
              <span className="text-teal-400 font-medium">Queue 2: Roles & Permissions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
