import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const location = useLocation();
  const { user } = useAuth();

  const requiredRoles = location.state?.requiredRoles || ['administrator'];
  const currentRole = user?.role || location.state?.currentRole || 'unauthorized';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center glass-panel p-8 rounded-3xl border border-rose-500/30 bg-slate-900/70 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          HTTP 403 Forbidden
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 tracking-tight">
          Access Restricted
        </h1>

        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
          You do not have the required permissions to access this area.
        </p>

        <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Your Active Role:</span>
            <span className="font-semibold uppercase text-teal-400 font-mono">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Required Role(s):</span>
            <span className="font-semibold uppercase text-amber-400 font-mono">
              {requiredRoles.join(', ')}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-teal-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-sm border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
