import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, Mail, Calendar, Phone, CheckCircle, Clock, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome, {user?.name || 'Citizen'}
                </h1>
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {user?.role || 'citizen'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                You are securely authenticated in the CivicResolve Platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Details & Session Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Citizen Profile Information</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" /> Full Name
              </span>
              <span className="text-slate-200 font-medium">{user?.name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Email Address
              </span>
              <span className="text-slate-200 font-medium">{user?.email}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone
              </span>
              <span className="text-slate-200 font-medium">{user?.phone || 'Not provided'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Member Since
              </span>
              <span className="text-slate-200 font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Security & Token State</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400" /> Account Status
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Verified
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-500" /> Token Format
              </span>
              <span className="text-slate-200 font-mono text-xs">JWT (Bearer) + Refresh Token</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Last Login
              </span>
              <span className="text-slate-200 font-medium">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Just now'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Active Queue
              </span>
              <span className="text-teal-400 font-medium">Queue 1: Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
