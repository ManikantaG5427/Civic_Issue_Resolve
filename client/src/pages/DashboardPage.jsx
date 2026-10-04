import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/common/PageHeader';
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
  MapPin,
  FilePlus2,
  BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Crown,
        };
      case 'administrator':
        return {
          label: 'Administrator',
          color: 'bg-brand-50 text-brand-700 border-brand-200',
          icon: ShieldCheck,
        };
      case 'field_worker':
        return {
          label: 'Field Worker',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: HardHat,
        };
      default:
        return {
          label: 'Citizen',
          color: 'bg-civic-50 text-civic-700 border-civic-200',
          icon: User,
        };
    }
  };

  const roleMeta = getRoleBadge(user?.role);
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}`}
        description="Role-Based Access Control and operational modules for your verified identity."
        badge={
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${roleMeta.color}`}
          >
            {roleMeta.label}
          </span>
        }
        action={
          user?.role === 'citizen' || user?.role === 'super_admin' ? (
            <Link to="/report-issue">
              <Button icon={FilePlus2}>Report New Issue</Button>
            </Link>
          ) : null
        }
      />

      {/* Staff Role Request Status Banner (For Pending or Rejected Approvals) */}
      {user?.approvalStatus === 'pending' && (
        <Card elevated className="p-6 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/60 border-2 border-amber-300 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Application Under Review
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Requested Role: <strong className="text-slate-900 uppercase">{user.requestedRole === 'administrator' ? 'Government Officer / Admin' : 'Field Worker Lead'}</strong>
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Super Admin Approval in Progress
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                  Your email has been verified. The primary Super Administrator (<strong className="text-slate-900">Manikanta</strong>) is reviewing your application. Once your municipal service area/village and department are assigned, your full administrative tools will unlock automatically.
                </p>
              </div>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-amber-200 text-center sm:text-right">
                <span className="text-[11px] font-semibold text-amber-900 uppercase block tracking-wider">
                  Current Access
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Citizen Portal Active
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {user?.approvalStatus === 'rejected' && (
        <Card className="p-5 bg-red-50/80 border border-red-200">
          <div className="flex items-start space-x-3 text-red-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Role Upgrade Request Not Approved</p>
              <p className="text-red-800 text-xs leading-relaxed">
                Your request for the <strong>{user.requestedRole || 'Officer'}</strong> role was reviewed by the Super Administrator. You maintain full access as a verified Citizen to submit municipal issues and track community resolutions.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Role-Specific Operational Modules */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Role Authority: {roleMeta.label} Workspace
            </h3>
            <p className="text-xs text-slate-500">
              Module permissions available for your assigned role in the resolution platform
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'citizen' && (
            <>
              <Link
                to="/report-issue"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Citizen Reporting
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  Report Civic Issues
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit road, water, electricity, and sanitation issues with photo proof & GPS.
                </p>
              </Link>

              <Link
                to="/my-reports"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Issue Tracking
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  My Reports Timeline
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Track verification status, assigned departments, and field repair progress.
                </p>
              </Link>

              <Link
                to="/map"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-civic-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-civic-700 uppercase tracking-wider">
                    Civic Map
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-civic-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  Explore City Map
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  View verified community complaints and active municipal field works nearby.
                </p>
              </Link>
            </>
          )}

          {user?.role === 'field_worker' && (
            <>
              <Link
                to="/worker/tasks"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Field Tasks
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  Assigned Task Queue
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect assigned civic repairs, GPS routes, and active SLA resolution deadlines.
                </p>
              </Link>

              <Link
                to="/map"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Geospatial Map
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  City Map Navigator
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Locate assigned issues and inspect neighboring reported hazards.
                </p>
              </Link>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Resolution Evidence
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">Proof Capture</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload mandatory before/after completion photos before submitting tickets.
                </p>
              </div>
            </>
          )}

          {(user?.role === 'administrator' || user?.role === 'super_admin') && (
            <>
              <Link
                to="/admin/review-queue"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Review Queue
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  Triage & Verification Board
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Triage submitted reports, verify evidence, reject invalid items, or dispatch workers.
                </p>
              </Link>

              <Link
                to="/admin/analytics"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-civic-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-civic-700 uppercase tracking-wider">
                    Intelligence
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-civic-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  Operations Analytics & KPIs
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resolution velocities, SLA compliance %, category distributions, and worker leaderboard.
                </p>
              </Link>

              <Link
                to="/catalog"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-white hover:shadow-card space-y-2 block transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    Catalogs
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-heading">
                  System Configuration
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect departments, pilot service areas, and civic complaint categories.
                </p>
              </Link>
            </>
          )}
        </div>
      </Card>

      {/* Profile & Security State Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 mb-4">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Profile & Identity</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="text-slate-900 font-bold">{user?.name}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="text-slate-900 font-bold">{user?.email}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Assigned Role</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${roleMeta.color}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Member Since</span>
              <span className="text-slate-900 font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Security & Token State</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Account Status</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Verified
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">RBAC Security</span>
              <span className="text-brand-700 font-semibold">Enforced in Middleware</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Real-Time Sync</span>
              <span className="text-civic-700 font-semibold">Socket.IO Bidirectional</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
