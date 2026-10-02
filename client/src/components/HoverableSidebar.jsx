import React, { useState } from 'react';
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
  Home,
  Menu,
  X,
  Pin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPopover from './NotificationPopover';

export default function HoverableSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isExpanded = isPinned || isHovered;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'administrator':
        return { label: 'Admin', color: 'bg-blue-50 text-[#0071E3] border-blue-200' };
      case 'field_worker':
        return { label: 'Worker', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Citizen', color: 'bg-[#E8E8ED] text-[#1D1D1F] border-[#D2D2D7]' };
    }
  };

  const navItems = [
    {
      title: 'Public Services',
      items: [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Live Civic Map', path: '/map', icon: MapPin },
        { label: 'Services Catalog', path: '/catalog', icon: Layers },
      ],
    },
    {
      title: 'Citizen Grievances',
      items: [
        { label: 'Report Issue', path: '/report-issue', icon: FilePlus2, highlight: true },
        ...(isAuthenticated && (user?.role === 'citizen' || user?.role === 'super_admin')
          ? [{ label: 'My Reported Issues', path: '/my-reports', icon: FileText }]
          : []),
      ],
    },
  ];

  if (isAuthenticated) {
    if (user?.role === 'field_worker' || user?.role === 'super_admin') {
      navItems.push({
        title: 'Field Operations',
        items: [{ label: 'Worker Tasks', path: '/worker/tasks', icon: HardHat }],
      });
    }

    if (user?.role === 'administrator' || user?.role === 'super_admin') {
      navItems.push({
        title: 'Administration',
        items: [
          { label: 'Review Queue', path: '/admin/review-queue', icon: ShieldAlert },
          { label: 'Civic Analytics', path: '/admin/analytics', icon: BarChart3 },
        ],
      });
    }

    navItems.push({
      title: 'Portal',
      items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
    });
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E5E7] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1D1D1F] flex items-center justify-center text-white">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
            Civic<span className="text-[#0071E3]">Resolve</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && <NotificationPopover />}
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F]"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Off-Canvas Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        />
      )}

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out bg-[#FFFFFF] border-r border-[#E5E5E7] shadow-sm flex flex-col justify-between overflow-x-hidden ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isExpanded ? 'md:w-72' : 'md:w-20'}`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-[#E5E5E7] flex items-center justify-between">
          <Link
            to="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>

            <div
              className={`transition-opacity duration-200 whitespace-nowrap ${
                isExpanded ? 'opacity-100' : 'opacity-0 md:hidden'
              }`}
            >
              <span className="text-base font-semibold tracking-tight text-[#1D1D1F] block">
                Civic<span className="text-[#0071E3]">Resolve</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-medium text-[#86868B] block">
                Infrastructure Platform
              </span>
            </div>
          </Link>

          {/* Desktop Pin / Unpin Toggle */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`hidden md:inline-flex p-1.5 rounded-lg transition ${
              isPinned
                ? 'bg-[#1D1D1F] text-white'
                : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
            } ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            title={isPinned ? 'Unpin Sidebar' : 'Pin Sidebar Open'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {/* Status indicator when expanded */}
        {isExpanded && (
          <div className="px-4 pt-3 pb-1">
            <div className="p-2 rounded-lg bg-[#F5F5F7] border border-[#E5E5E7] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1D1D1F]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium truncate">Civic Live Network</span>
              </div>
              <span className="text-[9px] font-mono uppercase text-[#0071E3] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Online
              </span>
            </div>
          </div>
        )}

        {/* Main Navigation Link Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {isExpanded && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B] px-3 py-1 block">
                  {section.title}
                </span>
              )}

              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                if (item.highlight) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`apple-btn-primary w-full p-2.5 flex items-center gap-3 my-1.5 justify-center ${
                        isExpanded ? 'px-3.5 justify-start' : 'px-0'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {isExpanded && (
                        <span className="text-xs font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E8E8ED] text-[#1D1D1F] font-semibold'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    } ${!isExpanded ? 'justify-center' : ''}`}
                    title={!isExpanded ? item.label : ''}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#0071E3]' : 'text-[#86868B] group-hover:text-[#1D1D1F]'
                      }`}
                    />

                    {isExpanded ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <div className="hidden md:group-hover:block absolute left-full ml-2 px-2.5 py-1 rounded-md bg-[#1D1D1F] text-white text-xs whitespace-nowrap shadow-md z-50 pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Profile & Auth Section */}
        <div className="p-3 border-t border-[#E5E5E7] bg-[#FAFAFC] space-y-2">
          {isAuthenticated ? (
            <div className="space-y-2">
              {isExpanded ? (
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E7] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-medium text-[#1D1D1F] block truncate">
                        {user?.name}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-medium px-1.5 py-0.2 rounded border inline-block ${
                          getRoleBadge(user?.role).color
                        }`}
                      >
                        {getRoleBadge(user?.role).label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <NotificationPopover />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <NotificationPopover />
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className={`w-full p-2 rounded-lg bg-[#FFFFFF] hover:bg-rose-50 text-[#6E6E73] hover:text-rose-700 text-xs font-medium border border-[#E5E5E7] transition flex items-center gap-2 justify-center`}
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isExpanded && <span>Sign Out</span>}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className={`w-full p-2 rounded-lg text-xs font-medium text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5E7] hover:bg-[#F5F5F7] transition flex items-center gap-2 justify-center ${
                  !isExpanded ? 'px-0' : ''
                }`}
                title="Sign In"
              >
                <LogIn className="w-3.5 h-3.5" />
                {isExpanded && <span>Sign In</span>}
              </Link>

              <Link
                to="/register"
                onClick={() => setIsMobileOpen(false)}
                className={`apple-btn-dark w-full p-2 text-xs flex items-center gap-2 justify-center ${
                  !isExpanded ? 'px-0' : ''
                }`}
                title="Register"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isExpanded && <span>Register</span>}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
