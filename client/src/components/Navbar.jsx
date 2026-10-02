import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LogIn,
  LogOut,
  UserPlus,
  LayoutDashboard,
  Layers,
  FilePlus2,
  FileText,
  HardHat,
  BarChart3,
  MapPin,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPopover from './NotificationPopover';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'administrator':
        return { label: 'Admin', color: 'bg-brand-50 text-brand-700 border-brand-200' };
      case 'field_worker':
        return { label: 'Worker', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Citizen', color: 'bg-civic-50 text-civic-700 border-civic-200' };
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#C8DACF]/95 backdrop-blur-md border-b border-[#B7CEBF] shadow-[0_4px_20px_rgba(28,48,36,0.05)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-[#1D3627] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all duration-300">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#16291E] font-display flex items-center gap-1">
                CIVIC<span className="text-[#33684B] font-editorial font-normal">Resolve</span>
              </span>
              <span className="text-[9px] tracking-widest uppercase font-bold text-[#456A54] block -mt-1">
                Public Governance System
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/70 text-[#214330] border border-white/80 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1.5"></span>
            Live Radar
          </span>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
              location.pathname === '/'
                ? 'text-[#13271B] bg-white shadow-sm'
                : 'text-[#2C4D38] hover:text-[#112419] hover:bg-white/50'
            }`}
          >
            Home
          </Link>

          <Link
            to="/map"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 ${
              location.pathname === '/map'
                ? 'text-[#13271B] bg-white shadow-sm'
                : 'text-[#2C4D38] hover:text-[#112419] hover:bg-white/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>Map</span>
          </Link>

          <Link
            to="/catalog"
            className={`hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
              location.pathname === '/catalog'
                ? 'text-[#13271B] bg-white shadow-sm'
                : 'text-[#2C4D38] hover:text-[#112419] hover:bg-white/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Services</span>
          </Link>

          {isAuthenticated ? (
            <>
              {(user?.role === 'citizen' || user?.role === 'super_admin') && (
                <>
                  <Link
                    to="/report-issue"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase bg-[#1D3627] hover:bg-[#122419] text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <FilePlus2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Report</span>
                  </Link>

                  <Link
                    to="/my-reports"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                      location.pathname === '/my-reports'
                        ? 'text-[#13271B] bg-white shadow-sm'
                        : 'text-[#2C4D38] hover:text-[#112419] hover:bg-white/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>My Issues</span>
                  </Link>
                </>
              )}

              {(user?.role === 'field_worker' || user?.role === 'super_admin') && (
                <Link
                  to="/worker/tasks"
                  className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition ${
                    location.pathname === '/worker/tasks'
                      ? 'bg-amber-700 text-white'
                      : 'bg-white/80 hover:bg-white text-amber-900 border border-amber-300 shadow-sm'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Tasks</span>
                </Link>
              )}

              {(user?.role === 'administrator' || user?.role === 'super_admin') && (
                <>
                  <Link
                    to="/admin/review-queue"
                    className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition ${
                      location.pathname === '/admin/review-queue'
                        ? 'bg-[#1D3627] text-white'
                        : 'bg-white/80 hover:bg-white text-[#1D3627] border border-[#B7CEBF] shadow-sm'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Review Queue</span>
                  </Link>

                  <Link
                    to="/admin/analytics"
                    className={`hidden sm:inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition ${
                      location.pathname === '/admin/analytics'
                        ? 'bg-[#1D3627] text-white'
                        : 'bg-white/80 hover:bg-white text-[#1D3627] border border-[#B7CEBF] shadow-sm'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}

              <Link
                to="/dashboard"
                className={`hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition ${
                  location.pathname === '/dashboard'
                    ? 'text-[#13271B] bg-white shadow-sm'
                    : 'text-[#2C4D38] hover:text-[#112419] hover:bg-white/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dashboard</span>
              </Link>

              <div className="h-4 w-px bg-[#B0C7B8]" />

              {/* In-App Notifications Bell */}
              <NotificationPopover />

              {/* User Identity Pill */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/90 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-[#1D3627] text-emerald-200 text-[10px] font-bold flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs text-[#1D3627] font-semibold max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full border ${
                      getRoleBadge(user?.role).color
                    }`}
                  >
                    {getRoleBadge(user?.role).label}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/70 hover:bg-rose-50 text-[#2C4D38] hover:text-rose-700 text-xs font-bold border border-white transition shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs font-bold tracking-wider uppercase text-[#2C4D38] hover:text-[#112419] transition px-3.5 py-2 rounded-full hover:bg-white/60"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full bg-[#1D3627] hover:bg-[#122419] text-white font-bold text-xs tracking-wider uppercase transition shadow-md hover:shadow-lg active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
