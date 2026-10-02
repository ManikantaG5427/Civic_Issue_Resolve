import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const requiredRoles = location.state?.requiredRoles || ['administrator'];
  const currentRole = user?.role || location.state?.currentRole || 'unauthorized';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="apple-panel max-w-md w-full text-center p-8 bg-[#FFFFFF] relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="apple-badge bg-rose-50 text-rose-700 border border-rose-200">
          HTTP 403 Restricted
        </span>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] mt-4 tracking-tight">
          Access Restricted
        </h1>

        <p className="text-sm text-[#6E6E73] mt-3 leading-relaxed">
          You do not have the required operational permissions to access this administrative portal.
        </p>

        <div className="mt-5 p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-[#86868B]">Your Role:</span>
            <span className="font-semibold uppercase text-[#1D1D1F] font-mono">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#86868B]">Required Role(s):</span>
            <span className="font-semibold uppercase text-[#0071E3] font-mono">
              {requiredRoles.join(', ')}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="apple-btn-primary w-full sm:w-auto text-sm gap-2">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="apple-btn-secondary w-full sm:w-auto text-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
