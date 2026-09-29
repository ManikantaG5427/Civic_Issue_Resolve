import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, LogOut, UserPlus, LayoutDashboard, Layers, FilePlus2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        return { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
      case 'administrator':
        return { label: 'Admin', color: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };
      case 'field_worker':
        return { label: 'Worker', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
      default:
        return { label: 'Citizen', color: 'bg-teal-500/10 text-teal-300 border-teal-500/20' };
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Civic<span className="text-teal-400">Resolve</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 block -mt-1">
                Resolution Platform
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Queue 4 · Reporting
          </span>
        </div>

        <nav className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </Link>

          <Link
            to="/catalog"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname === '/catalog' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Catalog</span>
          </Link>

          {isAuthenticated ? (
            <>
              {(user?.role === 'citizen' || user?.role === 'super_admin') && (
                <Link
                  to="/report-issue"
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md ${
                    location.pathname === '/report-issue'
                      ? 'bg-teal-400 text-slate-950'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
                  }`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </Link>
              )}

              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/dashboard' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <div className="h-4 w-px bg-slate-800" />

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs text-slate-200 font-medium max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                      getRoleBadge(user?.role).color
                    }`}
                  >
                    {getRoleBadge(user?.role).label}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-300 text-xs font-medium border border-slate-700 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-300 hover:text-white transition px-2 py-1"
              >
                <LogIn className="w-4 h-4 text-teal-400" />
                <span>Sign In</span>
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs sm:text-sm transition shadow-lg shadow-teal-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
