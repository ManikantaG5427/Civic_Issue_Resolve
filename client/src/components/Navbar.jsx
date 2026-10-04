import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPopover from './NotificationPopover';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'administrator':
        return { label: 'Officer / Admin', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'field_worker':
        return { label: 'Field Crew', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      default:
        return { label: 'Citizen', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo with Realistic Apple App Icon Tile */}
        <div className="flex items-center space-x-2.5">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-b from-[#1D1D1F] to-[#000000] flex items-center justify-center text-white shadow-md ios-app-icon group-hover:scale-105 transition-all duration-300">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1D1D1F] flex items-center gap-1">
                CIVIC<span className="text-[#0071E3] font-semibold">Resolve</span>
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-wider uppercase font-semibold text-[#86868B] block -mt-1">
                Public Governance Network
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
              location.pathname === '/'
                ? 'text-[#1D1D1F] bg-black/[0.07] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
            }`}
          >
            Home
          </Link>

          <Link
            to="/map"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
              location.pathname === '/map'
                ? 'text-[#1D1D1F] bg-black/[0.07] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Civic Map</span>
          </Link>

          <Link
            to="/catalog"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
              location.pathname === '/catalog'
                ? 'text-[#1D1D1F] bg-black/[0.07] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Catalog</span>
          </Link>

          {isAuthenticated && (
            <>
              {(user?.role === 'citizen' || user?.role === 'super_admin') && (
                <>
                  <Link
                    to="/report-issue"
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm transition-all active:scale-95"
                  >
                    <FilePlus2 className="w-3.5 h-3.5 text-white" />
                    <span>Report Issue</span>
                  </Link>

                  <Link
                    to="/my-reports"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
                      location.pathname === '/my-reports'
                        ? 'text-[#1D1D1F] bg-black/[0.07] shadow-sm'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>My Issues</span>
                  </Link>
                </>
              )}

              {(user?.role === 'field_worker' || user?.role === 'super_admin') && (
                <Link
                  to="/worker/tasks"
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition ${
                    location.pathname === '/worker/tasks'
                      ? 'bg-[#FF9500] text-white shadow-sm'
                      : 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F]'
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
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition ${
                      location.pathname === '/admin/review-queue'
                        ? 'bg-[#1D1D1F] text-white'
                        : 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F]'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Review Queue</span>
                  </Link>

                  <Link
                    to="/admin/analytics"
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition ${
                      location.pathname === '/admin/analytics'
                        ? 'bg-[#1D1D1F] text-white'
                        : 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}

              <Link
                to="/dashboard"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition flex items-center gap-1.5 ${
                  location.pathname === '/dashboard'
                    ? 'text-[#1D1D1F] bg-black/[0.07] shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Dashboard</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Section: Notifications + Auth / Profile + Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isAuthenticated ? (
            <>
              {/* Notification Popover */}
              <NotificationPopover />

              {/* Desktop User Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-black/[0.04] px-3 py-1 rounded-full border border-black/[0.04]">
                <div className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white text-[10px] font-bold flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs text-[#1D1D1F] font-semibold max-w-[110px] truncate">
                  {user?.name}
                </span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              </div>

              {/* Desktop Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden lg:inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-rose-50 text-[#6E6E73] hover:text-[#FF3B30] text-xs font-semibold transition"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit</span>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold tracking-tight text-[#1D1D1F] hover:text-[#0071E3] transition px-3.5 py-1.5 rounded-full hover:bg-black/[0.04]"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs tracking-tight transition shadow-sm active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] border border-black/[0.06] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN DRAWER (Apple iOS Sheet Aesthetic) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/[0.06] bg-[#F5F5F7]/95 backdrop-blur-2xl shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {/* Authenticated User Banner on Mobile */}
            {isAuthenticated && (
              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F]">{user?.name}</div>
                    <div className="text-[10px] text-[#86868B] truncate max-w-[180px]">{user?.email}</div>
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              </div>
            )}

            {/* Mobile Navigation List */}
            <div className="space-y-1 bg-white rounded-2xl p-2 border border-black/[0.08] shadow-sm">
              <Link
                to="/"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  location.pathname === '/' ? 'bg-[#0071E3] text-white' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                }`}
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>

              <Link
                to="/map"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  location.pathname === '/map' ? 'bg-[#0071E3] text-white' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0071E3]" />
                  <span>Interactive Civic Map</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>

              <Link
                to="/catalog"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  location.pathname === '/catalog' ? 'bg-[#0071E3] text-white' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0071E3]" />
                  <span>Category Catalog</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>

              {isAuthenticated && (
                <>
                  <div className="pt-2 pb-1 px-3.5 text-[10px] uppercase font-bold tracking-wider text-[#86868B]">
                    Your Workspace
                  </div>

                  {(user?.role === 'citizen' || user?.role === 'super_admin') && (
                    <>
                      <Link
                        to="/report-issue"
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#0071E3] text-white shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <FilePlus2 className="w-4 h-4 text-white" />
                          <span>Report New Issue</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </Link>

                      <Link
                        to="/my-reports"
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          location.pathname === '/my-reports' ? 'bg-blue-50 text-[#0071E3]' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0071E3]" />
                          <span>My Reported Issues</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                    </>
                  )}

                  {(user?.role === 'field_worker' || user?.role === 'super_admin') && (
                    <Link
                      to="/worker/tasks"
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        location.pathname === '/worker/tasks' ? 'bg-amber-100 text-amber-900' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-[#FF9500]" />
                        <span>Field Worker Tasks</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  )}

                  {(user?.role === 'administrator' || user?.role === 'super_admin') && (
                    <>
                      <Link
                        to="/admin/review-queue"
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          location.pathname === '/admin/review-queue' ? 'bg-slate-100 text-slate-900' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-[#0071E3]" />
                          <span>Admin Review Queue</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>

                      <Link
                        to="/admin/analytics"
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          location.pathname === '/admin/analytics' ? 'bg-slate-100 text-slate-900' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#0071E3]" />
                          <span>Municipal Analytics</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                    </>
                  )}

                  <Link
                    to="/dashboard"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      location.pathname === '/dashboard' ? 'bg-slate-100 text-slate-900' : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#0071E3]" />
                      <span>Account & Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>

                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-50 text-[#FF3B30] font-semibold text-xs hover:bg-rose-100 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="p-2 space-y-2 pt-3 border-t border-black/[0.06]">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center py-2.5 rounded-xl bg-black/[0.05] text-[#1D1D1F] font-semibold text-xs hover:bg-black/[0.08] transition"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="w-full flex items-center justify-center py-2.5 rounded-xl bg-[#0071E3] text-white font-semibold text-xs hover:bg-[#0077ED] transition shadow-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5 text-white" />
                    <span>Create Free Account</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

